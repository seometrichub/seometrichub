"use client";

import { useState } from "react";

const stats = [
  { value: "6", label: "SEO & Marketing Tools" },
  { value: "Real", label: "Website Analysis" },
  { value: "AI", label: "Content Generation" },
];

export default function Hero() {
  const [url, setUrl] = useState("");

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
              <span className="flex h-2 w-2 rounded-full bg-[#F97316]" />
              AI-Powered SEO Platform
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-[#0F172A] sm:text-6xl lg:text-7xl">
              Understand Your Website
              <br />

              <span className="text-[#F97316]">
                Improve With Better SEO
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-[#475569] sm:text-xl">
              Analyze important SEO signals, discover opportunities, and use
              practical SEO and AI marketing tools to make better digital
              marketing decisions.
            </p>

            <div className="mt-9 max-w-2xl rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/60">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-h-14 flex-1 items-center rounded-xl bg-slate-50 px-4">
                  <span className="mr-3 text-lg text-slate-400">
                    Search
                  </span>

                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter your website URL"
                    className="
                      w-full
                      bg-transparent
                      text-sm
                      font-medium
                      text-[#0F172A]
                      outline-none
                      placeholder:text-slate-400
                    "
                  />
                </div>

                <a
                  href={
                    url.trim()
                      ? `/audit?url=${encodeURIComponent(
                          url.trim().startsWith("http")
                            ? url.trim()
                            : `https://${url.trim()}`
                        )}`
                      : "/audit"
                  }
                  className="
                    relative
                    z-10
                    inline-flex
                    min-h-14
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#F97316]
                    px-7
                    text-sm
                    font-bold
                    text-white
                    transition-all
                    hover:-translate-y-0.5
                    hover:bg-[#EA580C]
                    hover:shadow-lg
                    hover:shadow-orange-200
                  "
                >
                  Start Free Audit

                  <span className="ml-2">
                    -&gt;
                  </span>
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="font-bold text-[#F97316]">
                  ✓
                </span>
                No credit card required
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-[#F97316]">
                  ✓
                </span>
                Instant SEO insights
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#tools"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#0F172A]
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-[#1E293B]
                  hover:shadow-lg
                "
              >
                Explore SEO Tools

                <span className="ml-2">
                  -&gt;
                </span>
              </a>

              <a
                href="#pricing"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-6
                  py-3.5
                  text-sm
                  font-bold
                  text-[#0F172A]
                  transition-all
                  hover:border-[#F97316]
                  hover:text-[#F97316]
                "
              >
                View Access Options
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-orange-100/60 blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-4 py-1.5 text-[10px] font-medium text-slate-400">
                  seometrichub.com
                </div>

                <div className="w-10" />
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      SEO Overview
                    </p>

                    <h3 className="mt-1 text-xl font-black text-[#0F172A]">
                      Website Performance
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                      Sample Data
                    </div>

                    <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-bold text-green-600">
                      Healthy
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold text-slate-400">
                      SEO Score
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-black text-[#0F172A]">
                        92
                      </span>

                      <span className="mb-1 text-sm font-bold text-green-500">
                        /100
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[92%] rounded-full bg-[#F97316]" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold text-slate-400">
                      Visibility
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-black text-[#0F172A]">
                        78%
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-bold text-green-500">
                      Up 14.8% this month
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">
                        Organic Traffic
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Last 30 days
                      </p>
                    </div>

                    <span className="text-sm font-black text-[#F97316]">
                      +28.4%
                    </span>
                  </div>

                  <div className="mt-6 flex h-28 items-end gap-2">
                    <div className="h-[25%] flex-1 rounded-t-md bg-orange-100" />
                    <div className="h-[38%] flex-1 rounded-t-md bg-orange-200" />
                    <div className="h-[32%] flex-1 rounded-t-md bg-orange-200" />
                    <div className="h-[50%] flex-1 rounded-t-md bg-orange-300" />
                    <div className="h-[45%] flex-1 rounded-t-md bg-orange-300" />
                    <div className="h-[65%] flex-1 rounded-t-md bg-orange-400" />
                    <div className="h-[58%] flex-1 rounded-t-md bg-orange-400" />
                    <div className="h-[78%] flex-1 rounded-t-md bg-[#F97316]" />
                    <div className="h-[70%] flex-1 rounded-t-md bg-[#F97316]" />
                    <div className="h-[92%] flex-1 rounded-t-md bg-[#F97316]" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Keywords
                    </p>

                    <p className="mt-2 text-lg font-black text-[#0F172A]">
                      1,284
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Backlinks
                    </p>

                    <p className="mt-2 text-lg font-black text-[#0F172A]">
                      3,842
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Issues
                    </p>

                    <p className="mt-2 text-lg font-black text-[#F97316]">
                      12
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-lg">
                  Growth
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    Organic Growth
                  </p>

                  <p className="text-sm font-black text-[#0F172A]">
                    +42.8%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 border-t border-slate-200 pt-10">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Built for practical SEO and marketing workflows
          </p>

          <div className="mx-auto mt-7 grid max-w-3xl grid-cols-3 divide-x divide-slate-200">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="px-4 text-center"
              >
                <div className="text-2xl font-black text-[#0F172A] sm:text-3xl">
                  {stat.value}
                </div>

                <div className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}