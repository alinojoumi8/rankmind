"use client";

import { useState } from "react";
import {
  Bot,
  TrendingUp,
  Search,
  FileText,
  Code2,
  Link2,
  BarChart3,
  Wrench,
  Megaphone,
  Bell,
  Settings,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Zap,
  Globe,
  Activity,
  Star,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const agents = [
  { id: "geo", name: "GEO Scout", icon: Bot, status: "active", lastRun: "2m ago", metric: "34.2% citation share", color: "indigo" },
  { id: "content", name: "Content Architect", icon: FileText, status: "active", lastRun: "12m ago", metric: "3 drafts ready", color: "violet" },
  { id: "schema", name: "Schema Architect", icon: Code2, status: "active", lastRun: "1h ago", metric: "12 schemas live", color: "cyan" },
  { id: "authority", name: "Authority Builder", icon: Link2, status: "active", lastRun: "3h ago", metric: "8 links built", color: "emerald" },
  { id: "keywords", name: "Keyword Intelligence", icon: BarChart3, status: "active", lastRun: "30m ago", metric: "47 rankings up", color: "blue" },
  { id: "doctor", name: "Site Doctor", icon: Wrench, status: "active", lastRun: "6h ago", metric: "Score: 94/100", color: "orange" },
  { id: "campaign", name: "Campaign Intel", icon: Megaphone, status: "active", lastRun: "1d ago", metric: "CPA -23%", color: "pink" },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  cyan: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  blue: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

const kpiCards = [
  { label: "Citation Share", value: "34.2%", change: "+12.1%", up: true, sub: "across 5 LLMs" },
  { label: "Organic Traffic", value: "18,420", change: "+31%", up: true, sub: "vs last month" },
  { label: "GEO Score", value: "87/100", change: "+14 pts", up: true, sub: "vs 73 last month" },
  { label: "Domain Rating", value: "52", change: "+8", up: true, sub: "Ahrefs DR" },
  { label: "Tech Health", value: "94/100", change: "+6 pts", up: true, sub: "Site Doctor" },
  { label: "Monthly Leads", value: "284", change: "+43%", up: true, sub: "from SEO channels" },
];

const llmCitations = [
  { llm: "ChatGPT", citations: 42, change: +8, color: "bg-green-400" },
  { llm: "Perplexity", citations: 31, change: +12, color: "bg-indigo-400" },
  { llm: "Gemini", citations: 28, change: +5, color: "bg-blue-400" },
  { llm: "Claude", citations: 35, change: +15, color: "bg-violet-400" },
  { llm: "Copilot", citations: 19, change: +3, color: "bg-cyan-400" },
];

const recentActivity = [
  { time: "2m ago", agent: "GEO Scout", action: "Citation detected in ChatGPT response for 'best CRM software'", type: "success" },
  { time: "12m ago", agent: "Content Architect", action: "Published 'Ultimate Guide to B2B Lead Generation 2026' (1,847 words)", type: "info" },
  { time: "1h ago", agent: "Schema Architect", action: "Deployed FAQ schema to 8 new pages. Rich results expected in 48h.", type: "info" },
  { time: "3h ago", agent: "Authority Builder", action: "Backlink acquired from techcrunch.com (DR 94) for 'AI CRM tools' article", type: "success" },
  { time: "5h ago", agent: "Keyword Intel", action: "Detected competitor ranking drop for 'sales automation software' — opportunity flagged", type: "warning" },
  { time: "6h ago", agent: "Site Doctor", action: "Fixed 14 broken redirects. Crawl score improved from 88 → 94", type: "success" },
];

const contentPipeline = [
  { title: "10 Best AI Search Optimization Strategies for SaaS in 2026", status: "published", citations: 3, traffic: 420 },
  { title: "GEO vs SEO: Complete Comparison Guide", status: "published", citations: 7, traffic: 1240 },
  { title: "How to Rank in ChatGPT Search Results", status: "review", citations: 0, traffic: 0 },
  { title: "Perplexity Optimization: The 2026 Playbook", status: "draft", citations: 0, traffic: 0 },
  { title: "Schema Markup for AI Search Engines", status: "generating", citations: 0, traffic: 0 },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "agents", "content", "citations", "reports"];

  return (
    <div className="min-h-screen bg-[#050914] text-white flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 bg-[#080d1a] border-r border-white/5 p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-base text-white">
            Rank<span className="gradient-text">Mind</span>
          </span>
        </Link>

        {/* Site selector */}
        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 mb-6 cursor-pointer hover:bg-white/8 transition-colors">
          <Globe className="w-4 h-4 text-slate-400" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">acme-corp.com</div>
            <div className="text-[10px] text-slate-500">Growth Plan</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          {[
            { icon: Activity, label: "Overview", id: "overview" },
            { icon: Bot, label: "AI Agents", id: "agents" },
            { icon: FileText, label: "Content", id: "content" },
            { icon: Search, label: "Citations", id: "citations" },
            { icon: BarChart3, label: "Keywords", id: "keywords" },
            { icon: TrendingUp, label: "Reports", id: "reports" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                activeTab === item.id
                  ? "bg-indigo-500/15 text-indigo-300 font-medium"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="pt-4 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-[#050914]/90 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Overview</h1>
            <p className="text-[11px] text-slate-500">acme-corp.com · Updated 2 minutes ago</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 agent-active" />
              7/7 Agents Active
            </div>
            <button className="relative w-8 h-8 rounded-lg bg-white/5 hover:bg-white/8 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-400 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
              AC
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className="card-glow rounded-xl p-4">
                <div className="text-[11px] text-slate-500 mb-1">{kpi.label}</div>
                <div className="text-xl font-bold text-white mb-0.5">{kpi.value}</div>
                <div className="flex items-center gap-1">
                  {kpi.up ? (
                    <ArrowUp className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <ArrowDown className="w-3 h-3 text-rose-400" />
                  )}
                  <span className={cn("text-[11px] font-medium", kpi.up ? "text-emerald-400" : "text-rose-400")}>
                    {kpi.change}
                  </span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Agent status */}
            <div className="card-glow rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">AI Agents</h2>
                <span className="text-[10px] text-emerald-400 font-medium">All running</span>
              </div>
              <div className="space-y-3">
                {agents.map((agent) => {
                  const colors = colorMap[agent.color];
                  const Icon = agent.icon;
                  return (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg, `border ${colors.border}`)}>
                        <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{agent.name}</div>
                        <div className="text-[10px] text-slate-500">{agent.metric}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 agent-active" />
                        <span className="text-[10px] text-slate-600">{agent.lastRun}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LLM Citations */}
            <div className="card-glow rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">AI Citation Share</h2>
                <span className="text-[10px] text-slate-500">Last 30 days</span>
              </div>
              <div className="space-y-3.5">
                {llmCitations.map((item) => (
                  <div key={item.llm}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-300">{item.llm}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400">+{item.change}%</span>
                        <span className="text-xs font-semibold text-white">{item.citations}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full opacity-70", item.color)}
                        style={{ width: `${item.citations}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic trend */}
            <div className="card-glow rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Traffic by Channel</h2>
                <span className="text-[10px] text-slate-500">This month</span>
              </div>
              <div className="space-y-3">
                {[
                  { channel: "Organic Search", visits: 11840, pct: 64, color: "bg-indigo-400" },
                  { channel: "AI Search", visits: 3420, pct: 19, color: "bg-violet-400" },
                  { channel: "Direct", visits: 1850, pct: 10, color: "bg-cyan-400" },
                  { channel: "Social", visits: 840, pct: 5, color: "bg-pink-400" },
                  { channel: "Referral", visits: 470, pct: 3, color: "bg-emerald-400" },
                ].map((c) => (
                  <div key={c.channel} className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", c.color)} />
                    <div className="flex-1 text-xs text-slate-300">{c.channel}</div>
                    <div className="text-[10px] text-slate-500">{c.visits.toLocaleString()}</div>
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full opacity-70", c.color)} style={{ width: `${c.pct}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-400 w-6 text-right">{c.pct}%</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">AI Search growing</span>
                  <span className="text-emerald-400 font-semibold">+184% MoM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content pipeline */}
          <div className="card-glow rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Content Pipeline</h2>
              <button className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                View all <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5">
                    <th className="text-left font-medium pb-2 pr-4">Title</th>
                    <th className="text-left font-medium pb-2 pr-4">Status</th>
                    <th className="text-right font-medium pb-2 pr-4">AI Citations</th>
                    <th className="text-right font-medium pb-2">Traffic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contentPipeline.map((item, i) => (
                    <tr key={i} className="hover:bg-white/2 transition-colors">
                      <td className="py-2.5 pr-4 text-slate-300 max-w-[300px] truncate">{item.title}</td>
                      <td className="py-2.5 pr-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                          item.status === "published" && "bg-emerald-500/10 text-emerald-400",
                          item.status === "review" && "bg-amber-500/10 text-amber-400",
                          item.status === "draft" && "bg-slate-500/10 text-slate-400",
                          item.status === "generating" && "bg-indigo-500/10 text-indigo-400",
                        )}>
                          {item.status === "generating" && <span className="w-1 h-1 bg-indigo-400 rounded-full agent-active" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        {item.citations > 0 ? (
                          <span className="flex items-center justify-end gap-1 text-emerald-400">
                            <Star className="w-3 h-3 fill-emerald-400" />
                            {item.citations}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-400">
                        {item.traffic > 0 ? item.traffic.toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed */}
          <div className="card-glow rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Agent Activity Feed</h2>
              <span className="text-[10px] text-slate-500">Today</span>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                    activity.type === "success" && "bg-emerald-400",
                    activity.type === "info" && "bg-indigo-400",
                    activity.type === "warning" && "bg-amber-400",
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium text-indigo-400">{activity.agent}</span>
                      <span className="text-[10px] text-slate-600">{activity.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{activity.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
