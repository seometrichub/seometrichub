const services = [
  {
    number: "01",
    title: "Technical SEO",
    description:
      "Review important technical SEO signals such as crawlability, metadata, mobile readiness, site structure, and performance indicators.",
    icon: "SEO",
  },
  {
    number: "02",
    title: "Local SEO",
    description:
      "Support local search visibility with tools and guidance focused on business presence and discoverability.",
    icon: "LOCAL",
  },
  {
    number: "03",
    title: "Keyword Research",
    description:
      "Discover relevant keyword opportunities and use available search metrics to guide content and SEO decisions.",
    icon: "KW",
  },
  {
    number: "04",
    title: "AI Content",
    description:
      "Generate SEO-focused content ideas and drafts using AI-powered content tools available on the platform.",
    icon: "AI",
  },
  {
    number: "05",
    title: "Social Content",
    description:
      "Create social media content ideas, captions, calls to action, and hashtags using the AI social generator.",
    icon: "SM",
  },
  {
    number: "06",
    title: "Competitor Analysis",
    description:
      "Compare observable on-page, content, link, and technical signals from competitor websites.",
    icon: "CA",
  },
];

export default function Services() {
  return (
    <section
      id="services"
      className="relative overflow-hidden border-y border-slate-200 bg-slate-50 py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-orange-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[#F97316]">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" />
              Platform Capabilities
            </span>

            <h2 className="mt-5 text-4xl font-black leading-tight tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
              SEO & Marketing Tools for{" "}
              <span className="text-[#F97316]">Smarter Growth</span>
            </h2>
          </div>

          <div>
            <p className="max-w-2xl text-lg leading-8 text-[#64748B]">
              Explore practical SEO analysis, keyword research, AI content,
              social media, backlink, and competitor analysis tools in one
              platform.
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
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
                {service.number}
              </div>

              <div
                className="
                  flex
                  h-14
                  min-w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#0F172A]
                  px-3
                  text-xs
                  font-black
                  tracking-wide
                  text-white
                  shadow-sm
                  transition-all
                  duration-300
                  group-hover:bg-[#F97316]
                  group-hover:shadow-lg
                  group-hover:shadow-orange-200
                "
              >
                {service.icon}
              </div>

              <h3 className="mt-6 text-xl font-black text-[#0F172A]">
                {service.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#64748B]">
                {service.description}
              </p>

              <a
                href="#tools"
                className="
                  mt-6
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-[#0F172A]
                  transition-all
                  group-hover:gap-3
                  group-hover:text-[#F97316]
                "
              >
                Explore Tools
                <span>-&gt;</span>
              </a>

              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#F97316] transition-all duration-300 group-hover:w-full" />
            </div>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-3xl bg-[#0F172A]">
          <div className="grid items-center gap-8 px-7 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-12 lg:py-12">
            <div>
              <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#F97316]">
                Explore SEOMETRICHUB
              </span>

              <h3 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                Practical tools for SEO and digital marketing workflows.
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Use the currently available analysis and AI tools to review
                websites, research keywords, create content, and compare
                competitors.
              </p>
            </div>

            <a
              href="#tools"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#F97316]
                px-6
                py-3.5
                text-sm
                font-bold
                text-white
                transition-all
                hover:-translate-y-0.5
                hover:bg-[#EA580C]
                hover:shadow-lg
                hover:shadow-orange-500/20
              "
            >
              Explore Tools
              <span>-&gt;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}