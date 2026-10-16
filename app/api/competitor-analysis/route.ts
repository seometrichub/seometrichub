
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchCompetitorOrganicKeywords } from "@/lib/dataforseo-competitors";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";

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

function normalizeUrl(value: string): string {
  const trimmed = value.trim();

  return /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}

function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();

  if (isIP(lower) === 4) {
    const parts = lower.split(".").map(Number);
    const [a, b, c] = parts;

    return (
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
    );
  }

  if (isIP(lower) === 6) {
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      /^fe[89ab]/.test(lower) ||
      lower.startsWith("2001:db8:") ||
      lower.startsWith("::ffff:")
    );
  }

  return true;
}

async function validatePublicUrl(input: string): Promise<string> {
  const url = new URL(normalizeUrl(input));

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  if (url.username || url.password) {
    throw new Error("URLs with credentials are not allowed.");
  }

  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Custom URL ports are not allowed.");
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private or local URLs are not allowed.");
  }

  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Private or local IPs are not allowed.");
    }
  } else {
    const addresses = await lookup(hostname, { all: true });

    if (
      addresses.length === 0 ||
      addresses.some((item) => isPrivateIp(item.address))
    ) {
      throw new Error("Website does not resolve to a public IP.");
    }
  }

  return url.toString();
}

async function fetchPublicPage(
  input: string,
  timeout = FETCH_TIMEOUT
): Promise<Response> {
  let current = await validatePublicUrl(input);

  for (let redirects = 0; redirects <= 5; redirects++) {
    const response = await fetch(current, {
      headers: {
        "User-Agent": BOT_USER_AGENT,
        Accept: "text/html,application/xhtml+xml,*/*",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });

    if (
      [301, 302, 303, 307, 308].includes(response.status)
    ) {
      const location = response.headers.get("location");

      if (!location) {
        throw new Error("Redirect location is missing.");
      }

      if (redirects === 5) {
        throw new Error("Too many website redirects.");
      }

      current = await validatePublicUrl(
        new URL(location, current).toString()
      );

      continue;
    }

    return response;
  }

  throw new Error("Unable to fetch website.");
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAttribute(
  tag: string,
  attribute: string
): string {
  const regex = new RegExp(
    `${attribute}\\s*=\\s*["']([^"']*)["']`,
    "i"
  );

  return tag.match(regex)?.[1]?.trim() || "";
}

function calculateScore(
  data: Omit<PageAnalysis, "score">
): number {
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

async function checkTextFile(url: string): Promise<boolean> {
  try {
    const response = await fetchPublicPage(url, 6000);
    return response.ok;
  } catch {
    return false;
  }
}

async function analyzePage(
  inputUrl: string
): Promise<PageAnalysis> {
  const normalized = await validatePublicUrl(inputUrl);
  const startedAt = performance.now();

  const response = await fetchPublicPage(normalized);

  const responseTime = Math.round(
    performance.now() - startedAt
  );

  if (!response.ok) {
    throw new Error(
      `${normalized} returned HTTP ${response.status}.`
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(
      `${normalized} did not return an HTML page.`
    );
  }

  const html = await response.text();
  const finalUrl = response.url || normalized;
  const finalParsed = new URL(finalUrl);

  const rawTitle =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "";

  const title = stripHtml(rawTitle);
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];

  let description = "";
  let viewport = false;

  for (const tag of metaTags) {
    const name = extractAttribute(tag, "name").toLowerCase();
    const property = extractAttribute(
      tag,
      "property"
    ).toLowerCase();
    const content = extractAttribute(tag, "content");

    if (
      !description &&
      (name === "description" ||
        property === "og:description")
    ) {
      description = stripHtml(content);
    }

    if (name === "viewport") {
      viewport = true;
    }
  }

  const canonical = (
    html.match(/<link\b[^>]*>/gi) || []
  ).some(
    (tag) =>
      extractAttribute(tag, "rel")
        .toLowerCase()
        .split(/\s+/)
        .includes("canonical")
  );

  const h1Count =
    (html.match(/<h1\b[^>]*>/gi) || []).length;

  const h2Count =
    (html.match(/<h2\b[^>]*>/gi) || []).length;

  const visibleText = stripHtml(html);

  const wordCount = visibleText
    ? visibleText.split(/\s+/).filter(Boolean).length
    : 0;

  const imageTags = html.match(/<img\b[^>]*>/gi) || [];
  const images = imageTags.length;

  const imagesWithoutAlt = imageTags.filter((tag) => {
    const altMatch = tag.match(
      /\balt\s*=\s*["']([^"']*)["']/i
    );

    return !altMatch || !altMatch[1].trim();
  }).length;

  const linkTags = html.match(/<a\b[^>]*>/gi) || [];

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
        !["http:", "https:"].includes(linkUrl.protocol)
      ) {
        continue;
      }

      const linkHost = linkUrl.hostname.replace(
        /^www\./,
        ""
      );

      const siteHost = finalParsed.hostname.replace(
        /^www\./,
        ""
      );

      if (linkHost === siteHost) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {
      continue;
    }
  }

  const origin = finalParsed.origin;

  const [robotsTxt, sitemapXml, sitemapIndex] =
    await Promise.all([
      checkTextFile(`${origin}/robots.txt`),
      checkTextFile(`${origin}/sitemap.xml`),
      checkTextFile(`${origin}/sitemap_index.xml`),
    ]);

  const dataWithoutScore: Omit<
    PageAnalysis,
    "score"
  > = {
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
    htmlSizeKb:
      Math.round(
        (Buffer.byteLength(html, "utf8") / 1024) * 10
      ) / 10,
  };

  return {
    ...dataWithoutScore,
    score: calculateScore(dataWithoutScore),
  };
}

function buildRecommendations(
  yourSite: PageAnalysis,
  competitors: PageAnalysis[]
): string[] {
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
    maxCompetitorInternalLinks -
      yourSite.internalLinks >=
      5
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
            "Please sign in to use competitor analysis.",
        },
        { status: 401 }
      );
    }

    const body =
      (await request.json()) as CompetitorRequest;

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
          error:
            "At least one competitor URL is required.",
        },
        { status: 400 }
      );
    }

    const urls = [yourUrl, competitor1];

    if (competitor2) {
      urls.push(competitor2);
    }

    // Validate all targets before making external requests.
    let organicTargets: string[];

    try {
      organicTargets = await Promise.all(
        urls.map((url) => validatePublicUrl(url))
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide valid, publicly accessible website URLs.",
        },
        { status: 400 }
      );
    }

    // On-page SEO analysis.
    const results = await Promise.allSettled(
      organicTargets.map((url) => analyzePage(url))
    );

    const failures = results.flatMap(
      (result, index) => {
        if (result.status === "fulfilled") {
          return [];
        }

        return [
          {
            url: urls[index],
            error:
              result.reason instanceof Error
                ? result.reason.message
                : "Unable to analyze this website.",
          },
        ];
      }
    );

    // Your own website is required for on-page comparison.
    const yourResult = results[0];

    if (yourResult.status !== "fulfilled") {
      return NextResponse.json(
        {
          success: false,
          error: "Your website could not be analyzed.",
          failures,
        },
        { status: 400 }
      );
    }

    const yourSite = yourResult.value;

    // Failed competitors are excluded from on-page scores.
    const competitors = results
      .slice(1)
      .filter(
        (
          result
        ): result is PromiseFulfilledResult<PageAnalysis> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    // Existing monthly quota logic.
    const { data: quotaRows, error: quotaError } =
      await supabase.rpc("consume_tool_usage", {
        p_user_id: user.id,
        p_tool: "competitor_analysis",
      });

    if (quotaError) {
      console.error(
        "Competitor quota check failed:",
        {
          message: quotaError.message,
          code: quotaError.code,
        }
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to verify your competitor analysis usage limit.",
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
            "Unable to verify your competitor analysis usage limit.",
        },
        { status: 500 }
      );
    }

    if (!quota.allowed) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Monthly competitor analysis limit reached.",
          quota: {
            used: quota.used,
            limit: quota.limit_value,
            remaining: quota.remaining,
            periodEnd: quota.period_end,
          },
        },
        { status: 429 }
      );
    }

    const recommendations = buildRecommendations(
      yourSite,
      competitors
    );

    // ====================================================
    // DATAFORSEO ORGANIC COMPETITOR INTELLIGENCE
    // ====================================================

    // Existing API requests are reused for Keyword Gap.
    // A blocked HTML page can still have organic data.

    const organicResults = await Promise.allSettled(
      organicTargets.map((url) =>
        fetchCompetitorOrganicKeywords(url, {
          locationCode: 2356,
          languageCode: "en",
          limit: 20,
        })
      )
    );

    const organicIntelligence = organicResults.map(
      (result, index) => {
        const domain = new URL(
          organicTargets[index]
        ).hostname;

        if (result.status === "fulfilled") {
          return {
            domain,
            available: true,
            data: result.value,
            error: null,
          };
        }

        console.error(
          "Competitor organic data unavailable:",
          {
            domain,
            reason:
              result.reason instanceof Error
                ? result.reason.message
                : "Unknown error",
          }
        );

        return {
          domain,
          available: false,
          data: null,
          error: "Organic keyword data unavailable.",
        };
      }
    );

    // ====================================================
    // KEYWORD GAP ANALYSIS
    // ====================================================

    const normalizeKeyword = (keyword: string) =>
      keyword.trim().toLowerCase().replace(/\s+/g, " ");

    const yourOrganicData = organicIntelligence[0]?.data;

    const yourKeywordMap = new Map(
      (yourOrganicData?.keywords ?? []).map(
        (keyword) => [
          normalizeKeyword(keyword.keyword),
          keyword,
        ]
      )
    );

    type KeywordGapItem = {
      keyword: string;
      competitor: string;
      competitorPosition: number | null;
      yourPosition: number | null;
      searchVolume: number;
      cpc: number | null;
      intent: string | null;
      opportunity: string;
      type: "missing" | "weak";
    };

    const keywordGap = organicIntelligence
      .slice(1)
      .flatMap((competitor) => {
        if (
          !competitor.available ||
          !competitor.data
        ) {
          return [];
        }

        return competitor.data.keywords.flatMap<KeywordGapItem>(
          (keyword) => {
            const yourKeyword = yourKeywordMap.get(
              normalizeKeyword(keyword.keyword)
            );

            // Missing means absent from fetched sample,
            // NOT necessarily absent from Google rankings.
            if (!yourKeyword) {
              return [
                {
                  keyword: keyword.keyword,
                  competitor: competitor.domain,
                  competitorPosition:
                    keyword.position,
                  yourPosition: null,
                  searchVolume:
                    keyword.searchVolume,
                  cpc: keyword.cpc,
                  intent: keyword.searchIntent,
                  opportunity:
                    "Not found in your sampled keywords",
                  type: "missing" as const,
                },
              ];
            }

            if (
              keyword.position !== null &&
              yourKeyword.position !== null &&
              yourKeyword.position >
                keyword.position
            ) {
              return [
                {
                  keyword: keyword.keyword,
                  competitor: competitor.domain,
                  competitorPosition:
                    keyword.position,
                  yourPosition:
                    yourKeyword.position,
                  searchVolume:
                    keyword.searchVolume,
                  cpc: keyword.cpc,
                  intent: keyword.searchIntent,
                  opportunity:
                    "Improve existing ranking",
                  type: "weak" as const,
                },
              ];
            }

            return [];
          }
        );
      })
      .sort(
        (a, b) =>
          b.searchVolume - a.searchVolume
      );

    // ====================================================
    // STEP 74 - KEYWORD RELEVANCE & PRIORITY
    // ====================================================

    const seoKeywordTopics = [
      "seo",
      "search engine optimization",
      "keyword research",
      "keyword tool",
      "rank tracker",
      "rank tracking",
      "backlink",
      "competitor analysis",
      "website audit",
      "site audit",
      "technical seo",
      "organic traffic",
      "google ranking",
      "search console",
      "on page optimization",
      "digital marketing",
      "content optimization",
      "serp analysis",
      "local seo",
    ];

    const calculateKeywordPriority = (
      keyword: string,
      searchVolume: number,
      intent: string | null
    ) => {
      const normalized = keyword.toLowerCase().trim();

      const matchedTopics = seoKeywordTopics.filter((topic) =>
        normalized.includes(topic)
      );

      const relevanceScore =
        matchedTopics.length > 0 ? 70 : 10;

      const volumeScore =
        searchVolume >= 10000
          ? 20
          : searchVolume >= 1000
            ? 15
            : searchVolume >= 100
              ? 10
              : 5;

      const intentScore =
        intent === "commercial" ||
        intent === "transactional"
          ? 10
          : 0;

      const priorityScore = Math.min(
        100,
        relevanceScore + volumeScore + intentScore
      );

      const relevance =
        matchedTopics.length > 0 ? "High" : "Low";

      const priority =
        priorityScore >= 80
          ? "High"
          : priorityScore >= 50
            ? "Medium"
            : "Low";

      return {
        relevance,
        priority,
        priorityScore,
        matchedTopics,
      };
    };

    const prioritizedKeywordGap = keywordGap
      .map((item) => ({
        ...item,
        ...calculateKeywordPriority(
          item.keyword,
          item.searchVolume,
          item.intent
        ),
      }))
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore ||
          b.searchVolume - a.searchVolume
      );

    const keywordGapSummary = {
      totalOpportunities: keywordGap.length,
      missingKeywords: keywordGap.filter(
        (item) => item.type === "missing"
      ).length,
      weakKeywords: keywordGap.filter(
        (item) => item.type === "weak"
      ).length,
      sampleBased: true,
      yourSiteDataAvailable:
        organicIntelligence[0]?.available ?? false,
    };

    // ====================================================
    // SUCCESS RESPONSE
    // ====================================================

    return NextResponse.json({
      success: true,
      failures,
      yourSite,
      competitors,
      recommendations,
      organicIntelligence,
      keywordGap: prioritizedKeywordGap,
keywordGapSummary,
      quota: {
        used: quota.used,
        limit: quota.limit_value,
        remaining: quota.remaining,
        periodEnd: quota.period_end,
      },
      note:
        "On-page comparison uses directly observable website signals. Organic keyword metrics are provided by DataForSEO for India and English. Keyword Gap is based only on sampled ranking keywords, not the full Google index. Estimated traffic covers fetched keywords only, not total domain traffic. Backlink gap and content gap are not yet included.",
    });
  } catch (error) {
    console.error(
      "Competitor analysis API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to complete competitor analysis.",
      },
      { status: 500 }
    );
  }
}
