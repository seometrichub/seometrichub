import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeBacklinkGap } from "@/lib/backlink-gap";

export const runtime = "nodejs";

type BacklinkGapRequest = {
  yourUrl?: string;
  competitor1?: string;
  competitor2?: string;
};

function normalizeDomain(value: string): string {
  const input = value.trim();

  if (!input || input.length > 253) {
    throw new Error("Invalid website domain.");
  }

  const url = new URL(
    /^https?:\/\//i.test(input)
      ? input
      : `https://${input}`
  );

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Invalid website URL.");
  }

  const hostname = url.hostname
    .toLowerCase()
    .replace(/^www\./, "");

  if (
    hostname.length > 253 ||
    !hostname.includes(".") ||
    hostname === "localhost" ||
    !/^[a-z0-9.-]+$/.test(hostname) ||
    hostname.split(".").some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith("-") ||
        label.endsWith("-")
    )
  ) {
    throw new Error("Enter a valid public domain.");
  }

  return hostname;
}

export async function POST(request: Request) {
  let reservedRequestId: string | null = null;

  try {
    // STEP 1: AUTHENTICATION
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in to use Backlink Gap Analysis.",
        },
        { status: 401 }
      );
    }

    // STEP 2: VALIDATE REQUEST
    let body: BacklinkGapRequest;

    try {
      body = (await request.json()) as BacklinkGapRequest;
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
        },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body.yourUrl !== "string" ||
      typeof body.competitor1 !== "string" ||
      (body.competitor2 !== undefined &&
        typeof body.competitor2 !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Your website and competitor website are required.",
        },
        { status: 400 }
      );
    }

    let yourDomain: string;
    let competitors: string[];

    try {
      yourDomain = normalizeDomain(body.yourUrl);

      competitors = [
        ...new Set(
          [body.competitor1, body.competitor2 ?? ""]
            .filter((value) => value.trim())
            .map(normalizeDomain)
        ),
      ].filter((domain) => domain !== yourDomain);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter valid website domains.",
        },
        { status: 400 }
      );
    }

    if (competitors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter at least one different competitor.",
        },
        { status: 400 }
      );
    }

    // STEP 3: MONTHLY QUOTA
    // Temporarily shares competitor_analysis quota.
    const { data: quotaRows, error: quotaError } =
  await supabase.rpc("reserve_backlink_gap_usage", {
    p_user_id: user.id,
  });

    if (quotaError) {
  console.error("Backlink Gap quota error:", {
    message: quotaError.message,
    code: quotaError.code,
  });

  const isDuplicateRequest =
    quotaError.code === "23505" &&
    quotaError.message.includes(
      "tool_usage_requests_one_pending_per_user_idx"
    );

  if (isDuplicateRequest) {
    return NextResponse.json(
      {
        success: false,
        error:
          "A Backlink Gap analysis is already in progress. Please wait for it to finish.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Unable to verify your monthly usage limit.",
    },
    { status: 500 }
  );
}

    const quota = Array.isArray(quotaRows)
      ? quotaRows[0]
      : null;

    if (!quota) {
      return NextResponse.json(
        {
          success: false,
          error: "Usage quota information unavailable.",
        },
        { status: 500 }
      );
    }

    const quotaInfo = {
      used: quota.used,
      limit: quota.limit_value,
      remaining: quota.remaining,
      periodEnd: quota.period_end,
    };

    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Monthly analysis limit reached.",
          quota: quotaInfo,
        },
        { status: 429 }
      );
    }
    // STEP 3A: VALIDATE QUOTA RESERVATION ID
const requestId = quota.request_id;

if (
  typeof requestId !== "string" ||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestId)
) {
  console.error(
    "Backlink Gap reservation ID missing or invalid."
  );

  return NextResponse.json(
    {
      success: false,
      error:
        "Usage reservation could not be verified. Please contact support before retrying.",
    },
    { status: 500 }
  );
}

  // Track the successful reservation for unexpected errors.
reservedRequestId = requestId;

// STEP 4: REAL DATAFORSEO BACKLINK GAP
let result;

    try {
      result = await analyzeBacklinkGap(
        yourDomain,
        competitors,
        100
      );
    } catch (error) {
  console.error("Backlink Gap provider error:", {
    requestId,
    error,
  });

  // Provider may have processed the request.
  // Do not automatically refund uncertain outcomes.
  let finalized = false;

  try {
    const admin = createAdminClient();

    const { data, error: finalizeError } =
      await admin.rpc("finalize_backlink_gap_usage", {
        p_request_id: requestId,
        p_status: "unknown",
      });

    if (finalizeError || data !== true) {
      console.error(
        "Backlink Gap unknown-status finalization failed:",
        {
          requestId,
          message: finalizeError?.message,
          data,
        }
      );
    } else {
      finalized = true;
    }
  } catch (finalizeException) {
    console.error(
      "Backlink Gap finalization exception:",
      {
        requestId,
        error: finalizeException,
      }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: finalized
        ? "Backlink data is currently unavailable. Usage has been recorded for review."
        : "Backlink data is unavailable and usage tracking could not be confirmed. Please contact support before retrying.",
      quota: quotaInfo,
    },
    { status: finalized ? 502 : 500 }
  );
}

    // STEP 5: FINALIZE SUCCESSFUL ANALYSIS
const admin = createAdminClient();

const { data: finalized, error: finalizeError } =
  await admin.rpc("finalize_backlink_gap_usage", {
    p_request_id: requestId,
    p_status: "completed",
  });

if (finalizeError || finalized !== true) {
  console.error("Backlink Gap finalization error:", {
    requestId,
    message: finalizeError?.message,
    finalized,
  });

  return NextResponse.json(
    {
      success: false,
      error:
        "Analysis completed, but usage tracking could not be confirmed. Please contact support before retrying.",
    },
    { status: 500 }
  );
}

// STEP 6: SUCCESS RESPONSE
return NextResponse.json({
  success: true,
  ...result,
  quota: quotaInfo,
});
  } catch (error) {
  console.error("Backlink Gap API error:", {
    requestId: reservedRequestId,
    error,
  });

  if (reservedRequestId) {
    try {
      const admin = createAdminClient();

      const { data, error: finalizeError } =
        await admin.rpc("finalize_backlink_gap_usage", {
          p_request_id: reservedRequestId,
          p_status: "unknown",
        });

      if (finalizeError || data !== true) {
        console.error("Backlink Gap recovery finalization:", {
          requestId: reservedRequestId,
          message: finalizeError?.message,
          finalized: data,
        });
      }
    } catch (finalizeException) {
      console.error("Backlink Gap recovery exception:", {
        requestId: reservedRequestId,
        error: finalizeException,
      });
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: reservedRequestId
        ? "Analysis interrupted. Usage status may require review. Please contact support before retrying."
        : "Unable to complete Backlink Gap Analysis.",
    },
    { status: 500 }
  );
}
}