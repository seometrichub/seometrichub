"use client";

import { FormEvent, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

type BacklinkItem = {
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

type BacklinkResult = {
  success: boolean;
  url?: string;
  domain?: string;
  onPageDomain?: string;
  backlinkProfileAvailable?: boolean;
  backlinkMessage?: string;
  backlinkSummary?: {
    provider: string;
    target: string;
    scope: string;
    includeSubdomains: boolean;
    totalBacklinks: number;
    referringDomains: number;
    referringMainDomains: number;
    fetchedAt: string;
    referringPages?: number;
    nofollowReferringPages?: number;
    nofollowReferringDomains?: number;
    backlinkSpamScore?: number;
    brokenBacklinks?: number;
  } | null;
  backlinkDetailsAvailable?: boolean;
  backlinkDetailsMessage?: string;
  backlinkDetails?: {
    totalCount: number;
    items: BacklinkItem[];
  } | null;
  backlinkMetrics?: {
    scope: string;
    fetchedCount: number;
    totalCount: number;
    dofollowCount: number;
    nofollowCount: number;
    unknownFollowCount: number;
    newBacklinks: number;
    lostBacklinks: number;
    reviewNeededCount: number;
  } | null;
  quota?: {
    used: number;
    limit: number;
    remaining: number;
    periodEnd?: string;
  };
  linkAnalysis?: {
    totalLinks: number;
    internalLinks: number;
    externalLinks: number;
    uniqueExternalDomains: number;
    followExternalLinks: number;
    nofollowExternalLinks: number;
  };
  externalDomains?: string[];
  error?: string;
};

type FollowFilter = "all" | "dofollow" | "nofollow" | "review" | "new" | "lost";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  // DataForSEO uses `YYYY-MM-DD HH:mm:ss +00:00` for timestamps.
  const normalized = value.replace(" ", "T").replace(/ ([+-]\d{2}:\d{2})$/, "$1");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function reviewNeeded(item: BacklinkItem): boolean {
  return (item.spamScore !== null && item.spamScore >= 50) ||
    (item.externalLinks !== null && item.externalLinks >= 1000);
}

function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function MetricCard({ title, value, note }: { title: string; value: number | string; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>
      {note && <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>}
    </div>
  );
}

export default function BacklinksPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<BacklinkResult | null>(null);
  const [quota, setQuota] = useState<BacklinkResult["quota"]>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FollowFilter>("all");

  const items = result?.backlinkDetails?.items ?? [];
  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !needle || [item.sourceDomain, item.sourceUrl, item.targetUrl, item.anchor ?? ""]
        .some((text) => text.toLowerCase().includes(needle));
      const matchesFilter = filter === "all" ||
        (filter === "dofollow" && item.dofollow === true) ||
        (filter === "nofollow" && item.dofollow === false) ||
        (filter === "review" && reviewNeeded(item)) ||
        (filter === "new" && item.isNew) ||
        (filter === "lost" && item.isLost);
      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) {
      setError("Please enter a website URL.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setQuota(undefined);
    setSearch("");
    setFilter("all");
    try {
      const response = await fetch("/api/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data: BacklinkResult = await response.json();
      if (data.quota) setQuota(data.quota);
      if (!response.ok || !data.success) {
        setError(data.error || "Unable to analyze this website.");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze this website.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />
      <main className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <header className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">SEOMETRICHUB</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">Backlink Intelligence</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Explore real incoming backlinks, anchor text, follow attributes and review signals, alongside on-page link analysis.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
            <input type="text" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="Enter website URL - example.com" aria-label="Website URL" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
            <button type="submit" disabled={loading} className="rounded-xl bg-[#0F172A] px-6 py-3 font-bold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Analyzing..." : "Analyze Backlinks"}
            </button>
          </form>

          {error && <div role="alert" className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

          {quota && (
            <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Monthly Usage</p>
                  <h2 className="mt-2 text-2xl font-black">Backlink Analysis Usage</h2>
                  <p className="mt-2 text-sm text-slate-600">Your monthly plan usage for backlink analysis.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([ ["Used", quota.used], ["Limit", quota.limit], ["Remaining", quota.remaining] ] as const).map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-white px-4 py-4 text-center shadow-sm">
                      <p className="text-2xl font-black">{value}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-blue-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, (quota.used / Math.max(quota.limit, 1)) * 100))}%` }} />
              </div>
              <p className="mt-3 text-xs font-semibold text-slate-600">
                {quota.remaining > 0 ? `${quota.remaining} analyses remaining this month` : "Monthly limit reached. Upgrade or wait for your plan to reset."}
              </p>
            </section>
          )}

          {result && (
            <>
              <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-2xl font-black">Backlink Profile</h2>
                <p className="mt-2 break-all text-sm text-slate-600">Target domain: {result.domain}</p>
                {result.backlinkSummary ? (
                  <>
                    <p className="mt-2 text-sm text-slate-600">DataForSEO backlink index. Subdomains included.</p>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricCard title="Total Backlinks" value={result.backlinkSummary.totalBacklinks} />
                      <MetricCard title="Referring Domains" value={result.backlinkSummary.referringDomains} />
                      <MetricCard title="Referring Main Domains" value={result.backlinkSummary.referringMainDomains} />
                      {typeof result.backlinkSummary.backlinkSpamScore === "number" && <MetricCard title="Provider Spam Score" value={result.backlinkSummary.backlinkSpamScore} note="Provider metric; not a Google penalty score" />}
                      {typeof result.backlinkSummary.brokenBacklinks === "number" && <MetricCard title="Broken Backlinks" value={result.backlinkSummary.brokenBacklinks} />}
                    </div>
                    <p className="mt-4 text-xs text-slate-500">Referring Domains may count subdomains separately; Referring Main Domains groups by main domain.</p>
                  </>
                ) : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{result.backlinkMessage || "Backlink summary is unavailable."}</p>}
              </section>

              <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black">Incoming Backlink Details</h2>
                    <p className="mt-2 text-sm text-slate-600">Actual source pages and anchor text returned by DataForSEO.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Up to 100 records per analysis</span>
                </div>

                {result.backlinkDetails && result.backlinkMetrics ? (
                  <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <MetricCard title="Fetched Backlinks" value={result.backlinkMetrics.fetchedCount} note={`Provider total reported: ${result.backlinkMetrics.totalCount.toLocaleString("en-IN")}`} />
                      <MetricCard title="Dofollow (Fetched)" value={result.backlinkMetrics.dofollowCount} />
                      <MetricCard title="Nofollow (Fetched)" value={result.backlinkMetrics.nofollowCount} />
                      <MetricCard title="New (Fetched)" value={result.backlinkMetrics.newBacklinks} />
                      <MetricCard title="Lost (Fetched)" value={result.backlinkMetrics.lostBacklinks} />
                      <MetricCard title="Review Needed (Fetched)" value={result.backlinkMetrics.reviewNeededCount} note="Heuristic flags, not proof of harmful links" />
                    </div>
                    {result.backlinkMetrics.unknownFollowCount > 0 && <p className="mt-4 text-sm text-amber-800">{result.backlinkMetrics.unknownFollowCount} records have unknown follow status.</p>}
                    <p className="mt-4 text-xs leading-5 text-slate-500">These counts describe only the fetched records, not necessarily all backlinks. New/lost statuses are provider flags, not a complete historical trend.</p>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search domain, URL or anchor text" aria-label="Search backlinks" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500" />
                      <select value={filter} onChange={(event) => setFilter(event.target.value as FollowFilter)} aria-label="Filter backlinks" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                        <option value="all">All backlinks</option>
                        <option value="dofollow">Dofollow</option>
                        <option value="nofollow">Nofollow</option>
                        <option value="review">Review needed</option>
                        <option value="new">New</option>
                        <option value="lost">Lost</option>
                      </select>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Showing {filteredItems.length} of {items.length} fetched records</p>
                    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                          <tr>
                            <th scope="col" className="px-4 py-4">Source / Target</th>
                            <th scope="col" className="px-4 py-4">Anchor Text</th>
                            <th scope="col" className="px-4 py-4">Follow</th>
                            <th scope="col" className="px-4 py-4">Spam</th>
                            <th scope="col" className="px-4 py-4">Status</th>
                            <th scope="col" className="px-4 py-4">Seen</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredItems.map((item, index) => (
                            <tr key={`${item.sourceUrl}-${item.targetUrl}-${index}`} className="align-top hover:bg-slate-50">
                              <td className="max-w-[280px] px-4 py-4">
                                <p className="font-bold text-slate-900">{item.sourceDomain}</p>
                                {safeExternalUrl(item.sourceUrl) ? <a href={safeExternalUrl(item.sourceUrl)} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-xs text-blue-700 hover:underline">{item.sourceUrl}</a> : <p className="mt-1 break-all text-xs">{item.sourceUrl}</p>}
                                <p className="mt-2 break-all text-xs text-slate-500">To: {item.targetUrl}</p>
                              </td>
                              <td className="max-w-[250px] break-words px-4 py-4 text-slate-700">{item.anchor || "(No anchor text)"}</td>
                              <td className="px-4 py-4 font-semibold">{item.dofollow === null ? "Unknown" : item.dofollow ? "Dofollow" : "Nofollow"}</td>
                              <td className="px-4 py-4">
                                <p className="font-bold">{item.spamScore ?? "—"}</p>
                                {reviewNeeded(item) && <span className="mt-1 inline-block rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">Review needed</span>}
                              </td>
                              <td className="px-4 py-4 text-xs font-semibold text-slate-700">{item.isNew ? "New" : item.isLost ? "Lost" : "Existing"}</td>
                              <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">First: {formatDate(item.firstSeen)}<p className="mt-1">Last: {formatDate(item.lastSeen)}</p></td>
                            </tr>
                          ))}
                          {filteredItems.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No matching backlinks in the fetched records.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-4 text-xs leading-5 text-slate-500">Review flags use spam score ≥ 50 or ≥ 1,000 outgoing links on the source page. They are indicators for manual investigation, not automatic disavow recommendations.</p>
                  </>
                ) : <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{result.backlinkDetailsMessage || "Detailed backlink data is unavailable."}</p>}
              </section>

              {result.linkAnalysis && (
                <section className="mt-10">
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <h2 className="font-bold text-blue-950">On-page Link Analysis</h2>
                    <p className="mt-2 text-sm leading-6 text-blue-900">These are outgoing links on the analyzed webpage, not incoming backlinks.</p>
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <MetricCard title="Total Links" value={result.linkAnalysis.totalLinks} />
                    <MetricCard title="Internal Links" value={result.linkAnalysis.internalLinks} />
                    <MetricCard title="External Links" value={result.linkAnalysis.externalLinks} />
                    <MetricCard title="External Domains" value={result.linkAnalysis.uniqueExternalDomains} />
                    <MetricCard title="Follow External" value={result.linkAnalysis.followExternalLinks} />
                    <MetricCard title="Nofollow External" value={result.linkAnalysis.nofollowExternalLinks} />
                  </div>
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-500">Analyzed website</p>
                    <p className="mt-1 break-all text-lg font-bold">{result.onPageDomain || result.domain}</p>
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <h2 className="text-xl font-black">External Domains</h2>
                      {result.externalDomains?.length ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {result.externalDomains.map((domain) => <span key={domain} className="break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{domain}</span>)}
                        </div>
                      ) : <p className="mt-3 text-sm text-slate-500">No external domains were found on this page.</p>}
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black">About backlink data</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Incoming backlink data is provided by DataForSEO when available. On-page analysis describes links on the requested webpage. Unavailable backlink data does not mean the website has zero backlinks. Provider spam scores and review flags are not Google penalty assessments.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
