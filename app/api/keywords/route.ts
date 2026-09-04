import { NextResponse } from "next/server";

type KeywordResult = {
  rank: number;
  keyword: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  intent: string;
  coreKeyword: string;
  isLongTail: boolean;
};

type SuggestionResponse = {
  query?: string;
  suggestions?: Array<{
    phrase?: string;
  }>;
};

function cleanKeyword(value: string): string {
  return value
    .toLowerCase()
    .replace(/\brealestate\b/g, "real estate")
    .replace(/\s+/g, " ")
    .trim();
}

function getIntent(keyword: string): string {
  const value = keyword.toLowerCase();

  if (
    /\b(buy|order|hire|book|purchase|subscribe|for sale|near me)\b/.test(
      value,
    )
  ) {
    return "Transactional";
  }

  if (
    /\b(login|sign in|signin|official|website|download|portal)\b/.test(
      value,
    )
  ) {
    return "Navigational";
  }

  if (
    /\b(price|pricing|cost|cheap|best|service|agency|company|tool|software|course|consultant|expert|package|packages)\b/.test(
      value,
    )
  ) {
    return "Commercial";
  }

  return "Informational";
}

function isLongTailKeyword(keyword: string): boolean {
  const wordCount = keyword.split(/\s+/).filter(Boolean).length;

  const longTailPatterns = [
    /\bnear me\b/i,
    /\bfor sale\b/i,
    /\bfor rent\b/i,
    /\bfor beginners\b/i,
    /\bfor business\b/i,
    /\bfor freshers\b/i,
    /\bhow\b/i,
    /\bwhy\b/i,
    /\bwhen\b/i,
    /\bwhere\b/i,
    /\btop \d+\b/i,
    /\bbest\b/i,
    /\bupcoming\b/i,
    /\bnew\b/i,
  ];

  if (longTailPatterns.some((pattern) => pattern.test(keyword))) {
    return true;
  }

  return wordCount >= 3;
}
function isUsefulKeyword(keyword: string): boolean {
  if (!keyword) return false;
  if (keyword.length < 2) return false;
  if (keyword.length > 100) return false;

  const words = keyword.split(/\s+/).filter(Boolean);

  if (words.length === 0 || words.length > 12) {
    return false;
  }

  // Reject obvious person-name style suggestions.
  const nameLikePatterns = [
    /\b(bo-ram|bum-june|eun-soo|ji-hoon|ji-hye|hyun-jin|su-min|hye-won)\b/i,
    /\b(taeji|taiji|nari|rina|jun|joon|hyun|eve|dan|guk|ha)\b/i,
  ];

 if (nameLikePatterns.some((pattern) => pattern.test(keyword))) {
  return false;
}

const noisySuggestionPatterns = [
  /\bku\b/i,
  /\bluxe\b/i,
  /\bomscs\b/i,
];

if (noisySuggestionPatterns.some((pattern) => pattern.test(keyword))) {
  return false;
}

const unwantedBrandPatterns = [
  /\bask properties\b/i,
  /\bsubhagruha\b/i,
];

if (unwantedBrandPatterns.some((pattern) => pattern.test(keyword))) {
  return false;
}

return true;
}

function buildKeywordResults(
  seedKeyword: string,
  suggestions: string[],
): KeywordResult[] {
  const seed = cleanKeyword(seedKeyword);

  const unique = Array.from(
    new Set(
      [seed, ...suggestions]
        .map(cleanKeyword)
        .filter(isUsefulKeyword),
    ),
  );
    const seedWords = seed.split(/\s+/).filter(Boolean);

    const suspiciousWords = new Set([
      "seonghyeon",
      "seoul",
      "seoulskin",
      "seozoom",
      "seoquake",
      "quartz",
      "zaragoza",
      "znacenje",
      "znaczenie",
      "zilla",
      "zac",
      "bo-ram",
      "bum-june",
      "eun-soo",
      "ji-hoon",
      "ji-hye",
      "hyun",
      "hyun-jin",
      "rina",
      "nari",
      "taiji",
      "taeji",
      "khazana",
      "yoon-jeong",
      "young-hee",
      "dal-mi",
      "london",
      "zurich",
      "shopee",
      "udemy",
      "upwork",
      "github",
    ]);

    const relevant = unique.filter((keyword) => {
      if (keyword === seed) {
        return true;
      }

      const keywordWords = keyword.split(/\s+/);

      // Every seed word must appear in the suggestion.
      const normalizedKeyword = keyword
  .replace(/\brealestate\b/g, "real estate")
  .replace(/\breal estate\b/g, "realestate");

const normalizedKeywordWords = normalizedKeyword
  .split(/\s+/)
  .filter(Boolean);

const containsSeed = seedWords.every((seedWord) =>
  normalizedKeywordWords.some(
    (keywordWord) =>
      keywordWord === seedWord ||
      keywordWord.includes(seedWord) ||
      seedWord.includes(keywordWord),
  ),
);

if (!containsSeed) {
  return false;
}

      // Reject known irrelevant/proper-name suggestions.
      if (
        seedWords.length === 1 &&
        keywordWords.some((word) => suspiciousWords.has(word))
      ) {
        return false;
      }

      return true;
    });

    const ranked = relevant
    .sort((a, b) => {
      if (a === seed) return -1;
      if (b === seed) return 1;

      const aLongTail = isLongTailKeyword(a);
      const bLongTail = isLongTailKeyword(b);

      // Keep shorter related keywords first.
      if (aLongTail !== bLongTail) {
        return aLongTail ? 1 : -1;
      }

      const aWords = a.split(/\s+/).length;
      const bWords = b.split(/\s+/).length;

      if (aWords !== bWords) {
        return aWords - bWords;
      }

      return a.localeCompare(b);
    })
    .slice(0, 100);

  return ranked.map((keyword, index) => ({
    rank: index + 1,
    keyword,
    searchVolume: null,
    keywordDifficulty: null,
    cpc: null,
    competition: null,
    competitionLevel: null,
    intent: getIntent(keyword),
    coreKeyword: seed,
    isLongTail: isLongTailKeyword(keyword),
  }));
}
type DataForSeoKeywordMetrics = {
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  intent: string | null;
};
type DataForSeoOverviewResponse = {
  tasks?: Array<{
    status_code?: number;
    status_message?: string;
    result?: Array<{
      items?: Array<{
        keyword?: string;
        keyword_info?: {
          search_volume?: number | null;
          cpc?: number | null;
          competition?: number | null;
          competition_level?: string | null;
        };
        search_intent_info?: {
          main_intent?: string | null;
        };
      }>;
    }>;
  }>;
};
type DataForSeoDifficultyResponse = {
  tasks?: Array<{
    status_code?: number;
    status_message?: string;
    result?: Array<{
      items?: Array<{
        keyword?: string;
        keyword_difficulty?: number | null;
      }>;
    }>;
  }>;
};
function getDataForSeoCredentials() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    return null;
  }

  return {
    login,
    password,
    auth: Buffer.from(`${login}:${password}`).toString("base64"),
  };
}
async function fetchGoogleSuggestions(
  query: string,
  languageCode: string,
): Promise<string[]> {
  const url =
    `https://suggestqueries.google.com/complete/search` +
    `?client=firefox` +
    `&q=${encodeURIComponent(query)}` +
    `&hl=${encodeURIComponent(languageCode)}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEOMETRICHUB Keyword Research/1.0)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data) || !Array.isArray(data[1])) {
      return [];
    }

    return data[1]
      .filter((item): item is string => typeof item === "string")
      .map(cleanKeyword)
      .filter(isUsefulKeyword);
  } catch {
    return [];
  }
}
async function fetchDataForSeoOverview(
  keywords: string[],
  locationName: string,
  languageCode: string,
): Promise<Map<string, DataForSeoKeywordMetrics>> {
  const credentials = getDataForSeoCredentials();

  if (!credentials || keywords.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_overview/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials.auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keywords,
            location_name: locationName,
            language_code: languageCode,
          },
        ]),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "DataForSEO overview request failed:",
        response.status,
      );
      return new Map();
    }

    const data =
      (await response.json()) as DataForSeoOverviewResponse;

    const result = new Map<string, DataForSeoKeywordMetrics>();

    for (const task of data.tasks ?? []) {
      for (const resultBlock of task.result ?? []) {
        for (const item of resultBlock.items ?? []) {
          const keyword = cleanKeyword(item.keyword ?? "");

          if (!keyword) {
            continue;
          }

          result.set(keyword, {
            searchVolume:
              item.keyword_info?.search_volume ?? null,
            keywordDifficulty: null,
            cpc: item.keyword_info?.cpc ?? null,
            competition:
              item.keyword_info?.competition ?? null,
            competitionLevel:
              item.keyword_info?.competition_level ?? null,
            intent:
              item.search_intent_info?.main_intent ?? null,
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error("DataForSEO overview error:", error);
    return new Map();
  }
}
async function fetchDataForSeoDifficulty(
  keywords: string[],
  locationName: string,
  languageCode: string,
): Promise<Map<string, number | null>> {
  const credentials = getDataForSeoCredentials();

  if (!credentials || keywords.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/dataforseo_labs/google/bulk_keyword_difficulty/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials.auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            keywords,
            location_name: locationName,
            language_code: languageCode,
          },
        ]),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "DataForSEO difficulty request failed:",
        response.status,
      );
      return new Map();
    }

    const data =
      (await response.json()) as DataForSeoDifficultyResponse;

    const result = new Map<string, number | null>();

    for (const task of data.tasks ?? []) {
      for (const resultBlock of task.result ?? []) {
        for (const item of resultBlock.items ?? []) {
          const keyword = cleanKeyword(item.keyword ?? "");

          if (!keyword) {
            continue;
          }

          result.set(
            keyword,
            item.keyword_difficulty ?? null,
          );
        }
      }
    }

    return result;
  } catch (error) {
    console.error("DataForSEO difficulty error:", error);
    return new Map();
  }
}
function extractLocationFromKeyword(keyword: string): string | null {
  const normalized = cleanKeyword(keyword);

  const match = normalized.match(
    /\b(?:in|near|at)\s+([a-z][a-z\s-]{1,40})$/i,
  );

  if (!match) {
    return null;
  }

  return match[1]
    .replace(/\s+/g, " ")
    .trim();
}
async function collectSuggestions(
  seedKeyword: string,
  languageCode: string,
): Promise<string[]> {
  const location = extractLocationFromKeyword(seedKeyword);
const baseKeyword = cleanKeyword(seedKeyword);
  const seed = cleanKeyword(seedKeyword);

  const queries = [
    seed,
    ...(location
      ? [
          `${baseKeyword} ${location}`,
          `${baseKeyword} near ${location}`,
          `${baseKeyword} in ${location}`,
          `${location} ${baseKeyword}`,
          `${baseKeyword} for sale in ${location}`,
          `${baseKeyword} for rent in ${location}`,
          `${baseKeyword} companies in ${location}`,
          `${baseKeyword} agents in ${location}`,
          `${baseKeyword} projects in ${location}`,
        ]
      : []),
    `${seed} near me`,
    `${seed} near`,
    `${seed} best`,
    `${seed} services`,
    `${seed} agency`,
    `${seed} company`,
    `${seed} companies`,
    `${seed} agents`,
    `${seed} properties`,
    `${seed} property`,
    `${seed} projects`,
    `${seed} builders`,
    `${seed} developers`,
    `${seed} for sale`,
    `${seed} for rent`,
    `${seed} price`,
    `${seed} cost`,
    `${seed} guide`,
    `${seed} tips`,
    `${seed} jobs`,
    `${seed} jobs for freshers`,

    `${seed} a`,
    `${seed} b`,
    `${seed} c`,
    `${seed} d`,
    `${seed} e`,
    `${seed} f`,
    `${seed} g`,
    `${seed} h`,
    `${seed} i`,
    `${seed} j`,
    `${seed} k`,
    `${seed} l`,
    `${seed} m`,
    `${seed} n`,
    `${seed} o`,
    `${seed} p`,
    `${seed} q`,
    `${seed} r`,
    `${seed} s`,
    `${seed} t`,
    `${seed} u`,
    `${seed} v`,
    `${seed} w`,
    `${seed} x`,
    `${seed} y`,
    `${seed} z`,
  ];

  const results = await Promise.all(
    queries.map((query) =>
      fetchGoogleSuggestions(query, languageCode),
    ),
  );

  const googleSuggestions = results.flat();

  const fallbackSuggestions = [
    `${seed} services`,
    `${seed} company`,
    `${seed} companies`,
    `${seed} agency`,
    `${seed} agents`,
    `${seed} properties`,
    `${seed} property`,
    `${seed} projects`,
    `${seed} builders`,
    `${seed} developers`,
    `${seed} for sale`,
    `${seed} for rent`,
    `${seed} price`,
    `${seed} cost`,
    `${seed} near me`,
  ];

  return [
    ...googleSuggestions,
    ...fallbackSuggestions,
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const keyword =
      typeof body.keyword === "string"
        ? body.keyword.trim()
        : "";

    const location =
      typeof body.location === "string" &&
      body.location.trim()
        ? body.location.trim()
        : "India";

    const languageCode =
      typeof body.languageCode === "string" &&
      body.languageCode.trim()
        ? body.languageCode.trim()
        : "en";

    if (!keyword) {
      return NextResponse.json(
        {
          error: "Keyword is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (keyword.length > 80) {
      return NextResponse.json(
        {
          error: "Keyword must be 80 characters or less.",
        },
        {
          status: 400,
        },
      );
    }

    const suggestions = await collectSuggestions(
      keyword,
      languageCode,
    );

    let keywords = buildKeywordResults(
      keyword,
      suggestions,
    );

    const metricKeywords = keywords
      .map((item) => item.keyword)
      .slice(0, 100);

    const [overviewMetrics, difficultyMetrics] =
      await Promise.all([
        fetchDataForSeoOverview(
          metricKeywords,
          location,
          languageCode,
        ),
        fetchDataForSeoDifficulty(
          metricKeywords,
          location,
          languageCode,
        ),
      ]);

    keywords = keywords.map((item) => {
      const overview = overviewMetrics.get(item.keyword);
      const difficulty = difficultyMetrics.get(item.keyword);

      return {
        ...item,
        searchVolume: overview?.searchVolume ?? item.searchVolume,
        keywordDifficulty:
          difficulty ??
          overview?.keywordDifficulty ??
          item.keywordDifficulty,
        cpc: overview?.cpc ?? item.cpc,
        competition: overview?.competition ?? item.competition,
        competitionLevel:
          overview?.competitionLevel ?? item.competitionLevel,
        intent: overview?.intent ?? item.intent,
      };
    });

    const metricsAvailable =
      overviewMetrics.size > 0 ||
      difficultyMetrics.size > 0;

    const relatedKeywords = keywords
      .filter(
        (item) =>
          item.keyword !== cleanKeyword(keyword),
      )
      .slice(0, 50);

    const longTailKeywords = keywords
      .filter((item) => item.isLongTail)
      .slice(0, 50);

    return NextResponse.json({
      provider: "free-keyword-discovery",
      metricsAvailable,

      seedKeyword: keyword,
      location,
      languageCode,

      totalKeywords: keywords.length,

      keywords,
      relatedKeywords,
      longTailKeywords,

      note:
        "Search volume, keyword difficulty and CPC are unavailable without a keyword metrics provider.",
    });
  } catch (error) {
    console.error("Keyword research error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected keyword research error.",
      },
      {
        status: 500,
      },
    );
  }
}
















