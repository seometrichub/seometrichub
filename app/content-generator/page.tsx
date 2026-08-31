"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

type GeneratorResponse = {
  success: boolean;
  content?: string;
  error?: string;
  providerConfigured?: boolean;
};

export default function ContentGeneratorPage() {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState("Blog Article");
  const [tone, setTone] = useState("Professional");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const wordCount = result.trim()
    ? result.trim().split(/\s+/).length
    : 0;

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      const response = await fetch("/api/content-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          contentType,
          tone,
          keywords,
        }),
      });

      const data: GeneratorResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to generate content.");
        return;
      }

      setResult(data.content || "");
    } catch (error) {
      console.error("Content generation failed:", error);
      setError("Unable to connect to the content generator.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Unable to copy content:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8 lg:py-20">
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
            AI Content Generator
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Create SEO Content
            <span className="text-[#F97316]"> Faster</span>
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#64748B]">
            Create SEO-friendly articles, website copy, product descriptions,
            and marketing content from your topic and target keywords.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Content Details
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Tell SEOMETRICHUB what you want to create.
          </p>

          <form onSubmit={handleGenerate} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Topic
              </label>

              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Example: Local SEO for small businesses"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="contentType"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Content Type
              </label>

              <select
                id="contentType"
                value={contentType}
                onChange={(event) => setContentType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option>Blog Article</option>
                <option>Website Content</option>
                <option>Product Description</option>
                <option>Landing Page</option>
                <option>Social Media Post</option>
                <option>Meta Title & Description</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="tone"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Tone
              </label>

              <select
                id="tone"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Informative</option>
                <option>Persuasive</option>
                <option>Conversational</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="keywords"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Target Keywords
              </label>

              <textarea
                id="keywords"
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="local SEO, Google Business Profile, local rankings"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#F97316] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Content"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0F172A]">
                Generated Content
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Your generated SEO content will appear here.
              </p>
            </div>

            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A] transition hover:border-orange-300 hover:bg-orange-50"
              >
                {copied ? "Copied!" : "Copy Content"}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-900">
                Content generation unavailable
              </p>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                {error}
              </p>
            </div>
          )}

          {result ? (
            <>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#475569]">
                  {wordCount.toLocaleString()} words
                </span>

                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-[#F97316]">
                  {contentType}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2563EB]">
                  {tone}
                </span>
              </div>

              <article className="mt-8 max-w-none text-[#334155]">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-5 mt-8 text-3xl font-black leading-tight text-[#0F172A] first:mt-0">
                        {children}
                      </h1>
                    ),

                    h2: ({ children }) => (
                      <h2 className="mb-4 mt-8 text-2xl font-black leading-tight text-[#0F172A]">
                        {children}
                      </h2>
                    ),

                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-6 text-xl font-bold text-[#0F172A]">
                        {children}
                      </h3>
                    ),

                    p: ({ children }) => (
                      <p className="mb-5 text-[15px] leading-8 text-[#475569]">
                        {children}
                      </p>
                    ),

                    ul: ({ children }) => (
                      <ul className="mb-6 ml-6 list-disc space-y-2 text-[15px] leading-7 text-[#475569]">
                        {children}
                      </ul>
                    ),

                    ol: ({ children }) => (
                      <ol className="mb-6 ml-6 list-decimal space-y-2 text-[15px] leading-7 text-[#475569]">
                        {children}
                      </ol>
                    ),

                    li: ({ children }) => <li>{children}</li>,

                    strong: ({ children }) => (
                      <strong className="font-black text-[#0F172A]">
                        {children}
                      </strong>
                    ),

                    hr: () => (
                      <hr className="my-8 border-0 border-t border-slate-200" />
                    ),
                  }}
                >
                  {result}
                </ReactMarkdown>
              </article>
            </>
          ) : (
            !error && (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="max-w-md text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl font-black text-[#F97316]">
                    AI
                  </div>

                  <h3 className="mt-5 text-lg font-black text-[#0F172A]">
                    Ready to create
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    Enter your topic, choose the content type and tone, then
                    generate your SEO content.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </main>
  );
}