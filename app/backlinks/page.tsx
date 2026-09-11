"use client";

import { FormEvent, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/sections/Footer";

type BacklinkResult = {
  success: boolean;
  url?: string;
  domain?: string;
  backlinkProfileAvailable?: boolean;
  backlinkMessage?: string;

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

export default function BacklinksPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<BacklinkResult | null>(null);
  const [quota, setQuota] =
    useState<BacklinkResult["quota"]>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    try {
      const response = await fetch("/api/backlinks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data: BacklinkResult = await response.json();

      if (data.quota) {
        setQuota(data.quota);
      }

      if (!response.ok || !data.success) {
        setError(
          data.error || "Unable to analyze this website."
        );
        return;
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze this website."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Navbar />

      <main className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
              SEOMETRICHUB
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
              Backlink & Link Analysis
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Analyze internal links, external links, follow links,
              nofollow links and external domains found on a webpage.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
          >
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Enter website URL — example.com"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0F172A] px-6 py-3 font-bold text-white transition hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing..." : "Analyze Links"}
            </button>
          </form>

          {error && (
            <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* MONTHLY USAGE */}
          {quota && (
            <div className="mx-auto mt-8 max-w-3xl rounded-3xl border border-blue-200 bg-blue-50 p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                    Monthly Usage
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Backlink Analysis Usage
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Your monthly plan usage for backlink analysis.
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
                    <p className="text-2xl font-black text-blue-700">
                      {quota.remaining}
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Remaining
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 h-3 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (quota.used /
                        Math.max(quota.limit, 1)) *
                        100
                    )}%`,
                  }}
                />
              </div>

              {quota.remaining > 0 ? (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {quota.remaining === 1
                    ? "1 analysis remaining this month"
                    : `${quota.remaining} analyses remaining this month`}
                </p>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-900">
                    Monthly limit reached
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    You have used all backlink analyses included in your
                    current plan. Upgrade your plan or wait until your
                    monthly usage resets.
                  </p>
                </div>
              )}
            </div>
          )}

          {result?.linkAnalysis && (
            <div className="mt-12">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <p className="font-bold text-blue-950">
                  On-page Link Analysis
                </p>

                <p className="mt-2 text-sm leading-6 text-blue-900">
                  {result.backlinkMessage}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  title="Total Links"
                  value={result.linkAnalysis.totalLinks}
                />

                <MetricCard
                  title="Internal Links"
                  value={result.linkAnalysis.internalLinks}
                />

                <MetricCard
                  title="External Links"
                  value={result.linkAnalysis.externalLinks}
                />

                <MetricCard
                  title="External Domains"
                  value={result.linkAnalysis.uniqueExternalDomains}
                />

                <MetricCard
                  title="Follow External"
                  value={result.linkAnalysis.followExternalLinks}
                />

                <MetricCard
                  title="Nofollow External"
                  value={result.linkAnalysis.nofollowExternalLinks}
                />
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Analyzed website
                  </p>

                  <p className="mt-1 break-all text-lg font-bold">
                    {result.domain}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h2 className="text-xl font-black">
                    External Domains
                  </h2>

                  {result.externalDomains &&
                  result.externalDomains.length > 0 ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {result.externalDomains.map((domain) => (
                        <span
                          key={domain}
                          className="block break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                          {domain}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      No external domains were found on this page.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-black">
              About backlink data
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              This free analysis does not estimate or fabricate backlink
              counts. True backlinks and referring-domain totals require
              access to an external web-scale backlink index.
              SEOMETRICHUB currently analyzes links present on the
              requested webpage.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black">
        {value.toLocaleString()}
      </p>
    </div>
  );
}