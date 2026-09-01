const features = [
  {
    number: "01",
    icon: "SEO",
    title: "Website SEO Audit",
    description:
      "Analyze your website and discover technical SEO, content and optimization issues.",
    link: "Analyze Website",
    href: "/audit",
    available: true,
  },
  {
    number: "02",
    icon: "KW",
    title: "Keyword Research",
    description:
      "Research keyword ideas and review available search metrics and opportunities.",
    link: "Find Keywords",
    href: "/keywords",
    available: true,
  },
  {
    number: "03",
    icon: "BL",
    title: "Backlink Analysis",
    description:
      "Analyze your page links, external domains and follow or nofollow link signals.",
    link: "Analyze Links",
    href: "/backlinks",
    available: true,
  },
  {
    number: "04",
    icon: "AI",
    title: "AI Content Generator",
    description:
      "Create SEO-friendly articles, website content and marketing copy using AI.",
    link: "Create Content",
    href: "/content-generator",
    available: true,
  },
  {
    number: "05",
    icon: "SM",
    title: "Social Media Generator",
    description:
      "Generate platform-ready social media posts, captions, hashtags and calls to action.",
    link: "Create Social Posts",
    href: "/social-generator",
    available: true,
  },
  {
    number: "06",
    icon: "CA",
    title: "Competitor Analysis",
    description:
      "Compare websites using directly observable on-page SEO, content and technical signals.",
    link: "Analyze Competitors",
    href: "/competitor-analysis",
    available: true,
  },
];

export default function Features() {
  return (
    <section
      id="tools"
      className="relative overflow-hidden bg-white py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
            Powerful SEO Tools
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Everything You Need to{" "}
            <span className="text-[#F97316]">Grow Online</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
            SEO and digital marketing tools designed to help you analyze,
            improve and grow your online presence.
          </p>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="
                group
                relative
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-7
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:border-orange-200
                hover:shadow-xl
                hover:shadow-orange-100/50
              "
            >
              <div className="absolute right-6 top-5 text-xs font-black tracking-widest text-slate-200 transition-colors group-hover:text-orange-200">
                {feature.number}
              </div>

              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-orange-200
                  bg-orange-50
                  text-sm
                  font-black
                  text-[#F97316]
                  transition-all
                  duration-300
                  group-hover:bg-[#F97316]
                  group-hover:text-white
                  group-hover:shadow-lg
                  group-hover:shadow-orange-200
                "
              >
                {feature.icon}
              </div>

              <h3 className="mt-6 text-xl font-black text-[#0F172A]">
                {feature.title}
              </h3>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#64748B]">
                {feature.description}
              </p>

              <a
                href={feature.href}
                className={`
                  mt-7
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  transition-all
                  group-hover:gap-3
                  ${
                    feature.available
                      ? "text-[#F97316] hover:text-[#EA580C]"
                      : "cursor-not-allowed text-slate-400"
                  }
                `}
              >
                {feature.link}

                <span aria-hidden="true">
                  -&gt;
                </span>

                {!feature.available && (
                  <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    Soon
                  </span>
                )}
              </a>

              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#F97316] transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 sm:flex-row sm:px-8">
          <div>
            <h3 className="text-lg font-black text-[#0F172A]">
              Ready to discover your growth opportunities?
            </h3>

            <p className="mt-1 text-sm text-[#64748B]">
              Start with a free website SEO audit.
            </p>
          </div>

          <a
            href="/audit"
            className="
              inline-flex
              shrink-0
              items-center
              gap-2
              rounded-xl
              bg-[#0F172A]
              px-6
              py-3
              text-sm
              font-bold
              text-white
              transition-all
              hover:-translate-y-0.5
              hover:bg-[#1E293B]
              hover:shadow-lg
            "
          >
            Start Free Audit

            <span
              className="text-[#F97316]"
              aria-hidden="true"
            >
              -&gt;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}