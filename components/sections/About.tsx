export default function About() {
  return (
    <section
      id="about"
      className="border-y border-[#E2E8F0] bg-[#F8FAFC] py-24 lg:py-28"
    >
      <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-[#F97316]">
            About SEOMETRICHUB
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-[#0F172A] sm:text-5xl">
            Smarter SEO & Marketing Starts Here
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#475569]">
            SEOMETRICHUB is an SEO and digital marketing platform that combines
            website analysis, keyword research, competitor insights, and
            AI-powered content tools in one place.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-black text-[#F97316]">
              AI
            </div>

            <h3 className="mt-5 font-bold text-[#0F172A]">
              AI-Powered Tools
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Generate useful SEO and marketing content with AI-assisted tools.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-black text-[#F97316]">
              SEO
            </div>

            <h3 className="mt-5 font-bold text-[#0F172A]">
              Data-Focused Analysis
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Review observable website, SEO, keyword, link, and competitor
              signals to support better decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-black text-[#F97316]">
              6
            </div>

            <h3 className="mt-5 font-bold text-[#0F172A]">
              Practical Tools
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#64748B]">
              Access six SEO and marketing tools built for practical website
              analysis, research, and content workflows.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}