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
    .replace(/\s+/g, " ")
    .trim();
}

function getIntent(keyword: string): string {
  const value = keyword.toLowerCase();

  if (
    /\b(buy|price|pricing|cost|cheap|best|service|agency|company|tool|software|course)\b/.test(
      value,
    )
  ) {
    return "Commercial";
  }

  if (
    /\b(buy|order|hire|book|purchase|near me|for sale)\b/.test(value)
  ) {
    return "Transactional";
  }

  if (
    /\b(login|sign in|signin|official|website|download)\b/.test(value)
  ) {
    return "Navigational";
  }

  return "Informational";
}

function isLongTailKeyword(keyword: string): boolean {
  return keyword.split(/\s+/).length >= 4;
}

function isUsefulKeyword(keyword: string): boolean {
  if (!keyword) return false;
  if (keyword.length < 2) return false;
  if (keyword.length > 100) return false;

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

  const relevant = unique.filter((keyword) => {
    if (keyword === seed) return true;

    const keywordWords = keyword.split(/\s+/);

    const matchedWords = seedWords.filter((word) =>
      keyword.includes(word),
    ).length;

    return (
      matchedWords >= Math.max(1, Math.ceil(seedWords.length * 0.5))
    );
  });

  const ranked = relevant
    .sort((a, b) => {
      if (a === seed) return -1;
      if (b === seed) return 1;

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

async function collectSuggestions(
  seedKeyword: string,
  languageCode: string,
): Promise<string[]> {
  const queries = [
    seedKeyword,
    `${seedKeyword} a`,
    `${seedKeyword} b`,
    `${seedKeyword} c`,
    `${seedKeyword} d`,
    `${seedKeyword} e`,
    `${seedKeyword} f`,
    `${seedKeyword} g`,
    `${seedKeyword} h`,
    `${seedKeyword} i`,
    `${seedKeyword} j`,
    `${seedKeyword} k`,
    `${seedKeyword} l`,
    `${seedKeyword} m`,
    `${seedKeyword} n`,
    `${seedKeyword} o`,
    `${seedKeyword} p`,
    `${seedKeyword} q`,
    `${seedKeyword} r`,
    `${seedKeyword} s`,
    `${seedKeyword} t`,
    `${seedKeyword} u`,
    `${seedKeyword} v`,
    `${seedKeyword} w`,
    `${seedKeyword} x`,
    `${seedKeyword} y`,
    `${seedKeyword} z`,
  ];

  const results = await Promise.all(
    queries.map((query) => fetchGoogleSuggestions(query, languageCode)),
  );

  return results.flat();
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

    const keywords = buildKeywordResults(
      keyword,
      suggestions,
    );

    const relatedKeywords = keywords
      .filter((item) => !item.isLongTail)
      .slice(0, 50);

    const longTailKeywords = keywords
      .filter((item) => item.isLongTail)
      .slice(0, 50);

    return NextResponse.json({
      provider: "free-keyword-discovery",
      metricsAvailable: false,

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
