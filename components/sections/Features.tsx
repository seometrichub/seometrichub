const features = [
  {
    number: "01",
    icon: "âŒ•",
    title: "Website SEO Audit",
    description:
      "Analyze your website and discover technical SEO, performance and optimization problems.",
    link: "Analyze Website",
    href: "/audit",
    available: true,
  },
  {
    number: "02",
    icon: "âŒ•",
    title: "Keyword Research",
    description:
      "Discover high-value keywords, search volume, competition and ranking opportunities.",
    link: "Find Keywords",
    href: "/keywords",
    available: true,
  },
  {
    number: "03",
    icon: "â†—",
    title: "Backlink Analysis",
    description:
      "Monitor backlinks, discover link opportunities and understand your website authority.",
    link: "Analyze Backlinks",
    href: "/backlinks",
      available: true,
  },
  {
    number: "04",
    icon: "âœ¦",
    title: "AI Content Generator",
    description:
      "Create SEO-friendly articles, website content, social posts and marketing copy using AI.",
    link: "Create Content",
    href: "/content-generator",
    available: true,
  },
  {
    number: "05",
    icon: "â—‰",
    title: "Social Media Generator",
    description:
      "Generate engaging social media posts, captions and campaign ideas for your business.",
    link: "Create Social Posts",
    href: "#",
    available: false,
  },
  {
    number: "06",
    icon: "â™›",
    title: "Competitor Analysis",
    description:
      "Analyze competitors, discover their keywords, content strategies and growth opportunities.",
    link: "Analyze Competitors",
    href: "#",
    available: false,
  },
];
export default function Features() {
  return (
    <section
      id="tools"
      className="relative overflow-hidden bg-white py-24 lg:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* =========================
            SECTION HEADER
        ========================== */}
        <div className="mx-auto max-w-3xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
            Powerful SEO Tools
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Everything You Need to{" "}
            <span className="text-[#F97316]">
              Grow Online
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
            Powerful SEO and digital marketing tools designed to help your
            business rank higher, attract more customers and grow faster.
          </p>

        </div>

        {/* =========================
            FEATURE GRID
        ========================== */}
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

              {/* Number */}
              <div className="absolute right-6 top-5 text-xs font-black tracking-widest text-slate-200 transition-colors group-hover:text-orange-200">
                {feature.number}
              </div>

              {/* Icon */}
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
                  text-xl
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

              {/* Title */}
              <h3 className="mt-6 text-xl font-black text-[#0F172A]">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#64748B]">
                {feature.description}
              </p>

              {/* Link */}
            
<a
  href={feature.available ? feature.href : "#"}
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

  <span>
    â†’
  </span>

  {!feature.available && (
    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
      Soon
    </span>
  )}
</a>

              {/* Bottom accent */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#F97316] transition-all duration-300 group-hover:w-full" />

            </div>
          ))}

        </div>

        {/* =========================
            BOTTOM CTA
        ========================== */}
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
            href="#pricing"
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
            <span className="text-[#F97316]">
              â†’
            </span>
          </a>

        </div>

      </div>
    </section>
  );
}



