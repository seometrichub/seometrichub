import { NextResponse } from "next/server";

type CompetitorRequest = {
  yourUrl?: string;
  competitor1?: string;
  competitor2?: string;
};

type PageAnalysis = {
  url: string;
  finalUrl: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  images: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  https: boolean;
  canonical: boolean;
  viewport: boolean;
  robotsTxt: boolean;
  sitemap: boolean;
  responseTime: number;
  htmlSizeKb: number;
  score: number;
};

const BOT_USER_AGENT =
  "Mozilla/5.0 (compatible; SEOMETRICHUB Competitor Analysis Bot/1.0)";

const FETCH_TIMEOUT = 15000;

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

function isPrivateHostname(hostname: string) {
  const lower = hostname.toLowerCase();

  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "::1"
  ) {
    return true;
  }

  if (
    /^10\./.test(lower) ||
    /^192\.168\./.test(lower) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)
  ) {
    return true;
  }

  return false;
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttribute(tag: string, attribute: string) {
  const regex = new RegExp(
    `${attribute}\\s*=\\s*["']([^"']*)["']`,
    "i"
  );

  return tag.match(regex)?.[1]?.trim() || "";
}

function calculateScore(data: Omit<PageAnalysis, "score">) {
  let score = 0;

  if (data.https) score += 10;
  if (data.canonical) score += 10;
  if (data.viewport) score += 10;
  if (data.robotsTxt) score += 10;
  if (data.sitemap) score += 10;

  if (data.titleLength >= 30 && data.titleLength <= 60) {
    score += 10;
  } else if (data.titleLength > 0) {
    score += 5;
  }

  if (
    data.descriptionLength >= 120 &&
    data.descriptionLength <= 160
  ) {
    score += 10;
  } else if (data.descriptionLength > 0) {
    score += 5;
  }

  if (data.h1Count === 1) {
    score += 10;
  } else if (data.h1Count > 0) {
    score += 5;
  }

  if (data.wordCount >= 600) {
    score += 10;
  } else if (data.wordCount >= 300) {
    score += 5;
  }

  if (
    data.images === 0 ||
    data.imagesWithoutAlt / data.images <= 0.1
  ) {
    score += 10;
  } else if (
    data.imagesWithoutAlt / Math.max(data.images, 1) <= 0.3
  ) {
    score += 5;
  }

  return Math.min(score, 100);
}

async function checkTextFile(url: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": BOT_USER_AGENT,
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timer);

    return response.ok;
  } catch {
    return false;
  }
}

async function analyzePage(inputUrl: string): Promise<PageAnalysis> {
  const normalized = normalizeUrl(inputUrl);
  const parsedUrl = new URL(normalized);

  if (isPrivateHostname(parsedUrl.hostname)) {
    throw new Error("Private or local URLs are not allowed.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  const startedAt = performance.now();

  let response: Response;

  try {
    response = await fetch(normalized, {
      headers: {
        "User-Agent": BOT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const responseTime = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    throw new Error(
      `${normalized} returned HTTP ${response.status}.`
    );
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(`${normalized} did not return an HTML page.`);
  }

  const html = await response.text();
  const finalUrl = response.url || normalized;
  const finalParsed = new URL(finalUrl);

  const rawTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";
  const title = stripHtml(rawTitle);

  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

  let description = "";
  let viewport = false;

  for (const tag of metaTags) {
    const name = extractAttribute(tag, "name").toLowerCase();
    const property = extractAttribute(tag, "property").toLowerCase();
    const content = extractAttribute(tag, "content");

    if (
      !description &&
      (name === "description" || property === "og:description")
    ) {
      description = stripHtml(content);
    }

    if (name === "viewport") {
      viewport = true;
    }
  }

  const canonical =
    (html.match(
      /<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i
    ) ||
      html.match(
        /<link\b[^>]*href=["'][^"']+["'][^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i
      )) !== null;

  const h1Count = (html.match(/<h1\b[^>]*>/gi) || []).length;
  const h2Count = (html.match(/<h2\b[^>]*>/gi) || []).length;

  const visibleText = stripHtml(html);
  const wordCount = visibleText
    ? visibleText.split(/\s+/).filter(Boolean).length
    : 0;

  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  const images = imageTags.length;

  const imagesWithoutAlt = imageTags.filter((tag) => {
    const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
    return !altMatch || !altMatch[1].trim();
  }).length;

  const linkTags = html.match(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>/gi) || [];

  let internalLinks = 0;
  let externalLinks = 0;

  for (const tag of linkTags) {
    const href = extractAttribute(tag, "href");

    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      continue;
    }

    try {
      const linkUrl = new URL(href, finalUrl);

      if (
        linkUrl.hostname.replace(/^www\./, "") ===
        finalParsed.hostname.replace(/^www\./, "")
      ) {
        internalLinks += 1;
      } else {
        externalLinks += 1;
      }
    } catch {
      continue;
    }
  }

  const origin = finalParsed.origin;

  const [robotsTxt, sitemapXml, sitemapIndex] = await Promise.all([
    checkTextFile(`${origin}/robots.txt`),
    checkTextFile(`${origin}/sitemap.xml`),
    checkTextFile(`${origin}/sitemap_index.xml`),
  ]);

  const dataWithoutScore: Omit<PageAnalysis, "score"> = {
    url: normalized,
    finalUrl,
    title,
    titleLength: title.length,
    description,
    descriptionLength: description.length,
    h1Count,
    h2Count,
    wordCount,
    images,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    https: finalParsed.protocol === "https:",
    canonical,
    viewport,
    robotsTxt,
    sitemap: sitemapXml || sitemapIndex,
    responseTime,
    htmlSizeKb: Math.round((Buffer.byteLength(html, "utf8") / 1024) * 10) / 10,
  };

  return {
    ...dataWithoutScore,
    score: calculateScore(dataWithoutScore),
  };
}

function buildRecommendations(
  yourSite: PageAnalysis,
  competitors: PageAnalysis[]
) {
  const recommendations: string[] = [];

  const maxCompetitorWords = Math.max(
    ...competitors.map((item) => item.wordCount),
    0
  );

  const maxCompetitorInternalLinks = Math.max(
    ...competitors.map((item) => item.internalLinks),
    0
  );

  const bestCompetitorScore = Math.max(
    ...competitors.map((item) => item.score),
    0
  );

  if (yourSite.score < bestCompetitorScore) {
    recommendations.push(
      `Your on-page SEO score is ${yourSite.score}, while the strongest competitor scores ${bestCompetitorScore}. Focus first on the missing technical and content signals shown in the comparison.`
    );
  }

  if (
    maxCompetitorWords > yourSite.wordCount &&
    maxCompetitorWords - yourSite.wordCount >= 200
  ) {
    recommendations.push(
      `Your page has ${yourSite.wordCount} visible words. At least one competitor has ${maxCompetitorWords}. Consider expanding genuinely useful topic coverage where your page is thin.`
    );
  }

  if (yourSite.h1Count === 0) {
    recommendations.push(
      "Your page has no H1 heading. Add one clear primary heading that accurately describes the page."
    );
  }

  if (yourSite.h1Count > 1) {
    recommendations.push(
      `Your page has ${yourSite.h1Count} H1 headings. Review heading structure and keep the main page topic clear.`
    );
  }

  if (
    yourSite.titleLength < 30 ||
    yourSite.titleLength > 60
  ) {
    recommendations.push(
      `Your title is ${yourSite.titleLength} characters. Review it for clarity and search-result readability.`
    );
  }

  if (
    yourSite.descriptionLength < 120 ||
    yourSite.descriptionLength > 160
  ) {
    recommendations.push(
      `Your meta description is ${yourSite.descriptionLength} characters. Improve it so it clearly summarizes the page and encourages relevant clicks.`
    );
  }

  if (!yourSite.canonical) {
    recommendations.push(
      "Your page does not expose a canonical link element. Add one when appropriate to clarify the preferred URL."
    );
  }

  if (!yourSite.viewport) {
    recommendations.push(
      "Your page does not expose a viewport meta tag. Add one for proper mobile rendering."
    );
  }

  if (!yourSite.robotsTxt) {
    recommendations.push(
      "robots.txt was not detected at the site root. Review whether your site should provide one."
    );
  }

  if (!yourSite.sitemap) {
    recommendations.push(
      "A standard sitemap.xml or sitemap_index.xml was not detected. Add or expose an XML sitemap if appropriate."
    );
  }

  if (
    yourSite.images > 0 &&
    yourSite.imagesWithoutAlt > 0
  ) {
    recommendations.push(
      `${yourSite.imagesWithoutAlt} of ${yourSite.images} images are missing useful alt text. Review image accessibility and descriptive alternatives.`
    );
  }

  if (
    maxCompetitorInternalLinks > yourSite.internalLinks &&
    maxCompetitorInternalLinks - yourSite.internalLinks >= 5
  ) {
    recommendations.push(
      `Your page has ${yourSite.internalLinks} internal links, while at least one competitor has ${maxCompetitorInternalLinks}. Review whether stronger contextual internal linking could improve navigation and topic discovery.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Your page is competitive across the measured on-page signals. Continue improving content quality, user experience, and technical consistency."
    );
  }

  return recommendations;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompetitorRequest;

    const yourUrl = body.yourUrl?.trim();
    const competitor1 = body.competitor1?.trim();
    const competitor2 = body.competitor2?.trim();

    if (!yourUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "Your website URL is required.",
        },
        { status: 400 }
      );
    }

    if (!competitor1) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one competitor URL is required.",
        },
        { status: 400 }
      );
    }

    const urls = [yourUrl, competitor1];

    if (competitor2) {
      urls.push(competitor2);
    }

    const results = await Promise.allSettled(
      urls.map((url) => analyzePage(url))
    );

    const failures = results
      .map((result, index) => {
        if (result.status === "fulfilled") {
          return null;
        }

        return {
          url: urls[index],
          error:
            result.reason instanceof Error
              ? result.reason.message
              : "Unable to analyze this website.",
        };
      })
      .filter(Boolean);

    if (failures.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "One or more websites could not be analyzed.",
          failures,
        },
        { status: 400 }
      );
    }

    const fulfilled = results.map(
      (result) =>
        (result as PromiseFulfilledResult<PageAnalysis>).value
    );

    const yourSite = fulfilled[0];
    const competitors = fulfilled.slice(1);

    const recommendations = buildRecommendations(
      yourSite,
      competitors
    );

    return NextResponse.json({
      success: true,
      yourSite,
      competitors,
      recommendations,
      note:
        "This comparison uses directly observable on-page and technical website signals. It does not estimate traffic, domain authority, keyword rankings, or backlink index metrics.",
    });
  } catch (error) {
    console.error("Competitor analysis API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to complete competitor analysis.",
      },
      { status: 500 }
    );
  }
}

