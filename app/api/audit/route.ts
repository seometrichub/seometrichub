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
  recommendedH1?: string;
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

type ContentContext = {
  topic: string;
  brand: string;
  existingTitle: string;
  existingDescription: string;
  signals: string[];
};

export async function POST(request: Request) {
  const startTime = performance.now();

  try {
    const body = await request.json().catch(() => null);
    const inputUrl = body?.url;

    if (!inputUrl || typeof inputUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Website URL is required." },
        { status: 400 },
      );
    }

    let websiteUrl = inputUrl.trim();

    if (!/^https?:\/\//i.test(websiteUrl)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { success: false, error: "Please enter a valid website URL." },
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
        { success: false, error: "This hostname cannot be audited." },
        { status: 400 },
      );
    }

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

    const title = extractTitle(html);
    const titleLength = title.length;
    const description = extractMetaContent(html, "description");
    const descriptionLength = description.length;

    const h1Tags = getOpeningTags(html, "h1");
    const h2Tags = getOpeningTags(html, "h2");
    const h1Count = h1Tags.length;
    const h2Count = h2Tags.length;
    const h1Texts = extractHeadingTexts(html, "h1");
    const h2Texts = extractHeadingTexts(html, "h2");

    const imageTags = getOpeningTags(html, "img");
    const totalImages = imageTags.length;
    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;

    const missingAltImages: {
      src: string;
      alt: string | null;
      recommendedAlt: string;
    }[] = [];

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
          recommendedAlt: getRecommendedAlt(src, finalUrl),
        });
      }
    }

    const canonical = extractCanonical(html);
    const hasCanonical = Boolean(canonical);
    const viewport = extractMetaContent(html, "viewport");
    const hasViewport = Boolean(viewport);
    const robotsMeta = extractMetaContent(html, "robots");
    const language = extractHtmlLanguage(html);
    const favicon = hasFavicon(html);
    const visibleText = extractVisibleText(html);
    const wordCount = countWords(visibleText);

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
        if (!/^https?:$/i.test(absoluteLink.protocol)) continue;

        const sourceHost = normalizeHostname(finalParsedUrl.hostname);
        const linkHost = normalizeHostname(absoluteLink.hostname);

        if (sourceHost === linkHost) internalLinks++;
        else externalLinks++;
      } catch {
        // Ignore malformed href values.
      }
    }

    const robotsTxtUrl = new URL("/robots.txt", finalUrl).toString();
    const robotsTxtResult = await fetchTextResource(robotsTxtUrl);
    const robotsTxt = robotsTxtResult.available;

    const sitemapResult = await detectSitemap(finalUrl, robotsTxtResult.text);
    const sitemap = sitemapResult.available;

    const hasTitle = titleLength > 0;
    const hasDescription = descriptionLength > 0;
    const hasH1 = h1Count > 0;
    const hasSingleH1 = h1Count === 1;
    const hasHttps = finalParsedUrl.protocol === "https:";

    const titleQuality = getTitleQuality(titleLength);
    const descriptionQuality = getDescriptionQuality(descriptionLength);

    let technicalSeoScore = 0;
    if (hasHttps) technicalSeoScore += 20;
    if (hasCanonical) technicalSeoScore += 20;
    if (hasViewport) technicalSeoScore += 20;
    if (robotsTxt) technicalSeoScore += 20;
    if (sitemap) technicalSeoScore += 20;
    technicalSeoScore = clampScore(technicalSeoScore);

    let metaScore = 0;
    if (titleQuality === "ideal") metaScore += 50;
    else if (titleQuality === "acceptable") metaScore += 35;
    else if (titleQuality === "tooShort" || titleQuality === "tooLong") metaScore += 20;

    if (descriptionQuality === "ideal") metaScore += 50;
    else if (descriptionQuality === "acceptable") metaScore += 35;
    else if (descriptionQuality === "tooShort" || descriptionQuality === "tooLong") metaScore += 20;
    metaScore = clampScore(metaScore);

    let contentScore = 0;
    if (h1Count === 1) contentScore += 30;
    else if (h1Count > 1) contentScore += 15;

    if (h2Count >= 2 && h2Count <= 20) contentScore += 20;
    else if (h2Count > 20) contentScore += 10;
    else if (h2Count === 1) contentScore += 10;

    if (titleLength >= 30 && titleLength <= 60) contentScore += 15;
    else if (titleLength > 0) contentScore += 8;

    if (wordCount >= 1500) contentScore += 35;
    else if (wordCount >= 1000) contentScore += 30;
    else if (wordCount >= 700) contentScore += 25;
    else if (wordCount >= 500) contentScore += 20;
    else if (wordCount >= 300) contentScore += 10;
    contentScore = clampScore(contentScore);

    const imageScore =
      totalImages === 0 ? 100 : Math.round((imagesWithAlt / totalImages) * 100);
    const mobileScore = hasViewport ? 100 : 40;

    let pagePerformanceScore = 100;
    if (responseTime > 2000) pagePerformanceScore -= 40;
    else if (responseTime > 1000) pagePerformanceScore -= 25;
    else if (responseTime > 500) pagePerformanceScore -= 10;

    if (htmlSizeKB > 1000) pagePerformanceScore -= 35;
    else if (htmlSizeKB > 500) pagePerformanceScore -= 25;
    else if (htmlSizeKB > 300) pagePerformanceScore -= 15;
    else if (htmlSizeKB > 150) pagePerformanceScore -= 5;
    pagePerformanceScore = clampScore(pagePerformanceScore);

   let seoOpportunitiesScore = 100;

if (!hasCanonical) seoOpportunitiesScore -= 15;
if (!robotsTxt) seoOpportunitiesScore -= 15;
if (!sitemap) seoOpportunitiesScore -= 15;
if (internalLinks === 0) seoOpportunitiesScore -= 15;
if (!favicon) seoOpportunitiesScore -= 10;

seoOpportunitiesScore = clampScore(seoOpportunitiesScore);

    const overallScore = Math.round(
      technicalSeoScore * 0.15 +
        pagePerformanceScore * 0.15 +
        metaScore * 0.20 +
        mobileScore * 0.10 +
        contentScore * 0.20 +
        imageScore * 0.05 +
        seoOpportunitiesScore * 0.15,
    );

    const backlinkData: BacklinkData = {
      available: false,
      backlinks: null,
      referringDomains: null,
      dofollow: null,
      nofollow: null,
      message: "Backlink data requires an external backlink index.",
    };

    const recommendations = buildRecommendations({
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
      hostname: finalParsedUrl.hostname,
      language,
    });

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
        technicalSeo: { score: technicalSeoScore, status: getStatus(technicalSeoScore) },
        pagePerformance: { score: pagePerformanceScore, status: getStatus(pagePerformanceScore) },
        metaTags: { score: metaScore, status: getStatus(metaScore) },
        mobileOptimization: { score: mobileScore, status: getStatus(mobileScore) },
        contentQuality: { score: contentScore, status: getStatus(contentScore) },
        seoOpportunities: { score: seoOpportunitiesScore, status: getStatus(seoOpportunitiesScore) },
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
        title: { status: titleQuality, recommendedRange: "30-60 characters" },
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
        error: "Unable to analyze this website. Please check the URL and try again.",
      },
      { status: 500 },
    );
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host === "localhost.localdomain" ||
    host.endsWith(".local") ||
    host === "0.0.0.0"
  ) return true;

  const ipv4 = host.match(
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  );
  if (!ipv4) return false;
  const [a, b] = host.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

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
    if (!response.ok) return { available: false, text: null, status: response.status };
    return { available: true, text: await response.text(), status: response.status };
  } catch {
    return { available: false, text: null, status: null };
  }
}

async function detectSitemap(
  baseUrl: string,
  robotsText: string | null,
): Promise<{ available: boolean; url: string | null }> {
  const candidates: string[] = [];
  if (robotsText) {
    const sitemapLines = robotsText.match(/^sitemap:\s*(.+)$/gim) || [];
    for (const line of sitemapLines) {
      const value = line.replace(/^sitemap:\s*/i, "").trim();
      if (!value) continue;
      try {
        const url = new URL(value, baseUrl).toString();
        if (/^https?:$/i.test(new URL(url).protocol)) candidates.push(url);
      } catch {}
    }
  }
  candidates.push(
    new URL("/sitemap.xml", baseUrl).toString(),
    new URL("/sitemap_index.xml", baseUrl).toString(),
    new URL("/sitemap-index.xml", baseUrl).toString(),
  );

  for (const sitemapUrl of [...new Set(candidates)]) {
    const result = await fetchTextResource(sitemapUrl);
    if (!result.available || !result.text) continue;
    const content = result.text.trim().toLowerCase();
    if (
      content.includes("<urlset") ||
      content.includes("<sitemapindex") ||
      content.includes("<urlset ")
    ) return { available: true, url: sitemapUrl };
  }
  return { available: false, url: null };
}

function getOpeningTags(html: string, tagName: string): string[] {
  const safeTag = escapeRegExp(tagName);
  return html.match(new RegExp(`<${safeTag}\\b[^>]*>`, "gi")) || [];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractHeadingTexts(html: string, tagName: string): string[] {
  const safeTag = escapeRegExp(tagName);
  const regex = new RegExp(`<${safeTag}\\b[^>]*>([\\s\\S]*?)<\\/${safeTag}>`, "gi");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const text = cleanHtmlText(match[1] || "");
    if (text) values.push(text);
  }
  return values;
}

function extractTitle(html: string): string {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? cleanHtmlText(match[1]) : "";
}

function extractMetaContent(html: string, name: string): string {
  for (const tag of getOpeningTags(html, "meta")) {
    const tagName = getAttribute(tag, "name");
    const property = getAttribute(tag, "property");
    if (
      (tagName && tagName.trim().toLowerCase() === name.trim().toLowerCase()) ||
      (property && property.trim().toLowerCase() === name.trim().toLowerCase())
    ) {
      return cleanHtmlText(getAttribute(tag, "content") || "");
    }
  }
  return "";
}

function extractCanonical(html: string): string | null {
  for (const tag of getOpeningTags(html, "link")) {
    const rel = getAttribute(tag, "rel");
    if (!rel) continue;
    if (rel.toLowerCase().split(/\s+/).includes("canonical")) {
      const href = getAttribute(tag, "href");
      if (href?.trim()) return href.trim();
    }
  }
  return null;
}

function getAttribute(tag: string, attributeName: string): string | null {
  const safeName = escapeRegExp(attributeName);
  const regex = new RegExp(
    `\\b${safeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`,
    "i",
  );
  const match = tag.match(regex);
  return match ? match[1] ?? match[2] ?? match[3] ?? null : null;
}

function extractHtmlLanguage(html: string): string | null {
  const htmlTagMatch = html.match(/<html\b[^>]*>/i);
  return htmlTagMatch ? getAttribute(htmlTagMatch[0], "lang") : null;
}

function hasFavicon(html: string): boolean {
  for (const tag of getOpeningTags(html, "link")) {
    const rel = getAttribute(tag, "rel");
    if (!rel) continue;
    const values = rel.toLowerCase().split(/\s+/).filter(Boolean);
    if (values.includes("icon") || values.includes("shortcut") || values.includes("apple-touch-icon")) return true;
  }
  return false;
}

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

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

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

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function getImageSource(image: string): string {
  const src =
    getAttribute(image, "src") ||
    getAttribute(image, "data-src") ||
    getAttribute(image, "data-lazy-src") ||
    getAttribute(image, "data-original") ||
    getAttribute(image, "data-image") ||
    getAttribute(image, "data-url");
  if (src) return src.trim();

  const srcset =
    getAttribute(image, "srcset") ||
    getAttribute(image, "data-srcset") ||
    getAttribute(image, "data-lazy-srcset");
  if (srcset) {
    const first = srcset.split(",").map((x) => x.trim()).filter(Boolean)[0];
    if (first) return first.split(/\s+/)[0].trim();
  }
  return "";
}

function getRecommendedAlt(src: string, baseUrl: string): string {
  if (!src) return "Descriptive image alt text";

  try {
    const parsed = new URL(src, baseUrl);
    const filename =
      parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/\.[^/.]+$/, "") || "";

    const rawName = decodeURIComponent(filename);

    const isLogo =
      /\b(cropped?|logo|brand|site[-_ ]?logo|header[-_ ]?logo)\b/i.test(rawName);

    let cleaned = rawName
      .replace(/\b(cropped?|image|img|photo|picture|pic|logo|brand)\b/gi, " ")
      .replace(/[-_]+/g, " ")
      .replace(/\d{2,}/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (isLogo) {
      const hostname = parsed.hostname
        .replace(/^www\./i, "")
        .split(".")[0]
        .replace(/[-_]+/g, " ")
        .trim();

      const brand = hostname
        ? hostname
            .split(" ")
            .filter(Boolean)
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ")
        : "";

      if (brand) {
        return `${brand} logo`;
      }

      return "Website logo";
    }

    if (!cleaned) {
      return "Descriptive image alt text";
    }

    const words = cleaned
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      );

    const uniqueWords = words.filter(
      (word, index) =>
        index === 0 ||
        word.toLowerCase() !== words[index - 1].toLowerCase(),
    );

    return uniqueWords.join(" ") || "Descriptive image alt text";
  } catch {
    return "Descriptive image alt text";
  }
}
function getTitleQuality(length: number): "missing" | "tooShort" | "ideal" | "tooLong" | "acceptable" {
  if (length === 0) return "missing";
  if (length < 30) return "tooShort";
  if (length <= 60) return "ideal";
  if (length <= 70) return "acceptable";
  return "tooLong";
}

function getDescriptionQuality(length: number): "missing" | "tooShort" | "ideal" | "tooLong" | "acceptable" {
  if (length === 0) return "missing";
  if (length < 70) return "tooShort";
  if (length <= 160) return "ideal";
  if (length <= 180) return "acceptable";
  return "tooLong";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getStatus(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Needs Work";
  return "Poor";
}

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
  const context = buildContentContext(title, description, visibleText, hostname, h1Texts, h2Texts);
  const recommendedTitle = buildRecommendedTitle(context);
  const recommendedMetaDescription = buildRecommendedMetaDescription(context);
  const recommendedH1 = buildRecommendedH1(context);

  if (h1Count === 0) {
    recommendations.push({ type: "error", title: "H1 Heading", description: "No H1 heading was detected. Add one clear primary H1 that describes the page's main topic.", recommendedH1 });
  } else if (h1Count === 1) {
    recommendations.push({ type: "success", title: "H1 Heading", description: "One H1 heading was detected." });
  } else {
    recommendations.push({ type: "warning", title: "Multiple H1 headings", description: `${h1Count} H1 headings were detected. Consider using one primary H1 for the page.` });
  }

  if (!title) {
    recommendations.push({ type: "error", title: "Page Title", description: "No page title was detected. Add a unique, descriptive SEO title.", recommendedTitle });
  } else if (titleLength >= 30 && titleLength <= 60) {
    recommendations.push({ type: "success", title: "Page Title", description: `Current title length: ${titleLength} characters. The title is within the recommended 30-60 character range.` });
  } else {
    recommendations.push({ type: "warning", title: "Page Title", description: `Current title length: ${titleLength} characters. Consider rewriting it within the recommended 30-60 character range.`, recommendedTitle });
  }

  if (!description) {
    recommendations.push({ type: "error", title: "Meta Description", description: "No meta description was detected. Add a unique description that clearly explains the page and encourages clicks.", recommendedMetaDescription });
  } else if (descriptionLength >= 70 && descriptionLength <= 160) {
    recommendations.push({ type: "success", title: "Meta Description", description: `Current description length: ${descriptionLength} characters. The description is within the recommended 70-160 character range.` });
  } else {
    recommendations.push({ type: "warning", title: "Meta Description", description: `Current description length: ${descriptionLength} characters. Consider rewriting it within the recommended 70-160 character range.`, recommendedMetaDescription });
  }

  if (totalImages === 0) recommendations.push({ type: "success", title: "Image ALT Attributes", description: "No images were detected in the analyzed HTML." });
  else if (imagesWithoutAlt > 0) recommendations.push({ type: "warning", title: "Image ALT Attributes", description: `${imagesWithoutAlt} of ${totalImages} detected image(s) are missing useful ALT text. Add descriptive ALT text to meaningful images; keep decorative images empty.` });
  else recommendations.push({ type: "success", title: "Image ALT Attributes", description: "All detected images contain non-empty ALT attributes." });

  recommendations.push(hasCanonical
    ? { type: "success", title: "Canonical URL", description: "Canonical URL detected." }
    : { type: "warning", title: "Canonical URL", description: "No canonical URL was detected. Add a canonical link to the preferred version of this page." });

  recommendations.push(hasHttps
    ? { type: "success", title: "HTTPS", description: "HTTPS is enabled on the final audited URL." }
    : { type: "error", title: "HTTPS", description: "HTTPS is not enabled on the final audited URL. Move the website to HTTPS and redirect HTTP to HTTPS." });

  recommendations.push(hasViewport
    ? { type: "success", title: "Mobile Viewport", description: "A mobile viewport meta tag was detected." }
    : { type: "error", title: "Mobile Viewport", description: "No mobile viewport meta tag was detected. Add a responsive viewport declaration." });

  recommendations.push(robotsTxt
    ? { type: "success", title: "Robots.txt", description: "Robots.txt was detected and returned successfully." }
    : { type: "warning", title: "Robots.txt", description: "Robots.txt was not detected successfully at the website root." });

  recommendations.push(sitemap
    ? { type: "success", title: "XML Sitemap", description: "A valid sitemap resource was detected." }
    : { type: "warning", title: "XML Sitemap", description: "No valid XML sitemap was detected from robots.txt or the common sitemap locations." });

  recommendations.push(favicon
    ? { type: "success", title: "Favicon", description: "A favicon link was detected in the HTML." }
    : { type: "warning", title: "Favicon", description: "A favicon link was not detected in the HTML." });

  if (h2Count >= 2) {
    recommendations.push({
      type: "success",
      title: "Heading Structure",
      description: `${h2Count} H2 headings were detected. H2 count alone is not treated as a negative SEO signal; review the headings for meaningful section structure and avoid repetitive or decorative headings.`
    });
  } else if (h2Count === 1) {
    recommendations.push({
      type: "success",
      title: "Heading Structure",
      description: "One H2 heading was detected. This can be appropriate for a simple page; add additional descriptive H2 headings where they improve content structure."
    });
  } else {
    recommendations.push({
      type: "warning",
      title: "Heading Structure",
      description: "No H2 headings were detected. Add descriptive section headings where they improve the page structure."
    });
  }
  recommendations.push(internalLinks > 0
    ? { type: "success", title: "Internal Links", description: `${internalLinks} internal link(s) were detected.` }
    : { type: "warning", title: "Internal Links", description: "No internal links were detected. Add relevant internal links to help users and search engines discover related pages." });

  recommendations.push({ type: "success", title: "External Links", description: "External links are reported as a factual count. Their presence is not treated as a negative SEO signal by itself." });

  if (responseTime <= 500) recommendations.push({ type: "success", title: "Page Performance", description: `Fast server response: ${responseTime} ms.` });
  else if (responseTime <= 1000) recommendations.push({ type: "warning", title: "Page Performance", description: `Server response time is ${responseTime} ms. There may be room for improvement.` });
  else recommendations.push({ type: "error", title: "Page Performance", description: `Server response time is ${responseTime} ms. Consider investigating server, CDN, caching, and backend response performance.` });

  if (htmlSizeKB <= 150) recommendations.push({ type: "success", title: "HTML Size", description: `HTML size is ${htmlSizeKB} KB.` });
  else if (htmlSizeKB <= 300) recommendations.push({ type: "warning", title: "HTML Size", description: `HTML size is ${htmlSizeKB} KB. Consider reducing unnecessary markup if possible.` });
  else recommendations.push({ type: "warning", title: "HTML Size", description: `HTML size is ${htmlSizeKB} KB. Consider optimizing the page HTML and reducing unnecessary markup.` });

  if (!language) recommendations.push({ type: "warning", title: "HTML Language", description: 'No lang attribute was detected on the HTML element. Add the correct page language, such as lang="en" or lang="te".' });

  return recommendations;
}

function buildContentContext(
  title: string,
  description: string,
  visibleText: string,
  hostname: string,
  h1Texts: string[],
  h2Texts: string[],
): ContentContext {
  const brand = extractBrandFromContent(title, h1Texts, description, hostname);
  const topic = extractTopic(title, description, h1Texts, h2Texts, visibleText, hostname, brand);
  const signals = [...h1Texts, title, ...h2Texts.slice(0, 5)]
    .map(cleanHtmlText)
    .map(cleanSuggestionPhrase)
    .filter(Boolean);
  return { topic, brand, existingTitle: title, existingDescription: description, signals };
}

function extractBrandFromContent(title: string, h1Texts: string[], description: string, domainName: string): string {
  const domainBrand = humanizeBrand(domainName);
  const candidates = [...h1Texts, title].map(cleanHtmlText).map((v) => v.trim()).filter(Boolean);
  for (const candidate of candidates) {
    for (const part of candidate.split("|").map((p) => p.trim()).filter(Boolean)) {
      const lowerPart = part.toLowerCase();
      if (lowerPart === domainBrand.toLowerCase() || lowerPart.includes(domainBrand.toLowerCase())) return domainBrand;
      if (part.length >= 3 && part.length <= 50 && !/\b(latest|government|private|jobs?|notifications?|updates?|recruitment|exam|vacancy)\b/i.test(part)) return part;
    }
  }
  return domainBrand;
}

function extractTopic(title: string, description: string, h1Texts: string[], h2Texts: string[], visibleText: string, domainName: string, brand: string): string {
  const sourceText = [title, description, ...h1Texts, ...h2Texts, visibleText.slice(0, 12000), domainName, brand].join(" ").toLowerCase();
  const nicheGroups: Array<{ keywords: string[]; topic: string }> = [
    { keywords: ["government jobs", "govt jobs", "government job", "private jobs", "private job", "job notifications", "job notification", "latest jobs", "employment", "recruitment", "vacancy", "vacancies", "competitive exams", "exam notifications"], topic: "Jobs & Recruitment" },
    { keywords: ["ai prompt", "ai prompts", "chatgpt", "midjourney", "prompt library", "prompt engineering", "artificial intelligence", "generative ai", "ai tools"], topic: "AI Prompts & Tools" },
    { keywords: ["digital marketing", "seo", "search engine optimization", "social media marketing", "content marketing", "online marketing"], topic: "Digital Marketing & SEO" },
    { keywords: ["recipes", "recipe", "cooking", "food", "breakfast", "lunch", "dinner", "dessert"], topic: "Recipes & Food" },
    { keywords: ["travel", "tourism", "destinations", "hotels", "places to visit", "trip", "vacation"], topic: "Travel & Tourism" },
    { keywords: ["technology", "tech news", "gadgets", "software", "apps", "smartphone", "artificial intelligence"], topic: "Technology & AI" },
    { keywords: ["kids stories", "children stories", "bedtime stories", "moral stories", "fairy tales", "learning for kids", "educational content for children"], topic: "Kids Stories & Learning" },
  ];
  let bestTopic = "";
  let bestScore = 0;
  for (const group of nicheGroups) {
    const score = group.keywords.reduce((total, keyword) => total + (sourceText.includes(keyword) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; bestTopic = group.topic; }
  }
  if (bestTopic && bestScore >= 1) return bestTopic;

  const candidates = [...h1Texts, title, ...h2Texts, description].map((value) => cleanTopicCandidate(value, brand)).filter(Boolean);
  for (const candidate of candidates) if (isUsefulTopic(candidate, brand)) return candidate;

  const keywords = extractImportantKeywords([title, description, ...h1Texts, ...h2Texts].join(" "));
  if (keywords.length >= 2) return keywords.slice(0, 4).join(" ");
  if (keywords.length === 1) return keywords[0];
  return brand || domainName.replace(/[-_]+/g, " ");
}

function cleanTopicCandidate(value: string, brand: string): string {
  if (!value) return "";
  let result = cleanHtmlText(value).replace(/\s+/g, " ").trim();
  if (!result) return "";
  result = result.replace(/^(home|welcome|review|reviews|menu|navigation|skip to content)\s*/i, "").replace(/^[|:\u2013\u2014-]+\s*/, "").replace(/\s*[|:\u2013\u2014-]+\s*$/, "").replace(/\s+/g, " ").trim();
  if (!result) return "";
  if (/^(home|about|contact|login|register|search|menu|read more|learn more|click here)$/i.test(result)) return "";
  if (result.length > 100) result = result.slice(0, 100).trim();
  if (brand && result.toLowerCase() === brand.toLowerCase()) return "";
  return result;
}

function isUsefulTopic(value: string, brand: string): boolean {
  const text = value.trim();
  if (text.length < 4) return false;
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 12) return false;
  const genericPatterns = [/^welcome/i, /^home$/i, /^review$/i, /^reviews$/i, /^read more$/i, /^learn more$/i, /^click here$/i, /^see what/i, /^the world needs/i];
  if (genericPatterns.some((pattern) => pattern.test(text))) return false;
  return !(brand && text.toLowerCase() === brand.toLowerCase());
}

function extractImportantKeywords(source: string): string[] {
  const words = source.toLowerCase().replace(/https?:\/\/\S+/gi, " ").replace(/[^a-z0-9\u0C00-\u0C7F\s-]/gi, " ").split(/\s+/).filter(Boolean);
  const stopWords = new Set(["the","and","for","with","your","this","that","from","have","has","are","was","were","you","our","about","more","into","www","com","home","page","welcome","read","learn","click","here","see","view","get","best","new","latest","review","reviews","menu","contact","login","register","story","stories"]);
  const frequency = new Map<string, number>();
  for (const word of words) if (word.length >= 4 && !stopWords.has(word) && !/^\d+$/.test(word)) frequency.set(word, (frequency.get(word) || 0) + 1);
  return [...frequency.entries()].sort((a,b) => b[1] !== a[1] ? b[1] - a[1] : a[0].localeCompare(b[0])).map(([word]) => word).slice(0, 6);
}

function humanizeBrand(value: string): string {
  if (!value) return "";
  return value.replace(/^www\./i, "").replace(/\.(com|in|org|net|co|edu|gov)$/i, "").replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (letter) => letter.toUpperCase()).trim();
}

function buildRecommendedTitle(context: ContentContext): string {
  const brand = cleanBrandName(context.brand || "Website");
  const existingTitle = cleanSuggestionPhrase(cleanHtmlText(context.existingTitle || ""));
  const signals = [context.existingTitle, ...context.signals].map(cleanHtmlText).map(cleanSuggestionPhrase).filter(Boolean);
  const candidates: string[] = [];

  if (existingTitle) {
    const titleParts = existingTitle.split("|").map((part) => part.trim()).filter(Boolean);
    if (titleParts.length >= 2) candidates.push(`${titleParts[0]} | ${titleParts.slice(1).join(" | ")}`);
    candidates.push(existingTitle);
  }
  for (const signal of signals) {
    const cleaned = signal.replace(/\b(review|home|homepage|welcome|menu|navigation)\b/gi, "").replace(/\s+/g, " ").trim();
    if (cleaned.length >= 20 && cleaned.length <= 70) candidates.push(cleaned);
  }
  const topic = cleanTopic(context.topic, brand);
  if (topic && brand) candidates.push(`${brand} | ${topic}`, `${topic} | ${brand}`);
  if (topic) candidates.push(topic);
  if (brand) candidates.push(`${brand} | Latest Updates`);

  const unique = [...new Set(candidates.map(cleanSuggestionPhrase).filter(Boolean))];
  const ideal = unique.filter((value) => value.length >= 30 && value.length <= 60);
  if (ideal.length) return ideal.sort((a,b) => Math.abs(50-a.length)-Math.abs(50-b.length))[0];
  const closest = unique.sort((a,b) => Math.abs(50-a.length)-Math.abs(50-b.length))[0];
  return trimTitleToLength(closest || `${brand} | Latest Updates`, 60);
}

function buildRecommendedH1(context: ContentContext): string {
  const brand = cleanBrandName(context.brand);
  const topic = cleanTopic(context.topic, brand);
  const lowerTopic = topic.toLowerCase();
  const signals = context.signals
    .map(cleanHtmlText)
    .map(cleanSuggestionPhrase)
    .filter(Boolean);

  const signalText = signals.join(" ").toLowerCase();

  if (
    lowerTopic.includes("job") ||
    lowerTopic.includes("recruitment") ||
    lowerTopic.includes("employment") ||
    signalText.includes("government jobs") ||
    signalText.includes("private jobs") ||
    signalText.includes("job notifications") ||
    signalText.includes("exam notifications")
  ) {
    return "Latest Government & Private Job Notifications";
  }

  if (topic) {
    return `${topic} - Latest Updates & Information`;
  }

  if (brand) {
    return `${brand} - Latest Updates & Information`;
  }

  return "Latest Updates & Information";
}
function buildRecommendedMetaDescription(context: ContentContext): string {
  const brand = cleanBrandName(context.brand);
  const topic = cleanTopic(context.topic, brand);
  const lowerTopic = topic.toLowerCase();
  const signals = context.signals
    .map(cleanHtmlText)
    .map(cleanSuggestionPhrase)
    .filter(Boolean);

  const candidates: string[] = [];

  const priorityCandidates: string[] = [];

  // Jobs & Recruitment
  if (
    lowerTopic.includes("job") ||
    lowerTopic.includes("recruitment") ||
    lowerTopic.includes("employment")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Find the latest jobs and recruitment updates from ${brand}. Get government jobs, private jobs, exam notifications and recruitment alerts.`,
        `Explore the latest job opportunities, government jobs, private vacancies, exam notifications and recruitment updates from ${brand}.`
      );
    }
  }

  // AI, Technology & Prompts
  else if (
    lowerTopic.includes("ai") ||
    lowerTopic.includes("prompt") ||
    lowerTopic.includes("technology")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Explore AI tools, prompts, technology updates and practical resources from ${brand}. Discover useful ideas and tools for everyday work and learning.`,
        `Discover useful AI tools, prompts, technology insights and practical resources from ${brand}.`
      );
    }
  }

  // Digital Marketing & SEO
  else if (
    lowerTopic.includes("digital marketing") ||
    lowerTopic.includes("seo")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Explore practical SEO, digital marketing, content marketing and social media strategies from ${brand} to improve online growth.`,
        `Discover SEO strategies, digital marketing tips, content marketing ideas and social media insights from ${brand}.`
      );
    }
  }

  // Recipes & Food
  else if (
    lowerTopic.includes("recipe") ||
    lowerTopic.includes("food")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Discover easy recipes, cooking ideas, useful food tips and meal inspiration from ${brand} for everyday cooking.`,
        `Explore delicious recipes, cooking ideas and helpful food tips from ${brand}.`
      );
    }
  }

  // Travel & Tourism
  else if (
    lowerTopic.includes("travel") ||
    lowerTopic.includes("tourism")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Explore travel destinations, places to visit, useful travel tips and trip information from ${brand}.`,
        `Discover travel guides, destinations, places to visit and useful tourism information from ${brand}.`
      );
    }
  }

  // Kids Stories & Learning
  else if (
    lowerTopic.includes("kids") ||
    lowerTopic.includes("stories") ||
    lowerTopic.includes("learning")
  ) {
    if (brand) {
      priorityCandidates.push(
        `Discover engaging kids stories, moral stories, bedtime stories and educational learning resources from ${brand} for children and families.`,
        `Explore kids stories, educational stories and learning resources from ${brand}, with engaging content for children and families.`,
        `Discover inspiring stories, moral lessons and educational learning content from ${brand} for children and families.`
      );
    } else {
      candidates.push(
        `Discover engaging kids stories, moral stories, bedtime stories and educational learning resources for children and families.`,
        `Explore kids stories, educational stories and useful learning resources for children and families.`
      );
    }
  }

  // Use detected content signals when available.
  for (const signal of signals.slice(0, 5)) {
    const cleaned = signal
      .replace(
        /\b(home|homepage|welcome|menu|navigation|read more|learn more)\b/gi,
        ""
      )
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length >= 20 && cleaned.length <= 80) {
      if (brand && cleaned.toLowerCase() !== brand.toLowerCase()) {
        candidates.push(
          `Explore ${cleaned.toLowerCase()} with ${brand}. Discover useful information, engaging content and practical resources.`
        );
      }
    }
  }

  // Generic but still useful fallback.
  if (topic && brand) {
    candidates.push(
      `Explore ${topic.toLowerCase()} with ${brand}. Discover useful information, practical resources and helpful content for readers.`,
      `Discover useful ${topic.toLowerCase()} information, resources and practical content from ${brand}.`
    );
  }

  if (topic) {
    candidates.push(
      `Explore ${topic.toLowerCase()} and discover useful information, practical resources and helpful content.`
    );
  }

  if (brand) {
    candidates.push(
      `Explore ${brand} for useful information, practical resources, helpful guides and the latest updates.`
    );
  }

  const cleanedCandidates = [
    ...new Set(
      candidates
        .map(cleanMetaDescription)
        .filter(Boolean)
    ),
  ];
  const cleanedPriorityCandidates = [
    ...new Set(
      priorityCandidates
        .map(cleanMetaDescription)
        .filter(Boolean)
    ),
  ];

  const priorityIdeal = cleanedPriorityCandidates.filter(
    (value) => value.length >= 70 && value.length <= 160
  );

  if (priorityIdeal.length) {
    return priorityIdeal.sort(
      (a, b) =>
        Math.abs(125 - a.length) - Math.abs(125 - b.length)
    )[0];
  }
  // Prefer descriptions within the recommended 70?160 character range.
  const ideal = cleanedCandidates.filter(
    (value) => value.length >= 70 && value.length <= 160
  );

  if (ideal.length) {
    return ideal.sort(
      (a, b) =>
        Math.abs(125 - a.length) - Math.abs(125 - b.length)
    )[0];
  }

  // If no ideal candidate exists, choose the closest candidate
  // and safely trim it to the maximum recommended length.
  const closest = cleanedCandidates.sort(
    (a, b) =>
      Math.abs(125 - a.length) - Math.abs(125 - b.length)
  )[0];

   return closest
       ? closest.slice(0, 160).replace(/\s+\S*$/, "").trim()
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

  const lower = brand.toLowerCase();

  if (lower === "freejobnotifications") return "Free Job Notifications";
  if (lower === "free job notifications") return "Free Job Notifications";

  if (lower === "vkkidsstories") return "VK Kids Stories";
  if (lower === "vk kids stories") return "VK Kids Stories";

  if (/^[A-Z0-9]+$/.test(brand)) return brand;

  return brand
    .split(/\s+/)
    .map((word) => {
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
function cleanTopic(value: string, brand: string): string {
  let topic = cleanHtmlText(value).replace(/\s+/g, " ").trim();

  if (!topic) return "";

  topic = topic
    .replace(
      /\b(home|homepage|welcome|review|reviews|skip|menu|navigation)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

  if (!topic) return "";

  // If the detected topic contains the brand plus additional
  // meaningful words, keep the complete topic instead of
  // removing the brand and leaving an incomplete phrase.
  if (brand) {
    const normalizedTopic = topic.toLowerCase();
    const normalizedBrand = brand.toLowerCase();

    if (normalizedTopic === normalizedBrand) {
      return "";
    }

    const withoutBrand = topic
      .replace(
        new RegExp(`\\b${escapeRegExp(brand)}\\b`, "gi"),
        " ",
      )
      .replace(/\s+/g, " ")
      .replace(/^[&|,:;\-??\s]+|[&|,:;\-??\s]+$/g, "")
      .trim();

    // Only remove the brand when the remaining phrase is
    // meaningful enough to stand on its own.
    const remainingWords = withoutBrand
      .split(/\s+/)
      .filter(Boolean);

    if (remainingWords.length >= 2) {
      topic = withoutBrand;
    }
  }

  return topic.length >= 3 ? titleCase(topic) : "";
}


function cleanSuggestionPhrase(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s*\|\s*/g, " | ").replace(/\s*-\s*/g, " - ").trim();
}

function cleanMetaDescription(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

function trimTitleToLength(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength).replace(/\s+\S*$/, "").replace(/\s*[|,-]\s*$/, "").trim();
}

function titleCase(value: string): string {
  return value.split(/\s+/).filter(Boolean).map((word) => {
    if (/^[\u0C00-\u0C7F]+$/.test(word)) return word;
    if (/^[A-Z0-9]+$/.test(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(" ");
}
