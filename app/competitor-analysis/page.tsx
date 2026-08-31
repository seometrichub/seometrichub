"use client";

import { FormEvent, useState } from "react";

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

type AnalysisResponse = {
  success: boolean;
  yourSite?: PageAnalysis;
  competitors?: PageAnalysis[];
  recommendations?: string[];
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

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
    <main className="min-h-screen bg-[#F8FAFC]">
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
  );
}