"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

type SocialResponse = {
  success: boolean;
  content?: string;
  error?: string;
};

export default function SocialGeneratorPage() {
  const [platform, setPlatform] = useState("Instagram");
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("Promotional");
  const [tone, setTone] = useState("Professional");
  const [keywords, setKeywords] = useState("");
  const [callToAction, setCallToAction] = useState("");

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
      setError("Please enter a business or topic.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      const response = await fetch("/api/social-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          topic,
          postType,
          tone,
          keywords,
          callToAction,
        }),
      });

      const data: SocialResponse = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Unable to generate social media content.");
        return;
      }

      setResult(data.content || "");
    } catch (error) {
      console.error("Social generation failed:", error);
      setError("Unable to connect to the social media generator.");
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
          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-600">
            Social Media Generator
          </span>

          <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Create Social Posts
            <span className="text-violet-600"> Faster</span>
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#64748B]">
            Generate platform-ready social media captions, hooks, calls to
            action, and hashtags for your business or campaign.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-black text-[#0F172A]">
            Post Details
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Tell SEOMETRICHUB what kind of social media post you want.
          </p>

          <form onSubmit={handleGenerate} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="platform"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Platform
              </label>

              <select
                id="platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option>Instagram</option>
                <option>Facebook</option>
                <option>LinkedIn</option>
                <option>X</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="topic"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Business / Topic
              </label>

              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Example: Local SEO services for small businesses"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label
                htmlFor="postType"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Post Type
              </label>

              <select
                id="postType"
                value={postType}
                onChange={(event) => setPostType(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option>Promotional</option>
                <option>Educational</option>
                <option>Offer</option>
                <option>Announcement</option>
                <option>Engagement</option>
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
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Persuasive</option>
                <option>Casual</option>
                <option>Informative</option>
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
                placeholder="local SEO, small business marketing"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <div>
              <label
                htmlFor="callToAction"
                className="mb-2 block text-sm font-bold text-[#0F172A]"
              >
                Call to Action
              </label>

              <input
                id="callToAction"
                type="text"
                value={callToAction}
                onChange={(event) => setCallToAction(event.target.value)}
                placeholder="Example: Message us today"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#0F172A] outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Social Post"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#0F172A]">
                Generated Post
              </h2>

              <p className="mt-2 text-sm text-[#64748B]">
                Your platform-ready social media content will appear here.
              </p>
            </div>

            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A] transition hover:border-violet-300 hover:bg-violet-50"
              >
                {copied ? "Copied!" : "Copy Post"}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-amber-900">
                Social post generation unavailable
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

                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-600">
                  {platform}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2563EB]">
                  {postType}
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
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
                      <h2 className="mb-4 mt-8 text-2xl font-black text-[#0F172A]">
                        {children}
                      </h2>
                    ),

                    h3: ({ children }) => (
                      <h3 className="mb-3 mt-6 text-xl font-bold text-[#0F172A]">
                        {children}
                      </h3>
                    ),

                    p: ({ children }) => (
                      <p className="mb-5 whitespace-pre-wrap text-[15px] leading-8 text-[#475569]">
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

                    strong: ({ children }) => (
                      <strong className="font-black text-[#0F172A]">
                        {children}
                      </strong>
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
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-2xl font-black text-violet-600">
                    SM
                  </div>

                  <h3 className="mt-5 text-lg font-black text-[#0F172A]">
                    Ready to create
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#64748B]">
                    Choose a platform, enter your topic, and generate a ready-to-use
                    social media post.
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