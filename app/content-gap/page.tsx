"use client";

import { useState, type FormEvent } from "react";

type Opportunity = {
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
  relevanceScore?: number;
  relevanceLevel?: "High" | "Medium" | "Low" | "Unknown";
  matchedTerms?: string[];
};

type ContentGapResponse = {
  success: boolean;
  error?: string;
  yourDomain?: string;
  competitors?: string[];
  businessContext?: { industry: string; services: string; location?: string } | null;
  opportunities?: Opportunity[];
  summary?: {
    totalOpportunities: number;
    missingOpportunities: number;
    weakOpportunities: number;
    highPriority: number;
    sampleBased: boolean;
    yourSiteDataAvailable: boolean;
  };
  warnings?: string[];
  quota?: {
    used: number;
    limit: number;
    remaining: number;
    periodEnd: string;
  };
  fetchedAt?: string;
};

type Filter = "all" | "high" | "relevant" | "missing" | "weak";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

export default function ContentGapPage() {
  const [yourUrl, setYourUrl] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [industry, setIndustry] = useState("");
  const [services, setServices] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] =
    useState<ContentGapResponse | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    setFilter("all");

    try {
      const response = await fetch("/api/content-gap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yourUrl,
          competitor1,
          competitor2,
          industry,
          services,
          location,
        }),
      });

      const data: ContentGapResponse =
        await response.json();

      setResult(data);

      if (!response.ok || !data.success) {
        setError(
          data.error ?? "Content Gap Analysis failed."
        );
      }
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  const opportunities =
    result?.opportunities ?? [];

  const filteredOpportunities =
    opportunities.filter((item) => {
      if (filter === "high") {
        return item.priority === "High";
      }

      if (filter === "relevant") {
        return item.relevanceLevel === "High";
      }

      if (filter === "missing") {
        return item.opportunityType === "missing";
      }

      if (filter === "weak") {
        return item.opportunityType === "weak";
      }

      return true;
    });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            SEOMETRICHUB
          </p>

          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Content Gap Analysis
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Compare your website with competitors,
            discover potential content opportunities,
            and generate SEO content ideas using
            real organic keyword data.
          </p>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="yourUrl"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Your Website
              </label>

              <input
                id="yourUrl"
                type="text"
                required
                value={yourUrl}
                onChange={(event) =>
                  setYourUrl(event.target.value)
                }
                placeholder="yourwebsite.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="competitor1"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Competitor 1
                </label>

                <input
                  id="competitor1"
                  type="text"
                  required
                  value={competitor1}
                  onChange={(event) =>
                    setCompetitor1(event.target.value)
                  }
                  placeholder="competitor1.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label
                  htmlFor="competitor2"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Competitor 2 (Optional)
                </label>

                <input
                  id="competitor2"
                  type="text"
                  value={competitor2}
                  onChange={(event) =>
                    setCompetitor2(event.target.value)
                  }
                  placeholder="competitor2.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-lg font-black text-slate-950">
                Business Relevance (Optional)
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add your industry and services to adjust keyword priorities.
                This is a basic word-matching estimate, not semantic analysis.
              </p>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="industry" className="mb-2 block text-sm font-bold text-slate-800">
                    Business Industry
                  </label>
                  <input id="industry" type="text" maxLength={120}
                    value={industry} onChange={(event) => setIndustry(event.target.value)}
                    placeholder="Digital Marketing Agency"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label htmlFor="location" className="mb-2 block text-sm font-bold text-slate-800">
                    Target Location
                  </label>
                  <input id="location" type="text" maxLength={120}
                    value={location} onChange={(event) => setLocation(event.target.value)}
                    placeholder="Visakhapatnam, India"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500" />
                  <p className="mt-1 text-xs text-slate-500">
                    Informational only; keyword data currently uses India (English).
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="services" className="mb-2 block text-sm font-bold text-slate-800">
                  Main Products / Services
                </label>
                <textarea id="services" rows={3} maxLength={1000}
                  value={services} onChange={(event) => setServices(event.target.value)}
                  placeholder="SEO, Google Business Profile optimization, social media marketing"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Analyzing Content Gaps..."
                : "Analyze Content Gap"}
            </button>

            <p className="text-xs text-slate-500">
              Uses DataForSEO organic keyword data.
              An analysis can trigger up to three
              billable provider requests and consumes
              shared competitor-analysis quota.
            </p>
          </form>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {result?.quota && (
          <section className="rounded-3xl border border-violet-200 bg-violet-50 p-6">
            <h2 className="text-lg font-black text-slate-950">
              Monthly Analysis Usage
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-600">
                  Used
                </p>
                <p className="text-2xl font-black">
                  {result.quota.used}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Remaining
                </p>
                <p className="text-2xl font-black">
                  {result.quota.remaining}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-600">
                  Monthly Limit
                </p>
                <p className="text-2xl font-black">
                  {result.quota.limit}
                </p>
              </div>
            </div>
          </section>
        )}

        {result?.success && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total Opportunities",
                  value:
                    result.summary?.totalOpportunities ?? 0,
                },
                {
                  label: "Potential Missing",
                  value:
                    result.summary?.missingOpportunities ?? 0,
                },
                {
                  label: "Weak Rankings",
                  value:
                    result.summary?.weakOpportunities ?? 0,
                },
                {
                  label: "High Priority",
                  value:
                    result.summary?.highPriority ?? 0,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-slate-200 bg-white p-6"
                >
                  <p className="text-sm font-medium text-slate-600">
                    {item.label}
                  </p>

                  <p className="mt-3 text-3xl font-black text-slate-950">
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </section>

            {result.businessContext && (
              <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
                <p className="font-bold text-slate-900">Business context applied</p>
                <p className="mt-2">Industry: {result.businessContext.industry || "Not specified"}</p>
                <p>Services: {result.businessContext.services || "Not specified"}</p>
                <p>Location: {result.businessContext.location || "Not specified"} (not used for keyword targeting)</p>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">
                Content Opportunities
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Keyword-based opportunities from
                sampled competitor rankings. These
                are not verified missing pages.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {(
                  [
                    ["all", "All Opportunities"],
                    ["high", "High Priority"],
                    ["relevant", "High Relevance"],
                    ["missing", "Potential Missing"],
                    ["weak", "Weak Rankings"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                      filter === value
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Showing{" "}
                {filteredOpportunities.length} of{" "}
                {opportunities.length} opportunities
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      {[
                        "Keyword",
                        "Competitor",
                        "Their Rank",
                        "Your Rank",
                        "Volume",
                        "CPC",
                        "Intent",
                        "Content Type",
                        "Priority",
                        "Score",
                        "Business Relevance",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-4 py-3 font-bold"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOpportunities.map(
                      (item) => (
                        <tr
                          key={item.keyword}
                          className="border-b border-slate-100 align-top"
                        >
                          <td className="px-4 py-4">
                            <p className="font-bold text-slate-900">
                              {item.keyword}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {item.suggestedTitle}
                            </p>
                            {item.competitorUrl && (
                              <a
                                href={item.competitorUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-block text-xs font-bold text-violet-600 hover:underline"
                              >
                                View Ranking Page
                              </a>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {item.competitor}
                          </td>

                          <td className="px-4 py-4">
                            {item.competitorPosition ?? "—"}
                          </td>

                          <td className="px-4 py-4">
                            {item.yourPosition ?? "Not in sample"}
                          </td>

                          <td className="px-4 py-4">
                            {formatNumber(
                              item.searchVolume
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {item.cpc === null
                              ? "—"
                              : item.cpc.toFixed(2)}
                          </td>

                          <td className="px-4 py-4 capitalize">
                            {item.intent ?? "Unknown"}
                          </td>

                          <td className="px-4 py-4">
                            {item.contentType}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-lg px-3 py-1 text-xs font-bold ${
                                item.priority === "High"
                                  ? "bg-green-100 text-green-700"
                                  : item.priority === "Medium"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-bold">
                            {item.priorityScore}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-slate-900">
                              {item.relevanceLevel ?? "Unknown"}
                            </span>
                            <p className="mt-1 text-xs text-slate-600">
                              {item.relevanceLevel && item.relevanceLevel !== "Unknown"
                                ? `${item.relevanceScore ?? 0}/100`
                                : "No business context"}
                            </p>
                            {(item.matchedTerms?.length ?? 0) > 0 && (
                              <p className="mt-2 max-w-48 text-xs text-slate-500">
                                Matched: {item.matchedTerms?.join(", ")}
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

                {filteredOpportunities.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No opportunities match this filter.
                  </p>
                )}
              </div>
            </section>

            {result.warnings &&
              result.warnings.length > 0 && (
                <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <h2 className="font-black text-amber-900">
                    Data Limitations
                  </h2>

                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900">
                    {result.warnings.map(
                      (warning) => (
                        <li key={warning}>
                          {warning}
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}
          </>
        )}
      </div>
    </main>
  );
}
