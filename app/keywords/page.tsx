"use client";

import { FormEvent, useMemo, useState } from "react";

type KeywordItem = {
  rank: number;
  keyword: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  competition: number | null;
  competitionLevel: string | null;
  intent: string;
  coreKeyword: string;
  isLongTail: boolean;
};

type KeywordResponse = {
  provider: string;
  metricsAvailable: boolean;
  seedKeyword: string;
  location: string;
  languageCode: string;
  totalKeywords: number;
  keywords: KeywordItem[];
  relatedKeywords: KeywordItem[];
  longTailKeywords: KeywordItem[];
  note?: string;
};

type Tab = "all" | "related" | "longtail";

function formatNumber(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

function formatCpc(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `₹${value.toFixed(2)}`;
}

function getIntentClasses(intent: string) {
  switch (intent) {
    case "Commercial":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "Transactional":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "Navigational":
      return "border-purple-200 bg-purple-50 text-purple-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getDifficultyClasses(value: number | null) {
  if (value === null) {
    return "text-slate-400";
  }

  if (value <= 30) {
    return "text-emerald-600";
  }

  if (value <= 60) {
    return "text-orange-500";
  }

  return "text-red-600";
}

export default function KeywordsPage() {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("India");
  const [languageCode, setLanguageCode] = useState("en");

  const [results, setResults] = useState<KeywordResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeKeywords = useMemo(() => {
    if (!results) {
      return [];
    }

    if (activeTab === "related") {
      return results.relatedKeywords;
    }

    if (activeTab === "longtail") {
      return results.longTailKeywords;
    }

    return results.keywords;
  }, [activeTab, results]);

  const filteredKeywords = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return activeKeywords;
    }

    return activeKeywords.filter((item) =>
      item.keyword.toLowerCase().includes(value),
    );
  }, [activeKeywords, search]);

  const handleResearch = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
      setError("Please enter a keyword.");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);
    setSearch("");
    setActiveTab("all");

    try {
      const response = await fetch("/api/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: trimmedKeyword,
          location,
          languageCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Unable to complete keyword research.",
        );
      }

      setResults(data as KeywordResponse);
    } catch (err) {
      console.error("Keyword research failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete keyword research.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <a
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F172A] shadow-sm">
              <span className="text-lg font-black text-white">
                S
              </span>
            </div>

            <div className="text-xl font-black tracking-tight text-[#0F172A]">
              SEOMETRIC
              <span className="text-[#F97316]">
                HUB
              </span>
            </div>
          </a>

          <a
            href="/audit"
            className="hidden rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0F172A] transition hover:border-[#F97316] hover:text-[#F97316] sm:inline-flex"
          >
            SEO Audit
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-orange-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-5 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />

            <span className="text-xs font-black uppercase tracking-[0.18em] text-[#F97316]">
              Keyword Research
            </span>
          </div>

          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-black leading-tight tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Find the right keywords to{" "}
            <span className="text-[#F97316]">
              grow your business
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#64748B] sm:text-lg">
            Discover keyword ideas, related searches, long-tail opportunities
            and search intent from a single seed keyword.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleResearch}
            className="mx-auto mt-10 max-w-4xl"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={keyword}
                    onChange={(event) =>
                      setKeyword(event.target.value)
                    }
                    placeholder="Enter a seed keyword..."
                    className="h-14 w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm font-semibold text-[#0F172A] outline-none transition placeholder:text-slate-400 focus:border-[#F97316] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                <select
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-orange-100 lg:w-40"
                >
                  <option value="India">
                    India
                  </option>

                  <option value="United States">
                    United States
                  </option>

                  <option value="United Kingdom">
                    United Kingdom
                  </option>

                  <option value="Australia">
                    Australia
                  </option>
                </select>

                <select
                  value={languageCode}
                  onChange={(event) =>
                    setLanguageCode(event.target.value)
                  }
                  className="h-14 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-[#0F172A] outline-none focus:border-[#F97316] focus:ring-4 focus:ring-orange-100 lg:w-36"
                >
                  <option value="en">
                    English
                  </option>

                  <option value="te">
                    Telugu
                  </option>

                  <option value="hi">
                    Hindi
                  </option>
                </select>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-14 rounded-xl bg-[#F97316] px-7 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Researching..." : "Research Keywords"}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {results && (
        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Total Keywords
              </p>

              <p className="mt-3 text-4xl font-black text-[#0F172A]">
                {results.totalKeywords}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Keyword opportunities discovered
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Related Keywords
              </p>

              <p className="mt-3 text-4xl font-black text-[#0F172A]">
                {results.relatedKeywords.length}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Closely related search ideas
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Long-tail Keywords
              </p>

              <p className="mt-3 text-4xl font-black text-[#0F172A]">
                {results.longTailKeywords.length}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Specific keyword opportunities
              </p>
            </div>
          </div>

          {/* Metrics Notice */}
          {!results.metricsAvailable && (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 text-xl">
                  ℹ️
                </div>

                <div>
                  <p className="font-black text-orange-900">
                    Keyword metrics are currently unavailable
                  </p>

                  <p className="mt-1 text-sm leading-6 text-orange-800">
                    Keyword ideas and search intent are available now.
                    Search volume, keyword difficulty and CPC will appear
                    when a keyword metrics provider is connected.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table Controls */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-[#0F172A]">
                    Keyword Opportunities
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Seed keyword:{" "}
                    <span className="font-bold text-[#0F172A]">
                      {results.seedKeyword}
                    </span>
                  </p>
                </div>

                <div className="relative w-full lg:w-80">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Filter keywords..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#F97316] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                    activeTab === "all"
                      ? "bg-[#0F172A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({results.keywords.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("related")}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                    activeTab === "related"
                      ? "bg-[#0F172A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Related ({results.relatedKeywords.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("longtail")}
                  className={`rounded-xl px-4 py-2.5 text-sm font-black transition ${
                    activeTab === "longtail"
                      ? "bg-[#0F172A] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Long-tail ({results.longTailKeywords.length})
                </button>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Keyword
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Volume
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Difficulty
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      CPC
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Intent
                    </th>

                    <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-500">
                      Type
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredKeywords.map((item) => (
                    <tr
                      key={`${item.rank}-${item.keyword}`}
                      className="border-b border-slate-100 transition hover:bg-orange-50/30"
                    >
                      <td className="px-5 py-4 text-sm font-bold text-slate-400">
                        {item.rank}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-[#0F172A]">
                          {item.keyword}
                        </div>

                        {item.keyword ===
                          results.seedKeyword.toLowerCase() && (
                          <span className="mt-1 inline-flex rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase text-orange-700">
                            Seed
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        {formatNumber(item.searchVolume)}
                      </td>

                      <td
                        className={`px-5 py-4 text-sm font-black ${getDifficultyClasses(
                          item.keywordDifficulty,
                        )}`}
                      >
                        {formatNumber(item.keywordDifficulty)}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-slate-600">
                        {formatCpc(item.cpc)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getIntentClasses(
                            item.intent,
                          )}`}
                        >
                          {item.intent}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-500">
                          {item.isLongTail
                            ? "Long-tail"
                            : "Related"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredKeywords.map((item) => (
                <div
                  key={`${item.rank}-${item.keyword}`}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-black leading-6 text-[#0F172A]">
                        {item.keyword}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${getIntentClasses(
                            item.intent,
                          )}`}
                        >
                          {item.intent}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                          {item.isLongTail
                            ? "Long-tail"
                            : "Related"}
                        </span>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-black text-slate-400">
                      #{item.rank}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Volume
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-700">
                        {formatNumber(item.searchVolume)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        Difficulty
                      </p>

                      <p
                        className={`mt-1 text-sm font-black ${getDifficultyClasses(
                          item.keywordDifficulty,
                        )}`}
                      >
                        {formatNumber(item.keywordDifficulty)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase text-slate-400">
                        CPC
                      </p>

                      <p className="mt-1 text-sm font-black text-slate-700">
                        {formatCpc(item.cpc)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredKeywords.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="text-4xl">
                  🔎
                </div>

                <h3 className="mt-4 text-lg font-black text-[#0F172A]">
                  No keywords found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try a different search term.
                </p>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center">
            <p className="text-xs leading-6 text-slate-400">
              Keyword ideas are generated from search suggestions and
              SEOMETRICHUB keyword patterns. Metric values are not estimated
              or fabricated.
            </p>
          </div>
        </section>
      )}

      {/* Empty State */}
      {!results && !loading && !error && (
        <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-100 text-3xl">
            🔑
          </div>

          <h2 className="mt-6 text-2xl font-black text-[#0F172A]">
            Start your keyword research
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            Enter a keyword above to discover related searches,
            long-tail opportunities and search intent.
          </p>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="mx-auto max-w-5xl px-5 py-20 text-center sm:px-6 lg:px-8">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F97316]" />

          <h2 className="mt-6 text-xl font-black text-[#0F172A]">
            Researching keywords...
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Discovering keyword opportunities for your seed keyword.
          </p>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-slate-400">
            © 2026 SEOMETRICHUB. Smarter SEO. Better growth.
          </p>
        </div>
      </footer>
    </main>
  );
}