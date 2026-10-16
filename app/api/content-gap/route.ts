
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchCompetitorOrganicKeywords,
  type CompetitorOrganicResult,
} from "@/lib/dataforseo-competitors";
import { analyzeContentGap } from "@/lib/content-gap";
import type { BusinessContext } from "@/lib/content-relevance";

export const runtime = "nodejs";

type ContentGapRequest = {
  yourUrl?: string;
  competitor1?: string;
  competitor2?: string;
  industry?: string;
  services?: string;
  location?: string;
};

function normalizeDomain(value: string): string {
  const input = value.trim();

  if (!input || input.length > 253) {
    throw new Error("INVALID_DOMAIN");
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
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("INVALID_DOMAIN");
  }

  const domain = url.hostname
    .toLowerCase()
    .replace(/^www\./, "")
    .replace(/\.$/, "");

  const labels = domain.split(".");

  if (
    domain.length > 253 ||
    labels.length < 2 ||
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)
    ) ||
    !/[a-z]/.test(labels[labels.length - 1])
  ) {
    throw new Error("INVALID_DOMAIN");
  }

  return domain;
}

function validateOptionalText(
  value: unknown,
  maxLength: number
): string {
  if (value === undefined) {
    return "";
  }

  if (
    typeof value !== "string" ||
    value.length > maxLength
  ) {
    throw new Error("INVALID_BUSINESS_CONTEXT");
  }

  return value.trim();
}

export async function POST(request: Request) {
  try {
    // 1. AUTHENTICATION
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please sign in to use Content Gap Analysis.",
        },
        { status: 401 }
      );
    }

    // 2. REQUEST VALIDATION
    let body: ContentGapRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request.",
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
          error:
            "Your website and competitor are required.",
        },
        { status: 400 }
      );
    }

    let yourDomain: string;
    let competitors: string[];
    let industry: string;
    let services: string;
    let location: string;

    try {
      yourDomain = normalizeDomain(body.yourUrl);

      competitors = [
        ...new Set(
          [
            body.competitor1,
            body.competitor2 ?? "",
          ]
            .filter((value) => value.trim())
            .map(normalizeDomain)
        ),
      ].filter(
        (domain) => domain !== yourDomain
      );

      industry = validateOptionalText(
        body.industry,
        120
      );

      services = validateOptionalText(
        body.services,
        1000
      );

      location = validateOptionalText(
        body.location,
        120
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter valid domains and business details.",
        },
        { status: 400 }
      );
    }

    if (competitors.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Enter at least one different competitor.",
        },
        { status: 400 }
      );
    }

    // Business relevance is enabled only when
    // industry or services are supplied.
    const businessContext: BusinessContext | undefined =
      industry || services
        ? {
            industry,
            services,
            location,
          }
        : undefined;

    // 3. MONTHLY QUOTA
    // Shared with existing competitor analysis.
    const {
      data: quotaRows,
      error: quotaError,
    } = await supabase.rpc(
      "consume_tool_usage",
      {
        p_user_id: user.id,
        p_tool: "competitor_analysis",
      }
    );

    if (quotaError) {
      console.error(
        "Content Gap quota error:",
        {
          code: quotaError.code,
          message: quotaError.message,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify your monthly usage limit.",
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
          error:
            "Usage quota information unavailable.",
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
          error:
            "Monthly analysis limit reached.",
          quota: quotaInfo,
        },
        { status: 429 }
      );
    }

    // 4. FETCH REAL ORGANIC KEYWORD DATA
    const domains = [
      yourDomain,
      ...competitors,
    ];

    const responses = await Promise.allSettled(
      domains.map((domain) =>
        fetchCompetitorOrganicKeywords(
          domain,
          {
            locationCode: 2356,
            languageCode: "en",
            limit: 20,
          }
        )
      )
    );

    const yourResponse = responses[0];

    if (
      !yourResponse ||
      yourResponse.status !== "fulfilled"
    ) {
      console.error(
        "Content Gap own-domain data unavailable:",
        yourResponse?.status === "rejected"
          ? yourResponse.reason
          : "Missing response"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Your website ranking data is unavailable. Content Gap comparison cannot be verified.",
          quota: quotaInfo,
        },
        { status: 502 }
      );
    }

    const competitorResults: CompetitorOrganicResult[] =
      responses
        .slice(1)
        .filter(
          (
            response
          ): response is PromiseFulfilledResult<
            CompetitorOrganicResult
          > =>
            response.status === "fulfilled"
        )
        .map(
          (response) => response.value
        );

    if (
      competitorResults.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Competitor ranking data is currently unavailable.",
          quota: quotaInfo,
        },
        { status: 502 }
      );
    }

    // 5. CONTENT GAP + BUSINESS RELEVANCE
    const result = analyzeContentGap(
      yourResponse.value,
      competitorResults,
      businessContext
    );

    const warnings = [
      "Results are based on a maximum of 20 sampled ranking keywords per website.",
      "A keyword absent from your ranking sample does not prove your website lacks content about that topic.",
      "Suggested titles require manual relevance and search-intent review.",
    ];

    if (businessContext) {
      warnings.push(
        "Business relevance uses basic keyword-term matching, not AI semantic understanding."
      );

      warnings.push(
        "Target location is stored in the analysis context but is not yet used for relevance scoring or DataForSEO location targeting."
      );
    } else {
      warnings.push(
        "Business details were not supplied, so priorities use SEO opportunity scoring only."
      );
    }

    if (
      competitorResults.length <
      competitors.length
    ) {
      warnings.push(
        "Some competitor ranking data was unavailable. Results are incomplete."
      );
    }

    // 6. SUCCESS RESPONSE
    return NextResponse.json({
      success: true,
      yourDomain,
      competitors:
        competitorResults.map(
          (item) => item.domain
        ),
      businessContext:
        businessContext ?? null,
      ...result,
      quota: quotaInfo,
      warnings,
      fetchedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Content Gap API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to complete Content Gap Analysis.",
      },
      { status: 500 }
    );
  }
}
