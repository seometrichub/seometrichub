"use client";
import { FormEvent, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

type PageAnalysis = {
  url: string;
  finalUrl: string;
  title: string;
  titleLength: number;
  description: string;
  descriptionLength: number;
  h1Count: number;
  h2Count: number;
  wordCount: number;
  images: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  https: boolean;
  canonical: boolean;
  viewport: boolean;
  robotsTxt: boolean;
  sitemap: boolean;
  responseTime: number;
  htmlSizeKb: number;
  score: number;
};

type OrganicKeyword = {
  keyword: string;
  position: number | null;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
  estimatedTraffic: number;
  searchIntent: string | null;
  url: string | null;
};

type OrganicCompetitorData = {
  domain: string;
  locationCode: number;
  languageCode: string;
  totalKeywords: number;
  estimatedOrganicTraffic: number;
  keywords: OrganicKeyword[];
  provider: "DataForSEO";
  fetchedAt: string;
};

type OrganicIntelligenceItem = {
  domain: string;
  available: boolean;
  data: OrganicCompetitorData | null;
  error: string | null;
};


type KeywordGapItem = {
  keyword: string;
  competitor: string;
  competitorPosition: number | null;
  yourPosition: number | null;
  searchVolume: number;
  cpc: number | null;
  intent: string | null;
  opportunity: string;
  type: "missing" | "weak";
  relevance?: "High" | "Low";
  priority?: "High" | "Medium" | "Low";
  priorityScore?: number;
  matchedTopics?: string[];
};


type KeywordGapSummary = {
  totalOpportunities: number;
  missingKeywords: number;
  weakKeywords: number;
  sampleBased: boolean;
  yourSiteDataAvailable?: boolean;
};

type AnalysisResponse = {
  success: boolean;
  organicIntelligence?: OrganicIntelligenceItem[];
  keywordGap?: KeywordGapItem[];
keywordGapSummary?: KeywordGapSummary;
  yourSite?: PageAnalysis;
  competitors?: PageAnalysis[];
  recommendations?: string[];
  quota?: {
    used: number;
    limit: number;
    remaining: number;
    periodEnd?: string;
  };
  note?: string;
  error?: string;
  failures?: Array<{
    url: string;
    error: string;
  }>;
};

function BooleanValue({ value }: { value: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        value
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  let style = "bg-red-50 text-red-700";

  if (score >= 80) {
    style = "bg-emerald-50 text-emerald-700";
  } else if (score >= 60) {
    style = "bg-amber-50 text-amber-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${style}`}
    >
      {score}/100
    </span>
  );
}

export default function CompetitorAnalysisPage() {
  const [yourUrl, setYourUrl] = useState("");
  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
const [priorityFilter, setPriorityFilter] = useState<
  "all" | "high"
>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [quota, setQuota] = useState<AnalysisResponse["quota"]>(undefined);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);
    setQuota(undefined);

    try {
      const response = await fetch("/api/competitor-analysis", {
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

      const data = (await response.json()) as AnalysisResponse;
      if (data.quota) {
        setQuota(data.quota);
      }

      if (!response.ok || !data.success) {
        let message =
          data.error || "Unable to complete competitor analysis.";

        if (data.failures?.length) {
          message +=
            " " +
            data.failures
              .map(
                (failure) =>
                  `${failure.url}: ${failure.error}`
              )
              .join(" | ");
        }

        setError(message);
        return;
      }

      setResult(data);
    } catch {
      setError(
        "Unable to connect to the competitor analysis service."
      );
    } finally {
      setLoading(false);
    }
  }

  const websites = result?.yourSite
    ? [
        {
          label: "Your Website",
          data: result.yourSite,
        },
        ...(result.competitors || []).map((competitor, index) => ({
          label: `Competitor ${index + 1}`,
          data: competitor,
        })),
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <main>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
              Competitor Intelligence
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Competitor SEO Analysis
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Compare your website against competitors using real,
              directly observable on-page SEO and technical signals.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="yourUrl"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Your Website URL
                </label>

                <input
                  id="yourUrl"
                  type="text"
                  required
                  value={yourUrl}
                  onChange={(event) =>
                    setYourUrl(event.target.value)
                  }
                  placeholder="example.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="competitor1"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Competitor 1 URL
                </label>

                <input
                  id="competitor1"
                  type="text"
                  required
                  value={competitor1}
                  onChange={(event) =>
                    setCompetitor1(event.target.value)
                  }
                  placeholder="competitor.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="competitor2"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Competitor 2 URL
                  <span className="ml-2 font-medium text-slate-400">
                    Optional
                  </span>
                </label>

                <input
                  id="competitor2"
                  type="text"
                  value={competitor2}
                  onChange={(event) =>
                    setCompetitor2(event.target.value)
                  }
                  placeholder="anothercompetitor.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Analyzing Competitors..."
                : "Analyze Competitors"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="font-bold text-red-800">
                Analysis failed
              </p>
              <p className="mt-1 text-sm leading-6 text-red-700">
                {error}
              </p>
            </div>
          )}
        </div>

{/* COMPETITOR ON-PAGE ANALYSIS WARNINGS */}
{result?.success &&
  result.failures &&
  result.failures.length > 0 && (
    <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <h2 className="text-lg font-black text-amber-950">
        Some Competitor Pages Could Not Be Analyzed
      </h2>

      <p className="mt-2 text-sm text-amber-900">
        These websites did not allow our on-page SEO scanner
        to access their HTML. Organic keyword intelligence
        may still be available through DataForSEO.
      </p>

      <div className="mt-4 space-y-3">
        {result.failures.map((failure, index) => (
          <div
            key={`${failure.url}-${index}`}
            className="rounded-xl border border-amber-200 bg-white p-4"
          >
            <p className="break-all text-sm font-bold text-slate-900">
              {failure.url}
            </p>

            <p className="mt-1 text-sm text-amber-800">
              {failure.error}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              On-page SEO comparison unavailable for this
              website. No SEO score has been estimated.
            </p>
          </div>
        ))}
      </div>
    </section>
  )}

{/* ORGANIC COMPETITOR INTELLIGENCE */}
{result?.success && result.organicIntelligence && (
  <section className="mt-10 space-y-6">
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
        DataForSEO Organic Intelligence
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Organic Competitor Intelligence
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Real organic keyword rankings, search volumes, CPC and
        estimated traffic for India (English).
      </p>
    </div>

    {result.organicIntelligence.map((item, index) => (
      <div
        key={`${item.domain}-${index}`}
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-200 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-violet-700">
            {index === 0
              ? "Your Website"
              : `Competitor ${index}`}
          </p>
          <h3 className="mt-2 break-all text-xl font-black text-slate-950">
            {item.domain}
          </h3>

          {!item.available || !item.data ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Organic keyword data is currently unavailable for
              this website.
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-bold text-slate-500">
                    Total Ranking Keywords
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {item.data.totalKeywords.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-5">
                  <p className="text-xs font-bold text-violet-700">
                    Sample Estimated Traffic
                  </p>
                  <p className="mt-2 text-2xl font-black text-violet-950">
                    {item.data.estimatedOrganicTraffic.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-5">
                  <p className="text-xs font-bold text-blue-700">
                    Keywords Retrieved
                  </p>
                  <p className="mt-2 text-2xl font-black text-blue-950">
                    {item.data.keywords.length}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {item.available && item.data && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Keyword</th>
                  <th className="px-5 py-4">Position</th>
                  <th className="px-5 py-4">Volume</th>
                  <th className="px-5 py-4">CPC</th>
                  <th className="px-5 py-4">Intent</th>
                  <th className="px-5 py-4">ETV</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {item.data.keywords.map((keyword, keywordIndex) => (
                  <tr
                    key={`${keyword.keyword}-${keywordIndex}`}
                    className="hover:bg-slate-50"
                  >
                    <td className="max-w-xs px-5 py-4 font-semibold text-slate-900">
                      {keyword.url ? (
                        <a
                          href={keyword.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-700 hover:underline"
                        >
                          {keyword.keyword}
                        </a>
                      ) : (
                        keyword.keyword
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {keyword.position ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {keyword.searchVolume.toLocaleString("en-IN")}
                    </td>

                    <td className="px-5 py-4">
                      {keyword.cpc === null
                        ? "—"
                        : `$${keyword.cpc.toFixed(2)}`}
                    </td>

                    <td className="px-5 py-4 capitalize">
                      {keyword.searchIntent ?? "—"}
                    </td>

                    <td className="px-5 py-4">
                      {keyword.estimatedTraffic.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {item.data.keywords.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                No ranking keywords were returned for this domain.
              </p>
            )}
          </div>
        )}
      </div>
    ))}

    <p className="text-xs leading-5 text-slate-500">
      Source: DataForSEO. Search volumes, CPC and ranking positions
      are third-party metrics. Sample Estimated Traffic is the sum
      of ETV for the retrieved keywords only, not total domain traffic.
    </p>
  </section>
)}

{/* KEYWORD GAP ANALYSIS */}
{result?.success && result.keywordGapSummary && (
  <section className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 p-6 sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
        DataForSEO Keyword Gap
      </p>

      <h2 className="mt-2 text-2xl font-black text-slate-950">
        Keyword Gap Opportunities
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Compare your sampled ranking keywords with competitors
        for India (English).
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Opportunities",
            value: result.keywordGapSummary.totalOpportunities,
          },
          {
            label: "Not in Your Sample",
            value: result.keywordGapSummary.missingKeywords,
          },
          {
            label: "Weaker Rankings",
            value: result.keywordGapSummary.weakKeywords,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-slate-50 p-5"
          >
            <p className="text-xs font-bold text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {stat.value.toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      {result.keywordGapSummary.yourSiteDataAvailable ===
        false && (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your website organic keyword data is unavailable.
          These opportunities cannot be fully verified.
        </p>
      )}
    </div>

    {result.keywordGap && result.keywordGap.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Keyword</th>
              <th className="px-5 py-4">Competitor</th>
              <th className="px-5 py-4">Competitor Rank</th>
              <th className="px-5 py-4">Your Rank</th>
              <th className="px-5 py-4">Volume</th>
              <th className="px-5 py-4">CPC</th>
              <th className="px-5 py-4">Intent</th>
              <th className="px-5 py-4">Opportunity</th>
              <th className="px-5 py-4">Relevance</th>
<th className="px-5 py-4">Priority</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {result.keywordGap
  .filter(
    (item) =>
      priorityFilter === "all" ||
      item.priority === "High"
  )
  .map((item, index) => (
              <tr
                key={`${item.competitor}-${item.keyword}-${index}`}
                className="hover:bg-slate-50"
              >
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {item.keyword}
                </td>

                <td className="break-all px-5 py-4 text-slate-700">
                  {item.competitor}
                </td>

                <td className="px-5 py-4">
                  {item.competitorPosition ?? "—"}
                </td>

                <td className="px-5 py-4">
                  {item.yourPosition ?? "Not in sample"}
                </td>

                <td className="px-5 py-4">
                  {item.searchVolume.toLocaleString("en-IN")}
                </td>

                <td className="px-5 py-4">
                  {item.cpc === null
                    ? "—"
                    : `$${item.cpc.toFixed(2)}`}
                </td>

                <td className="px-5 py-4 capitalize">
                  {item.intent ?? "—"}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                      item.type === "weak"
                        ? "bg-amber-50 text-amber-800"
                        : "bg-violet-50 text-violet-800"
                    }`}
                  >
                    {item.type === "weak"
                      ? "Improve ranking"
                      : "Not in sample"}
                  </span>

<td className="px-5 py-4">
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
      item.relevance === "High"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600"
    }`}
  >
    {item.relevance ?? "Not scored"}
  </span>
</td>

<td className="px-5 py-4">
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

                </td>
              </tr>
            ))}

<div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-6 py-4">
  <span className="text-sm font-bold text-slate-600">
    Filter Keywords:
  </span>

  <button
    type="button"
    onClick={() => setPriorityFilter("all")}
    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
      priorityFilter === "all"
        ? "bg-violet-600 text-white"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`}
  >
    All Keywords
  </button>

  <button
    type="button"
    onClick={() => setPriorityFilter("high")}
    className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
      priorityFilter === "high"
        ? "bg-violet-600 text-white"
        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
    }`}
  >
    High Priority Only
  </button>
</div>

          </tbody>
        </table>
      </div>
    ) : (

      <p className="p-6 text-sm text-slate-600">
        No keyword gap opportunities were identified
        in the retrieved sample.
      </p>
    )}

    <p className="border-t border-slate-100 px-6 py-4 text-xs leading-5 text-slate-500">
      Source: DataForSEO. Each domain contributes up to
      20 retrieved keywords. "Not in sample" does not
      necessarily mean your website does not rank for
      that keyword.
    </p>
  </section>
)}


          {/* MONTHLY USAGE */}
          {quota && (
            <div className="mt-10 rounded-3xl border border-violet-200 bg-violet-50 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                    Monthly Usage
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Competitor Analysis Usage
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Your monthly plan usage for competitor analysis.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-slate-950">
                      {quota.used}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Used
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-slate-950">
                      {quota.limit}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Limit
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-2xl font-black text-violet-700">
                      {quota.remaining}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Remaining
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (quota.used / Math.max(quota.limit, 1)) * 100
                    )}%`,
                  }}
                />
              </div>

              {quota.remaining > 0 ? (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {quota.remaining} analyses remaining this month
                </p>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    Monthly limit reached
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    You have used all competitor analyses included in your current plan.
                    Upgrade your plan or wait until your monthly usage resets.
                  </p>
                </div>
              )}
            </div>
          )}

          {result?.success && websites.length > 0 && (
            <div className="mt-10 space-y-8">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {websites.map((website) => (
                <article
                  key={`${website.label}-${website.data.finalUrl}`}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">
                        {website.label}
                      </p>

                      <h2 className="mt-2 break-words text-lg font-black text-slate-950">
                        {website.data.finalUrl}
                      </h2>
                    </div>

                    <ScoreBadge score={website.data.score} />
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Page Title
                    </p>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                      {website.data.title || "No title detected"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {website.data.titleLength} characters
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Meta Description
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {website.data.description ||
                        "No meta description detected"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {website.data.descriptionLength} characters
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-black text-slate-950">
                  SEO Comparison
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Side-by-side comparison of measurable on-page
                  signals.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 font-black text-slate-700">
                        Metric
                      </th>

                      {websites.map((website) => (
                        <th
                          key={website.label}
                          className="px-5 py-4 font-black text-slate-700"
                        >
                          {website.label}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        SEO Score
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-score`}
                          className="px-5 py-4"
                        >
                          <ScoreBadge score={website.data.score} />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Word Count
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-words`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.wordCount.toLocaleString()}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        H1 Headings
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-h1`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.h1Count}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        H2 Headings
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-h2`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.h2Count}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Internal Links
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-internal`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.internalLinks}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        External Links
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-external`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.externalLinks}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Images
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-images`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.images}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Missing Image ALT
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-alt`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.imagesWithoutAlt}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        HTTPS
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-https`}
                          className="px-5 py-4"
                        >
                          <BooleanValue value={website.data.https} />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Canonical
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-canonical`}
                          className="px-5 py-4"
                        >
                          <BooleanValue
                            value={website.data.canonical}
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Mobile Viewport
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-viewport`}
                          className="px-5 py-4"
                        >
                          <BooleanValue
                            value={website.data.viewport}
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Robots.txt
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-robots`}
                          className="px-5 py-4"
                        >
                          <BooleanValue
                            value={website.data.robotsTxt}
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        XML Sitemap
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-sitemap`}
                          className="px-5 py-4"
                        >
                          <BooleanValue
                            value={website.data.sitemap}
                          />
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        Response Time
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-response`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.responseTime} ms
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="px-5 py-4 font-bold text-slate-600">
                        HTML Size
                      </td>
                      {websites.map((website) => (
                        <td
                          key={`${website.label}-html`}
                          className="px-5 py-4 font-bold text-slate-900"
                        >
                          {website.data.htmlSizeKb} KB
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-violet-200 bg-violet-50 p-6 sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                Competitive Opportunities
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                What You Should Improve
              </h2>

              <div className="mt-6 space-y-4">
                {result.recommendations?.map(
                  (recommendation, index) => (
                    <div
                      key={`${index}-${recommendation}`}
                      className="flex gap-4 rounded-2xl border border-violet-100 bg-white p-5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                        {index + 1}
                      </div>

                      <p className="text-sm leading-7 text-slate-700">
                        {recommendation}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {result.note && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm leading-6 text-slate-500">
                  <span className="font-bold text-slate-700">
                    Data note:
                  </span>{" "}
                  {result.note}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
      </main>
      <Footer />
    </div>
  );
}