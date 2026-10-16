
export type BusinessContext = {
  industry: string;
  services: string;
  location?: string;
};

export type RelevanceResult = {
  score: number;
  level: "High" | "Medium" | "Low" | "Unknown";
  matchedTerms: string[];
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "your",
  "our",
  "best",
  "top",
  "near",
  "services",
  "service",
  "company",
  "business",
  "online",
  "website",
  "solutions",
  "provider",
  "providers",
  "in",
  "at",
  "of",
  "to",
  "a",
  "an",
]);

// Equivalent terms and common abbreviations.
const TERM_ALIASES: Record<string, string> = {
  seo: "seo",
  sem: "sem",
  ppc: "ppc",
  gbp: "gbp",
  gmb: "gbp",
  serp: "serp",
  smm: "socialmedia",
  backlinks: "backlink",
  keywords: "keyword",
  marketers: "marketing",
  marketer: "marketing",
  optimisation: "optimization",
  optimised: "optimization",
  optimized: "optimization",
  ads: "advertising",
  adverts: "advertising",
  advertising: "advertising",
};

type PhraseAlias = {
  pattern: RegExp;
  token: string;
};

const PHRASE_ALIASES: PhraseAlias[] = [
  {
    pattern: /\bsearch engine optimi[sz]ation\b/g,
    token: "seo",
  },
  {
    pattern: /\bgoogle business profile\b/g,
    token: "gbp",
  },
  {
    pattern: /\bgoogle my business\b/g,
    token: "gbp",
  },
  {
    pattern: /\bsocial media marketing\b/g,
    token: "socialmedia",
  },
  {
    pattern: /\bsocial media\b/g,
    token: "socialmedia",
  },
  {
    pattern: /\bpay per click\b/g,
    token: "ppc",
  },
  {
    pattern: /\bsearch engine results pages?\b/g,
    token: "serp",
  },
  {
    pattern: /\bkeyword research\b/g,
    token: "keywordresearch",
  },
 {
  pattern: /\bbacklink analysis\b/g,
  token: "backlink",
},
  {
    pattern: /\bdigital marketing\b/g,
    token: "digitalmarketing",
  },
];

// More specific phrases should match before shorter ones.
const SORTED_PHRASES = [...PHRASE_ALIASES].sort(
  (a, b) =>
    b.pattern.source.length - a.pattern.source.length
);

function normalizeTerm(term: string): string {
  if (TERM_ALIASES[term]) {
    return TERM_ALIASES[term];
  }

  if (
    term.length > 4 &&
    term.endsWith("ies")
  ) {
    return `${term.slice(0, -3)}y`;
  }

  if (
    term.length > 4 &&
    term.endsWith("s") &&
    !term.endsWith("ss")
  ) {
    return term.slice(0, -1);
  }

  return term;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  let text = normalizeText(value);

  const tokens = new Set<string>();

  // Replace recognized phrases with canonical tokens.
  // This prevents the individual words from
  // incorrectly reducing the relevance score.
  for (const alias of SORTED_PHRASES) {
    text = text.replace(
      alias.pattern,
      () => ` ${alias.token} `
    );
  }

  const words = text
    .split(/\s+/)
    .filter(Boolean);

  for (const word of words) {
    if (
      word.length < 3 ||
      STOP_WORDS.has(word)
    ) {
      continue;
    }

    tokens.add(normalizeTerm(word));
  }

  return [...tokens];
}

export function calculateContentRelevance(
  keyword: string,
  context: BusinessContext
): RelevanceResult {
  const keywordTerms = tokenize(keyword);

  const businessTerms = tokenize(
    `${context.industry} ${context.services}`
  );

  if (
    keywordTerms.length === 0 ||
    businessTerms.length === 0
  ) {
    return {
      score: 0,
      level: "Unknown",
      matchedTerms: [],
    };
  }

  const businessSet = new Set(businessTerms);

  const matchedTerms = keywordTerms.filter(
    (term) => businessSet.has(term)
  );

  const coverage =
    matchedTerms.length / keywordTerms.length;

  const score = Math.round(
    Math.min(1, coverage) * 100
  );

  const level: RelevanceResult["level"] =
    score >= 60
      ? "High"
      : score >= 25
        ? "Medium"
        : "Low";

  return {
    score,
    level,
    matchedTerms,
  };
}
