
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
      await supabase.rpc("consume_tool_usage", {
        p_user_id: user.id,
        p_tool: "competitor_analysis",
      });

    if (quotaError) {
      console.error("Backlink Gap quota error:", {
        message: quotaError.message,
        code: quotaError.code,
      });

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

    // STEP 4: REAL DATAFORSEO BACKLINK GAP
    let result;

    try {
      result = await analyzeBacklinkGap(
        yourDomain,
        competitors,
        100
      );
    } catch (error) {
      console.error("Backlink Gap provider error:", error);

      return NextResponse.json(
        {
          success: false,
          error:
            "Backlink data is currently unavailable. Please try again later.",
          quota: quotaInfo,
        },
        { status: 502 }
      );
    }

    // STEP 5: SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      ...result,
      quota: quotaInfo,
    });
  } catch (error) {
    console.error("Backlink Gap API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete Backlink Gap Analysis.",
      },
      { status: 500 }
    );
  }
}
