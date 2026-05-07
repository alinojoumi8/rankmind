"use client";

const stats = [
  {
    value: "80%",
    label: "of LLM citations",
    desc: "don't appear in Google's top 100 results",
    color: "text-rose-400",
  },
  {
    value: "4.4×",
    label: "better conversion",
    desc: "from AI search visitors vs classic organic",
    color: "text-emerald-400",
  },
  {
    value: "31%",
    label: "of US users",
    desc: "will use generative AI search in 2026",
    color: "text-indigo-400",
  },
  {
    value: "$4.5B",
    label: "market by 2033",
    desc: "AI SEO tools industry CAGR of 15.2%",
    color: "text-violet-400",
  },
];

export default function Stats() {
  return (
    <section className="py-16 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm text-slate-500 uppercase tracking-widest font-medium mb-2">
            Why RankMind exists
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            The search landscape has{" "}
            <span className="gradient-text">fractured</span>
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm">
            Google optimization alone is no longer enough. AI engines are a separate, faster-converting channel — and most businesses are completely invisible there.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-[#050914] p-8 flex flex-col items-center text-center hover:bg-[#080d1a] transition-colors"
            >
              <div className={`text-4xl sm:text-5xl font-black mb-2 ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-xs text-slate-500 leading-relaxed">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
