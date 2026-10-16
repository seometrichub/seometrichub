
"use client";

import { useState, type FormEvent } from "react";

type BacklinkSummary = {
  totalBacklinks: number;
  referringDomains: number;
  referringMainDomains: number;
};

type Opportunity = {
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

type GapResponse = {
  success: boolean;
  error?: string;
  yourDomain?: string;
  competitors?: string[];
  summaries?: {
    domain: string;
    data: BacklinkSummary | null;
    error: string | null;
  }[];
  opportunities?: Opportunity[];
  totalOpportunities?: number;
  sampleBased?: boolean;
  warnings?: string[];
  quota?: {
    used: number;
    limit: number;
    remaining: number;
    periodEnd: string;
  };
};

export default function BacklinkGapPage() {
  const [yourUrl, setYourUrl] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
  "all" | "high"
>("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GapResponse | null>(
    null
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/backlink-gap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yourUrl,
          competitor1,
          competitor2,
        }),
      });

      const data: GapResponse = await response.json();

      setResult(data);

      if (!response.ok || !data.success) {
        setError(data.error ?? "Analysis failed.");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
            SEOMETRICHUB
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Backlink Gap Analysis
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            Compare backlink sources between your website
            and competitors. Discover sampled referring
            domains that may offer link-building opportunities.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-5 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">
                Your Website
              </span>
              <input
                required
                value={yourUrl}
                onChange={(event) =>
                  setYourUrl(event.target.value)
                }
                placeholder="yourwebsite.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">
                Competitor 1
              </span>
              <input
                required
                value={competitor1}
                onChange={(event) =>
                  setCompetitor1(event.target.value)
                }
                placeholder="competitor.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-bold text-slate-700">
                Competitor 2 (Optional)
              </span>
              <input
                value={competitor2}
                onChange={(event) =>
                  setCompetitor2(event.target.value)
                }
                placeholder="competitor2.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 rounded-xl bg-violet-600 px-7 py-3 font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
          >
            {loading
              ? "Analyzing Backlinks..."
              : "Analyze Backlink Gap"}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {result?.quota && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Monthly Usage
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {result.quota.used} used /{" "}
              {result.quota.limit} limit â€”{" "}
              {result.quota.remaining} remaining
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Currently shares the Competitor Analysis quota.
            </p>
          </section>
        )}

        {result?.success && (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Sampled Gap Opportunities
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {result.totalOpportunities ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Competitors Compared
                </p>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {result.competitors?.length ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">
                  Data Scope
                </p>
                <p className="mt-2 text-xl font-black text-amber-700">
                  Sample Based
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">
                Backlink Comparison
              </h2>





              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3">Backlinks</th>
                      <th className="px-4 py-3">
                        Referring Domains
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.summaries?.map((item) => (
                      <tr
                        key={item.domain}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-semibold">
                          {item.domain}
                        </td>
                        <td className="px-4 py-3">
                          {item.data
                            ? item.data.totalBacklinks.toLocaleString()
                            : "Unavailable"}
                        </td>
                        <td className="px-4 py-3">
                          {item.data
                            ? item.data.referringDomains.toLocaleString()
                            : "Unavailable"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-black text-slate-950">
                Backlink Gap Opportunities
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Domains found linking to competitors but
                absent from your sampled backlink sources.
              </p>

<div className="mt-5 flex flex-wrap items-center gap-3">
  <button
    type="button"
    onClick={() => setPriorityFilter("all")}
    className={`rounded-xl px-4 py-2 text-sm font-bold ${
      priorityFilter === "all"
        ? "bg-violet-600 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    All Opportunities
  </button>

  <button
    type="button"
    onClick={() => setPriorityFilter("high")}
    className={`rounded-xl px-4 py-2 text-sm font-bold ${
      priorityFilter === "high"
        ? "bg-violet-600 text-white"
        : "bg-slate-100 text-slate-700"
    }`}
  >
    High Priority Only
  </button>
</div>


              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">
                        Referring Domain
                      </th>
                      <th className="px-4 py-3">
                        Competitors
                      </th>
                      <th className="px-4 py-3">
                        Backlinks Found
                      </th>
                      <th className="px-4 py-3">
                        Example Source
                      </th>
                      <th className="px-4 py-3">
                        Dofollow
                      </th>

<th className="px-4 py-3">Priority</th>
<th className="px-4 py-3">Quality Score</th>
<th className="px-4 py-3">Source Rank</th>
<th className="px-4 py-3">Spam Score</th>

                    </tr>
                  </thead>

                  <tbody>
                    {result.opportunities
  ?.filter(
    (item) =>
      priorityFilter === "all" ||
      item.priority === "High"
  )
  .map((item) => (
                      <tr
                        key={item.sourceDomain}
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {item.sourceDomain}
                        </td>

                        <td className="px-4 py-3">
                          {item.competitorDomains.join(", ")}
                        </td>

                        <td className="px-4 py-3">
                          {item.backlinksFound}
                        </td>

                        <td className="px-4 py-3">
                          {item.examples[0] ? (
                            <a
                              href={item.examples[0].sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-violet-700 underline"
                            >
                              View Source
                            </a>
                          ) : (
                            "â€”"
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {item.examples[0]?.dofollow === true
                            ? "Yes"
                            : item.examples[0]?.dofollow === false
                              ? "No"
                              : "Unknown"}
                        </td>

<td className="px-4 py-3">
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
      item.priority === "High"
        ? "bg-emerald-50 text-emerald-700"
        : item.priority === "Medium"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-600"
    }`}
  >
    {item.priority ?? "Not scored"}
  </span>
</td>

<td className="px-4 py-3 font-bold">
  {item.qualityScore ?? "â€”"}
</td>

<td className="px-4 py-3">
  {item.averageRank ?? "â€”"}
</td>

<td className="px-4 py-3">
  {item.averageSpamScore === null ||
  item.averageSpamScore === undefined
    ? "Unknown"
    : item.averageSpamScore}
</td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result.opportunities?.length === 0 && (
                <p className="mt-5 text-sm text-slate-500">
                  No gap opportunities were found in the
                  available backlink sample.
                </p>
              )}
            </section>

            {result.warnings &&
              result.warnings.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h2 className="font-bold text-amber-900">
                    Data Limitations
                  </h2>

                  {result.warnings.map((warning, index) => (
                    <p
                      key={index}
                      className="mt-2 text-sm text-amber-800"
                    >
                      {warning}
                    </p>
                  ))}
                </section>
              )}
          </>
        )}
      </div>
    </main>
  );
}
