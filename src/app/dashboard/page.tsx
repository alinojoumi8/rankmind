"use client";

import { useState, useEffect, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
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
  Plus,
  LogOut,
  Play,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Site {
  id: string;
  domain: string;
  name: string;
  industry?: string | null;
}

interface DashData {
  site: { id: string; domain: string; name: string };
  metrics: {
    citationShare: number;
    organicTraffic: number;
    geoScore: number;
    domainRating: number;
    techScore: number;
    monthlyLeads: number;
  };
  llmCitationShare: { llm: string; citationRate: number; total: number; cited: number }[];
  agentStatuses: { name: string; status: string; lastRun: string | null; lastSummary: unknown }[];
  recentCitations: { id: string; llm: string; query: string; cited: boolean; sentiment: string | null; checkedAt: string }[];
  contents: { id: string; title: string; status: string; wordCount: number; seoScore: number | null; geoScore: number | null }[];
  issues: { id: string; type: string; severity: string; url: string; description: string }[];
}

// ── Static meta ───────────────────────────────────────────────────────────────

const agentMeta = [
  { id: "geo-scout",        name: "GEO Scout",          icon: Bot,       color: "indigo",  runnable: true },
  { id: "content-architect",name: "Content Architect",  icon: FileText,  color: "violet",  runnable: true },
  { id: "schema-architect", name: "Schema Architect",   icon: Code2,     color: "cyan",    runnable: false },
  { id: "authority-builder",name: "Authority Builder",  icon: Link2,     color: "emerald", runnable: false },
  { id: "keyword-intel",    name: "Keyword Intelligence",icon: BarChart3, color: "blue",    runnable: false },
  { id: "site-doctor",      name: "Site Doctor",        icon: Wrench,    color: "orange",  runnable: true },
  { id: "campaign-intel",   name: "Campaign Intel",     icon: Megaphone, color: "pink",    runnable: false },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo:  { bg: "bg-indigo-500/10",  text: "text-indigo-400",  border: "border-indigo-500/20" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20" },
  cyan:    { bg: "bg-cyan-500/10",    text: "text-cyan-400",    border: "border-cyan-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  orange:  { bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/20" },
  pink:    { bg: "bg-pink-500/10",    text: "text-pink-400",    border: "border-pink-500/20" },
};

const agentEndpoint: Record<string, string> = {
  "geo-scout":         "/api/agents/geo-scout",
  "content-architect": "/api/agents/content",
  "site-doctor":       "/api/agents/site-doctor",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Add-Site Modal ────────────────────────────────────────────────────────────

function AddSiteModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (site: Site) => void }) {
  const [domain, setDomain] = useState("");
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          name,
          industry,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to add site");
        return;
      }
      onCreated(data.site);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#080d1a] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Add your website</h2>
            <p className="text-xs text-slate-500 mt-0.5">Set up AI agents to optimize your online presence</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-400">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Domain / URL *</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              required
              placeholder="example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Site / Brand name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Corp"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Industry</label>
            <input
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. SaaS, e-commerce, healthcare"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target keywords <span className="text-slate-600">(comma-separated)</span></label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="AI tools, marketing automation, CRM"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60 text-white font-semibold text-sm rounded-lg px-4 py-2.5 transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding site...</> : "Add Site & Start Agents"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [activeTab, setActiveTab] = useState("overview");
  const tabs = ["overview", "agents", "content", "citations", "reports"];

  const [sites, setSites] = useState<Site[]>([]);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [dashData, setDashData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const [agentRunning, setAgentRunning] = useState<Record<string, boolean>>({});
  const [agentToast, setAgentToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const loadDashboard = useCallback(async (siteId: string) => {
    const res = await fetch(`/api/dashboard?siteId=${siteId}`);
    if (res.ok) setDashData(await res.json());
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/login"); return; }

    async function init() {
      try {
        // Upsert Clerk user into our DB, then load their sites
        const sitesRes = await fetch(`/api/sites?userId=${clerkUser!.id}`);
        if (sitesRes.ok) {
          const { sites } = await sitesRes.json();
          setSites(sites ?? []);
          if (sites?.length > 0) {
            setCurrentSite(sites[0]);
            await loadDashboard(sites[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [isLoaded, clerkUser, router, loadDashboard]);

  async function runAgent(agentId: string) {
    if (!currentSite || agentRunning[agentId]) return;
    setAgentRunning((p) => ({ ...p, [agentId]: true }));
    setAgentToast(null);
    try {
      const endpoint = agentEndpoint[agentId];
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: currentSite.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAgentToast({ msg: data.summary ?? "Agent completed", ok: true });
        await loadDashboard(currentSite.id);
      } else {
        setAgentToast({ msg: data.error ?? "Agent failed", ok: false });
      }
    } catch {
      setAgentToast({ msg: "Network error", ok: false });
    } finally {
      setAgentRunning((p) => ({ ...p, [agentId]: false }));
      setTimeout(() => setAgentToast(null), 5000);
    }
  }

  async function handleLogout() {
    await signOut({ redirectUrl: "/" });
  }

  function handleSiteCreated(site: Site) {
    setSites((p) => [site, ...p]);
    setCurrentSite(site);
    setShowAddSite(false);
    loadDashboard(site.id);
  }

  // ── KPI values (real data or zeros) ────────────────────────────────────────
  const m = dashData?.metrics;
  const kpiCards = [
    { label: "Citation Share",   value: m ? `${m.citationShare}%`       : "—",     change: "+0%",   up: true,  sub: "across 5 LLMs" },
    { label: "Organic Traffic",  value: m ? m.organicTraffic.toLocaleString() : "—", change: "+0%", up: true,  sub: "vs last month" },
    { label: "GEO Score",        value: m ? `${m.geoScore}/100`          : "—",     change: "+0 pts",up: true,  sub: "optimization score" },
    { label: "Domain Rating",    value: m ? String(m.domainRating)       : "—",     change: "+0",    up: true,  sub: "Ahrefs DR" },
    { label: "Tech Health",      value: m ? `${m.techScore}/100`         : "—",     change: "+0 pts",up: true,  sub: "Site Doctor" },
    { label: "Monthly Leads",    value: m ? String(m.monthlyLeads)       : "—",     change: "+0%",   up: true,  sub: "from SEO channels" },
  ];

  // ── Clerk not yet hydrated ──────────────────────────────────────────────────
  if (!isLoaded || (isLoaded && !clerkUser)) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Clerk user display helpers
  const displayName = clerkUser.fullName ?? clerkUser.primaryEmailAddress?.emailAddress ?? "";
  const displayInitials = displayName
    ? displayName.trim().split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-slate-500">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  // ── No sites — onboarding ───────────────────────────────────────────────────
  if (!currentSite && !loading) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center p-4">
        {showAddSite && <AddSiteModal userId={clerkUser.id} onClose={() => setShowAddSite(false)} onCreated={handleSiteCreated} />}
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Welcome{clerkUser.firstName ? `, ${clerkUser.firstName}` : ""}!
          </h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Add your website to start monitoring your AI citation share, run technical SEO audits, and generate optimized content — all automatically.
          </p>
          <button
            onClick={() => setShowAddSite(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold text-sm rounded-xl px-6 py-3 transition-all shadow-lg shadow-indigo-500/25"
          >
            <Plus className="w-4 h-4" />
            Add Your First Site
          </button>
          <button
            onClick={handleLogout}
            className="block mt-4 mx-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // ── Merge agent statuses with meta ─────────────────────────────────────────
  const agentCards = agentMeta.map((meta) => {
    const status = dashData?.agentStatuses.find((a) => a.name === meta.id);
    return {
      ...meta,
      status: status?.status ?? "never_run",
      lastRun: status?.lastRun ?? null,
    };
  });

  const activeCount = agentCards.filter((a) => a.status === "completed").length;

  // ── Full dashboard ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050914] text-white flex">
      {/* Add site modal */}
      {showAddSite && <AddSiteModal userId={clerkUser.id} onClose={() => setShowAddSite(false)} onCreated={handleSiteCreated} />}

      {/* Toast notification */}
      {agentToast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border max-w-sm",
          agentToast.ok
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        )}>
          <span className={cn("w-2 h-2 rounded-full flex-shrink-0", agentToast.ok ? "bg-emerald-400" : "bg-rose-400")} />
          {agentToast.msg}
          <button onClick={() => setAgentToast(null)} className="ml-1 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col fixed inset-y-0 left-0 bg-[#080d1a] border-r border-white/5 p-4">
        <Link href="/" className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-base text-white">
            Rank<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Mind</span>
          </span>
        </Link>

        {/* Site selector */}
        <div className="mb-2">
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/8 transition-colors">
            <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{currentSite?.domain}</div>
              <div className="text-[10px] text-slate-500">{currentSite?.name}</div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          </div>
          {sites.length > 1 && (
            <div className="mt-1 space-y-0.5">
              {sites.filter(s => s.id !== currentSite?.id).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setCurrentSite(s); loadDashboard(s.id); }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-white hover:bg-white/5 transition-all truncate"
                >
                  {s.domain}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowAddSite(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 mt-1 rounded-lg text-[11px] text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition-all"
          >
            <Plus className="w-3 h-3" /> Add site
          </button>
        </div>

        {/* Nav */}
        <nav className="space-y-1 flex-1 mt-4">
          {[
            { icon: Activity,   label: "Overview",   id: "overview" },
            { icon: Bot,        label: "AI Agents",  id: "agents" },
            { icon: FileText,   label: "Content",    id: "content" },
            { icon: Search,     label: "Citations",  id: "citations" },
            { icon: BarChart3,  label: "Keywords",   id: "keywords" },
            { icon: TrendingUp, label: "Reports",    id: "reports" },
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
          <Link
            href="/billing"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Zap className="w-4 h-4" />
            Plans & Billing
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60 flex-1">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-[#050914]/90 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-white">Overview</h1>
            <p className="text-[11px] text-slate-500">{currentSite?.domain} · {dashData ? "Live data" : "Waiting for first agent run"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 text-[11px] rounded-full px-3 py-1 border",
              activeCount > 0
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : "text-slate-400 bg-white/5 border-white/10"
            )}>
              {activeCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              {activeCount > 0 ? `${activeCount}/7 Agents Run` : "No agents run yet"}
            </div>
            <button className="relative w-8 h-8 rounded-lg bg-white/5 hover:bg-white/8 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {displayInitials}
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* First-run prompt */}
          {!dashData?.recentCitations?.length && !dashData?.contents?.length && (
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Run your first agents to see live data</p>
                <p className="text-xs text-slate-500 mt-0.5">GEO Scout scans AI citations, Site Doctor audits your tech health, Content Architect generates SEO articles.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {["geo-scout", "site-doctor"].map((id) => (
                  <button
                    key={id}
                    onClick={() => runAgent(id)}
                    disabled={!!agentRunning[id]}
                    className="flex items-center gap-1.5 text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 rounded-lg px-3 py-1.5 transition-all disabled:opacity-50"
                  >
                    {agentRunning[id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {id === "geo-scout" ? "GEO Scout" : "Site Doctor"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiCards.map((kpi) => (
              <div key={kpi.label} className="bg-[#080d1a] border border-white/5 rounded-xl p-4">
                <div className="text-[11px] text-slate-500 mb-1">{kpi.label}</div>
                <div className="text-xl font-bold text-white mb-0.5">{kpi.value}</div>
                <div className="flex items-center gap-1">
                  {kpi.up ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-rose-400" />}
                  <span className={cn("text-[11px] font-medium", kpi.up ? "text-emerald-400" : "text-rose-400")}>{kpi.change}</span>
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Agent status */}
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">AI Agents</h2>
                <button
                  onClick={() => currentSite && loadDashboard(currentSite.id)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2.5">
                {agentCards.map((agent) => {
                  const colors = colorMap[agent.color];
                  const Icon = agent.icon;
                  const isRunning = agentRunning[agent.id];
                  return (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg, `border ${colors.border}`)}>
                        {isRunning
                          ? <Loader2 className={cn("w-3.5 h-3.5 animate-spin", colors.text)} />
                          : <Icon className={cn("w-3.5 h-3.5", colors.text)} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{agent.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {isRunning ? "Running…" : timeAgo(agent.lastRun)}
                        </div>
                      </div>
                      {agent.runnable ? (
                        <button
                          onClick={() => runAgent(agent.id)}
                          disabled={isRunning}
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-medium rounded-md px-2 py-0.5 border transition-all",
                            agent.status === "never_run" || agent.status === "failed"
                              ? `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
                            isRunning && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {isRunning
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : agent.status === "never_run" || agent.status === "failed"
                              ? <Play className="w-3 h-3" />
                              : <RefreshCw className="w-3 h-3" />
                          }
                          {isRunning ? "…" : agent.status === "never_run" ? "Run" : "Re-run"}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 px-2 py-0.5 rounded-md bg-white/3 border border-white/5">
                          Soon
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LLM Citations */}
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">AI Citation Share</h2>
                <span className="text-[10px] text-slate-500">Last 50 queries</span>
              </div>
              {dashData?.llmCitationShare && dashData.llmCitationShare.length > 0 ? (
                <div className="space-y-3.5">
                  {dashData.llmCitationShare.map((item) => (
                    <div key={item.llm}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-300 capitalize">{item.llm}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{item.citationRate}%</span>
                          <span className="text-[10px] text-slate-600">{item.cited}/{item.total}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 rounded-full opacity-70" style={{ width: `${item.citationRate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Bot className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-600">Run GEO Scout to see AI citation data</p>
                  <button
                    onClick={() => runAgent("geo-scout")}
                    disabled={!!agentRunning["geo-scout"]}
                    className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    {agentRunning["geo-scout"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run GEO Scout
                  </button>
                </div>
              )}
            </div>

            {/* Issues / Tech Health */}
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Site Issues</h2>
                <span className="text-[10px] text-slate-500">
                  {dashData?.issues?.length ?? 0} open
                </span>
              </div>
              {dashData?.issues && dashData.issues.length > 0 ? (
                <div className="space-y-2.5">
                  {dashData.issues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-start gap-2.5">
                      <span className={cn(
                        "flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full",
                        issue.severity === "critical" ? "bg-rose-400" :
                        issue.severity === "warning" ? "bg-amber-400" : "bg-blue-400"
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-300 truncate">{issue.description}</p>
                        <p className="text-[10px] text-slate-600 truncate">{issue.url}</p>
                      </div>
                    </div>
                  ))}
                  {dashData.issues.length > 5 && (
                    <p className="text-[10px] text-slate-600 text-center">+{dashData.issues.length - 5} more issues</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Wrench className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs text-slate-600">Run Site Doctor to find technical issues</p>
                  <button
                    onClick={() => runAgent("site-doctor")}
                    disabled={!!agentRunning["site-doctor"]}
                    className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors disabled:opacity-50"
                  >
                    {agentRunning["site-doctor"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Site Doctor
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content pipeline */}
          <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Content Pipeline</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => runAgent("content-architect")}
                  disabled={!!agentRunning["content-architect"]}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {agentRunning["content-architect"]
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Plus className="w-3.5 h-3.5" />
                  }
                  {agentRunning["content-architect"] ? "Generating…" : "Generate Article"}
                </button>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              </div>
            </div>
            {dashData?.contents && dashData.contents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/5">
                      <th className="text-left font-medium pb-2 pr-4">Title</th>
                      <th className="text-left font-medium pb-2 pr-4">Status</th>
                      <th className="text-right font-medium pb-2 pr-4">SEO</th>
                      <th className="text-right font-medium pb-2">Words</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {dashData.contents.map((item) => (
                      <tr key={item.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-2.5 pr-4 text-slate-300 max-w-[280px] truncate">{item.title}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            item.status === "published" && "bg-emerald-500/10 text-emerald-400",
                            item.status === "review"    && "bg-amber-500/10 text-amber-400",
                            item.status === "draft"     && "bg-slate-500/10 text-slate-400",
                          )}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {item.seoScore != null
                            ? <span className="flex items-center justify-end gap-1 text-emerald-400"><Star className="w-3 h-3 fill-emerald-400" />{item.seoScore}</span>
                            : <span className="text-slate-600">—</span>
                          }
                        </td>
                        <td className="py-2.5 text-right text-slate-400">
                          {item.wordCount > 0 ? item.wordCount.toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <p className="text-xs text-slate-600">No content generated yet.</p>
                <button
                  onClick={() => runAgent("content-architect")}
                  disabled={!!agentRunning["content-architect"]}
                  className="mt-2 text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {agentRunning["content-architect"] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  Generate your first article
                </button>
              </div>
            )}
          </div>

          {/* Recent Citations */}
          {dashData?.recentCitations && dashData.recentCitations.length > 0 && (
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">Recent AI Citations</h2>
                <span className="text-[10px] text-slate-500">Last 10 checks</span>
              </div>
              <div className="space-y-2.5">
                {dashData.recentCitations.map((c) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.cited ? "bg-emerald-400" : "bg-rose-400")} />
                    <span className="text-[10px] font-medium text-slate-500 w-20 flex-shrink-0 capitalize">{c.llm}</span>
                    <p className="text-xs text-slate-400 flex-1 truncate">{c.query}</p>
                    <span className={cn("text-[10px] font-medium", c.cited ? "text-emerald-400" : "text-slate-600")}>
                      {c.cited ? `✓ Cited${c.sentiment ? ` (${c.sentiment})` : ""}` : "Not cited"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
