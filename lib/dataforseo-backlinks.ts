
import "server-only";

export type BacklinkSummary = {
  totalBacklinks: number;
  referringDomains: number;
  referringMainDomains: number;
  referringPages: number | null;
  nofollowReferringPages: number | null;
  nofollowReferringDomains: number | null;
  backlinkSpamScore: number | null;
  brokenBacklinks: number | null;
  referringLinksTld: Record<string, number>;
  referringLinksTypes: Record<string, number>;
  referringLinksAttributes: Record<string, number>;
};

type SummaryResult = {
  backlinks?: number;
  referring_domains?: number;
  referring_main_domains?: number;
  referring_pages?: number;
  referring_pages_nofollow?: number;
  referring_domains_nofollow?: number;
  backlinks_spam_score?: number;
  broken_backlinks?: number;
  referring_links_tld?: Record<string, number>;
  referring_links_types?: Record<string, number>;
  referring_links_attributes?: Record<string, number>;
};

type ProviderResponse = {
  status_code?: number;
  tasks?: Array<{
    status_code?: number;
    result?: SummaryResult[] | null;
  }>;
};

function isValidCount(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function optionalCount(value: unknown): number | null {
  return isValidCount(value) ? value : null;
}

function safeDistribution(
  value: unknown,
): Record<string, number> {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] =>
        isValidCount(entry[1]),
    ),
  );
}

export async function fetchBacklinkSummary(
  domain: string,
): Promise<BacklinkSummary> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("DATAFORSEO_NOT_CONFIGURED");
  }

  const auth = Buffer.from(
    `${login}:${password}`,
  ).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    15000,
  );

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/backlinks/summary/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            target: domain,
            include_subdomains: true,
            backlinks_status_type: "live",
          },
        ]),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `DATAFORSEO_HTTP_ERROR_${response.status}`,
      );
    }

    const data: ProviderResponse = await response.json();
    const task = data.tasks?.[0];

    if (
      data.status_code !== 20000 ||
      task?.status_code !== 20000
    ) {
      throw new Error("DATAFORSEO_TASK_ERROR");
    }

    const summary = task.result?.[0];

    if (
      !summary ||
      !isValidCount(summary.backlinks) ||
      !isValidCount(summary.referring_domains) ||
      !isValidCount(summary.referring_main_domains)
    ) {
      throw new Error("DATAFORSEO_INVALID_RESULT");
    }

    return {
      totalBacklinks: summary.backlinks,
      referringDomains: summary.referring_domains,
      referringMainDomains:
        summary.referring_main_domains,
      referringPages:
        optionalCount(summary.referring_pages),
      nofollowReferringPages:
        optionalCount(summary.referring_pages_nofollow),
      nofollowReferringDomains:
        optionalCount(summary.referring_domains_nofollow),
      backlinkSpamScore:
        optionalCount(summary.backlinks_spam_score),
      brokenBacklinks:
        optionalCount(summary.broken_backlinks),
      referringLinksTld:
        safeDistribution(summary.referring_links_tld),
      referringLinksTypes:
        safeDistribution(summary.referring_links_types),
      referringLinksAttributes:
        safeDistribution(summary.referring_links_attributes),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export type BacklinkDetail = {
  sourceDomain: string;
  sourceUrl: string;
  targetUrl: string;
  anchor: string | null;
  dofollow: boolean | null;
  spamScore: number | null;
  rank: number | null;
  firstSeen: string | null;
  lastSeen: string | null;
  isNew: boolean;
  isLost: boolean;
  externalLinks: number | null;
};

type BacklinkDetailItem = {
  domain_from?: string;
  url_from?: string;
  url_to?: string;
  anchor?: string | null;
  dofollow?: boolean;
  backlink_spam_score?: number;
  rank?: number;
  first_seen?: string | null;
  last_seen?: string | null;
  is_new?: boolean;
  is_lost?: boolean;
  page_from_external_links?: number;
};

type BacklinkDetailsResponse = {
  status_code?: number;
  tasks?: Array<{
    status_code?: number;
    result?: Array<{
      total_count?: number;
      items?: BacklinkDetailItem[];
    }> | null;
  }>;
};

export async function fetchBacklinkDetails(
  domain: string,
  limit = 100,
): Promise<{
  totalCount: number;
  items: BacklinkDetail[];
}> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("DATAFORSEO_NOT_CONFIGURED");
  }

  const safeLimit = Math.min(
    100,
    Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 100)),
  );

  const auth = Buffer.from(
    `${login}:${password}`,
  ).toString("base64");

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    20000,
  );

  try {
    const response = await fetch(
      "https://api.dataforseo.com/v3/backlinks/backlinks/live",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            target: domain,
            mode: "as_is",
            limit: safeLimit,
            backlinks_status_type: "live",
          },
        ]),
        signal: controller.signal,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `DATAFORSEO_DETAILS_HTTP_${response.status}`,
      );
    }

    const data: BacklinkDetailsResponse =
      await response.json();

    const task = data.tasks?.[0];

    if (
      data.status_code !== 20000 ||
      task?.status_code !== 20000
    ) {
      throw new Error("DATAFORSEO_DETAILS_TASK_ERROR");
    }

    const result = task.result?.[0];

    if (!result || !Array.isArray(result.items)) {
      throw new Error("DATAFORSEO_DETAILS_INVALID_RESULT");
    }

    const items: BacklinkDetail[] = result.items
      .filter(
        (item) =>
          typeof item.url_from === "string" &&
          typeof item.url_to === "string",
      )
      .map((item) => ({
        sourceDomain: item.domain_from ?? "",
        sourceUrl: item.url_from!,
        targetUrl: item.url_to!,
        anchor: item.anchor ?? null,
        dofollow:
          typeof item.dofollow === "boolean"
            ? item.dofollow
            : null,
        spamScore: optionalCount(
          item.backlink_spam_score,
        ),
        rank: optionalCount(item.rank),
        firstSeen: item.first_seen ?? null,
        lastSeen: item.last_seen ?? null,
        isNew: item.is_new === true,
        isLost: item.is_lost === true,
        externalLinks: optionalCount(
          item.page_from_external_links,
        ),
      }));

    return {
      totalCount:
        optionalCount(result.total_count) ??
        items.length,
      items,
    };
  } finally {
    clearTimeout(timeout);
  }
}
