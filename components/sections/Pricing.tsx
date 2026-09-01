const plans = [
  {
    name: "SEO Essentials",
    description:
      "Use the core SEO analysis tools currently available on SEOMETRICHUB.",
    status: "Available Now",
    features: [
      "Website SEO Audit",
      "Keyword Research",
      "Backlink & Link Analysis",
      "Competitor Analysis",
    ],
    button: "Explore SEO Tools",
    href: "#tools",
    popular: false,
  },
  {
    name: "AI Marketing Tools",
    description:
      "Create useful marketing content with the AI tools available on the platform.",
    status: "Available Now",
    features: [
      "AI Content Generator",
      "Social Media Generator",
      "SEO-Focused Content Assistance",
      "Marketing Content Ideas",
    ],
    button: "Explore AI Tools",
    href: "#tools",
    popular: true,
  },
  {
    name: "Premium Plans",
    description:
      "Advanced plans and additional platform features are being prepared.",
    status: "Coming Soon",
    features: [
      "More Advanced SEO Workflows",
      "Expanded Reporting",
      "Additional Business Tools",
      "More Platform Integrations",
    ],
    button: "Explore Current Tools",
    href: "#tools",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-white py-24 lg:py-32"
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-orange-100/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

        {/* =========================
            HEADER
        ========================== */}
        <div className="mx-auto max-w-3xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#F97316]">
            <span className="h-2 w-2 rounded-full bg-[#F97316]" />
            Simple Access
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
            Powerful Tools{" "}
            <span className="text-[#F97316]">
              Built for Growth
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#64748B]">
            Explore the SEO and AI marketing tools currently available.
            Premium plans and additional capabilities are coming soon.
          </p>

        </div>

        {/* =========================
            CARDS
        ========================== */}
        <div className="mx-auto mt-16 grid max-w-6xl gap-6 lg:grid-cols-3">

          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-[#F97316] bg-white shadow-2xl shadow-orange-100"
                  : "border-slate-200 bg-white shadow-sm hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
              }`}
            >

              {/* Featured Badge */}
              {plan.popular && (
                <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F97316] px-4 py-1.5 text-xs font-black tracking-wide text-white shadow-lg shadow-orange-200">
                  AI POWERED
                </div>
              )}

              {/* Card Header */}
              <div>

                <div className="flex items-start justify-between gap-3">

                  <h3 className="text-xl font-black text-[#0F172A]">
                    {plan.name}
                  </h3>

                  <span
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
                      plan.status === "Coming Soon"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-green-50 text-green-600"
                    }`}
                  >
                    {plan.status}
                  </span>

                </div>

                <p className="mt-4 min-h-[72px] text-sm leading-6 text-[#64748B]">
                  {plan.description}
                </p>

              </div>

              {/* Access */}
              <div className="mt-7 border-b border-slate-100 pb-7">

                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Access
                </p>

                <p className="mt-2 text-3xl font-black tracking-tight text-[#0F172A]">
                  {plan.status === "Coming Soon"
                    ? "Coming Soon"
                    : "Explore Now"}
                </p>

              </div>

              {/* Features */}
              <div className="mt-8 flex-1">

                <p className="text-sm font-black text-[#0F172A]">
                  What&apos;s included
                </p>

                <ul className="mt-5 space-y-4">

                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-[#475569]"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-50 text-xs font-black text-[#F97316]">
                        ✓
                      </span>

                      <span>
                        {feature}
                      </span>
                    </li>
                  ))}

                </ul>

              </div>

              {/* Button */}
              <a
                href={plan.href}
                className={`mt-9 flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-black transition-all ${
                  plan.popular
                    ? "bg-[#F97316] text-white hover:bg-[#EA580C] hover:shadow-lg hover:shadow-orange-200"
                    : "border border-slate-300 bg-white text-[#0F172A] hover:border-[#F97316] hover:text-[#F97316]"
                }`}
              >
                {plan.button}

                <span className="ml-2">
                  -&gt;
                </span>
              </a>

            </div>
          ))}

        </div>

        {/* =========================
            BOTTOM NOTE
        ========================== */}
        <div className="mx-auto mt-10 flex max-w-3xl items-center justify-center gap-2 text-center text-sm text-[#64748B]">

          <span className="font-bold text-[#F97316]">
            ✓
          </span>

          Current tools can be explored now. Premium plans and additional
          features will be announced when available.

        </div>

      </div>
    </section>
  );
}