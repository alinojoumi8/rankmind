"use client";

import { useState } from "react";
import { Check, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    desc: "Get started with AI visibility monitoring at no cost.",
    features: [
      "1 website",
      "5 agent runs / month",
      "GEO Scout agent",
      "Site Doctor agent",
      "Basic dashboard",
    ],
    notIncluded: ["Content Architect", "Keyword Intel", "Authority Builder", "Competitor tracking"],
    cta: "Get Started Free",
    popular: false,
    color: "slate",
    href: "/signup",
  },
  {
    name: "Growth",
    monthlyPrice: 49,
    annualPrice: 39,
    desc: "The complete AI marketing suite for growing businesses.",
    features: [
      "3 websites",
      "Unlimited agent runs",
      "All 5 core AI agents",
      "Competitor citation tracking",
      "Weekly email reports",
      "Historical analytics charts",
      "Shareable client reports",
      "Google Search Console integration",
      "Team members (up to 3)",
    ],
    notIncluded: ["Slack webhooks", "Authority Builder", "Campaign Intel"],
    cta: "Start 14-Day Free Trial",
    popular: true,
    color: "indigo",
    href: "/signup",
  },
  {
    name: "Agency",
    monthlyPrice: 199,
    annualPrice: 159,
    desc: "Unlimited power for agencies managing multiple clients.",
    features: [
      "Unlimited websites",
      "Unlimited agent runs",
      "All 7 AI agents",
      "White-label PDF exports",
      "Slack webhook notifications",
      "Unlimited team members",
      "Priority support",
      "Campaign Intel agent",
      "Authority Builder agent",
    ],
    notIncluded: [],
    cta: "Start 14-Day Free Trial",
    popular: false,
    color: "violet",
    href: "/signup",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm text-indigo-400 uppercase tracking-widest font-medium mb-3">
            Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Agency-grade results,{" "}
            <span className="gradient-text">SMB-friendly price</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg mb-8">
            Start free for 14 days. No credit card required. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                !annual ? "bg-white text-black" : "text-slate-400 hover:text-white"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                annual ? "bg-white text-black" : "text-slate-400 hover:text-white"
              )}
            >
              Annual
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/15 rounded-full px-1.5">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl p-7 relative overflow-hidden",
                plan.popular
                  ? "bg-gradient-to-b from-indigo-950/80 to-[#080d1a] border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/10"
                  : "card-glow"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
              )}

              {plan.popular && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-[11px] font-bold text-white bg-indigo-500 rounded-full px-3 py-1">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-white">
                    ${annual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-slate-400 mb-2">/mo</span>
                </div>
                {annual && (
                  <p className="text-xs text-emerald-400">
                    Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={plan.href}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-semibold mb-6 transition-all block text-center",
                  plan.popular
                    ? "btn-primary text-white"
                    : "bg-white/8 hover:bg-white/12 text-white border border-white/10 hover:border-white/20"
                )}
              >
                {plan.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 line-through">
                    <div className="w-4 h-4 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Enterprise row */}
        <div className="mt-6 card-glow rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-bold text-white mb-1">Enterprise</div>
            <div className="text-sm text-slate-400">
              Unlimited sites, custom agent training, SLA guarantees, dedicated CSM, and custom integrations.
            </div>
          </div>
          <button className="flex-shrink-0 bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all">
            Talk to Sales
          </button>
        </div>

        {/* Trust row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: "14-day free trial", sub: "No credit card" },
            { label: "Cancel anytime", sub: "No lock-in" },
            { label: "SOC 2 Type II", sub: "Enterprise security" },
            { label: "99.9% uptime SLA", sub: "Always-on agents" },
          ].map((item) => (
            <div key={item.label} className="card-glow rounded-xl p-4">
              <div className="text-sm font-semibold text-white">{item.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
