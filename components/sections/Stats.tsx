const stats = [
  {
    value: "10K+",
    label: "Websites Analyzed",
  },
  {
    value: "50K+",
    label: "Keywords Tracked",
  },
  {
    value: "5K+",
    label: "Businesses",
  },
  {
    value: "24/7",
    label: "AI Insights",
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