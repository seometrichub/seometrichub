const stats = [
  {
    value: "6",
    label: "SEO & Marketing Tools",
  },
  {
    value: "Real",
    label: "Website Analysis",
  },
  {
    value: "AI",
    label: "Content Generation",
  },
  {
    value: "24/7",
    label: "Tools Available",
  },
];

export default function Stats() {
  return (
    <section className="border-y border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-[#E2E8F0] px-5 py-10 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="px-4 text-center"
          >
            <div className="text-3xl font-black text-[#0F172A] sm:text-4xl">
              {stat.value}
            </div>

            <div className="mt-2 text-sm font-medium text-[#64748B]">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}