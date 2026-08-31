import { NextResponse } from "next/server";

const BOT_USER_AGENT =
  "Mozilla/5.0 (compatible; SEOMETRICHUB Link Analysis Bot/1.0)";

const FETCH_TIMEOUT = 15000;

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase();

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function getAttribute(tag: string, attribute: string) {
  const pattern = new RegExp(
    `${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );

  const match = tag.match(pattern);

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const inputUrl = body?.url;

    if (!inputUrl || typeof inputUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Website URL is required.",
        },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(inputUrl);

    let targetUrl: URL;

    try {
      targetUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid website URL.",
        },
        { status: 400 }
      );
    }

    if (
      !["http:", "https:"].includes(targetUrl.protocol) ||
      isBlockedHostname(targetUrl.hostname)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "This website URL cannot be analyzed.",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      FETCH_TIMEOUT
    );

    let response: Response;

    try {
      response = await fetch(targetUrl.toString(), {
        headers: {
          "User-Agent": BOT_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: controller.signal,
        cache: "no-store",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Website returned HTTP ${response.status}.`,
        },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("text/html")) {
      return NextResponse.json(
        {
          success: false,
          error: "The requested URL did not return an HTML page.",
        },
        { status: 400 }
      );
    }

    const html = await response.text();
    const finalUrl = new URL(response.url || targetUrl.toString());

    const anchorTags =
      html.match(/<a\b[^>]*>/gi) ?? [];

    let internalLinks = 0;
    let externalLinks = 0;
    let followLinks = 0;
    let nofollowLinks = 0;

    const externalDomains = new Set<string>();

    for (const tag of anchorTags) {
      const href = getAttribute(tag, "href");

      if (!href) {
        continue;
      }

      const trimmedHref = href.trim();

      if (
        !trimmedHref ||
        trimmedHref.startsWith("#") ||
        trimmedHref.startsWith("mailto:") ||
        trimmedHref.startsWith("tel:") ||
        trimmedHref.startsWith("javascript:")
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

      const isInternal =
        linkUrl.hostname.replace(/^www\./i, "") ===
        finalUrl.hostname.replace(/^www\./i, "");

      if (isInternal) {
        internalLinks += 1;
        continue;
      }

      externalLinks += 1;
      externalDomains.add(
        linkUrl.hostname.replace(/^www\./i, "")
      );

      const rel =
        getAttribute(tag, "rel")?.toLowerCase() ?? "";

      if (
        rel
          .split(/\s+/)
          .filter(Boolean)
          .includes("nofollow")
      ) {
        nofollowLinks += 1;
      } else {
        followLinks += 1;
      }
    }

    return NextResponse.json({
      success: true,
      url: finalUrl.toString(),
      domain: finalUrl.hostname.replace(/^www\./i, ""),
      backlinkProfileAvailable: false,
      backlinkMessage:
        "True backlink counts require an external backlink index. SEOMETRICHUB is showing real on-page link analysis without estimating backlink data.",
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
    });
  } catch (error) {
    console.error("Backlink analysis error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to analyze this website right now. Please try again.",
      },
      { status: 500 }
    );
  }
}
