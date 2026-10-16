
import "server-only";

const DATAFORSEO_BASE_URL = "https://api.dataforseo.com/v3";
const REQUEST_TIMEOUT_MS = 30000;

export type CompetitorKeyword = {
  keyword: string;
  position: number | null;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  estimatedTraffic: number;
  searchIntent: string | null;
  url: string | null;
};

export type CompetitorOrganicResult = {
  domain: string;
  locationCode: number;
  languageCode: string;
  totalKeywords: number;
  estimatedOrganicTraffic: number;
  keywords: CompetitorKeyword[];
  provider: "DataForSEO";
  fetchedAt: string;
};

type DataForSEOResponse = {
  status_code?: number;
  status_message?: string;
  tasks?: Array<{
    status_code?: number;
    status_message?: string;
    result?: Array<{
      total_count?: number;
      items?: Array<{
        keyword_data?: {
          keyword?: string;
          keyword_info?: {
            search_volume?: number;
            cpc?: number;
            competition?: number;
          };
          search_intent_info?: {
            main_intent?: string;
          };
        };
        ranked_serp_element?: {
          serp_item?: {
            rank_group?: number;
            rank_absolute?: number;
            etv?: number;
            url?: string;
          };
        };
      }>;
    }>;
  }>;
};

function normalizeDomain(input: string): string {
  const value = input.trim();

  if (!value) {
    throw new Error("DOMAIN_REQUIRED");
  }

  let parsed: URL;

  try {
    parsed = new URL(
      /^https?:\/\//i.test(value)
        ? value
        : `https://${value}`
    );
  } catch {
    throw new Error("INVALID_DOMAIN");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("INVALID_DOMAIN");
  }

  const domain = parsed.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/^www\./, "");

  if (
    domain.length > 253 ||
    !/^[a-z0-9.-]+$/.test(domain) ||
    !domain.includes(".") ||
    domain.split(".").some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith("-") ||
        label.endsWith("-")
    )
  ) {
    throw new Error("INVALID_DOMAIN");
  }

  return domain;
}

function getAuthorization(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error("DATAFORSEO_NOT_CONFIGURED");
  }

  return `Basic ${Buffer.from(
    `${login}:${password}`
  ).toString("base64")}`;
}

function safeNumber(value: unknown): number {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : 0;
}

export async function fetchCompetitorOrganicKeywords(
  inputDomain: string,
  options: {
    locationCode?: number;
    languageCode?: string;
    limit?: number;
  } = {}
): Promise<CompetitorOrganicResult> {
  const domain = normalizeDomain(inputDomain);

  const locationCode = options.locationCode ?? 2356;
  const languageCode = options.languageCode ?? "en";

  const limit = Math.min(
    20,
    Math.max(1, Math.floor(options.limit ?? 20))
  );

  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `${DATAFORSEO_BASE_URL}/dataforseo_labs/google/ranked_keywords/live`,
      {
        method: "POST",
        headers: {
          Authorization: getAuthorization(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          {
            target: domain,
            location_code: locationCode,
            language_code: languageCode,
            limit,
            order_by: [
              "keyword_data.keyword_info.search_volume,desc",
            ],
          },
        ]),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw new Error(
        `DATAFORSEO_HTTP_ERROR_${response.status}`
      );
    }

    const data =
      (await response.json()) as DataForSEOResponse;

    if (data.status_code !== 20000) {
      throw new Error(
        `DATAFORSEO_ERROR: ${
          data.status_message ?? "Unknown API error"
        }`
      );
    }

    const task = data.tasks?.[0];

    if (!task || task.status_code !== 20000) {
      throw new Error(
        `DATAFORSEO_TASK_ERROR: ${
          task?.status_message ?? "Unknown task error"
        }`
      );
    }

    const result = task.result?.[0];

    if (!result) {
      throw new Error(
        "DATAFORSEO_EMPTY_RESULT"
      );
    }

    const items = result.items ?? [];

    const keywords: CompetitorKeyword[] = items.map(
      (item) => {
        const keywordData = item.keyword_data;
        const keywordInfo = keywordData?.keyword_info;
        const serpItem =
          item.ranked_serp_element?.serp_item;

        return {
          keyword: keywordData?.keyword ?? "",
          position:
            serpItem?.rank_group ??
            serpItem?.rank_absolute ??
            null,
          searchVolume: safeNumber(
            keywordInfo?.search_volume
          ),
          cpc:
            typeof keywordInfo?.cpc === "number"
              ? keywordInfo.cpc
              : null,
          competition:
            typeof keywordInfo?.competition === "number"
              ? keywordInfo.competition
              : null,
          estimatedTraffic: safeNumber(
            serpItem?.etv
          ),
          searchIntent:
            keywordData?.search_intent_info
              ?.main_intent ?? null,
          url: serpItem?.url ?? null,
        };
      }
    );

    return {
      domain,
      locationCode,
      languageCode,
      totalKeywords: safeNumber(
        result.total_count
      ),
      estimatedOrganicTraffic: keywords.reduce(
        (sum, item) => sum + item.estimatedTraffic,
        0
      ),
      keywords,
      provider: "DataForSEO",
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error("DATAFORSEO_REQUEST_TIMEOUT");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
