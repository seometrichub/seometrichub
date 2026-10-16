
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchBacklinkSummary,
  fetchBacklinkDetails,
} from "@/lib/dataforseo-backlinks";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";

const BOT_USER_AGENT =
  "Mozilla/5.0 (compatible; SEOMETRICHUB Link Analysis Bot/1.0)";

const FETCH_TIMEOUT = 15000;
const MAX_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function normalizeUrl(value: string): string {
  const trimmed = value.trim();

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]"
  ) {
    return true;
  }

  if (isIP(host) !== 0) {
    return true;
  }

  if (!host.includes(".")) {
    return true;
  }

  return false;
}

async function validatePublicUrl(url: URL): Promise<void> {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    isBlockedHostname(url.hostname) ||
    (url.port &&
      !["80", "443"].includes(url.port))
  ) {
    throw new Error("BLOCKED_URL");
  }

  let addresses: Array<{ address: string; family: number }>;

  try {
    addresses = await lookup(url.hostname, { all: true });
  } catch {
    throw new Error("DNS_LOOKUP_FAILED");
  }

  if (!addresses.length) {
    throw new Error("DNS_LOOKUP_FAILED");
  }

  for (const item of addresses) {
    const ip = item.address.toLowerCase();

    if (item.family === 4) {
      const parts = ip.split(".").map(Number);
      const [a, b, c] = parts;

      if (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 192 && b === 0 && c === 0) ||
        (a === 192 && b === 0 && c === 2) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113)
      ) {
        throw new Error("BLOCKED_URL");
      }
    } else {
      if (
        ip === "::1" ||
        ip === "::" ||
        ip.startsWith("fc") ||
        ip.startsWith("fd") ||
        /^fe[89ab]/.test(ip.slice(0, 4)) ||
        ip.startsWith("ff") ||
        ip.startsWith("2001:db8:") ||
        ip.startsWith("::ffff:")
      ) {
        throw new Error("BLOCKED_URL");
      }
    }
  }
}

function getAttribute(
  tag: string,
  attribute: string,
): string | null {
  const pattern = new RegExp(
    `${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );

  const match = tag.match(pattern);

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

async function fetchWebsiteHtml(
  initialUrl: URL,
): Promise<{ html: string; finalUrl: URL }> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    FETCH_TIMEOUT,
  );

  try {
    let currentUrl = initialUrl;

    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
      await validatePublicUrl(currentUrl);

      const response = await fetch(currentUrl.toString(), {
        headers: {
          "User-Agent": BOT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: controller.signal,
        cache: "no-store",
      });

      if (
        [301, 302, 303, 307, 308].includes(response.status)
      ) {
        const location = response.headers.get("location");

        if (!location || redirectCount === MAX_REDIRECTS) {
          throw new Error("REDIRECT_LIMIT");
        }

        currentUrl = new URL(location, currentUrl);
        await response.body?.cancel();
        continue;
      }

      if (!response.ok) {
        throw new Error(`WEBSITE_HTTP_${response.status}`);
      }

      const contentType =
        response.headers.get("content-type") ?? "";

      if (!contentType.toLowerCase().includes("text/html")) {
        throw new Error("NOT_HTML");
      }

      const contentLength = Number(
        response.headers.get("content-length") ?? 0,
      );

      if (contentLength > MAX_HTML_BYTES) {
        throw new Error("HTML_TOO_LARGE");
      }

      if (!response.body) {
        throw new Error("EMPTY_RESPONSE");
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          totalBytes += value.byteLength;

          if (totalBytes > MAX_HTML_BYTES) {
            throw new Error("HTML_TOO_LARGE");
          }

          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      const bytes = Buffer.concat(chunks);

      return {
        html: new TextDecoder("utf-8").decode(bytes),
        finalUrl: currentUrl,
      };
    }

    throw new Error("REDIRECT_LIMIT");
  } finally {
    clearTimeout(timeout);
  }
}

function analyzeOnPageLinks(
  html: string,
  finalUrl: URL,
) {
  const anchorTags = html.match(/<a\b[^>]*>/gi) ?? [];

  let internalLinks = 0;
  let externalLinks = 0;
  let followLinks = 0;
  let nofollowLinks = 0;

  const externalDomains = new Set<string>();

  const pageDomain = finalUrl.hostname.replace(/^www\./i, "");

  for (const tag of anchorTags) {
    const href = getAttribute(tag, "href");

    if (!href) continue;

    const trimmedHref = href.trim();

    if (
      !trimmedHref ||
      trimmedHref.startsWith("#") ||
      /^(mailto:|tel:|javascript:|data:)/i.test(trimmedHref)
    ) {
      continue;
    }

    let linkUrl: URL;

    try {
      linkUrl = new URL(trimmedHref, finalUrl);
    } catch {
      continue;
    }

    if (!["http:", "https:"].includes(linkUrl.protocol)) {
      continue;
    }

    const linkDomain = linkUrl.hostname.replace(/^www\./i, "");

    if (linkDomain === pageDomain) {
      internalLinks++;
      continue;
    }

    externalLinks++;
    externalDomains.add(linkDomain);

    const rel = getAttribute(tag, "rel")?.toLowerCase() ?? "";
    const relValues = rel.split(/\s+/).filter(Boolean);

    if (relValues.includes("nofollow")) {
      nofollowLinks++;
    } else {
      followLinks++;
    }
  }

  return {
    linkAnalysis: {
      totalLinks: internalLinks + externalLinks,
      internalLinks,
      externalLinks,
      uniqueExternalDomains: externalDomains.size,
      followExternalLinks: followLinks,
      nofollowExternalLinks: nofollowLinks,
    },
    externalDomains: Array.from(externalDomains)
      .sort()
      .slice(0, 100),
  };
}

export async function POST(request: Request) {
  try {
    // STEP 1: Authenticate user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Please sign in to use backlink analysis.",
        },
        { status: 401 },
      );
    }

    // STEP 2: Validate website URL.
    const body = await request.json().catch(() => null);
    const inputUrl = body?.url;

    if (
      typeof inputUrl !== "string" ||
      !inputUrl.trim() ||
      inputUrl.length > 2048
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid website URL.",
        },
        { status: 400 },
      );
    }

    let targetUrl: URL;

    try {
      targetUrl = new URL(normalizeUrl(inputUrl));
      await validatePublicUrl(targetUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "This website URL cannot be analyzed.",
        },
        { status: 400 },
      );
    }

    // STEP 3: Check DataForSEO configuration.
    if (
      !process.env.DATAFORSEO_LOGIN ||
      !process.env.DATAFORSEO_PASSWORD
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Backlink data provider is not configured.",
        },
        { status: 503 },
      );
    }

    // STEP 4: Fetch and analyze website HTML.
    let html: string;
    let finalUrl: URL;

    try {
      const website = await fetchWebsiteHtml(targetUrl);
      html = website.html;
      finalUrl = website.finalUrl;
    } catch (error) {
      const code =
        error instanceof Error ? error.message : "UNKNOWN";

      const status =
        code === "BLOCKED_URL" ? 400 :
        code === "NOT_HTML" ? 400 :
        code === "HTML_TOO_LARGE" ? 413 :
        code === "REDIRECT_LIMIT" ? 502 :
        code === "DNS_LOOKUP_FAILED" ? 502 :
        code.startsWith("WEBSITE_HTTP_") ? 502 :
        error instanceof Error && error.name === "AbortError"
          ? 504 : 502;

      return NextResponse.json(
        {
          success: false,
          error:
            status === 504
              ? "Website request timed out."
              : "Unable to fetch this website for link analysis.",
        },
        { status },
      );
    }

    // STEP 5: Consume monthly usage before paid API requests.
    const { data: quotaRows, error: quotaError } =
      await supabase.rpc("consume_tool_usage", {
        p_user_id: user.id,
        p_tool: "backlink_analysis",
      });

    if (quotaError) {
      console.error("Backlink quota check failed:", {
        message: quotaError.message,
        code: quotaError.code,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify backlink analysis usage limit.",
        },
        { status: 500 },
      );
    }

    const quota = Array.isArray(quotaRows)
      ? quotaRows[0]
      : quotaRows;

    if (!quota || typeof quota.allowed !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify backlink analysis usage limit.",
        },
        { status: 500 },
      );
    }

    const quotaDetails = {
      used: quota.used,
      limit: quota.limit_value,
      remaining: quota.remaining,
      periodEnd: quota.period_end,
    };

    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Monthly backlink analysis limit reached.",
          quota: quotaDetails,
        },
        { status: 429 },
      );
    }

    // STEP 6: Analyze outgoing links on the website.
    const onPage = analyzeOnPageLinks(html, finalUrl);

    // STEP 7: Get real backlink summary.
    const domain = targetUrl.hostname.replace(/^www\./i, "");

    let backlinkSummary: Awaited<
      ReturnType<typeof fetchBacklinkSummary>
    > | null = null;

    let backlinkMessage =
      "Live backlink summary provided by DataForSEO.";

    try {
      backlinkSummary = await fetchBacklinkSummary(domain);
    } catch (error) {
      console.error("Backlink summary failed:", {
        code:
          error instanceof Error
            ? error.message
            : "UNKNOWN_PROVIDER_ERROR",
      });

      backlinkMessage =
        "Backlink summary is temporarily unavailable.";
    }

    // STEP 8: Get real backlink URLs, anchors and attributes.
    let backlinkDetails: Awaited<
      ReturnType<typeof fetchBacklinkDetails>
    > | null = null;

    let backlinkDetailsMessage =
      "Real backlink details provided by DataForSEO.";

    try {
      backlinkDetails = await fetchBacklinkDetails(domain, 100);
    } catch (error) {
      console.error("Backlink details failed:", {
        code:
          error instanceof Error
            ? error.message
            : "UNKNOWN_DETAILS_ERROR",
      });

      backlinkDetailsMessage =
        "Detailed backlink data is temporarily unavailable.";
    }

    // STEP 9: Calculate metrics for fetched backlink records.
    const detailItems = backlinkDetails?.items ?? [];

    const dofollowCount = detailItems.filter(
      (item) => item.dofollow === true,
    ).length;

    const nofollowCount = detailItems.filter(
      (item) => item.dofollow === false,
    ).length;

    const unknownFollowCount = detailItems.filter(
      (item) => item.dofollow === null,
    ).length;

    const newBacklinks = detailItems.filter(
      (item) => item.isNew,
    ).length;

    const lostBacklinks = detailItems.filter(
      (item) => item.isLost,
    ).length;

    const reviewNeededCount = detailItems.filter(
      (item) =>
        (item.spamScore !== null &&
          item.spamScore >= 50) ||
        (item.externalLinks !== null &&
          item.externalLinks >= 1000),
    ).length;

    // STEP 10: Return complete analysis to frontend.
    return NextResponse.json({
      success: true,

      url: finalUrl.toString(),
      domain,
      onPageDomain: finalUrl.hostname.replace(/^www\./i, ""),

      backlinkProfileAvailable: backlinkSummary !== null,
      backlinkMessage,

      backlinkSummary: backlinkSummary
        ? {
            provider: "dataforseo",
            target: domain,
            scope: "domain",
            includeSubdomains: true,
            ...backlinkSummary,
            fetchedAt: new Date().toISOString(),
          }
        : null,

      backlinkDetailsAvailable: backlinkDetails !== null,
      backlinkDetailsMessage,

      backlinkDetails,

      backlinkMetrics: backlinkDetails
        ? {
            scope: "fetched_records_only",
            fetchedCount: detailItems.length,
            totalCount: backlinkDetails.totalCount,
            dofollowCount,
            nofollowCount,
            unknownFollowCount,
            newBacklinks,
            lostBacklinks,
            reviewNeededCount,
          }
        : null,

      quota: quotaDetails,

      linkAnalysis: onPage.linkAnalysis,
      externalDomains: onPage.externalDomains,
    });
  } catch (error) {
    console.error("Backlink analysis error:", {
      name:
        error instanceof Error
          ? error.name
          : "UnknownError",
    });

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to analyze this website right now. Please try again.",
      },
      { status: 500 },
    );
  }
}
