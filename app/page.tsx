import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Stats from "@/components/sections/Stats";
import Features from "@/components/sections/Features";
import Services from "@/components/sections/Services";
import Pricing from "@/components/sections/Pricing";
import About from "@/components/sections/About";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#0F172A]">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <Hero />

      {/* STATS */}
      <Stats />

      {/* SEO TOOLS */}
      <Features />

      {/* SERVICES */}
      <Services />

      {/* PRICING */}
      <Pricing />

      {/* ABOUT */}
      <About />

      {/* FINAL CTA */}
      <section
        id="contact"
        className="relative overflow-hidden bg-white px-5 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-100/50 blur-3xl" />

        <div
          className="
            relative mx-auto max-w-6xl
            overflow-hidden rounded-[2rem]
            border border-slate-700
            bg-[#0F172A]
            px-6 py-16
            text-center
            shadow-2xl
            sm:px-12
            lg:px-20
            lg:py-20
          "
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#F97316]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-[#F97316]/10 blur-3xl" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F97316]">
                Explore Your SEO Opportunities
              </span>
            </div>

            <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Understand Your Website and{" "}
              <span className="text-[#F97316]">
                Find Opportunities to Improve
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Analyze important SEO signals, discover improvement opportunities,
              and use practical SEO and AI marketing tools to support your
              digital marketing decisions.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/audit"
                className="
                  inline-flex items-center justify-center gap-2
                  rounded-xl
                  bg-[#F97316]
                  px-8 py-4
                  text-sm font-black text-white
                  shadow-lg shadow-orange-500/10
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-[#EA580C]
                  hover:shadow-xl
                  hover:shadow-orange-500/20
                "
              >
                Start Free Audit
                <span className="text-lg" aria-hidden="true">
                  -&gt;
                </span>
              </a>

              <a
                href="#pricing"
                className="
                  inline-flex items-center justify-center
                  rounded-xl
                  border border-slate-600
                  bg-white/5
                  px-8 py-4
                  text-sm font-bold text-white
                  transition-all duration-200
                  hover:border-[#F97316]
                  hover:bg-white/10
                  hover:text-[#F97316]
                "
              >
                View Access Options
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <span className="text-[#F97316]">✓</span>
                SEO Analysis
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#F97316]">✓</span>
                AI Marketing Tools
              </span>

              <span className="flex items-center gap-2">
                <span className="text-[#F97316]">✓</span>
                Competitor Insights
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
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

              <p className="mt-5 max-w-md text-sm leading-7 text-[#64748B]">
                SEO analysis, research, and AI-powered marketing tools designed
                to help businesses understand their online presence and make
                better digital marketing decisions.
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                <span className="text-xs font-semibold text-[#64748B]">
                  Built for modern businesses
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-[#0F172A]">
                Platform
              </h4>

              <div className="mt-5 space-y-3 text-sm">
                <a
                  href="#tools"
                  className="block text-[#64748B] transition hover:translate-x-1 hover:text-[#F97316]"
                >
                  SEO Tools
                </a>

                <a
                  href="#services"
                  className="block text-[#64748B] transition hover:translate-x-1 hover:text-[#F97316]"
                >
                  Services
                </a>

                <a
                  href="#pricing"
                  className="block text-[#64748B] transition hover:translate-x-1 hover:text-[#F97316]"
                >
                  Access
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-[#0F172A]">
                Company
              </h4>

              <div className="mt-5 space-y-3 text-sm">
                <a
                  href="#about"
                  className="block text-[#64748B] transition hover:translate-x-1 hover:text-[#F97316]"
                >
                  About
                </a>

                <a
                  href="#contact"
                  className="block text-[#64748B] transition hover:translate-x-1 hover:text-[#F97316]"
                >
                  Contact
                </a>

                <span className="block text-[#64748B]">
                  Privacy
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#94A3B8]">
              © 2026 SEOMETRICHUB. All rights reserved.
            </p>

            <div className="flex items-center gap-5 text-sm">
              <span className="text-[#94A3B8]">
                Terms
              </span>

              <span className="text-[#94A3B8]">
                Privacy
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}