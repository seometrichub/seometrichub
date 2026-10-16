
import "server-only";

import {
  type CompetitorOrganicResult,
  type CompetitorKeyword,
} from "@/lib/dataforseo-competitors";

import {
  calculateContentRelevance,
  type BusinessContext,
} from "@/lib/content-relevance";

export type ContentGapOpportunity = {
  keyword: string;
  competitor: string;
  competitorPosition: number | null;
  competitorUrl: string | null;
  yourPosition: number | null;
  searchVolume: number;
  cpc: number | null;
  intent: string | null;
  contentType: "Article" | "Landing Page" | "Guide";
  suggestedTitle: string;
  opportunityType: "missing" | "weak";

  priority: "High" | "Medium" | "Low";
  priorityScore: number;

  relevanceScore: number;
  relevanceLevel: "High" | "Medium" | "Low" | "Unknown";
  matchedTerms: string[];
};

export type ContentGapResult = {
  opportunities: ContentGapOpportunity[];
  summary: {
    totalOpportunities: number;
    missingOpportunities: number;
    weakOpportunities: number;
    highPriority: number;
    sampleBased: true;
    yourSiteDataAvailable: boolean;
  };
};

function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function getContentType(
  intent: string | null,
  keyword: string
): "Article" | "Landing Page" | "Guide" {
  const normalized = keyword.toLowerCase();

  if (
    intent === "transactional" ||
    intent === "commercial"
  ) {
    return "Landing Page";
  }

  if (
    normalized.startsWith("how ") ||
    normalized.includes("guide") ||
    normalized.includes("tutorial")
  ) {
    return "Guide";
  }

  return "Article";
}

function createSuggestedTitle(
  keyword: string,
  contentType: "Article" | "Landing Page" | "Guide"
): string {
  const title = keyword
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  if (contentType === "Guide") {
    return `${title}: A Complete Guide`;
  }

  if (contentType === "Landing Page") {
    return title;
  }

  return `${title}: What You Need to Know`;
}

function calculatePriority(
  keyword: CompetitorKeyword,
  opportunityType: "missing" | "weak"
): {
  priority: "High" | "Medium" | "Low";
  priorityScore: number;
} {
  const volumePoints =
    keyword.searchVolume >= 10000
      ? 40
      : keyword.searchVolume >= 1000
        ? 30
        : keyword.searchVolume >= 100
          ? 20
          : 10;

  const positionPoints =
    keyword.position !== null &&
    keyword.position <= 10
      ? 30
      : keyword.position !== null &&
          keyword.position <= 20
        ? 20
        : 10;

  const intentPoints =
    keyword.searchIntent === "commercial" ||
    keyword.searchIntent === "transactional"
      ? 20
      : 10;

  const gapPoints =
    opportunityType === "missing" ? 10 : 5;

  const priorityScore = Math.min(
    100,
    volumePoints +
      positionPoints +
      intentPoints +
      gapPoints
  );

  const priority =
    priorityScore >= 75
      ? "High"
      : priorityScore >= 50
        ? "Medium"
        : "Low";

  return {
    priority,
    priorityScore,
  };
}

export function analyzeContentGap(
  yourSite: CompetitorOrganicResult | null,
  competitors: CompetitorOrganicResult[],
  businessContext?: BusinessContext
): ContentGapResult {
  const yourKeywordMap = new Map(
    (yourSite?.keywords ?? []).map((item) => [
      normalizeKeyword(item.keyword),
      item,
    ])
  );

  const opportunityMap = new Map<
    string,
    ContentGapOpportunity
  >();

  for (const competitor of competitors) {
    for (const keyword of competitor.keywords) {
      const normalized = normalizeKeyword(
        keyword.keyword
      );

      if (!normalized) {
        continue;
      }

      const yourKeyword =
        yourKeywordMap.get(normalized);

      let opportunityType:
        | "missing"
        | "weak"
        | null = null;

      if (!yourKeyword) {
        opportunityType = "missing";
      } else if (
        keyword.position !== null &&
        yourKeyword.position !== null &&
        yourKeyword.position > keyword.position
      ) {
        opportunityType = "weak";
      }

      if (!opportunityType) {
        continue;
      }

      const contentType = getContentType(
        keyword.searchIntent,
        keyword.keyword
      );

      // Base SEO opportunity score
      const priority = calculatePriority(
        keyword,
        opportunityType
      );

      // Business relevance score
      const relevance = businessContext
        ? calculateContentRelevance(
            keyword.keyword,
            businessContext
          )
        : {
            score: 0,
            level: "Unknown" as const,
            matchedTerms: [] as string[],
          };

      // Combine SEO opportunity with relevance.
      // Without business context, preserve old scoring.
      const adjustedPriorityScore =
        relevance.level === "Unknown"
          ? priority.priorityScore
          : Math.round(
              priority.priorityScore * 0.6 +
                relevance.score * 0.4
            );

      let adjustedPriority:
        | "High"
        | "Medium"
        | "Low";

      if (relevance.level === "Low") {
        adjustedPriority = "Low";
      } else if (adjustedPriorityScore >= 75) {
        adjustedPriority = "High";
      } else if (adjustedPriorityScore >= 50) {
        adjustedPriority = "Medium";
      } else {
        adjustedPriority = "Low";
      }

      const opportunity: ContentGapOpportunity = {
        keyword: keyword.keyword,
        competitor: competitor.domain,
        competitorPosition: keyword.position,
        competitorUrl: keyword.url,
        yourPosition: yourKeyword?.position ?? null,
        searchVolume: keyword.searchVolume,
        cpc: keyword.cpc,
        intent: keyword.searchIntent,
        contentType,
        suggestedTitle: createSuggestedTitle(
          keyword.keyword,
          contentType
        ),
        opportunityType,

        priority: adjustedPriority,
        priorityScore: adjustedPriorityScore,

        relevanceScore: relevance.score,
        relevanceLevel: relevance.level,
        matchedTerms: relevance.matchedTerms,
      };

      const existing =
        opportunityMap.get(normalized);

      if (
        !existing ||
        opportunity.priorityScore >
          existing.priorityScore ||
        (opportunity.priorityScore ===
          existing.priorityScore &&
          (opportunity.competitorPosition ??
            Infinity) <
            (existing.competitorPosition ??
              Infinity))
      ) {
        opportunityMap.set(
          normalized,
          opportunity
        );
      }
    }
  }

  const opportunities = [
    ...opportunityMap.values(),
  ].sort(
    (a, b) =>
      b.priorityScore - a.priorityScore ||
      b.searchVolume - a.searchVolume
  );

  return {
    opportunities,
    summary: {
      totalOpportunities: opportunities.length,

      missingOpportunities:
        opportunities.filter(
          (item) =>
            item.opportunityType === "missing"
        ).length,

      weakOpportunities:
        opportunities.filter(
          (item) =>
            item.opportunityType === "weak"
        ).length,

      highPriority:
        opportunities.filter(
          (item) => item.priority === "High"
        ).length,

      sampleBased: true,
      yourSiteDataAvailable: yourSite !== null,
    },
  };
}
