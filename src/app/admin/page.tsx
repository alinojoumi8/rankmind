"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Users, ArrowLeft, Loader2, DollarSign, UserX, Bot,
  ExternalLink, RefreshCw, Clock, Check, X, Activity, BarChart3, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  planCurrentPeriodEnd: string | null;
  createdAt: string;
  _count: { sites: number };
}

interface AdminStats {
  overview: {
    totalUsers: number; newUsersThisMonth: number; totalSites: number;
    totalAgentRuns: number; agentRunsThisMonth: number;
    mrr: number; arr: number; churned30d: number;
  };
  planBreakdown: { free: number; growth: number; agency: number };
  topAgents: Array<{ name: string; runs: number }>;
  recentUsers: AdminUser[];
}

const PLAN_COLORS: Record<string, string> = {
  free:   "bg-slate-700 text-slate-200",
  growth: "bg-indigo-600 text-white",
  agency: "bg-violet-600 text-white",
};

/* ── inline user row with direct controls ──────────────────────────────── */
function UserRow({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [busy, setBusy]     = useState(false);
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");
  const [msg, setMsg]       = useState("");

  async function act(action: string, extra: object = {}) {
    setBusy(true); setStatus("idle"); setMsg("");
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "Failed");
      setStatus("ok"); setMsg("Saved!");
      setTimeout(() => { setStatus("idle"); onDone(); }, 1500);
    } catch (e: unknown) {
      setStatus("err"); setMsg(e instanceof Error ? e.message : "Error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally { setBusy(false); }
  }

  const expiring = user.planCurrentPeriodEnd
    && new Date(user.planCurrentPeriodEnd) < new Date(Date.now() + 3 * 86400000)
    && new Date(user.planCurrentPeriodEnd) > new Date();

  return (
    <div className="bg-[#0a1020] border border-white/10 rounded-xl p-5 space-y-4">
      {/* User identity */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-white text-sm">{user.name || <span className="text-slate-500 italic">No name</span>}</div>
          <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}{user._count.sites} site{user._count.sites !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status pill */}
          {user.stripeSubscriptionStatus && user.stripeSubscriptionStatus !== "free" && (
            <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full border capitalize",
              user.stripeSubscriptionStatus === "active"   ? "text-emerald-300 bg-emerald-500/15 border-emerald-500/30" :
              user.stripeSubscriptionStatus === "trialing" ? "text-sky-300 bg-sky-500/15 border-sky-500/30" :
              user.stripeSubscriptionStatus === "past_due" ? "text-amber-300 bg-amber-500/15 border-amber-500/30" :
              "text-slate-400 bg-slate-500/10 border-slate-500/20"
            )}>
              {user.stripeSubscriptionStatus}
            </span>
          )}
          {/* Stripe link */}
          {user.stripeCustomerId && (
            <a
              href={`https://dashboard.stripe.com/test/customers/${user.stripeCustomerId}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-indigo-500/10 px-2.5 py-1 rounded-lg transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Stripe
            </a>
          )}
        </div>
      </div>

      {/* Feedback */}
      {status !== "idle" && (
        <div className={cn("flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg",
          status === "ok" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" :
                           "bg-rose-500/10 text-rose-300 border border-rose-500/20"
        )}>
          {status === "ok" ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          {msg}
        </div>
      )}

      {/* Controls grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* ── Change Plan ── */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Plan</div>
          <div className="flex gap-1.5 mb-1">
            {["free", "growth", "agency"].map(p => (
              <button
                key={p}
                disabled={busy}
                onClick={() => act("change_plan", { plan: p })}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all border",
                  user.plan === p
                    ? PLAN_COLORS[p] + " border-transparent ring-2 ring-white/30 ring-offset-1 ring-offset-[#0a1020]"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-600 mt-2">Click to change immediately</div>
        </div>

        {/* ── Extend / Grant Trial ── */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Trial
            {user.planCurrentPeriodEnd && (
              <span className={cn("ml-2 font-normal normal-case", expiring ? "text-amber-400" : "text-slate-500")}>
                <Clock className="inline w-3 h-3 mr-0.5" />
                {new Date(user.planCurrentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {expiring && " ⚠"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "+7 days",  action: "extend_trial",    extra: { days: 7 } },
              { label: "+14 days", action: "extend_trial",    extra: { days: 14 } },
              { label: "Grant 7d (Growth)",  action: "grant_free_trial", extra: { plan: "growth", days: 7 } },
              { label: "Grant 14d (Agency)", action: "grant_free_trial", extra: { plan: "agency", days: 14 } },
            ].map(btn => (
              <button
                key={btn.label}
                disabled={busy}
                onClick={() => act(btn.action, btn.extra)}
                className="py-1.5 px-2 rounded-lg text-[11px] font-medium bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300 hover:text-indigo-200 transition-all disabled:opacity-40"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cancel ── */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Danger</div>
          <button
            disabled={busy || user.plan === "free"}
            onClick={() => {
              if (confirm(`Cancel subscription for ${user.email}?\nThis will downgrade them to Free immediately.`)) {
                act("cancel_subscription");
              }
            }}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Cancel subscription
          </button>
          {user.plan === "free" && (
            <div className="text-[10px] text-slate-600 mt-2">Already on free plan</div>
          )}
        </div>
      </div>

      {/* Loading overlay indicator */}
      {busy && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Applying…
        </div>
      )}
    </div>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [stats, setStats]       = useState<AdminStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab]           = useState<"overview" | "users">("overview");

  async function loadStats() {
    setRefreshing(true);
    try {
      const r = await fetch("/api/admin/stats");
      if (r.status === 403) { setForbidden(true); return; }
      setStats(await r.json());
    } finally { setRefreshing(false); }
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/login"); return; }
    loadStats().finally(() => setLoading(false));
  }, [isLoaded, clerkUser, router]);

  if (!isLoaded || loading) return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (forbidden) return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center text-center p-4">
      <div>
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6">Admin privileges required.</p>
        <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const o = stats?.overview;

  return (
    <div className="min-h-screen bg-[#050914] text-white">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#080d1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> Refresh
          </button>
          <span className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-full px-3 py-1">
            Internal Only
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 bg-[#080d1a] px-6">
        <div className="flex max-w-5xl mx-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "users",    label: `Manage Users (${stats?.overview.totalUsers ?? 0})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as "overview" | "users")}
              className={cn(
                "px-5 py-3.5 text-sm font-semibold border-b-2 transition-all",
                tab === t.id
                  ? "border-indigo-400 text-white"
                  : "border-transparent text-slate-500 hover:text-white hover:border-white/20"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ══ OVERVIEW ══════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "MRR",         value: `$${(o?.mrr ?? 0).toLocaleString()}`,      sub: `ARR $${(o?.arr ?? 0).toLocaleString()}`,    icon: DollarSign, c: "emerald" },
                { label: "Total Users", value: String(o?.totalUsers ?? 0),                sub: `+${o?.newUsersThisMonth ?? 0} this month`,  icon: Users,      c: "indigo"  },
                { label: "Agent Runs",  value: String(o?.totalAgentRuns ?? 0),            sub: `${o?.agentRunsThisMonth ?? 0} this month`,  icon: Bot,        c: "violet"  },
                { label: "Churn (30d)", value: String(o?.churned30d ?? 0),                sub: "cancelled subscriptions",                    icon: UserX,      c: "rose"    },
              ].map(card => (
                <div key={card.label} className="bg-[#0a1020] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-300">{card.label}</span>
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", `bg-${card.c}-500/15 border-${card.c}-500/25`)}>
                      <card.icon className={cn("w-4 h-4", `text-${card.c}-400`)} />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-white">{card.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Plan breakdown */}
              <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <h2 className="font-bold text-white">Plan Breakdown</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Agency", count: stats?.planBreakdown.agency ?? 0, bar: "bg-violet-500" },
                    { label: "Growth", count: stats?.planBreakdown.growth ?? 0, bar: "bg-indigo-500" },
                    { label: "Free",   count: stats?.planBreakdown.free   ?? 0, bar: "bg-slate-600"  },
                  ].map(row => {
                    const pct = stats?.overview.totalUsers ? Math.round((row.count / stats.overview.totalUsers) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-medium text-slate-200">{row.label}</span>
                          <span className="text-slate-400">{row.count} · <b className="text-white">{pct}%</b></span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", row.bar)} style={{ width: `${Math.max(pct > 0 ? 4 : 0, pct)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-white/8 text-sm text-slate-400">
                  Total sites: <span className="font-bold text-white ml-1">{o?.totalSites ?? 0}</span>
                </div>
              </div>

              {/* Top agents */}
              <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Activity className="w-4 h-4 text-violet-400" />
                  <h2 className="font-bold text-white">Top Agents</h2>
                </div>
                <div className="space-y-3.5">
                  {(stats?.topAgents ?? []).map(agent => {
                    const pct = Math.round((agent.runs / (stats?.topAgents[0]?.runs ?? 1)) * 100);
                    return (
                      <div key={agent.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-200 capitalize">{agent.name.replace(/-/g, " ")}</span>
                          <span className="text-slate-400 font-semibold">{agent.runs.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h2 className="font-bold text-white">Quick Stats</h2>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Paid conversion", value: stats ? `${Math.round(((stats.planBreakdown.growth + stats.planBreakdown.agency) / Math.max(stats.overview.totalUsers, 1)) * 100)}%` : "—" },
                    { label: "Avg sites / paid user", value: stats && (stats.planBreakdown.growth + stats.planBreakdown.agency) > 0 ? (stats.overview.totalSites / (stats.planBreakdown.growth + stats.planBreakdown.agency)).toFixed(1) : "—" },
                    { label: "Agent runs / user", value: stats ? (stats.overview.totalAgentRuns / Math.max(stats.overview.totalUsers, 1)).toFixed(1) : "—" },
                    { label: "New users this month", value: String(o?.newUsersThisMonth ?? 0) },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{row.label}</span>
                      <span className="text-sm font-bold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ MANAGE USERS ════════════════════════════════════════════════════ */}
        {tab === "users" && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Click <strong className="text-white">Free / Growth / Agency</strong> to instantly change a user&apos;s plan.
              Use trial buttons to extend or grant access without a credit card.
            </p>
            {(stats?.recentUsers ?? []).length === 0 ? (
              <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-16 text-center text-slate-500">No users yet.</div>
            ) : (
              (stats?.recentUsers ?? []).map(user => (
                <UserRow key={user.id} user={user} onDone={loadStats} />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
