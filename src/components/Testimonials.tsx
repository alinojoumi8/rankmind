"use client";

import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Founder, NestNook Interiors",
    avatar: "SC",
    color: "#6366f1",
    quote:
      "We went from invisible in ChatGPT searches to being cited in 38% of relevant interior design queries. Our organic traffic doubled in 90 days. I cancelled our $4K/month SEO agency on month two.",
    metrics: [
      { label: "Citation share", value: "+38%" },
      { label: "Organic traffic", value: "+103%" },
    ],
    stars: 5,
  },
  {
    name: "Marcus Webb",
    role: "CMO, Veloce SaaS",
    avatar: "MW",
    color: "#8b5cf6",
    quote:
      "The GEO Scout agent showed us we were completely invisible on Perplexity while our main competitor had 40% citation share. Within 60 days we'd closed that gap by half — without writing a single piece of content ourselves.",
    metrics: [
      { label: "Perplexity citations", value: "+180%" },
      { label: "Demo requests", value: "+67%" },
    ],
    stars: 5,
  },
  {
    name: "Priya Nair",
    role: "Agency Owner, Apex Digital",
    avatar: "PN",
    color: "#06b6d4",
    quote:
      "I manage 22 client sites with RankMind Agency plan. The white-label reports alone save me 20 hours a month. My clients see better results than when I was manually doing everything, and my margins have tripled.",
    metrics: [
      { label: "Time saved", value: "20h/mo" },
      { label: "Agency margin", value: "+3×" },
    ],
    stars: 5,
  },
  {
    name: "Tom Okafor",
    role: "E-commerce Director, GlowNaturals",
    avatar: "TO",
    color: "#10b981",
    quote:
      "Site Doctor found 147 technical SEO issues on our Shopify store that we didn't know existed. It fixed 89 of them automatically. Our Core Web Vitals went from failing to 95+ Lighthouse score in a week.",
    metrics: [
      { label: "Issues auto-fixed", value: "89" },
      { label: "Lighthouse score", value: "95+" },
    ],
    stars: 5,
  },
  {
    name: "Jordan Blake",
    role: "Content Lead, TechBridge Media",
    avatar: "JB",
    color: "#f59e0b",
    quote:
      "Content Architect generates pieces that actually get cited by AI engines. We publish 20 articles a month automatically and each one is structured for maximum LLM extraction. Our editorial team now focuses on strategy, not drafting.",
    metrics: [
      { label: "AI-cited articles", value: "73%" },
      { label: "Editorial time saved", value: "60%" },
    ],
    stars: 5,
  },
  {
    name: "Lisa Fontaine",
    role: "Marketing Manager, RealBridge CRM",
    avatar: "LF",
    color: "#ef4444",
    quote:
      "The ROI is absurd. We were paying $8K/month in SEO services. Now we pay $149 and get better results, faster. The dashboard makes it easy to show my CEO the exact dollar value of every agent action.",
    metrics: [
      { label: "Cost reduction", value: "98%" },
      { label: "Results quality", value: "Better" },
    ],
    stars: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <p className="text-sm text-indigo-400 uppercase tracking-widest font-medium mb-3">
            Customer Stories
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Real results from{" "}
            <span className="gradient-text">real businesses</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Join 2,400+ businesses that switched to RankMind and never looked back.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="card-glow rounded-2xl p-6 flex flex-col">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array(t.stars).fill(0).map((_, si) => (
                  <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <div className="mb-6 flex-1">
                <Quote className="w-5 h-5 text-indigo-500/40 mb-3" />
                <p className="text-sm text-slate-300 leading-relaxed">{t.quote}</p>
              </div>

              {/* Metrics */}
              <div className="flex gap-3 mb-4">
                {t.metrics.map((m) => (
                  <div key={m.label} className="flex-1 bg-white/4 rounded-lg p-2.5 text-center">
                    <div className="text-sm font-bold text-white">{m.value}</div>
                    <div className="text-[10px] text-slate-500">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary bar */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "2,400+", label: "Active businesses" },
            { value: "4.9/5", label: "Average rating" },
            { value: "147%", label: "Avg citation growth (90d)" },
            { value: "<3%", label: "Monthly churn rate" },
          ].map((s) => (
            <div key={s.label} className="card-glow rounded-xl p-5 text-center">
              <div className="text-3xl font-black gradient-text mb-1">{s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
