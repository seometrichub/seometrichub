
import "server-only";

import {
  fetchBacklinkDetails,
  fetchBacklinkSummary,
  type BacklinkDetail,
  type BacklinkSummary,
} from "@/lib/dataforseo-backlinks";

export type BacklinkGapOpportunity = {
  sourceDomain: string;
  priority: "High" | "Medium" | "Low";
qualityScore: number;
averageRank: number | null;
averageSpamScore: number | null;
  competitorDomains: string[];
  competitorCount: number;
  backlinksFound: number;
  examples: {
    competitor: string;
    sourceUrl: string;
    targetUrl: string;
    anchor: string | null;
    dofollow: boolean | null;
    rank: number | null;
    spamScore: number | null;
  }[];
};

export type BacklinkGapResult = {
  yourDomain: string;
  competitors: string[];
  summaries: {
    domain: string;
    data: BacklinkSummary | null;
    error: string | null;
  }[];
  opportunities: BacklinkGapOpportunity[];
  totalOpportunities: number;
  sampleBased: true;
  fetchedAt: string;
  warnings: string[];
};

function normalizeDomain(input: string): string {
  const value = input.trim();

  if (!value) {
    throw new Error("Domain is required.");
  }

  const url = new URL(
    /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`
  );

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Invalid website URL.");
  }

  return url.hostname.toLowerCase().replace(/^www\./, "");
}

function normalizeSourceDomain(
  item: BacklinkDetail
): string | null {
  try {
    const hostname = item.sourceDomain
      ? normalizeDomain(item.sourceDomain)
      : normalizeDomain(item.sourceUrl);

    return hostname || null;
  } catch {
    return null;
  }
}

function calculateOpportunityQuality(
  examples: BacklinkGapOpportunity["examples"],
  competitorCount: number
) {
  const ranks = examples
    .map((item) => item.rank)
    .filter((value): value is number => value !== null);

  const spamScores = examples
    .map((item) => item.spamScore)
    .filter((value): value is number => value !== null);

  const averageRank = ranks.length
    ? Math.round(
        ranks.reduce((sum, value) => sum + value, 0) /
          ranks.length
      )
    : null;

  const averageSpamScore = spamScores.length
    ? Math.round(
        spamScores.reduce((sum, value) => sum + value, 0) /
          spamScores.length
      )
    : null;

  const rankPoints =
    averageRank === null
      ? 0
      : averageRank >= 500
        ? 40
        : averageRank >= 200
          ? 25
          : 10;

  const spamPoints =
    averageSpamScore === null
      ? 0
      : averageSpamScore <= 10
        ? 30
        : averageSpamScore <= 30
          ? 15
          : 0;

  const competitorPoints =
    Math.min(competitorCount, 2) * 15;

  const qualityScore =
    rankPoints + spamPoints + competitorPoints;

  const priority: "High" | "Medium" | "Low" =
    qualityScore >= 70
      ? "High"
      : qualityScore >= 40
        ? "Medium"
        : "Low";

  return {
    priority,
    qualityScore,
    averageRank,
    averageSpamScore,
  };
}

export async function analyzeBacklinkGap(
  yourWebsite: string,
  competitorWebsites: string[],
  limitPerWebsite = 100
): Promise<BacklinkGapResult> {
  const yourDomain = normalizeDomain(yourWebsite);

  const competitors = [
    ...new Set(
      competitorWebsites
        .filter((value) => value.trim().length > 0)
        .map(normalizeDomain)
    ),
  ].filter((domain) => domain !== yourDomain);

  if (competitors.length === 0) {
    throw new Error(
      "At least one different competitor domain is required."
    );
  }

  if (competitors.length > 2) {
    throw new Error(
      "A maximum of two competitors is supported."
    );
  }

  const domains = [yourDomain, ...competitors];

  const results = await Promise.allSettled(
    domains.map(async (domain) => {
      const [summaryResult, detailsResult] =
        await Promise.allSettled([
          fetchBacklinkSummary(domain),
          fetchBacklinkDetails(domain, limitPerWebsite),
        ]);

      return {
        domain,
        summaryResult,
        detailsResult,
      };
    })
  );

  const warnings: string[] = [];

  const summaries = results.map((result, index) => {
    const domain = domains[index];

    if (result.status === "rejected") {
      warnings.push(
        `Unable to retrieve backlink data for ${domain}.`
      );

      return {
        domain,
        data: null,
        error: "Backlink data unavailable.",
      };
    }

    const summary = result.value.summaryResult;

    if (summary.status === "fulfilled") {
      return {
        domain,
        data: summary.value,
        error: null,
      };
    }

    warnings.push(
      `Backlink summary unavailable for ${domain}.`
    );

    return {
      domain,
      data: null,
      error: "Backlink summary unavailable.",
    };
  });

  const detailResults = results.map((result, index) => {
    const domain = domains[index];

    if (result.status === "rejected") {
      return {
        domain,
        items: [] as BacklinkDetail[],
        available: false,
      };
    }

    const details = result.value.detailsResult;

    if (details.status === "rejected") {
      warnings.push(
        `Backlink details unavailable for ${domain}.`
      );

      return {
        domain,
        items: [] as BacklinkDetail[],
        available: false,
      };
    }

    return {
      domain,
      items: details.value.items,
      available: true,
    };
  });

  const yourDetails = detailResults[0];

  if (!yourDetails.available) {
    throw new Error(
      "Your website backlink details are unavailable. Gap comparison cannot be verified."
    );
  }

  const yourSourceDomains = new Set(
    yourDetails.items
      .filter((item) => !item.isLost)
      .map(normalizeSourceDomain)
      .filter((domain): domain is string => Boolean(domain))
  );

  const gapMap = new Map<
    string,
    BacklinkGapOpportunity
  >();

  for (const competitorResult of detailResults.slice(1)) {
    if (!competitorResult.available) {
      continue;
    }

    for (const item of competitorResult.items) {
      if (item.isLost) {
        continue;
      }

      const sourceDomain = normalizeSourceDomain(item);

      if (
        !sourceDomain ||
        yourSourceDomains.has(sourceDomain)
      ) {
        continue;
      }

      let opportunity = gapMap.get(sourceDomain);

      if (!opportunity) {
        opportunity = {
  sourceDomain,
  competitorDomains: [],
  competitorCount: 0,
  backlinksFound: 0,
  examples: [],
  priority: "Low",
  qualityScore: 0,
  averageRank: null,
  averageSpamScore: null,
};

        gapMap.set(sourceDomain, opportunity);
      }

      if (
        !opportunity.competitorDomains.includes(
          competitorResult.domain
        )
      ) {
        opportunity.competitorDomains.push(
          competitorResult.domain
        );
      }

      opportunity.backlinksFound++;

      if (opportunity.examples.length < 5) {
        opportunity.examples.push({
          competitor: competitorResult.domain,
          sourceUrl: item.sourceUrl,
          targetUrl: item.targetUrl,
          anchor: item.anchor,
          dofollow: item.dofollow,
          rank: item.rank,
          spamScore: item.spamScore,
        });
      }
    }
  }


    const opportunities = [...gapMap.values()]
  .map((item) => {
    const competitorCount =
      item.competitorDomains.length;

    const quality = calculateOpportunityQuality(
      item.examples,
      competitorCount
    );

    return {
      ...item,
      competitorCount,
      ...quality,
    };
  })
  .sort(
    (a, b) =>
      b.qualityScore - a.qualityScore ||
      b.competitorCount - a.competitorCount ||
      b.backlinksFound - a.backlinksFound
  );
  warnings.push(
    "Gap results use sampled backlinks only. A source absent from your sample may still link to your website."
  );

  return {
    yourDomain,
    competitors,
    summaries,
    opportunities,
    totalOpportunities: opportunities.length,
    sampleBased: true,
    fetchedAt: new Date().toISOString(),
    warnings,
  };
}
