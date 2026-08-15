"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";


type BacklinkData = {
  available: boolean;
  backlinks: number | null;
  referringDomains: number | null;
  dofollow: number | null;
  nofollow: number | null;
  message: string;
};

type Recommendation = {
  type: "success" | "warning" | "error";
  title: string;
  description: string;
  recommendedTitle?: string;
  recommendedMetaDescription?: string;
};
type SearchConsoleQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type SearchConsoleData = {
  success: boolean;
  siteUrl: string;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
  summary: {
    clicks: number;
    impressions: number;
    averageCtr: number;
    averagePosition: number;
  };
  queries: SearchConsoleQuery[];
};

type AuditResult = {
  success: boolean;
  score: number;

  website: {
    url: string;
    hostname: string;
    statusCode: number;
    responseTime: number;
    htmlSizeKB: number;
  };

  results: {
    technicalSeo: {
      score: number;
      status: string;
    };
    pagePerformance: {
      score: number;
      status: string;
    };
    metaTags: {
      score: number;
      status: string;
    };
    mobileOptimization: {
      score: number;
      status: string;
    };
    contentQuality: {
      score: number;
      status: string;
    };
    seoOpportunities: {
      score: number;
      status: string;
    };
  };

  backlinks?: BacklinkData;
  recommendations?: Recommendation[];

  details: {
    title: string;
    titleLength: number;

    description: string;
    descriptionLength: number;

    h1Count: number;
    h2Count: number;

    wordCount: number;

    totalImages: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;

    missingAltImages: {
      src: string;
      alt: string | null;
      recommendedAlt: string;
    }[];

    internalLinks: number;
    externalLinks: number;

    canonical: string | null;

    https: boolean;
    mobileViewport: boolean;

    robotsMeta: string | null;
    robotsTxt: boolean;
    sitemap: boolean;
    favicon: boolean;

    language: string | null;
  };
};

const checks = [
  "Technical SEO",
  "Page Performance",
  "Meta Tags",
  "Mobile Optimization",
  "Content Quality",
  "SEO Opportunities",
];

function AuditPageContent() {
  const searchParams = useSearchParams();

  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [audit, setAudit] = useState<AuditResult | null>(null);
const [searchConsole, setSearchConsole] =
  useState<SearchConsoleData | null>(null);

const [searchConsoleLoading, setSearchConsoleLoading] =
  useState(false);

const [searchConsoleError, setSearchConsoleError] =
  useState("");

useEffect(() => {
  const queryUrl = searchParams.get("url");

  if (queryUrl) {
    setUrl(queryUrl);
  }
}, [searchParams]);
useEffect(() => {
  if (!audit) return;

  const timer = setTimeout(() => {
    document.getElementById("audit-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 150);

  return () => clearTimeout(timer);
}, [audit]);
const loadSearchConsole = async (siteUrl: string) => {
  setSearchConsoleLoading(true);
  setSearchConsoleError("");
  setSearchConsole(null);

  try {
    const response = await fetch(
      `/api/search-console/overview?siteUrl=${encodeURIComponent(
        siteUrl
      )}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || !data?.success) {
      throw new Error(
        data?.error || "Unable to load Google Search Console data."
      );
    }

    setSearchConsole(data as SearchConsoleData);
  } catch (err) {
    console.error("Search Console request failed:", err);

    setSearchConsoleError(
      err instanceof Error
        ? err.message
        : "Unable to load Google Search Console data."
    );
  } finally {
    setSearchConsoleLoading(false);
  }
};

  const handleAnalyze = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setAudit(null);

    if (!url.trim()) {
      setError("Please enter your website URL.");
      return;
    }

    let websiteUrl = url.trim();

    if (
      !websiteUrl.startsWith("http://") &&
      !websiteUrl.startsWith("https://")
    ) {
      websiteUrl = `https://${websiteUrl}`;
    }

    try {
      const parsed = new URL(websiteUrl);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Only HTTP and HTTPS websites are supported.");
      }
    } catch {
      setError("Please enter a valid website URL.");
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: websiteUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || "Unable to analyze this website."
        );
      }

     
setUrl(websiteUrl);
setAudit(data as AuditResult);


    } catch (err) {
      console.error("Audit request failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze this website. Please try again."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const runAnotherAudit = () => {
    setAudit(null);
    setError("");
    setUrl("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* HEADER */}
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <a
            href="/"
            className="text-xl font-black tracking-tight text-[#0F172A]"
          >
            SEOMETRIC<span className="text-[#F97316]">HUB</span>
          </a>

          <a
            href="/"
            className="text-sm font-semibold text-[#475569] transition hover:text-[#F97316]"
          >
            ? Back to Home
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="px-5 pb-16 pt-20 sm:px-6 lg:px-8 lg:pt-28">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
            Website SEO Audit
          </span>

          <h1 className="mt-7 text-5xl font-black leading-[1.05] tracking-tight text-[#0F172A] sm:text-6xl lg:text-7xl">
            Find What Is Holding{" "}
            <span className="text-[#F97316]">Your Website Back</span>
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-[#64748B] sm:text-xl">
            Analyze your website for SEO, performance, technical issues
            and optimization opportunities.
          </p>
        </div>

        {/* FORM */}
        <div className="mx-auto mt-14 max-w-3xl">
          <form
            onSubmit={handleAnalyze}
            className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
          >
            <label
              htmlFor="website-url"
              className="block text-sm font-bold text-[#0F172A]"
            >
              Website URL
            </label>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input
                id="website-url"
                type="text"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  setError("");
                  setAudit(null);
                }}
                placeholder="https://example.com"
                autoComplete="url"
                className="h-14 flex-1 rounded-xl border border-[#CBD5E1] bg-white px-5 text-base text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#F97316] focus:ring-4 focus:ring-orange-100"
              />

              <button
                type="submit"
                disabled={analyzing}
                className="h-14 rounded-xl bg-[#F97316] px-7 font-bold text-white transition-all hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {analyzing ? "Analyzing..." : "Analyze Website ?"}
              </button>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#94A3B8]">
                Enter your website URL to start your SEO analysis.
              </p>
            )}
          </form>
        </div>
      </section>

      {/* WHAT WE CHECK */}
      <section className="px-5 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-black text-[#0F172A] sm:text-4xl">
            What We Check
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {checks.map((check) => (
              <div
                key={check}
                className="flex items-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-lg font-black text-[#F97316]">
                  ?
                </div>

                <span className="font-bold text-[#0F172A]">
                  {check}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {audit && (
        <section
          id="audit-results"
          className="scroll-mt-10 border-t border-[#E2E8F0] bg-white px-5 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-6xl">
            {/* AUDIT COMPLETE */}
            <div className="text-center">
              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-600">
                ? Audit Complete
              </span>

              <h2 className="mt-5 text-4xl font-black text-[#0F172A] sm:text-5xl">
                Your SEO Overview
              </h2>

              <p className="mx-auto mt-3 max-w-3xl text-[#64748B]">
                Analysis completed for{" "}
                <span className="break-all font-bold text-[#0F172A]">
                  {audit.website?.url || url}
                </span>
              </p>
            </div>

            {/* MAIN SCORE */}
            <div className="mx-auto mt-12 max-w-sm rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wider text-[#64748B]">
                SEO Score
              </p>

              <div className="mt-4 text-7xl font-black text-[#F97316]">
                {safeNumber(audit.score)}
              </div>

              <p className="mt-2 font-semibold text-[#475569]">
                {getScoreMessage(audit.score)}
              </p>

              <div className="mx-auto mt-6 h-3 max-w-xs overflow-hidden rounded-full bg-[#E2E8F0]">
                <div
                  className="h-full rounded-full bg-[#F97316] transition-all duration-700"
                  style={{
                    width: `${clampScore(audit.score)}%`,
                  }}
                />
              </div>
            </div>

            {/* RESULT CARDS */}
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ResultCard
                title="Technical SEO"
                score={audit.results?.technicalSeo?.score}
                status={audit.results?.technicalSeo?.status}
              />

              <ResultCard
                title="Page Performance"
                score={audit.results?.pagePerformance?.score}
                status={audit.results?.pagePerformance?.status}
              />

              <ResultCard
                title="Meta Tags"
                score={audit.results?.metaTags?.score}
                status={audit.results?.metaTags?.status}
              />

              <ResultCard
                title="Mobile Optimization"
                score={audit.results?.mobileOptimization?.score}
                status={audit.results?.mobileOptimization?.status}
              />

              <ResultCard
                title="Content Quality"
                score={audit.results?.contentQuality?.score}
                status={audit.results?.contentQuality?.status}
              />

              <ResultCard
                title="SEO Opportunities"
                score={audit.results?.seoOpportunities?.score}
                status={audit.results?.seoOpportunities?.status}
              />
            </div>

            {/* WEBSITE OVERVIEW */}
            <div className="mt-16">
              <SectionTitle title="Website Overview" />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard
                  label="Response Time"
                  value={`${safeNumber(
                    audit.website?.responseTime
                  )} ms`}
                />

                <InfoCard
                  label="HTML Size"
                  value={`${safeNumber(
                    audit.website?.htmlSizeKB
                  )} KB`}
                />

                <InfoCard
                  label="HTTP Status"
                  value={`${safeNumber(
                    audit.website?.statusCode
                  )}`}
                />

                <InfoCard
                  label="Word Count"
                  value={`${safeNumber(
                    audit.details?.wordCount
                  )}`}
                />
              </div>
            </div>

            {/* ON PAGE SEO */}
            <div className="mt-16">
              <SectionTitle title="On-Page SEO" />

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <DetailCard
                  title="Page Title"
                  value={audit.details?.title || "Missing"}
                  extra={`Length: ${safeNumber(
                    audit.details?.titleLength
                  )} characters`}
                  warning={
                    !audit.details?.title ||
                    audit.details.titleLength > 60 ||
                    audit.details.titleLength < 30
                  }
                />

                <DetailCard
                  title="Meta Description"
                  value={audit.details?.description || "Missing"}
                  extra={`Length: ${safeNumber(
                    audit.details?.descriptionLength
                  )} characters`}
                  warning={
                    !audit.details?.description ||
                    audit.details.descriptionLength > 160 ||
                    audit.details.descriptionLength < 70
                  }
                />

                <DetailCard
                  title="H1 Headings"
                  value={`${safeNumber(audit.details?.h1Count)}`}
                  extra={
                    audit.details?.h1Count === 1
                      ? "One H1 tag detected — ideal."
                      : audit.details?.h1Count === 0
                      ? "No H1 tag found. Add one clear primary H1."
                      : "Multiple H1 tags found. Review heading structure."
                  }
                  warning={audit.details?.h1Count !== 1}
                />

                <DetailCard
                  title="H2 Headings"
                  value={`${safeNumber(audit.details?.h2Count)}`}
                  extra={
                    audit.details?.h2Count > 0
                      ? `${safeNumber(
                          audit.details?.h2Count
                        )} H2 tags found.`
                      : "No H2 tags found."
                  }
                  warning={audit.details?.h2Count === 0}
                />
              </div>

              {/* META INTELLIGENCE */}
              <MetaIntelligenceCard audit={audit} />
            </div>

            {/* TECHNICAL DETAILS */}
            <div className="mt-16">
              <SectionTitle title="Technical Details" />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <TechnicalCard
                  title="HTTPS"
                  value={Boolean(audit.details?.https)}
                />

                <TechnicalCard
                  title="Mobile Viewport"
                  value={Boolean(audit.details?.mobileViewport)}
                />

                <TechnicalCard
                  title="Canonical"
                  value={Boolean(audit.details?.canonical)}
                />

                <TechnicalCard
                  title="Robots.txt"
                  value={Boolean(audit.details?.robotsTxt)}
                />

                <TechnicalCard
                  title="Sitemap.xml"
                  value={Boolean(audit.details?.sitemap)}
                />

                <TechnicalCard
                  title="Favicon"
                  value={Boolean(audit.details?.favicon)}
                />

                <TechnicalCard
                  title="Language"
                  value={Boolean(audit.details?.language)}
                  customValue={
                    audit.details?.language || "Not detected"
                  }
                />
              </div>
            </div>

            {/* IMAGES + LINKS */}
            <div className="mt-16 grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
                <h3 className="text-xl font-black text-[#0F172A]">
                  Images
                </h3>

                <p className="mt-2 text-sm text-[#64748B]">
                  Image accessibility and ALT attribute analysis.
                </p>

                <div className="mt-6 space-y-4">
                  <StatRow
                    label="Total Images"
                    value={safeNumber(
                      audit.details?.totalImages
                    )}
                  />

                  <StatRow
                    label="Images With ALT"
                    value={safeNumber(
                      audit.details?.imagesWithAlt
                    )}
                  />

                  <StatRow
                    label="Missing ALT"
                    value={safeNumber(
                      audit.details?.imagesWithoutAlt
                    )}
                    danger={
                      safeNumber(
                        audit.details?.imagesWithoutAlt
                      ) > 0
                    }
                  />
                </div>
              </div>

              {/* LINKS */}
              <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
                <h3 className="text-xl font-black text-[#0F172A]">
                  Links
                </h3>

                <p className="mt-2 text-sm text-[#64748B]">
                  Links detected directly from the analyzed HTML.
                </p>

                <div className="mt-6 space-y-4">
                  <StatRow
                    label="Internal Links"
                    value={safeNumber(
                      audit.details?.internalLinks
                    )}
                  />

                  <StatRow
                    label="External Links"
                    value={safeNumber(
                      audit.details?.externalLinks
                    )}
                  />
                </div>
              </div>
            </div>

            {/* MISSING ALT DETAILS */}
            {audit.details?.missingAltImages?.length > 0 && (
              <div className="mt-16">
                <SectionTitle title="Images Missing ALT Text" />

                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748B]">
                  These images were detected without useful ALT text.
                  Add descriptive ALT text to meaningful images and keep
                  decorative images empty.
                </p>

                <div className="mt-6 rounded-3xl border border-orange-200 bg-orange-50 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-black text-[#0F172A]">
                      {audit.details.missingAltImages.length} Missing
                    </h3>

                    <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600">
                      Review Required
                    </span>
                  </div>

                  <div className="space-y-4">
                    {audit.details.missingAltImages.map(
                      (image, index) => (
                        <div
                          key={`${image.src}-${index}`}
                          className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
                        >
                          <div className="flex flex-col gap-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">
                                {index + 1}. Image Source
                              </p>

                              <p className="mt-2 break-all text-sm font-semibold text-[#0F172A]">
                                {image.src ||
                                  "Image source not detected"}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-black uppercase tracking-wider text-[#64748B]">
                                Current ALT
                              </p>

                              <p className="mt-2 text-sm font-semibold text-red-500">
                                {image.alt?.trim() || "Missing ALT"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                              <p className="text-xs font-black uppercase tracking-wider text-green-600">
                                Recommended ALT
                              </p>

                              <p className="mt-2 text-sm font-bold text-green-700">
                                {image.recommendedAlt}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* BACKLINKS */}
            <div className="mt-16">
              <SectionTitle title="Backlinks" />

              <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
                <div className="grid gap-5 sm:grid-cols-2">
                  <BacklinkCard
                    title="Backlinks"
                    value={audit.backlinks?.backlinks}
                    available={audit.backlinks?.available}
                  />

                  <BacklinkCard
                    title="Referring Domains"
                    value={audit.backlinks?.referringDomains}
                    available={audit.backlinks?.available}
                  />
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <BacklinkCard
                    title="Dofollow"
                    value={audit.backlinks?.dofollow}
                    available={audit.backlinks?.available}
                  />

                  <BacklinkCard
                    title="Nofollow"
                    value={audit.backlinks?.nofollow}
                    available={audit.backlinks?.available}
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm leading-6 text-blue-700">
                    {audit.backlinks?.message ||
                      "Real backlink data requires an external backlink index. SEOMETRICHUB does not display invented backlink counts."}
                  </p>
                </div>
              </div>
            </div>

            {/* SEO ISSUES */}
            <div className="mt-16">
              <SectionTitle title="SEO Issues & Opportunities" />

              <div className="mt-6 grid gap-4">
                <AuditIssue
                  title="H1 Heading"
                  passed={audit.details?.h1Count === 1}
                  message={
                    audit.details?.h1Count === 1
                      ? "One H1 heading was detected."
                      : audit.details?.h1Count === 0
                      ? "No H1 heading was detected. Add one clear primary H1."
                      : "Multiple H1 headings were detected. Review your heading structure."
                  }
                />

                <AuditIssue
                  title="Page Title"
                  passed={
                    audit.details?.titleLength >= 30 &&
                    audit.details?.titleLength <= 60
                  }
                  message={
                    audit.details?.titleLength >= 30 &&
                    audit.details?.titleLength <= 60
                      ? "Title length is within the recommended range."
                      : `Current title length: ${safeNumber(
                          audit.details?.titleLength
                        )} characters. Recommended: 30–60 characters.`
                  }
                />

                <AuditIssue
                  title="Meta Description"
                  passed={
                    audit.details?.descriptionLength >= 70 &&
                    audit.details?.descriptionLength <= 160
                  }
                  message={
                    audit.details?.descriptionLength >= 70 &&
                    audit.details?.descriptionLength <= 160
                      ? "Meta description length is within the recommended range."
                      : `Current description length: ${safeNumber(
                          audit.details?.descriptionLength
                        )} characters. Recommended: 70–160 characters.`
                  }
                />

                <AuditIssue
                  title="Image ALT Attributes"
                  passed={
                    safeNumber(
                      audit.details?.imagesWithoutAlt
                    ) === 0
                  }
                  message={
                    safeNumber(
                      audit.details?.imagesWithoutAlt
                    ) === 0
                      ? "All detected images have ALT attributes."
                      : `${safeNumber(
                          audit.details?.imagesWithoutAlt
                        )} image(s) are missing ALT attributes.`
                  }
                />

                <AuditIssue
                  title="Canonical URL"
                  passed={Boolean(audit.details?.canonical)}
                  message={
                    audit.details?.canonical
                      ? `Canonical detected: ${audit.details.canonical}`
                      : "No canonical URL was detected."
                  }
                />

                <AuditIssue
                  title="Sitemap"
                  passed={Boolean(audit.details?.sitemap)}
                  message={
                    audit.details?.sitemap
                      ? "Sitemap was detected."
                      : "Sitemap was not detected at the tested locations."
                  }
                />

                <AuditIssue
                  title="Robots.txt"
                  passed={Boolean(audit.details?.robotsTxt)}
                  message={
                    audit.details?.robotsTxt
                      ? "Robots.txt was detected."
                      : "Robots.txt was not detected."
                  }
                />

                <AuditIssue
                  title="HTTPS"
                  passed={Boolean(audit.details?.https)}
                  message={
                    audit.details?.https
                      ? "HTTPS is enabled."
                      : "HTTPS is not enabled."
                  }
                />

                <AuditIssue
                  title="Mobile Viewport"
                  passed={Boolean(
                    audit.details?.mobileViewport
                  )}
                  message={
                    audit.details?.mobileViewport
                      ? "A mobile viewport meta tag was detected."
                      : "Mobile viewport meta tag was not detected."
                  }
                />
              </div>
            </div>
            {/* GOOGLE SEARCH CONSOLE */}
<div className="mt-16">
  <SectionTitle title="Google Search Console" />

  <div className="mt-6 rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#64748B]">
          Organic Search Performance
        </p>

        <h3 className="mt-1 text-2xl font-black text-[#0F172A]">
          Search visibility from Google
        </h3>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          Optional: Connect Google Search Console (Optional) to view real Google search performance data.
        </p>
      </div>

      <a
  href={`/api/auth/google?siteUrl=${encodeURIComponent(url)}`}
  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#0F172A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E293B]"
>
  Connect Google Search Console (Optional)
</a>
    </div>

    {/* LOADING */}
    {searchConsoleLoading && (
      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-bold text-blue-900">
          Loading Google Search Console data...
        </p>

        <p className="mt-1 text-sm text-blue-800">
          Fetching real organic search performance data.
        </p>
      </div>
    )}

    {/* ERROR */}
    {!searchConsoleLoading && searchConsoleError && (
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <span className="text-lg">!</span>

          <div>
            <p className="font-bold text-amber-900">
              Search Console data unavailable
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              {searchConsoleError}
            </p>

            <p className="mt-3 text-xs leading-5 text-amber-700">
              Search Console access is optional. Your SEO audit works without connecting a Google account.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* SUCCESS */}
    {!searchConsoleLoading && searchConsole && (
      <>
        {/* PERIOD */}
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                Connected
              </p>

              <p className="mt-1 text-sm font-semibold text-emerald-900">
                Google Search Console
              </p>
            </div>

            <p className="text-xs text-emerald-700">
              {searchConsole.period?.startDate} ?{" "}
              {searchConsole.period?.endDate}
            </p>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
              Clicks
            </p>

            <p className="mt-2 text-3xl font-black text-[#0F172A]">
              {searchConsole.summary?.clicks ?? 0}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Organic clicks
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
              Impressions
            </p>

            <p className="mt-2 text-3xl font-black text-[#0F172A]">
              {searchConsole.summary?.impressions ?? 0}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Search impressions
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
              CTR
            </p>

            <p className="mt-2 text-3xl font-black text-[#0F172A]">
              {searchConsole.summary?.averageCtr ?? 0}%
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Average click-through rate
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-[#94A3B8]">
              Avg. Position
            </p>

            <p className="mt-2 text-3xl font-black text-[#0F172A]">
              {searchConsole.summary?.averagePosition ?? 0}
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Average search position
            </p>
          </div>
        </div>

        {/* SEARCH QUERIES */}
        <div className="mt-6">
          <div className="mb-4">
            <p className="text-sm font-bold text-[#0F172A]">
              Top Search Queries
            </p>

            <p className="mt-1 text-xs text-[#64748B]">
              Search queries reported by Google Search Console.
            </p>
          </div>

          {searchConsole.queries?.length ? (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[#F8FAFC]">
                    <tr>
                      <th className="px-4 py-3 font-bold text-[#64748B]">
                        Query
                      </th>

                      <th className="px-4 py-3 text-right font-bold text-[#64748B]">
                        Clicks
                      </th>

                      <th className="px-4 py-3 text-right font-bold text-[#64748B]">
                        Impressions
                      </th>

                      <th className="px-4 py-3 text-right font-bold text-[#64748B]">
                        CTR
                      </th>

                      <th className="px-4 py-3 text-right font-bold text-[#64748B]">
                        Position
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {searchConsole.queries.map((query, index) => (
                      <tr
                        key={`${query.query}-${index}`}
                        className="border-t border-[#E2E8F0]"
                      >
                        <td className="px-4 py-3 font-medium text-[#0F172A]">
                          {query.query || "Unknown query"}
                        </td>

                        <td className="px-4 py-3 text-right text-[#334155]">
                          {query.clicks ?? 0}
                        </td>

                        <td className="px-4 py-3 text-right text-[#334155]">
                          {query.impressions ?? 0}
                        </td>

                        <td className="px-4 py-3 text-right text-[#334155]">
                          {query.ctr ?? 0}%
                        </td>

                        <td className="px-4 py-3 text-right font-semibold text-[#0F172A]">
                          {query.position ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-sm text-[#64748B]">
              No Google Search Console search queries were returned for
              this period.
            </div>
          )}
        </div>
      </>
    )}

    {/* NOT CONNECTED */}
    {!searchConsoleLoading &&
      !searchConsoleError &&
      !searchConsole && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <span className="text-lg">!</span>

            <div>
              <p className="font-bold text-amber-900">
                Connect Google Search Console (Optional)
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Connect your Google account only if you want to see real clicks, impressions, CTR, average position and search queries.
              </p>
            </div>
          </div>
        </div>
      )}
  </div>
</div>
            {/* ACTIONABLE SEO RECOMMENDATIONS */}
            <div className="mt-16">
              <SectionTitle title="Actionable SEO Recommendations" />

              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#64748B]">
                These recommendations are generated from the actual
                HTML data detected during this audit. We never invent
                website metrics.
              </p>

              <div className="mt-6 grid gap-4">
                {(audit.recommendations || []).map(
                  (recommendation, index) => (
                    <RecommendationCard
                      key={`${recommendation.title}-${index}`}
                      recommendation={recommendation}
                    />
                  )
                )}

                {!audit.recommendations?.length && (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 text-sm text-[#64748B]">
                    No additional recommendations were returned for
                    this audit.
                  </div>
                )}
              </div>
            </div>

            {/* NEXT STEP */}
            <div className="mt-16 rounded-3xl bg-[#0F172A] px-6 py-12 text-center sm:px-10">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#F97316]">
                Next Step
              </span>

              <h3 className="mt-4 text-3xl font-black text-white">
                Want to Improve Your SEO Score?
              </h3>

              <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
                Fix the issues identified in this audit and continue
                improving your website&apos;s technical and on-page
                SEO.
              </p>

              <button
                type="button"
                onClick={runAnotherAudit}
                className="mt-7 inline-flex rounded-xl bg-[#F97316] px-7 py-3.5 font-bold text-white transition hover:bg-[#EA580C]"
              >
                Run Another Audit ?
              </button>
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-[#94A3B8]">
            © 2026 SEOMETRICHUB. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* =========================================================
   META INTELLIGENCE
========================================================= */

function MetaIntelligenceCard({
  audit,
}: {
  audit: AuditResult;
}) {
  const titleRecommendation = audit.recommendations?.find(
    (item) =>
      item.title.toLowerCase().includes("page title") &&
      Boolean(item.recommendedTitle)
  );

  const descriptionRecommendation = audit.recommendations?.find(
    (item) =>
      item.title.toLowerCase().includes("meta description") &&
      Boolean(item.recommendedMetaDescription)
  );

  const currentTitle = audit.details?.title?.trim() || "";
  const currentDescription =
    audit.details?.description?.trim() || "";

  const recommendedTitle =
    titleRecommendation?.recommendedTitle?.trim() || "";

  const recommendedDescription =
    descriptionRecommendation?.recommendedMetaDescription?.trim() ||
    "";

  const titleLength = safeNumber(audit.details?.titleLength);
  const descriptionLength = safeNumber(
    audit.details?.descriptionLength
  );

  const titleGood =
    titleLength >= 30 && titleLength <= 60;

  const descriptionGood =
    descriptionLength >= 70 && descriptionLength <= 160;

  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-sm">
      {/* HEADER */}
      <div className="border-b border-[#E2E8F0] bg-gradient-to-r from-orange-50 via-white to-white px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl font-black text-[#F97316]">
              ?
            </div>

            <div>
              <h3 className="text-xl font-black text-[#0F172A]">
                Meta Intelligence
              </h3>

              <p className="mt-1 text-sm text-[#64748B]">
                Smart title and meta description analysis
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full bg-orange-50 px-3 py-1.5 text-xs font-black text-orange-600">
            SEO Optimization
          </span>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* CURRENT METADATA */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MetaAnalysisBox
            label="Current Page Title"
            value={currentTitle || "No title detected"}
            length={titleLength}
            min={30}
            max={60}
            good={titleGood}
            empty={!currentTitle}
          />

          <MetaAnalysisBox
            label="Current Meta Description"
            value={
              currentDescription || "No meta description detected"
            }
            length={descriptionLength}
            min={70}
            max={160}
            good={descriptionGood}
            empty={!currentDescription}
          />
        </div>

        {/* WHAT NEEDS IMPROVEMENT */}
        <div className="mt-8">
          <h4 className="text-lg font-black text-[#0F172A]">
            What Needs Improvement?
          </h4>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MetaWeakness
              title="Page Title"
              good={titleGood && Boolean(currentTitle)}
              message={getTitleWeakness(
                currentTitle,
                titleLength
              )}
            />

            <MetaWeakness
              title="Meta Description"
              good={
                descriptionGood &&
                Boolean(currentDescription)
              }
              message={getDescriptionWeakness(
                currentDescription,
                descriptionLength
              )}
            />
          </div>
        </div>

        {/* RECOMMENDED METADATA */}
        {(recommendedTitle || recommendedDescription) && (
          <div className="mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-lg font-black text-[#0F172A]">
                  Recommended Metadata
                </h4>

                <p className="mt-1 text-sm text-[#64748B]">
                  Generated from the actual content and SEO signals
                  detected during this audit.
                </p>
              </div>

              <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-600">
                Generated
              </span>
            </div>

            <div className="mt-5 grid gap-5">
              {recommendedTitle && (
                <RecommendedMetaBox
                  label="Recommended SEO Title"
                  value={recommendedTitle}
                  max={60}
                />
              )}

              {recommendedDescription && (
                <RecommendedMetaBox
                  label="Recommended Meta Description"
                  value={recommendedDescription}
                  max={160}
                />
              )}
            </div>
          </div>
        )}

        {/* GOOGLE PREVIEW */}
        <div className="mt-8">
          <h4 className="text-lg font-black text-[#0F172A]">
            Google Search Preview
          </h4>

          <p className="mt-1 text-sm text-[#64748B]">
            Approximate preview of how the page metadata may appear
            in search results.
          </p>

          <div className="mt-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
            <GooglePreview
              url={audit.website?.url || ""}
              title={
                recommendedTitle ||
                currentTitle ||
                "Your Page Title"
              }
              description={
                recommendedDescription ||
                currentDescription ||
                "Your meta description will appear here."
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaAnalysisBox({
  label,
  value,
  length,
  min,
  max,
  good,
  empty,
}: {
  label: string;
  value: string;
  length: number;
  min: number;
  max: number;
  good: boolean;
  empty: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-black text-[#0F172A]">
          {label}
        </h4>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            good
              ? "bg-green-50 text-green-600"
              : "bg-orange-50 text-orange-600"
          }`}
        >
          {good ? "Good" : "Review"}
        </span>
      </div>

      <p
        className={`mt-4 break-words text-sm font-semibold leading-6 ${
          empty ? "text-red-500" : "text-[#0F172A]"
        }`}
      >
        {value}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs">
        <span className="font-bold text-[#64748B]">
          {length} characters
        </span>

        <span className="font-semibold text-[#94A3B8]">
          Recommended: {min}-{max}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className={`h-full rounded-full transition-all ${
            good ? "bg-green-500" : "bg-orange-500"
          }`}
          style={{
            width: `${getLengthProgress(length, max)}%`,
          }}
        />
      </div>
    </div>
  );
}

function MetaWeakness({
  title,
  good,
  message,
}: {
  title: string;
  good: boolean;
  message: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        good
          ? "border-green-100 bg-green-50"
          : "border-orange-100 bg-orange-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black ${
            good
              ? "bg-green-100 text-green-600"
              : "bg-orange-100 text-orange-600"
          }`}
        >
          {good ? "?" : "!"}
        </div>

        <div>
          <h5 className="font-black text-[#0F172A]">
            {title}
          </h5>

          <p className="mt-1 text-sm leading-6 text-[#64748B]">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

function RecommendedMetaBox({
  label,
  value,
  max,
}: {
  label: string;
  value: string;
  max: number;
}) {
  const length = value.length;
  const good = length >= 30 && length <= max;

  return (
    <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-black uppercase tracking-wider text-green-600">
          {label}
        </p>

        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700">
          {length} characters
        </span>
      </div>

      <p className="mt-3 break-words text-sm font-bold leading-7 text-[#0F172A]">
        {value}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#64748B]">
          SEO-ready recommendation
        </span>

        <span
          className={`font-bold ${
            good ? "text-green-600" : "text-orange-600"
          }`}
        >
          {good ? "Within range" : "Review length"}
        </span>
      </div>
    </div>
  );
}

function GooglePreview({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  let displayUrl = url;

  try {
    const parsed = new URL(url);
    displayUrl = parsed.hostname + parsed.pathname;
  } catch {
    displayUrl = url || "example.com";
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium text-[#475569]">
        {displayUrl}
      </p>

      <h5 className="mt-1 text-xl font-medium leading-7 text-[#1A0DAB]">
        {title}
      </h5>

      <p className="mt-2 text-sm leading-6 text-[#4D5156]">
        {description}
      </p>
    </div>
  );
}

function getLengthProgress(
  length: number,
  max: number
): number {
  if (!length || length <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((length / max) * 100)
  );
}

function getTitleWeakness(
  title: string,
  length: number
): string {
  if (!title) {
    return "No page title was detected. A unique SEO title should be added.";
  }

  if (length < 30) {
    return "The title is too short and may not communicate the page topic clearly enough.";
  }

  if (length > 60) {
    return "The title is longer than the recommended range and may be truncated in search results.";
  }

  return "The title length is within the recommended range. Review keyword relevance and search intent as the next step.";
}

function getDescriptionWeakness(
  description: string,
  length: number
): string {
  if (!description) {
    return "No meta description was detected. Add a clear description that explains the page and encourages clicks.";
  }

  if (length < 70) {
    return "The description is short. It could use more useful context and a stronger reason for users to click.";
  }

  if (length > 160) {
    return "The description is longer than the recommended range and may be truncated in search results.";
  }

  return "The description length is within the recommended range. Review clarity, relevance and click appeal.";
}

/* =========================================================
   COMPONENTS
========================================================= */

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-black text-[#0F172A] sm:text-3xl">
        {title}
      </h2>

      <div className="h-1 flex-1 rounded-full bg-orange-100" />
    </div>
  );
}

function ResultCard({
  title,
  score,
  status,
}: {
  title: string;
  score?: number;
  status?: string;
}) {
  const safeScore = clampScore(score);

  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-black text-[#0F172A]">
          {title}
        </h3>

        <span className="text-2xl font-black text-[#F97316]">
          {safeNumber(score)}
        </span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
        <div
          className="h-full rounded-full bg-[#F97316] transition-all duration-700"
          style={{
            width: `${safeScore}%`,
          }}
        />
      </div>

      <p className="mt-3 text-sm font-semibold text-[#64748B]">
        {status || getScoreStatus(safeScore)}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <p className="text-sm font-bold text-[#64748B]">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-black text-[#0F172A]">
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  title,
  value,
  extra,
  warning = false,
}: {
  title: string;
  value: string;
  extra: string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-[#E2E8F0] bg-[#F8FAFC] p-7">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-black text-[#0F172A]">
          {title}
        </h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            warning
              ? "bg-orange-50 text-orange-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {warning ? "Review" : "Good"}
        </span>
      </div>

      <p className="mt-4 break-words font-bold leading-7 text-[#0F172A]">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
        {extra}
      </p>
    </div>
  );
}

function TechnicalCard({
  title,
  value,
  customValue,
}: {
  title: string;
  value: boolean;
  customValue?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
      <span className="font-bold text-[#0F172A]">
        {title}
      </span>

      {customValue ? (
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            value
              ? "bg-green-50 text-green-600"
              : "bg-orange-50 text-orange-600"
          }`}
        >
          {customValue}
        </span>
      ) : (
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            value
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-500"
          }`}
        >
          {value ? "Passed" : "Missing"}
        </span>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 last:border-b-0 last:pb-0">
      <span className="font-semibold text-[#64748B]">
        {label}
      </span>

      <span
        className={`font-black ${
          danger ? "text-red-500" : "text-[#0F172A]"
        }`}
      >
        {safeNumber(value)}
      </span>
    </div>
  );
}

function BacklinkCard({
  title,
  value,
  available = false,
}: {
  title: string;
  value?: number | null;
  available?: boolean;
}) {
  const hasValue =
    available &&
    typeof value === "number" &&
    Number.isFinite(value);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <p className="text-sm font-bold text-[#64748B]">
        {title}
      </p>

      <p className="mt-3 text-4xl font-black text-[#0F172A]">
        {hasValue ? value : "—"}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
        {hasValue
          ? "Verified data returned by the connected source."
          : "Real backlink data source not connected yet."}
      </p>
    </div>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const isSuccess = recommendation.type === "success";
  const isError = recommendation.type === "error";

  const icon = isSuccess ? "?" : "!";
  const iconClass = isSuccess
    ? "bg-green-50 text-green-600"
    : isError
    ? "bg-red-50 text-red-600"
    : "bg-orange-50 text-orange-600";

  const badgeClass = isSuccess
    ? "bg-green-50 text-green-600"
    : isError
    ? "bg-red-50 text-red-600"
    : "bg-orange-50 text-orange-600";

  const badgeText = isSuccess
    ? "Passed"
    : isError
    ? "Important"
    : "Improve";

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${iconClass}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h4 className="font-black text-[#0F172A]">
              {recommendation.title}
            </h4>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
            >
              {badgeText}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            {recommendation.description}
          </p>

          {recommendation.recommendedTitle && (
            <div className="mt-4 rounded-xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">
                Recommended Title
              </p>

              <p className="mt-2 break-words text-sm font-bold leading-6 text-[#0F172A]">
                {recommendation.recommendedTitle}
              </p>

              <p className="mt-2 text-xs text-[#94A3B8]">
                {recommendation.recommendedTitle.length} characters
              </p>
            </div>
          )}

          {recommendation.recommendedMetaDescription && (
            <div className="mt-4 rounded-xl border border-orange-100 bg-white p-4">
              <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">
                Recommended Meta Description
              </p>

              <p className="mt-2 break-words text-sm font-bold leading-6 text-[#0F172A]">
                {recommendation.recommendedMetaDescription}
              </p>

              <p className="mt-2 text-xs text-[#94A3B8]">
                {recommendation.recommendedMetaDescription.length}{" "}
                characters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuditIssue({
  title,
  passed,
  message,
}: {
  title: string;
  passed: boolean;
  message: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:flex-row sm:items-center">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black ${
          passed
            ? "bg-green-50 text-green-600"
            : "bg-orange-50 text-orange-600"
        }`}
      >
        {passed ? "?" : "!"}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="font-black text-[#0F172A]">
          {title}
        </h4>

        <p className="mt-1 break-words text-sm leading-6 text-[#64748B]">
          {message}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
          passed
            ? "bg-green-50 text-green-600"
            : "bg-orange-50 text-orange-600"
        }`}
      >
        {passed ? "Passed" : "Review"}
      </span>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function safeNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;
}

function clampScore(value: unknown): number {
  const score = safeNumber(value);

  return Math.max(0, Math.min(100, score));
}

function getScoreStatus(score: number): string {
  if (score >= 90) {
    return "Excellent";
  }

  if (score >= 75) {
    return "Good";
  }

  if (score >= 50) {
    return "Needs Work";
  }

  return "Poor";
}

function getScoreMessage(score: number): string {
  const safeScore = clampScore(score);

  if (safeScore >= 90) {
    return "Excellent — your website is well optimized";
  }

  if (safeScore >= 75) {
    return "Good — room for improvement";
  }

  if (safeScore >= 50) {
    return "Needs Work — several improvements are recommended";
  }

  return "Poor — important SEO issues need attention";
}





export default function AuditPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F8FAFC] px-5 py-20 text-center text-[#0F172A]">
          <p className="text-lg font-bold">Loading SEO Audit...</p>
        </main>
      }
    >
      <AuditPageContent />
    </Suspense>
  );
}



