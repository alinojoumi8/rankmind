"use client";

import { ArrowRight, Sparkles } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-violet-950/30 to-[#050914] pointer-events-none" />
      <div className="hero-glow w-[500px] h-[500px] bg-indigo-600/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs text-indigo-300 font-medium">
            14-day free trial — no credit card required
          </span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">
          Your competitors are already{" "}
          <span className="gradient-text">optimizing for AI search.</span>
          <br />
          Are you?
        </h2>

        <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Every day you wait, competitors are building citation share in ChatGPT and Perplexity that converts 4.4× better than organic. Start your free trial and have all 7 agents running in under 10 minutes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <a
            href="#pricing"
            className="btn-primary flex items-center gap-2 text-white font-bold px-10 py-4 rounded-xl text-base w-full sm:w-auto justify-center"
          >
            Start Free Trial — 14 Days
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/dashboard"
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base transition-all w-full sm:w-auto justify-center"
          >
            See Live Demo
          </a>
        </div>

        <p className="text-xs text-slate-600">
          No credit card required · Cancel anytime · SOC 2 Type II · 99.9% uptime SLA
        </p>

        {/* Brand logos / "as seen in" */}
        <div className="mt-16 pt-10 border-t border-white/5">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-6">
            As featured in
          </p>
          <div className="flex items-center justify-center gap-8 flex-wrap opacity-30">
            {["TechCrunch", "Search Engine Land", "Marketing Brew", "Product Hunt", "Forbes"].map((brand) => (
              <span key={brand} className="text-sm font-bold text-slate-400 tracking-wide">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
