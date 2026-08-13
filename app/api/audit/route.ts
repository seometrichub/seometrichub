import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BOT_USER_AGENT =
  "Mozilla/5.0 (compatible; SEOMETRICHUB SEO Audit Bot/1.0)";

const FETCH_TIMEOUT = 15000;
const AUX_FETCH_TIMEOUT = 10000;

type BacklinkData = {
  available: boolean;
  backlinks: number | null;
  referringDomains: number | null;
  dofollow: number | null;
  nofollow: number | null;
  message: string;
};

type Recommendation = {
  type: "success" | "warning" | "error";
  title: string;
  description: string;
  recommendedTitle?: string;
  recommendedMetaDescription?: string;
};

type AuditInput = {
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h2Count: number;
  totalImages: number;
  imagesWithoutAlt: number;
  hasCanonical: boolean;
  hasHttps: boolean;
  hasViewport: boolean;
  robotsTxt: boolean;
  sitemap: boolean;
  favicon: boolean;
  responseTime: number;
  htmlSizeKB: number;
  internalLinks: number;
};

export async function POST(request: Request) {
  const startTime = performance.now();

  try {
    // ============================================================
    // READ REQUEST
    // Supports the current frontend field: { url: "..." }
    // ============================================================

    const body = await request.json().catch(() => null);
    const inputUrl = body?.url;

    if (!inputUrl || typeof inputUrl !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Website URL is required.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // NORMALIZE + VALIDATE URL
    // ============================================================

    let websiteUrl = inputUrl.trim();

    if (!/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid website URL.",
        },
        { status: 400 },
      );
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        {
          success: false,
          error: "Only HTTP and HTTPS websites are supported.",
        },
        { status: 400 },
      );
    }

    if (isBlockedHostname(parsedUrl.hostname)) {
      return NextResponse.json(
        {
          success: false,
          error: "This hostname cannot be audited.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // FETCH MAIN WEBSITE
    // ============================================================

    const response = await fetchWithTimeout(
      parsedUrl.toString(),
      {
        method: "GET",
        headers: {
          "User-Agent": BOT_USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
        cache: "no-store",
      },
      FETCH_TIMEOUT,
    );

    const responseTime = Math.round(performance.now() - startTime);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Website returned HTTP ${response.status}.`,
        },
        { status: 400 },
      );
    }

    const finalUrl = response.url || parsedUrl.toString();
    const finalParsedUrl = new URL(finalUrl);

    if (isBlockedHostname(finalParsedUrl.hostname)) {
      return NextResponse.json(
        {
          success: false,
          error: "The final website hostname cannot be audited.",
        },
        { status: 400 },
      );
    }

    // ============================================================
    // HTML
    // ============================================================

    const contentType = response.headers.get("content-type") || "";

    if (
      contentType &&
      !contentType.toLowerCase().includes("text/html") &&
      !contentType.toLowerCase().includes("application/xhtml+xml")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The URL did not return an HTML page.",
        },
        { status: 400 },
      );
    }

    const html = await response.text();

    const htmlSizeKB = Number(
      (Buffer.byteLength(html, "utf8") / 1024).toFixed(1),
    );

    // ============================================================
    // ON-PAGE SEO DATA
    // ============================================================

    const title = extractTitle(html);
    const titleLength = title.length;

    const description = extractMetaContent(html, "description");
    const descriptionLength = description.length;

    const h1Tags = getOpeningTags(html, "h1");
    const h2Tags = getOpeningTags(html, "h2");

    const h1Count = h1Tags.length;
    const h2Count = h2Tags.length;

    // ============================================================
    // IMAGE ALT ANALYSIS
    // ============================================================

    const imageTags = getOpeningTags(html, "img");
    const totalImages = imageTags.length;

    let imagesWithAlt = 0;
let imagesWithoutAlt = 0;

const missingAltImages: {
  src: string;
  alt: string | null;
  recommendedAlt: string;
}[] = [];

function getImageSource(image: string): string {
  const src =
    getAttribute(image, "src") ||
    getAttribute(image, "data-src") ||
    getAttribute(image, "data-lazy-src") ||
    getAttribute(image, "data-original") ||
    getAttribute(image, "data-image") ||
    getAttribute(image, "data-url");

  if (src) {
    return src.trim();
  }

  const srcset =
    getAttribute(image, "srcset") ||
    getAttribute(image, "data-srcset") ||
    getAttribute(image, "data-lazy-srcset");

  if (srcset) {
    const firstSource = srcset
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)[0];

    if (firstSource) {
      return firstSource.split(/\s+/)[0].trim();
    }
  }

  return "";
}

function getRecommendedAlt(src: string): string {
  if (!src) {
    return "Descriptive image alt text";
  }

  try {
    const parsed = new URL(src, finalUrl);

    const filename =
      parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";

    const cleaned = decodeURIComponent(filename)
      .replace(/[-_]+/g, " ")
      .replace(/\d{2,}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return "Descriptive image alt text";
    }

    return cleaned
      .split(" ")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1).toLowerCase(),
      )
      .join(" ");
  } catch {
    return "Descriptive image alt text";
  }
}

for (const image of imageTags) {
  const alt = getAttribute(image, "alt");

  if (alt !== null && alt.trim().length > 0) {
    imagesWithAlt++;
  } else {
    imagesWithoutAlt++;

    const src = getImageSource(image);

    missingAltImages.push({
      src,
      alt,
      recommendedAlt: getRecommendedAlt(src),
    });
  }
}

    // ============================================================
    // CANONICAL
    // ============================================================

    const canonical = extractCanonical(html);
    const hasCanonical = Boolean(canonical);

    // ============================================================
    // VIEWPORT
    // ============================================================

    const viewport = extractMetaContent(html, "viewport");
    const hasViewport = Boolean(viewport);

    // ============================================================
    // ROBOTS META
    // ============================================================

    const robotsMeta = extractMetaContent(html, "robots");

    // ============================================================
    // HTML LANGUAGE
    // ============================================================

    const language = extractHtmlLanguage(html);

    // ============================================================
    // FAVICON
    // ============================================================

    const favicon = hasFavicon(html);

    // ============================================================
    // VISIBLE WORD COUNT
    // ============================================================

    const visibleText = extractVisibleText(html);
    const wordCount = countWords(visibleText);

    // ============================================================
    // INTERNAL / EXTERNAL LINKS
    // ============================================================

    const linkTags = getOpeningTags(html, "a");

    let internalLinks = 0;
    let externalLinks = 0;

    for (const link of linkTags) {
      const href = getAttribute(link, "href");

      if (!href) continue;

      const cleanHref = href.trim();

      if (
        cleanHref.startsWith("#") ||
        cleanHref.startsWith("mailto:") ||
        cleanHref.startsWith("tel:") ||
        cleanHref.startsWith("javascript:") ||
        cleanHref.startsWith("data:")
      ) {
        continue;
      }

      try {
        const absoluteLink = new URL(cleanHref, finalUrl);

        if (!/^https?:$/i.test(absoluteLink.protocol)) {
          continue;
        }

        const sourceHost = normalizeHostname(finalParsedUrl.hostname);
        const linkHost = normalizeHostname(absoluteLink.hostname);

        if (sourceHost === linkHost) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        // Ignore malformed href values.
      }
    }

    // ============================================================
    // ROBOTS.TXT
    // ============================================================

    const robotsTxtUrl = new URL("/robots.txt", finalUrl).toString();
    const robotsTxtResult = await fetchTextResource(robotsTxtUrl);

    const robotsTxt = robotsTxtResult.available;

    // ============================================================
    // SITEMAP
    // ============================================================

    const sitemapResult = await detectSitemap(finalUrl, robotsTxtResult.text);

    const sitemap = sitemapResult.available;

    // ============================================================
    // BASIC FLAGS
    // ============================================================

    const hasTitle = titleLength > 0;
    const hasDescription = descriptionLength > 0;
    const hasH1 = h1Count > 0;
    const hasSingleH1 = h1Count === 1;
    const hasHttps = finalParsedUrl.protocol === "https:";

    // ============================================================
    // QUALITY
    // ============================================================

    const titleQuality = getTitleQuality(titleLength);
    const descriptionQuality = getDescriptionQuality(descriptionLength);

    // ============================================================
    // TECHNICAL SEO SCORE
    // ============================================================

    let technicalSeoScore = 0;

    if (hasHttps) technicalSeoScore += 20;
    if (hasCanonical) technicalSeoScore += 20;
    if (hasViewport) technicalSeoScore += 20;
    if (robotsTxt) technicalSeoScore += 20;
    if (sitemap) technicalSeoScore += 20;

    technicalSeoScore = clampScore(technicalSeoScore);

   // ============================================================
// META TAG SCORE
// ============================================================

let metaScore = 0;

// Page Title — 50 points
if (titleQuality === "ideal") {
  metaScore += 50;
} else if (titleQuality === "acceptable") {
  metaScore += 35;
} else if (titleQuality === "tooShort" || titleQuality === "tooLong") {
  metaScore += 20;
}

// Meta Description — 50 points
if (descriptionQuality === "ideal") {
  metaScore += 50;
} else if (descriptionQuality === "acceptable") {
  metaScore += 35;
} else if (
  descriptionQuality === "tooShort" ||
  descriptionQuality === "tooLong"
) {
  metaScore += 20;
}

metaScore = clampScore(metaScore);

// ============================================================
// CONTENT QUALITY SCORE
// ============================================================

let contentScore = 0;

// H1 — 30 points
if (h1Count === 1) {
  contentScore += 30;
} else if (h1Count > 1) {
  contentScore += 15;
}

// H2 structure — 20 points
if (h2Count >= 2 && h2Count <= 20) {
  contentScore += 20;
} else if (h2Count > 20) {
  // Too many H2s may indicate decorative/repeated headings
  contentScore += 10;
} else if (h2Count === 1) {
  contentScore += 10;
}

// Title relevance — 15 points
if (titleLength >= 30 && titleLength <= 60) {
  contentScore += 15;
} else if (titleLength > 0) {
  contentScore += 8;
}

// Content depth — 35 points
if (wordCount >= 1500) {
  contentScore += 35;
} else if (wordCount >= 1000) {
  contentScore += 30;
} else if (wordCount >= 700) {
  contentScore += 25;
} else if (wordCount >= 500) {
  contentScore += 20;
} else if (wordCount >= 300) {
  contentScore += 10;
}

contentScore = clampScore(contentScore);

// ============================================================
// IMAGE SCORE
// ============================================================

const imageScore =
  totalImages === 0
    ? 100
    : Math.round((imagesWithAlt / totalImages) * 100);

// ============================================================
// MOBILE SCORE
// ============================================================

const mobileScore = hasViewport ? 100 : 40;

// ============================================================
// PAGE PERFORMANCE SCORE
// ============================================================

let pagePerformanceScore = 100;

// Server response time
if (responseTime > 2000) {
  pagePerformanceScore -= 40;
} else if (responseTime > 1000) {
  pagePerformanceScore -= 25;
} else if (responseTime > 500) {
  pagePerformanceScore -= 10;
}

// HTML document size
if (htmlSizeKB > 1000) {
  pagePerformanceScore -= 35;
} else if (htmlSizeKB > 500) {
  pagePerformanceScore -= 25;
} else if (htmlSizeKB > 300) {
  pagePerformanceScore -= 15;
} else if (htmlSizeKB > 150) {
  pagePerformanceScore -= 5;
}

pagePerformanceScore = clampScore(pagePerformanceScore);

// ============================================================
// SEO OPPORTUNITIES SCORE
// ============================================================

let seoOpportunitiesScore = 100;

// H1
if (!hasH1) {
  seoOpportunitiesScore -= 25;
} else if (h1Count > 1) {
  seoOpportunitiesScore -= 10;
}

// Title
if (!hasTitle) {
  seoOpportunitiesScore -= 15;
} else if (titleLength < 30 || titleLength > 60) {
  seoOpportunitiesScore -= 5;
}

// Meta description
if (!hasDescription) {
  seoOpportunitiesScore -= 15;
} else if (descriptionLength < 70 || descriptionLength > 160) {
  seoOpportunitiesScore -= 5;
}

// Images
if (imagesWithoutAlt > 0) {
  seoOpportunitiesScore -= 15;
}

// Technical signals
if (!hasCanonical) {
  seoOpportunitiesScore -= 10;
}

if (!robotsTxt) {
  seoOpportunitiesScore -= 10;
}

if (!sitemap) {
  seoOpportunitiesScore -= 10;
}

// Internal linking
if (internalLinks === 0) {
  seoOpportunitiesScore -= 10;
}

seoOpportunitiesScore = clampScore(seoOpportunitiesScore);

// ============================================================
// OVERALL SCORE
// ============================================================

// Weighted scoring.
// Technical SEO and content/meta quality carry more importance
// than opportunity signals, while image accessibility contributes
// without dominating the overall score.

const overallScore = Math.round(
  technicalSeoScore * 0.20 +
    pagePerformanceScore * 0.15 +
    metaScore * 0.20 +
    mobileScore * 0.10 +
    contentScore * 0.20 +
    imageScore * 0.05 +
    seoOpportunitiesScore * 0.10,
);

    // ============================================================
    // BACKLINK DATA
    // ============================================================
    // Do NOT invent backlink numbers.
    // Backlinks/referring domains require an external backlink index.
    // ============================================================

    const backlinkData: BacklinkData = {
      available: false,
      backlinks: null,
      referringDomains: null,
      dofollow: null,
      nofollow: null,
      message: "Backlink data requires an external backlink index.",
    };

    // ============================================================
    // ACTIONABLE SEO RECOMMENDATIONS
    // ============================================================

    const recommendations = buildRecommendations({
      title,
      titleLength,
      description,
      descriptionLength,
      h1Count,
      h2Count,
      h1Texts: extractHeadingTexts(html, "h1"),
      h2Texts: extractHeadingTexts(html, "h2"),
      totalImages,
      imagesWithoutAlt,
      hasCanonical,
      hasHttps,
      hasViewport,
      robotsTxt,
      sitemap,
      favicon,
      responseTime,
      htmlSizeKB,
      internalLinks,
      visibleText,
      hostname: finalParsedUrl.hostname,
      language,
    });

    // ============================================================
    // FINAL RESPONSE
    // ============================================================

    return NextResponse.json({
      success: true,

      website: {
        url: finalUrl,
        hostname: finalParsedUrl.hostname,
        statusCode: response.status,
        responseTime,
        htmlSizeKB,
      },

      score: overallScore,

      results: {
        technicalSeo: {
          score: technicalSeoScore,
          status: getStatus(technicalSeoScore),
        },

        pagePerformance: {
          score: pagePerformanceScore,
          status: getStatus(pagePerformanceScore),
        },

        metaTags: {
          score: metaScore,
          status: getStatus(metaScore),
        },

        mobileOptimization: {
          score: mobileScore,
          status: getStatus(mobileScore),
        },

        contentQuality: {
          score: contentScore,
          status: getStatus(contentScore),
        },

        seoOpportunities: {
          score: seoOpportunitiesScore,
          status: getStatus(seoOpportunitiesScore),
        },
      },

      backlinks: backlinkData,

      details: {
        title,
        titleLength,

        description,
        descriptionLength,

        h1Count,
        h2Count,
        singleH1: hasSingleH1,

        wordCount,

        totalImages,
        imagesWithAlt,
        imagesWithoutAlt,
    missingAltImages,

        internalLinks,
        externalLinks,

        canonical,

        https: hasHttps,

        mobileViewport: hasViewport,

        robotsMeta,

        robotsTxt,
        robotsTxtUrl,

        sitemap,
        sitemapUrl: sitemapResult.url,

        favicon,

        language,
      },

      recommendations,

      quality: {
        title: {
          status: titleQuality,
          recommendedRange: "30-60 characters",
        },

        metaDescription: {
          status: descriptionQuality,
          recommendedRange: "70-160 characters",
        },

        images: {
          score: imageScore,
          total: totalImages,
          withAlt: imagesWithAlt,
          withoutAlt: imagesWithoutAlt,
        },
      },
    });
  } catch (error) {
    console.error("SEO Audit Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to analyze this website. Please check the URL and try again.",
      },
      { status: 500 },
    );
  }
}

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// CHECK PRIVATE / LOCAL HOSTNAMES
// ============================================================

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host === "localhost.localdomain" ||
    host.endsWith(".local") ||
    host === "0.0.0.0"
  ) {
    return true;
  }

  const ipv4 = host.match(
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  );

  if (!ipv4) return false;

  const parts = host.split(".").map(Number);
  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

// ============================================================
// CHECK TEXT RESOURCE
// ============================================================

async function fetchTextResource(
  url: string,
): Promise<{ available: boolean; text: string | null; status: number | null }> {
  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": BOT_USER_AGENT,
          Accept: "text/plain,text/xml,application/xml,*/*;q=0.8",
        },
        redirect: "follow",
        cache: "no-store",
      },
      AUX_FETCH_TIMEOUT,
    );

    if (!response.ok) {
      return {
        available: false,
        text: null,
        status: response.status,
      };
    }

    const text = await response.text();

    return {
      available: true,
      text,
      status: response.status,
    };
  } catch {
    return {
      available: false,
      text: null,
      status: null,
    };
  }
}

// ============================================================
// DETECT SITEMAP
// ============================================================

async function detectSitemap(
  baseUrl: string,
  robotsText: string | null,
): Promise<{ available: boolean; url: string | null }> {
  const candidates: string[] = [];

  if (robotsText) {
    const sitemapLines = robotsText.match(/^sitemap:\s*(.+)$/gim) || [];

    for (const line of sitemapLines) {
      const value = line.replace(/^sitemap:\s*/i, "").trim();

      if (value) {
        try {
          const url = new URL(value, baseUrl).toString();

          if (/^https?:$/i.test(new URL(url).protocol)) {
            candidates.push(url);
          }
        } catch {
          // Ignore invalid sitemap declarations.
        }
      }
    }
  }

  candidates.push(
    new URL("/sitemap.xml", baseUrl).toString(),
    new URL("/sitemap_index.xml", baseUrl).toString(),
    new URL("/sitemap-index.xml", baseUrl).toString(),
  );

  const uniqueCandidates = [...new Set(candidates)];

  for (const sitemapUrl of uniqueCandidates) {
    try {
      const result = await fetchTextResource(sitemapUrl);

      if (!result.available || !result.text) {
        continue;
      }

      const content = result.text.trim().toLowerCase();

      if (
        content.includes("<urlset") ||
        content.includes("<sitemapindex") ||
        content.includes("<urlset ")
      ) {
        return {
          available: true,
          url: sitemapUrl,
        };
      }
    } catch {
      // Continue checking other candidates.
    }
  }

  return {
    available: false,
    url: null,
  };
}

// ============================================================
// GET OPENING HTML TAGS
// ============================================================

function getOpeningTags(html: string, tagName: string): string[] {
  const safeTag = escapeRegExp(tagName);

  const regex = new RegExp(`<${safeTag}\\b[^>]*>`, "gi");

  return html.match(regex) || [];
}

// ============================================================
// ESCAPE REGEX
// ============================================================

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHeadingTexts(html: string, tagName: string): string[] {
  const safeTag = escapeRegExp(tagName);
  const regex = new RegExp(
    `<${safeTag}\\b[^>]*>([\\s\\S]*?)<\\/${safeTag}>`,
    "gi",
  );

  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    const text = cleanHtmlText(match[1] || "");
    if (text) values.push(text);
  }

  return values;
}

// ============================================================
// EXTRACT TITLE
// ============================================================

function extractTitle(html: string): string {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);

  if (!match?.[1]) {
    return "";
  }

  return cleanHtmlText(match[1]);
}

// ============================================================
// EXTRACT META CONTENT
// ============================================================

function extractMetaContent(html: string, name: string): string {
  const metaTags = getOpeningTags(html, "meta");

  for (const tag of metaTags) {
    const tagName = getAttribute(tag, "name");

    if (
      tagName &&
      tagName.trim().toLowerCase() === name.trim().toLowerCase()
    ) {
      const content = getAttribute(tag, "content");

      return cleanHtmlText(content || "");
    }

    // Also support property="og:description" only when requested
    // as a property-style name.
    const property = getAttribute(tag, "property");

    if (
      property &&
      property.trim().toLowerCase() === name.trim().toLowerCase()
    ) {
      const content = getAttribute(tag, "content");

      return cleanHtmlText(content || "");
    }
  }

  return "";
}

// ============================================================
// EXTRACT CANONICAL
// ============================================================

function extractCanonical(html: string): string | null {
  const linkTags = getOpeningTags(html, "link");

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel");

    if (!rel) continue;

    const relValues = rel
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (!relValues.includes("canonical")) {
      continue;
    }

    const href = getAttribute(tag, "href");

    if (href && href.trim()) {
      return href.trim();
    }
  }

  return null;
}

// ============================================================
// GET ATTRIBUTE
// ============================================================

function getAttribute(
  tag: string,
  attributeName: string,
): string | null {
  const safeName = escapeRegExp(attributeName);

  const regex = new RegExp(
    `\\b${safeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + "`" + `]+))`,
    "i",
  );

  const match = tag.match(regex);

  if (!match) {
    return null;
  }

  return match[1] ?? match[2] ?? match[3] ?? null;
}

// ============================================================
// HTML LANGUAGE
// ============================================================

function extractHtmlLanguage(html: string): string | null {
  const htmlTagMatch = html.match(/<html\b[^>]*>/i);

  if (!htmlTagMatch) {
    return null;
  }

  return getAttribute(htmlTagMatch[0], "lang");
}

// ============================================================
// FAVICON
// ============================================================

function hasFavicon(html: string): boolean {
  const linkTags = getOpeningTags(html, "link");

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel");

    if (!rel) continue;

    const relValues = rel
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);

    if (
      relValues.includes("icon") ||
      relValues.includes("shortcut") ||
      relValues.includes("apple-touch-icon")
    ) {
      return true;
    }
  }

  return false;
}

// ============================================================
// VISIBLE TEXT
// ============================================================

function extractVisibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<template\b[^>]*>[\s\S]*?<\/template>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// WORD COUNT
// ============================================================

function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

// ============================================================
// CLEAN HTML TEXT
// ============================================================

function cleanHtmlText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// NORMALIZE HOSTNAME
// ============================================================

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

// ============================================================
// TITLE QUALITY
// ============================================================

function getTitleQuality(
  length: number,
):
  | "missing"
  | "tooShort"
  | "ideal"
  | "tooLong"
  | "acceptable" {
  if (length === 0) return "missing";
  if (length < 30) return "tooShort";
  if (length <= 60) return "ideal";
  if (length <= 70) return "acceptable";

  return "tooLong";
}

// ============================================================
// DESCRIPTION QUALITY
// ============================================================

function getDescriptionQuality(
  length: number,
):
  | "missing"
  | "tooShort"
  | "ideal"
  | "tooLong"
  | "acceptable" {
  if (length === 0) return "missing";
  if (length < 70) return "tooShort";
  if (length <= 160) return "ideal";
  if (length <= 180) return "acceptable";

  return "tooLong";
}

// ============================================================
// SCORE CLAMP
// ============================================================

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================
// STATUS
// ============================================================

function getStatus(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Work";

  return "Poor";
}

// ============================================================
// RECOMMENDATIONS
// ============================================================

function buildRecommendations({
  title,
  titleLength,
  description,
  descriptionLength,
  h1Count,
  h2Count,
  h1Texts,
  h2Texts,
  totalImages,
  imagesWithoutAlt,
  hasCanonical,
  hasHttps,
  hasViewport,
  robotsTxt,
  sitemap,
  favicon,
  responseTime,
  htmlSizeKB,
  internalLinks,
  visibleText,
  hostname,
  language,
}: AuditInput & {
  visibleText: string;
  hostname: string;
  language: string | null;
  h1Texts: string[];
  h2Texts: string[];
}): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const context = buildContentContext(
    title,
    description,
    visibleText,
    hostname,
    h1Texts,
    h2Texts,
  );

  const recommendedTitle = buildRecommendedTitle(context);
  const recommendedMetaDescription =
    buildRecommendedMetaDescription(context);

  // ============================================================
  // H1
  // ============================================================

  if (h1Count === 0) {
    recommendations.push({
      type: "error",
      title: "H1 Heading",
      description:
        "No H1 heading was detected. Add one clear primary H1 that describes the page's main topic.",
    });
  } else if (h1Count === 1) {
    recommendations.push({
      type: "success",
      title: "H1 Heading",
      description: "One H1 heading was detected.",
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Multiple H1 headings",
      description: `${h1Count} H1 headings were detected. Consider using one primary H1 for the page.`,
    });
  }

  // ============================================================
  // TITLE
  // ============================================================

  if (!title) {
    recommendations.push({
      type: "error",
      title: "Page Title",
      description:
        "No page title was detected. Add a unique, descriptive SEO title.",
      recommendedTitle,
    });
  } else if (titleLength >= 30 && titleLength <= 60) {
    recommendations.push({
      type: "success",
      title: "Page Title",
      description: `Current title length: ${titleLength} characters. The title is within the recommended 30-60 character range.`,
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Page Title",
      description: `Current title length: ${titleLength} characters. Consider rewriting it within the recommended 30-60 character range.`,
      recommendedTitle,
    });
  }

  // ============================================================
  // META DESCRIPTION
  // ============================================================

  if (!description) {
    recommendations.push({
      type: "error",
      title: "Meta Description",
      description:
        "No meta description was detected. Add a unique description that clearly explains the page and encourages clicks.",
      recommendedMetaDescription,
    });
  } else if (descriptionLength >= 70 && descriptionLength <= 160) {
    recommendations.push({
      type: "success",
      title: "Meta Description",
      description: `Current description length: ${descriptionLength} characters. The description is within the recommended 70-160 character range.`,
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Meta Description",
      description: `Current description length: ${descriptionLength} characters. Consider rewriting it within the recommended 70-160 character range.`,
      recommendedMetaDescription,
    });
  }

  // ============================================================
  // IMAGES ALT
  // ============================================================

  if (totalImages === 0) {
    recommendations.push({
      type: "success",
      title: "Image ALT Attributes",
      description: "No images were detected in the analyzed HTML.",
    });
  } else if (imagesWithoutAlt > 0) {
    recommendations.push({
      type: "warning",
      title: "Image ALT Attributes",
      description: `${imagesWithoutAlt} of ${totalImages} detected image(s) are missing useful ALT text. Add descriptive ALT text to meaningful images; keep decorative images empty.`,
    });
  } else {
    recommendations.push({
      type: "success",
      title: "Image ALT Attributes",
      description: "All detected images contain non-empty ALT attributes.",
    });
  }

  // ============================================================
  // CANONICAL
  // ============================================================

  if (hasCanonical) {
    recommendations.push({
      type: "success",
      title: "Canonical URL",
      description: "Canonical URL detected.",
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Canonical URL",
      description:
        "No canonical URL was detected. Add a canonical link to the preferred version of this page.",
    });
  }

  // ============================================================
  // HTTPS
  // ============================================================

  if (hasHttps) {
    recommendations.push({
      type: "success",
      title: "HTTPS",
      description: "HTTPS is enabled on the final audited URL.",
    });
  } else {
    recommendations.push({
      type: "error",
      title: "HTTPS",
      description:
        "HTTPS is not enabled on the final audited URL. Move the website to HTTPS and redirect HTTP to HTTPS.",
    });
  }

  // ============================================================
  // MOBILE VIEWPORT
  // ============================================================

  if (hasViewport) {
    recommendations.push({
      type: "success",
      title: "Mobile Viewport",
      description: "A mobile viewport meta tag was detected.",
    });
  } else {
    recommendations.push({
      type: "error",
      title: "Mobile Viewport",
      description:
        "No mobile viewport meta tag was detected. Add a responsive viewport declaration.",
    });
  }

  // ============================================================
  // ROBOTS
  // ============================================================

  if (robotsTxt) {
    recommendations.push({
      type: "success",
      title: "Robots.txt",
      description: "Robots.txt was detected and returned successfully.",
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Robots.txt",
      description:
        "Robots.txt was not detected successfully at the website root.",
    });
  }

  // ============================================================
  // SITEMAP
  // ============================================================

  if (sitemap) {
    recommendations.push({
      type: "success",
      title: "XML Sitemap",
      description:
        "A valid sitemap resource was detected.",
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "XML Sitemap",
      description:
        "No valid XML sitemap was detected from robots.txt or the common sitemap locations.",
    });
  }

  // ============================================================
  // FAVICON
  // ============================================================

  if (favicon) {
    recommendations.push({
      type: "success",
      title: "Favicon",
      description: "A favicon link was detected in the HTML.",
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Favicon",
      description:
        "A favicon link was not detected in the HTML.",
    });
  }

  // ============================================================
  // H2
  // ============================================================

 // ============================================================
// H2
// ============================================================

if (h2Count >= 2 && h2Count <= 10) {
  recommendations.push({
    type: "success",
    title: "Heading Structure",
    description: `${h2Count} H2 headings were detected. The page has multiple section headings that help organize the content.`,
  });
} else if (h2Count > 10) {
  recommendations.push({
    type: "warning",
    title: "Heading Structure",
    description: `${h2Count} H2 headings were detected. Review the heading hierarchy and make sure each H2 represents a meaningful page section rather than repeated or decorative headings.`,
  });
} else if (h2Count === 1) {
  recommendations.push({
    type: "warning",
    title: "Heading Structure",
    description:
      "Only one H2 heading was detected. Consider adding descriptive H2 headings for important page sections where appropriate.",
  });
} else {
  recommendations.push({
    type: "warning",
    title: "Heading Structure",
    description:
      "No H2 headings were detected. Add descriptive section headings where they improve the page structure.",
  });
}
  // ============================================================
  // INTERNAL LINKS
  // ============================================================

  if (internalLinks > 0) {
    recommendations.push({
      type: "success",
      title: "Internal Links",
      description: `${internalLinks} internal link(s) were detected.`,
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Internal Links",
      description:
        "No internal links were detected. Add relevant internal links to help users and search engines discover related pages.",
    });
  }

  // ============================================================
  // EXTERNAL LINKS
  // ============================================================

  // External links are not automatically a problem.
  recommendations.push({
    type: "success",
    title: "External Links",
    description:
      "External links are reported as a factual count. Their presence is not treated as a negative SEO signal by itself.",
  });

  // ============================================================
  // PERFORMANCE
  // ============================================================

  if (responseTime <= 500) {
    recommendations.push({
      type: "success",
      title: "Page Performance",
      description: `Fast server response: ${responseTime} ms.`,
    });
  } else if (responseTime <= 1000) {
    recommendations.push({
      type: "warning",
      title: "Page Performance",
      description: `Server response time is ${responseTime} ms. There may be room for improvement.`,
    });
  } else {
    recommendations.push({
      type: "error",
      title: "Page Performance",
      description: `Server response time is ${responseTime} ms. Consider investigating server, CDN, caching, and backend response performance.`,
    });
  }

  // ============================================================
  // HTML SIZE
  // ============================================================

  if (htmlSizeKB <= 150) {
    recommendations.push({
      type: "success",
      title: "HTML Size",
      description: `HTML size is ${htmlSizeKB} KB.`,
    });
  } else if (htmlSizeKB <= 300) {
    recommendations.push({
      type: "warning",
      title: "HTML Size",
      description: `HTML size is ${htmlSizeKB} KB. Consider reducing unnecessary markup if possible.`,
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "HTML Size",
      description: `HTML size is ${htmlSizeKB} KB. Consider optimizing the page HTML and reducing unnecessary markup.`,
    });
  }

  // ============================================================
  // LANGUAGE
  // ============================================================

  if (!language) {
    recommendations.push({
      type: "warning",
      title: "HTML Language",
      description:
        "No lang attribute was detected on the HTML element. Add the correct page language, such as lang=\"en\" or lang=\"te\".",
    });
  }

  return recommendations;
}

// ============================================================
// CONTENT CONTEXT FOR ACTIONABLE SUGGESTIONS
// ============================================================

function buildContentContext(
  title: string,
  description: string,
  visibleText: string,
  hostname: string,
  h1Texts: string[] = [],
  h2Texts: string[] = [],
): {
  topic: string;
  brand: string;
  existingTitle: string;
  existingDescription: string;
  signals: string[];
} {
  const domainName = normalizeHostname(hostname).split(".")[0];
  const brand = humanizeBrand(domainName);

  const cleanH1 = h1Texts
    .map(cleanHtmlText)
    .filter(Boolean)
    .slice(0, 3);

  const cleanH2 = h2Texts
    .map(cleanHtmlText)
    .filter(Boolean)
    .slice(0, 10);

  const topic = extractTopic(
    title,
    description,
    cleanH1,
    cleanH2,
    visibleText,
    domainName,
    brand,
  );

  return {
    topic,
    brand,
    existingTitle: title,
    existingDescription: description,
    signals: [
      title,
      description,
      ...cleanH1,
      ...cleanH2,
    ]
      .map(cleanHtmlText)
      .filter(Boolean),
  };
}

// ============================================================
// EXTRACT A MORE RELIABLE PAGE TOPIC
// ============================================================

function extractTopic(
  title: string,
  description: string,
  h1Texts: string[],
  h2Texts: string[],
  visibleText: string,
  domainName: string,
  brand: string,
): string {
  /*
   * Topic detection priority:
   * 1. Strong niche signals from the actual website
   * 2. H1
   * 3. Existing title
   * 4. Strong H2 signals
   * 5. Meta description
   * 6. Important keywords
   * 7. Brand/domain fallback
   */

  const sourceText = [
    title,
    description,
    ...h1Texts,
    ...h2Texts,
    visibleText.slice(0, 12000),
    domainName,
    brand,
  ]
    .join(" ")
    .toLowerCase();

  const nicheGroups: Array<{
    keywords: string[];
    topic: string;
  }> = [
    {
      keywords: [
        "government jobs",
        "govt jobs",
        "government job",
        "private jobs",
        "private job",
        "job notifications",
        "job notification",
        "latest jobs",
        "employment",
        "recruitment",
        "vacancy",
        "vacancies",
        "competitive exams",
        "exam notifications",
      ],
      topic: "Jobs & Recruitment",
    },
    {
      keywords: [
        "ai prompt",
        "ai prompts",
        "chatgpt",
        "midjourney",
        "prompt library",
        "prompt engineering",
        "artificial intelligence",
        "generative ai",
        "ai tools",
      ],
      topic: "AI Prompts & Tools",
    },
    {
      keywords: [
        "digital marketing",
        "seo",
        "search engine optimization",
        "social media marketing",
        "content marketing",
        "online marketing",
      ],
      topic: "Digital Marketing & SEO",
    },
    {
      keywords: [
        "recipes",
        "recipe",
        "cooking",
        "food",
        "breakfast",
        "lunch",
        "dinner",
        "dessert",
      ],
      topic: "Recipes & Food",
    },
    {
      keywords: [
        "travel",
        "tourism",
        "destinations",
        "hotels",
        "places to visit",
        "trip",
        "vacation",
      ],
      topic: "Travel & Tourism",
    },
    {
      keywords: [
        "technology",
        "tech news",
        "gadgets",
        "software",
        "apps",
        "smartphone",
        "artificial intelligence",
      ],
      topic: "Technology & AI",
    },
    {
      keywords: [
        "kids stories",
        "children stories",
        "bedtime stories",
        "moral stories",
        "fairy tales",
        "learning for kids",
        "educational content for children",
      ],
      topic: "Kids Stories & Learning",
    },
  ];

  let bestTopic = "";
  let bestScore = 0;

  for (const group of nicheGroups) {
    const score = group.keywords.reduce(
      (total, keyword) =>
        total + (sourceText.includes(keyword) ? 1 : 0),
      0,
    );

    if (score > bestScore) {
      bestScore = score;
      bestTopic = group.topic;
    }
  }

  if (bestTopic && bestScore >= 1) {
    return bestTopic;
  }

  const candidates = [
    ...h1Texts,
    title,
    ...h2Texts,
    description,
  ]
    .map((value) => cleanTopicCandidate(value, brand))
    .filter(Boolean);

  for (const candidate of candidates) {
    if (isUsefulTopic(candidate, brand)) {
      return candidate;
    }
  }

  const signalText = [
    title,
    description,
    ...h1Texts,
    ...h2Texts,
  ].join(" ");

  const keywords = extractImportantKeywords(signalText);

  if (keywords.length >= 2) {
    return keywords.slice(0, 4).join(" ");
  }

  if (keywords.length === 1) {
    return keywords[0];
  }

  if (brand) {
    return brand;
  }

  return domainName.replace(/[-_]+/g, " ");
}
// ============================================================
// CLEAN TOPIC CANDIDATE
// ============================================================

function cleanTopicCandidate(
  value: string,
  brand: string,
): string {
  if (!value) return "";

  let result = cleanHtmlText(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!result) return "";

  // Remove common navigation/UI words.
  result = result
    .replace(
      /^(home|welcome|review|reviews|menu|navigation|skip to content)\s*/i,
      "",
    )
    .replace(/^[|:â€“â€”-]+\s*/, "")
    .replace(/\s*[|:â€“â€”-]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // Remove leading/trailing separators again after cleanup.
  result = result
    .replace(/^[|:â€“â€”-]+\s*/, "")
    .replace(/\s*[|:â€“â€”-]+\s*$/, "")
    .trim();

  if (!result) return "";

  if (
    /^(home|about|contact|login|register|search|menu|read more|learn more|click here)$/i.test(
      result,
    )
  ) {
    return "";
  }

  // Avoid long body-like sentences.
  if (result.length > 100) {
    result = result.slice(0, 100).trim();
  }

  // Do not use the brand alone as the topic.
  if (
    brand &&
    result.toLowerCase() === brand.toLowerCase()
  ) {
    return "";
  }

  return result;
}

// ============================================================
// CHECK WHETHER A CANDIDATE IS A USEFUL TOPIC
// ============================================================

function isUsefulTopic(
  value: string,
  brand: string,
): boolean {
  const text = value.trim();

  if (text.length < 4) return false;

  const words = text.split(/\s+/).filter(Boolean);

  if (words.length === 0) return false;

  if (words.length > 12) return false;

  const genericPatterns = [
    /^welcome/i,
    /^home$/i,
    /^review$/i,
    /^reviews$/i,
    /^read more$/i,
    /^learn more$/i,
    /^click here$/i,
    /^see what/i,
    /^the world needs/i,
  ];

  if (
    genericPatterns.some((pattern) =>
      pattern.test(text),
    )
  ) {
    return false;
  }

  // Don't let a sentence containing the brand alone
  // become the topic.
  if (
    brand &&
    text.toLowerCase() === brand.toLowerCase()
  ) {
    return false;
  }

  return true;
}

// ============================================================
// IMPORTANT KEYWORD EXTRACTION
// ============================================================

function extractImportantKeywords(
  source: string,
): string[] {
  const words = source
    .toLowerCase()
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[^a-z0-9\u0C00-\u0C7F\s-]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "your",
    "this",
    "that",
    "from",
    "have",
    "has",
    "are",
    "was",
    "were",
    "you",
    "our",
    "about",
    "more",
    "into",
    "www",
    "com",
    "home",
    "page",
    "welcome",
    "read",
    "learn",
    "click",
    "here",
    "see",
    "view",
    "get",
    "best",
    "new",
    "latest",
    "review",
    "reviews",
    "menu",
    "contact",
    "login",
    "register",
    "story",
    "stories",
  ]);

  const frequency = new Map<string, number>();

  for (const word of words) {
    if (
      word.length >= 4 &&
      !stopWords.has(word) &&
      !/^\d+$/.test(word)
    ) {
      frequency.set(
        word,
        (frequency.get(word) || 0) + 1,
      );
    }
  }

  return [...frequency.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) {
        return b[1] - a[1];
      }

      return a[0].localeCompare(b[0]);
    })
    .map(([word]) => word)
    .slice(0, 6);
}

// ============================================================
// HUMANIZE BRAND
// ============================================================

function humanizeBrand(value: string): string {
  if (!value) return "";

  return value
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
// ============================================================
}
// RECOMMENDED META TITLE
// ============================================================

function buildRecommendedTitle(context: {
  topic: string;
  brand: string;
  existingTitle: string;
  existingDescription: string;
  signals: string[];
}): string {
  const brand = cleanBrandName(context.brand || "Website");
  const topic = cleanTopic(context.topic, brand);
  const lowerTopic = topic.toLowerCase();

  const candidates: string[] = [];

  // JOBS / RECRUITMENT
  if (
    lowerTopic.includes("job") ||
    lowerTopic.includes("recruitment") ||
    lowerTopic.includes("employment")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | Latest Jobs & Recruitment`,
        `Latest Jobs & Recruitment | ${brand}`,
        `${brand} | Government & Private Jobs`,
      );
    }
  }

  // AI / TECHNOLOGY
  else if (
    lowerTopic.includes("ai") ||
    lowerTopic.includes("prompt") ||
    lowerTopic.includes("technology")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | AI Tools, Prompts & Technology`,
        `AI Tools & Technology | ${brand}`,
        `${brand} | AI & Technology Guides`,
      );
    }
  }

  // DIGITAL MARKETING / SEO
  else if (
    lowerTopic.includes("digital marketing") ||
    lowerTopic.includes("seo")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | SEO & Digital Marketing`,
        `SEO & Digital Marketing | ${brand}`,
        `${brand} | SEO, Marketing & Growth`,
      );
    }
  }

  // RECIPES / FOOD
  else if (
    lowerTopic.includes("recipe") ||
    lowerTopic.includes("food")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | Recipes & Food Ideas`,
        `Recipes & Food Ideas | ${brand}`,
        `${brand} | Easy Recipes & Cooking`,
      );
    }
  }

  // TRAVEL / TOURISM
  else if (
    lowerTopic.includes("travel") ||
    lowerTopic.includes("tourism")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | Travel & Tourism Guides`,
        `Travel & Tourism Guides | ${brand}`,
        `${brand} | Travel Tips & Destinations`,
      );
    }
  }

  // KIDS / STORIES / LEARNING
  else if (
    lowerTopic.includes("kids") ||
    lowerTopic.includes("stories") ||
    lowerTopic.includes("learning")
  ) {
    if (brand) {
      candidates.push(
        `${brand} | Kids Stories & Learning`,
        `Kids Stories & Learning | ${brand}`,
        `${brand} | Stories & Educational Content`,
      );
    }
  }

  // GENERIC FALLBACK
  if (topic && brand) {
    candidates.push(
      `${topic} | ${brand}`,
      `${brand} | ${topic}`,
    );
  }

  if (topic) {
    candidates.push(`${topic} | Useful Guides & Resources`);
  }

  if (brand) {
    candidates.push(`${brand} | Useful Guides & Resources`);
  }

  const unique = [
    ...new Set(
      candidates
        .map((value) => cleanSuggestionPhrase(value))
        .filter(Boolean),
    ),
  ];

  const ideal = unique.filter(
    (value) => value.length >= 30 && value.length <= 60,
  );

  if (ideal.length > 0) {
    return ideal.sort(
      (a, b) => Math.abs(48 - a.length) - Math.abs(48 - b.length),
    )[0];
  }

  const closest = unique.sort(
    (a, b) => Math.abs(48 - a.length) - Math.abs(48 - b.length),
  )[0];

  return trimTitleToLength(
    closest || `${brand} | Useful Guides & Resources`,
    60,
  );
}

// ============================================================
// RECOMMENDED META DESCRIPTION
// ============================================================
// ============================================================

function buildRecommendedMetaDescription(context: {
  topic: string;
  brand: string;
  existingTitle: string;
  existingDescription: string;
  signals: string[];
}): string {
  const brand = cleanBrandName(context.brand);
  const topic = cleanTopic(context.topic, brand);

  const lowerTopic = topic.toLowerCase();
  const candidates: string[] = [];

  // ------------------------------------------------------------
  // JOBS / RECRUITMENT
  // ------------------------------------------------------------
  if (
    lowerTopic.includes("job") ||
    lowerTopic.includes("recruitment") ||
    lowerTopic.includes("employment")
  ) {
    if (topic && brand) {
      candidates.push(
        `Find the latest ${topic.toLowerCase()} updates from ${brand}. Get government jobs, private jobs, exam notifications and recruitment alerts.`,
        `Explore the latest ${topic.toLowerCase()} updates, government jobs, private vacancies, exam notifications and recruitment alerts from ${brand}.`,
      );
    } else if (brand) {
      candidates.push(
        `Get the latest government jobs, private jobs, exam notifications and recruitment updates from ${brand}.`,
      );
    }
  }

  // ------------------------------------------------------------
  // AI / TECHNOLOGY
  // ------------------------------------------------------------
  else if (
    lowerTopic.includes("ai") ||
    lowerTopic.includes("prompt") ||
    lowerTopic.includes("technology")
  ) {
    if (topic && brand) {
      candidates.push(
        `Explore ${topic.toLowerCase()} with ${brand}. Discover useful AI tools, prompts, technology updates and practical resources.`,
        `Discover ${topic.toLowerCase()} resources, useful AI tools, prompts and technology updates from ${brand}.`,
      );
    }
  }

  // ------------------------------------------------------------
  // DIGITAL MARKETING / SEO
  // ------------------------------------------------------------
  else if (
    lowerTopic.includes("digital marketing") ||
    lowerTopic.includes("seo")
  ) {
    if (topic && brand) {
      candidates.push(
        `Explore ${topic.toLowerCase()} strategies with ${brand}. Learn SEO, content marketing, social media and practical growth techniques.`,
        `Discover practical ${topic.toLowerCase()} tips, SEO strategies, content marketing and social media insights from ${brand}.`,
      );
    }
  }

  // ------------------------------------------------------------
  // RECIPES / FOOD
  // ------------------------------------------------------------
  else if (
    lowerTopic.includes("recipe") ||
    lowerTopic.includes("food")
  ) {
    if (topic && brand) {
      candidates.push(
        `Discover delicious ${topic.toLowerCase()} recipes from ${brand}, with easy cooking ideas, useful tips and meal inspiration.`,
        `Explore ${topic.toLowerCase()} recipes, cooking ideas and helpful food tips from ${brand}.`,
      );
    }
  }

  // ------------------------------------------------------------
  // TRAVEL
  // ------------------------------------------------------------
  else if (
    lowerTopic.includes("travel") ||
    lowerTopic.includes("tourism")
  ) {
    if (topic && brand) {
      candidates.push(
        `Explore ${topic.toLowerCase()} with ${brand}. Discover destinations, travel tips, places to visit and useful trip information.`,
        `Discover ${topic.toLowerCase()} destinations, travel guides, places to visit and useful tourism information from ${brand}.`,
      );
    }
  }

  // ------------------------------------------------------------
  // KIDS / STORIES / LEARNING
  // ------------------------------------------------------------
  else if (
    lowerTopic.includes("kids") ||
    lowerTopic.includes("stories") ||
    lowerTopic.includes("learning")
  ) {
    if (topic && brand) {
      candidates.push(
        `Explore ${topic.toLowerCase()} with ${brand}. Discover engaging stories, learning content and useful educational resources for children and families.`,
        `Discover ${topic.toLowerCase()}, educational content, stories and useful learning resources for children and families.`,
      );
    }
  }

  // ------------------------------------------------------------
  // GENERIC TOPIC-AWARE FALLBACK
  // ------------------------------------------------------------
  if (topic && brand) {
    candidates.push(
      `Explore ${topic.toLowerCase()} with ${brand}. Discover useful information, practical resources and helpful content for readers.`,
      `Discover useful ${topic.toLowerCase()} information, resources and practical content from ${brand}.`,
    );
  }

  if (topic) {
    candidates.push(
      `Explore ${topic.toLowerCase()} and discover useful information, practical resources and helpful content.`,
    );
  }

  if (brand) {
    candidates.push(
      `Explore ${brand} for useful information, practical resources, helpful guides and the latest updates.`,
    );
  }

  const cleanedCandidates = [
    ...new Set(
      candidates
        .map((value) => cleanMetaDescription(value))
        .filter(Boolean),
    ),
  ];

  const idealCandidates = cleanedCandidates.filter(
    (value) => value.length >= 70 && value.length <= 160,
  );

  // Prefer niche-aware fallback descriptions before generic candidates.
  if (topic === "Jobs & Recruitment") {
    return "Get the latest government jobs, private jobs, exam notifications and recruitment updates from Free Job Notifications.";
  }

  if (topic === "AI Prompts & Tools") {
    return "Discover AI prompts, useful AI tools, ChatGPT resources and practical prompt engineering guides for creators and professionals.";
  }

  if (topic === "Digital Marketing & SEO") {
    return "Discover practical SEO, digital marketing, social media and content marketing tips to improve your online visibility and growth.";
  }

  if (topic === "Recipes & Food") {
    return "Discover delicious recipes, cooking ideas, meal inspiration and helpful food guides for everyday cooking.";
  }

  if (topic === "Travel & Tourism") {
    return "Discover travel destinations, tourism guides, places to visit, hotels and useful tips for planning your next trip.";
  }

  if (topic === "Technology & AI") {
    return "Explore technology, AI, software, apps, gadgets and useful tech guides to stay informed and up to date.";
  }

  if (topic === "Kids Stories & Learning") {
    return "Explore engaging kids stories, educational content, learning resources and helpful activities for children and families.";
  }

  if (idealCandidates.length > 0) {
    return idealCandidates.sort(
      (a, b) =>
        Math.abs(125 - a.length) - Math.abs(125 - b.length),
    )[0];
  }

  const closest = cleanedCandidates.sort(
    (a, b) =>
      Math.abs(125 - a.length) - Math.abs(125 - b.length),
  )[0];

  if (closest) {
    return closest.slice(0, 160).trim();
  }


  return topic
    ? `Explore ${topic.toLowerCase()} and discover useful information, practical resources and helpful content.`
    : "Explore useful information, practical resources, helpful guides and the latest updates.";
}
function cleanBrandName(value: string): string {
  if (!value) return "";

  let brand = value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\.(com|in|org|net|co|edu|gov)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!brand) return "";

  // Convert common lowercase domain-style brand names.
  const lower = brand.toLowerCase();

  const knownBrands: Record<string, string> = {
    "vkkidsstories": "VK Kids Stories",
  };

  if (knownBrands[lower]) {
    return knownBrands[lower];
  }

  return brand
    .split(" ")
    .map((word) => {
      if (/^[A-Z0-9]+$/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}
// ============================================================
// CLEAN TOPIC
// ============================================================

function cleanTopic(value: string, brand: string): string {
  let topic = cleanHtmlText(value)
    .replace(/\s+/g, " ")
    .trim();

  if (!topic) {
    return "";
  }

  // Remove generic page words.
  topic = topic
    .replace(
      /\b(home|homepage|welcome|review|reviews|skip|menu|navigation)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Remove duplicated brand from the topic.
  if (
    brand &&
    topic.toLowerCase() === brand.toLowerCase()
  ) {
    return "";
  }

  topic = topic
    .replace(
      new RegExp(`\\b${escapeRegExp(brand)}\\b`, "gi"),
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!topic || topic.length < 3) {
    return "";
  }

  return titleCase(topic);
}


// ============================================================
// CLEAN TITLE
// ============================================================

function cleanSuggestionPhrase(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/\s*-\s*/g, " - ")
    
    
    .trim();
}


// ============================================================
// CLEAN META DESCRIPTION
// ============================================================

function cleanMetaDescription(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}


// ============================================================
// TRIM TITLE SAFELY
// ============================================================

function trimTitleToLength(
  value: string,
  maxLength: number,
): string {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value
    .slice(0, maxLength)
    .replace(/\s+\S*$/, "")
    .replace(/\s*[|,-]\s*$/, "")
    .trim();

  return shortened;
}


// ============================================================
// TITLE CASE
// ============================================================

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      // Preserve Telugu and other non-Latin words.
      if (/^[\u0C00-\u0C7F]+$/.test(word)) {
        return word;
      }

      // Preserve acronyms.
      if (/^[A-Z0-9]+$/.test(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ============================================================
// RECOMMENDED META DESCRIPTION
// ============================================================









