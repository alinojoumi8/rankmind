"use client";

import {
  Bot,
  FileText,
  Code2,
  Link2,
  BarChart3,
  Wrench,
  Megaphone,
  ArrowRight,
} from "lucide-react";

const agents = [
  {
    icon: Bot,
    name: "GEO Scout",
    tagline: "AI Search Visibility Monitor",
    desc: "Tracks your brand across ChatGPT, Perplexity, Gemini, Claude, and Copilot daily. Measures citation share, sentiment, and competitor positioning across every major LLM.",
    features: ["5 LLMs monitored daily", "Citation share tracking", "Competitor gap alerts", "Sentiment analysis"],
    color: "indigo",
    badge: "Core",
  },
  {
    icon: FileText,
    name: "Content Architect",
    tagline: "E-E-A-T Content Generator",
    desc: "Analyzes what content LLMs actually cite in your niche, then generates and auto-publishes structured content optimized for AI extraction and traditional ranking.",
    features: ["Auto-publish to any CMS", "E-E-A-T optimization", "Citation-optimized format", "Topic cluster mapping"],
    color: "violet",
    badge: "Popular",
  },
  {
    icon: Code2,
    name: "Schema Architect",
    tagline: "Structured Data Automation",
    desc: "Crawls your site and auto-generates Schema.org JSON-LD markup. Implements FAQ, HowTo, Product, and LocalBusiness schemas that AI engines prioritize.",
    features: ["Auto-generated JSON-LD", "10+ schema types", "Daily validation checks", "Rich result monitoring"],
    color: "cyan",
    badge: null,
  },
  {
    icon: Link2,
    name: "Authority Builder",
    tagline: "Digital PR & Link Intelligence",
    desc: "Identifies high-authority publications in your niche, drafts personalized outreach, and converts unlinked brand mentions into backlinks automatically.",
    features: ["Prospect discovery", "Personalized outreach drafts", "Mention → link conversion", "DR trend tracking"],
    color: "emerald",
    badge: null,
  },
  {
    icon: BarChart3,
    name: "Keyword Intelligence",
    tagline: "Semantic Search Optimizer",
    desc: "Maps topic clusters using semantic relationships, identifies AI-friendly query patterns (questions, definitions, comparisons), and tracks rankings across Google and AI search.",
    features: ["Semantic cluster mapping", "AI-query pattern detection", "Multi-engine rank tracking", "Opportunity scoring"],
    color: "blue",
    badge: null,
  },
  {
    icon: Wrench,
    name: "Site Doctor",
    tagline: "Technical SEO Automation",
    desc: "Weekly full-site crawl detects and auto-fixes broken redirects, missing meta tags, Core Web Vitals issues, and crawlability problems — no dev required.",
    features: ["Full weekly crawl", "Auto-fix capabilities", "Core Web Vitals monitoring", "Health score 0–100"],
    color: "orange",
    badge: null,
  },
  {
    icon: Megaphone,
    name: "Campaign Intelligence",
    tagline: "Paid + Organic Sync",
    desc: "Analyzes which organic topics convert to build smarter paid campaigns. Generates Google Ads and Meta Ads briefs from real SEO performance data.",
    features: ["Organic → paid insights", "Ad brief generation", "Landing page optimization", "Blended CAC tracking"],
    color: "pink",
    badge: null,
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", glow: "shadow-violet-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-cyan-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-orange-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20", glow: "shadow-pink-500/20" },
};

export default function Features() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm text-indigo-400 uppercase tracking-widest font-medium mb-3">
            7 AI Agents
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
            Your full marketing team,{" "}
            <span className="gradient-text">automated</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Each agent runs autonomously, 24/7, handling a different pillar of your online visibility. Together they replace what would cost $15K–$30K/month in agency fees.
          </p>
        </div>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.slice(0, 6).map((agent) => {
            const colors = colorMap[agent.color];
            const Icon = agent.icon;
            return (
              <div
                key={agent.name}
                className="card-glow rounded-2xl p-6 group cursor-default relative overflow-hidden"
              >
                {agent.badge && (
                  <div className="absolute top-4 right-4 text-[10px] font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 rounded-full px-2.5 py-0.5">
                    {agent.badge}
                  </div>
                )}

                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:${colors.glow} transition-all`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>

                {/* Status */}
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active" />
                  <span className="text-[10px] text-slate-500 uppercase tracking-wide">Active</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                <p className={`text-xs font-medium ${colors.text} mb-3`}>{agent.tagline}</p>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{agent.desc}</p>

                <ul className="space-y-1.5">
                  {agent.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`w-1 h-1 rounded-full ${colors.text.replace("text-", "bg-")}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 7th agent — Campaign Intel — featured wide */}
        {(() => {
          const agent = agents[6];
          const colors = colorMap[agent.color];
          const Icon = agent.icon;
          return (
            <div className="mt-6 card-glow rounded-2xl p-6 group cursor-default">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-shrink-0">
                  <div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Active</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
                  <p className={`text-xs font-medium ${colors.text} mb-3`}>{agent.tagline}</p>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4 max-w-2xl">{agent.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {agent.features.map((f) => (
                      <span key={f} className="text-xs bg-white/5 border border-white/8 rounded-full px-3 py-1 text-slate-400">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0 self-center">
                  <a href="#pricing" className="flex items-center gap-2 text-sm text-white font-medium bg-white/5 hover:bg-white/8 border border-white/10 rounded-lg px-5 py-2.5 transition-all">
                    Try it free <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
