"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Bot, TrendingUp, Search, Sparkles } from "lucide-react";

const floatingCards = [
  {
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    label: "Citation Share",
    value: "+147%",
    sub: "vs last month",
    color: "emerald",
    pos: "top-[15%] left-[5%]",
  },
  {
    icon: <Bot className="w-4 h-4 text-indigo-400" />,
    label: "AI Agents Active",
    value: "7/7",
    sub: "Running 24/7",
    color: "indigo",
    pos: "top-[20%] right-[4%]",
  },
  {
    icon: <Search className="w-4 h-4 text-cyan-400" />,
    label: "LLMs Monitored",
    value: "5",
    sub: "ChatGPT, Perplexity...",
    color: "cyan",
    pos: "bottom-[25%] left-[3%]",
  },
  {
    icon: <Sparkles className="w-4 h-4 text-violet-400" />,
    label: "Content Published",
    value: "38",
    sub: "AI-optimized pieces",
    color: "violet",
    pos: "bottom-[20%] right-[5%]",
  },
];

const llmBadges = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Copilot"];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-grid pt-16"
    >
      {/* Background glows */}
      <div className="hero-glow w-[600px] h-[600px] bg-indigo-600/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="hero-glow w-[400px] h-[400px] bg-violet-600/15 top-[20%] left-[20%]" />
      <div className="hero-glow w-[300px] h-[300px] bg-cyan-600/10 bottom-[20%] right-[20%]" />

      {/* Floating stat cards */}
      {floatingCards.map((card, i) => (
        <div
          key={i}
          className={`absolute ${card.pos} hidden lg:flex items-center gap-3 card-glow rounded-xl px-4 py-3 float`}
          style={{ animationDelay: `${i * 1.5}s` }}
        >
          <div className={`w-8 h-8 rounded-lg bg-${card.color}-500/15 flex items-center justify-center`}>
            {card.icon}
          </div>
          <div>
            <div className="text-xs text-slate-400">{card.label}</div>
            <div className="font-bold text-white text-sm">{card.value}</div>
            <div className="text-[10px] text-slate-500">{card.sub}</div>
          </div>
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 agent-active" />
          <span className="text-xs text-indigo-300 font-medium">
            7 AI Agents Working Right Now for 2,400+ Businesses
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">
          Dominate Google{" "}
          <span className="gradient-text">AND</span>
          <br />
          AI Search Engines
          <br />
          <span className="text-slate-500 text-4xl sm:text-5xl lg:text-6xl font-bold">
            Automatically.
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
          RankMind deploys 7 AI agents that optimize your visibility across traditional SEO
          and the new AI search ecosystem — ChatGPT, Perplexity, Gemini, and more.{" "}
          <span className="text-white font-medium">No marketing team required.</span>
        </p>

        {/* LLM badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          <span className="text-xs text-slate-500">Optimizes for:</span>
          {llmBadges.map((badge) => (
            <span
              key={badge}
              className="text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1 text-slate-300"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="#pricing"
            className="btn-primary flex items-center gap-2 text-white font-semibold px-8 py-4 rounded-xl text-base w-full sm:w-auto justify-center"
          >
            Start Free — 14 Days
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-8 py-4 rounded-xl text-base transition-all w-full sm:w-auto justify-center"
          >
            See Live Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Social proof micro */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <div className="flex -space-x-2">
            {["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b"].map((c, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-[#050914] flex items-center justify-center text-[10px] text-white font-bold"
                style={{ background: c }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span>
            <strong className="text-slate-300">2,400+</strong> businesses growing with RankMind
          </span>
          <span className="hidden sm:block">·</span>
          <span className="hidden sm:block">
            Avg <strong className="text-emerald-400">+147%</strong> citation share in 90 days
          </span>
        </div>
      </div>

      {/* Dashboard preview teaser */}
      <div className="relative z-10 mt-16 w-full max-w-5xl mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden gradient-border">
          <div className="bg-[#080d1a] rounded-2xl p-1">
            <div className="bg-[#0a0f1e] rounded-xl overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-white/5 rounded-md h-6 mx-4 flex items-center justify-center">
                  <span className="text-[10px] text-slate-500">app.rankmind.ai/dashboard</span>
                </div>
              </div>

              {/* Dashboard content */}
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreview() {
  const agents = [
    { name: "GEO Scout", status: "active", metric: "5 LLMs tracked", color: "indigo" },
    { name: "Content Architect", status: "active", metric: "3 drafts ready", color: "violet" },
    { name: "Schema Architect", status: "active", metric: "12 schemas live", color: "cyan" },
    { name: "Authority Builder", status: "active", metric: "8 links built", color: "emerald" },
    { name: "Site Doctor", status: "active", metric: "Score: 94/100", color: "blue" },
    { name: "Keyword Intel", status: "active", metric: "47 rankings up", color: "pink" },
    { name: "Campaign Intel", status: "active", metric: "CPA -23%", color: "orange" },
  ];

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* Stats row */}
      <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Citation Share", value: "34.2%", change: "+12.1%", up: true },
          { label: "Organic Traffic", value: "18,420", change: "+31%", up: true },
          { label: "GEO Score", value: "87/100", change: "+14 pts", up: true },
          { label: "Domain Rating", value: "52", change: "+8", up: true },
        ].map((stat) => (
          <div key={stat.label} className="bg-white/3 rounded-xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 mb-1">{stat.label}</div>
            <div className="text-lg font-bold text-white">{stat.value}</div>
            <div className="text-[10px] text-emerald-400">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Agent list */}
      <div className="sm:col-span-2 bg-white/3 rounded-xl border border-white/5 p-4">
        <div className="text-xs font-semibold text-slate-400 mb-3">Active Agents</div>
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active`} />
                <span className="text-xs text-slate-300">{agent.name}</span>
              </div>
              <span className="text-[10px] text-slate-500">{agent.metric}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Citation chart placeholder */}
      <div className="bg-white/3 rounded-xl border border-white/5 p-4">
        <div className="text-xs font-semibold text-slate-400 mb-3">AI Citation Share</div>
        <div className="space-y-2">
          {[
            { llm: "ChatGPT", pct: 42, color: "bg-green-400" },
            { llm: "Perplexity", pct: 31, color: "bg-indigo-400" },
            { llm: "Gemini", pct: 28, color: "bg-blue-400" },
            { llm: "Claude", pct: 35, color: "bg-violet-400" },
            { llm: "Copilot", pct: 19, color: "bg-cyan-400" },
          ].map((item) => (
            <div key={item.llm}>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>{item.llm}</span>
                <span>{item.pct}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full opacity-70`}
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
