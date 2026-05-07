"use client";

import { Globe, Cpu, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Globe,
    title: "Connect Your Site",
    desc: "Enter your domain and connect Google Search Console via OAuth. RankMind scans your site, analyses your current SEO health, and establishes your baseline GEO score across 5 AI search engines.",
    time: "< 5 minutes",
    details: [
      "Instant site health score",
      "GSC data import",
      "Initial GEO citation check",
      "Competitor benchmark",
    ],
    color: "indigo",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Agents Go to Work",
    desc: "Your 7 AI agents initialize and start running immediately. They crawl, analyze, generate content, fix technical issues, and start building your authority — continuously, around the clock.",
    time: "24 hours to first results",
    details: [
      "First content piece published",
      "Schema markup deployed",
      "Technical issues flagged",
      "Outreach prospects identified",
    ],
    color: "violet",
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Watch Your Visibility Grow",
    desc: "Your unified dashboard shows citation share across all AI engines, organic rank movements, domain authority growth, and a weekly AI-generated digest of what's working and what's next.",
    time: "Results visible in 30 days",
    details: [
      "Weekly performance digest",
      "Citation share increases",
      "Organic traffic growth",
      "White-label reports ready",
    ],
    color: "cyan",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; num: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", num: "text-indigo-500/30" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", num: "text-violet-500/30" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", num: "text-cyan-500/30" },
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <p className="text-sm text-indigo-400 uppercase tracking-widest font-medium mb-3">
            How It Works
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            From zero to{" "}
            <span className="gradient-text">omnipresent</span>
            <br />
            in 3 steps
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Setup takes less than 10 minutes. Results start appearing within 30 days.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-16 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20" />

          {steps.map((step, i) => {
            const colors = colorMap[step.color];
            const Icon = step.icon;
            return (
              <div key={i} className="relative">
                <div className="card-glow rounded-2xl p-8 h-full">
                  {/* Step number watermark */}
                  <div className={`text-8xl font-black ${colors.num} absolute top-4 right-6 leading-none pointer-events-none select-none`}>
                    {step.step}
                  </div>

                  <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  <div className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${colors.text} bg-white/4 border ${colors.border} rounded-full px-3 py-1 mb-4`}>
                    ⏱ {step.time}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">{step.desc}</p>

                  <ul className="space-y-2">
                    {step.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline bar */}
        <div className="mt-12 card-glow rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-white">Typical Results Timeline</span>
            <span className="text-xs text-slate-500">Based on 2,400+ customers</span>
          </div>
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 opacity-60 rounded-full shimmer" />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { time: "Day 1", label: "Agents live" },
              { time: "Week 1", label: "Content published" },
              { time: "Month 1", label: "+23% citations" },
              { time: "Month 3", label: "+147% citations" },
            ].map((milestone) => (
              <div key={milestone.time} className="text-center">
                <div className="text-[11px] font-semibold text-white">{milestone.time}</div>
                <div className="text-[10px] text-slate-500">{milestone.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
