export default function CTA() {
  return (
    <section
      id="contact"
      className="bg-white px-5 py-20 sm:px-6 lg:px-8"
    >
      <div
        className="
          mx-auto max-w-6xl
          overflow-hidden rounded-3xl
          bg-[#0F172A]
          px-6 py-16
          text-center
          shadow-2xl
          sm:px-12
          lg:py-20
        "
      >
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#F97316]">
          Ready to Grow?
        </span>

        <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight text-white sm:text-5xl">
          Ready to Grow Your{" "}
          <span className="text-[#F97316]">
            Business?
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Start using smarter SEO tools and discover new growth
          opportunities for your business.
        </p>

        <a
          href="#tools"
          className="
            mt-9 inline-flex
            items-center
            rounded-xl
            bg-[#F97316]
            px-8 py-4
            font-bold text-white
            transition-all duration-200
            hover:-translate-y-0.5
            hover:bg-[#EA580C]
            hover:shadow-lg
            hover:shadow-orange-500/20
          "
        >
          Start Free Audit
          <span className="ml-2">
            →
          </span>
        </a>
      </div>
    </section>
  );
}