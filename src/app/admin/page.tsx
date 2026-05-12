"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Users, TrendingUp, Activity, ArrowLeft,
  Loader2, BarChart3, DollarSign, UserX, Bot,
  ExternalLink, ChevronDown, Check, X, RefreshCw,
  Clock, CreditCard, ShieldOff, Gift,
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
    totalUsers: number;
    newUsersThisMonth: number;
    totalSites: number;
    totalAgentRuns: number;
    agentRunsThisMonth: number;
    mrr: number;
    arr: number;
    churned30d: number;
  };
  planBreakdown: { free: number; growth: number; agency: number };
  topAgents: Array<{ name: string; runs: number }>;
  recentUsers: AdminUser[];
}

type ActionState = "idle" | "loading" | "done" | "error";

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-slate-600 text-[10px]">—</span>;
  const color =
    status === "active" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
    status === "trialing" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
    status === "past_due" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
    status === "canceled" ? "text-rose-400 bg-rose-500/10 border-rose-500/20" :
    "text-slate-400 bg-slate-500/10 border-slate-500/20";
  return (
    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", color)}>
      {status}
    </span>
  );
}

function UserActionsMenu({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>("idle");
  const [msg, setMsg] = useState("");
  const [extendDays, setExtendDays] = useState(7);
  const [grantPlan, setGrantPlan] = useState<"growth" | "agency">("growth");
  const [grantDays, setGrantDays] = useState(14);
  const [changePlan, setChangePlan] = useState(user.plan);
  const [subAction, setSubAction] = useState<
    "extend" | "grant" | "change_plan" | "cancel" | null
  >(null);

  async function runAction(action: string, extra: object = {}) {
    setState("loading");
    setMsg("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      setState("done");
      setMsg("Done!");
      setTimeout(() => { setState("idle"); setOpen(false); setSubAction(null); onDone(); }, 1500);
    } catch (e: unknown) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "Error");
      setTimeout(() => setState("idle"), 3000);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 transition-all"
      >
        Manage <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl z-50 p-1 text-xs">

          {/* State feedback */}
          {state === "loading" && (
            <div className="flex items-center gap-2 px-3 py-2 text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
            </div>
          )}
          {state === "done" && (
            <div className="flex items-center gap-2 px-3 py-2 text-emerald-400">
              <Check className="w-3.5 h-3.5" /> {msg}
            </div>
          )}
          {state === "error" && (
            <div className="flex items-center gap-2 px-3 py-2 text-rose-400">
              <X className="w-3.5 h-3.5" /> {msg}
            </div>
          )}

          {state === "idle" && (
            <>
              {/* Extend trial */}
              {subAction === "extend" ? (
                <div className="p-2 space-y-2">
                  <p className="text-slate-400 px-1">Extend trial by:</p>
                  <div className="flex gap-1.5">
                    {[3, 7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setExtendDays(d)}
                        className={cn(
                          "flex-1 py-1 rounded-lg border transition-all",
                          extendDays === d
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => runAction("extend_trial", { days: extendDays })}
                      className="flex-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg py-1.5 transition-all"
                    >
                      Extend {extendDays} days
                    </button>
                    <button onClick={() => setSubAction(null)} className="px-3 text-slate-500 hover:text-white">✕</button>
                  </div>
                </div>
              ) : subAction === "grant" ? (
                <div className="p-2 space-y-2">
                  <p className="text-slate-400 px-1">Grant free trial:</p>
                  <div className="flex gap-1.5">
                    {(["growth", "agency"] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setGrantPlan(p)}
                        className={cn(
                          "flex-1 py-1 rounded-lg border capitalize transition-all",
                          grantPlan === p
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    {[7, 14, 30].map(d => (
                      <button
                        key={d}
                        onClick={() => setGrantDays(d)}
                        className={cn(
                          "flex-1 py-1 rounded-lg border transition-all",
                          grantDays === d
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => runAction("grant_free_trial", { plan: grantPlan, days: grantDays })}
                      className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg py-1.5 transition-all"
                    >
                      Grant {grantDays}-day {grantPlan}
                    </button>
                    <button onClick={() => setSubAction(null)} className="px-3 text-slate-500 hover:text-white">✕</button>
                  </div>
                </div>
              ) : subAction === "change_plan" ? (
                <div className="p-2 space-y-2">
                  <p className="text-slate-400 px-1">Change plan to:</p>
                  <div className="flex gap-1.5">
                    {["free", "growth", "agency"].map(p => (
                      <button
                        key={p}
                        onClick={() => setChangePlan(p)}
                        className={cn(
                          "flex-1 py-1 rounded-lg border capitalize transition-all",
                          changePlan === p
                            ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => runAction("change_plan", { plan: changePlan })}
                      className="flex-1 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 rounded-lg py-1.5 transition-all"
                    >
                      Set to {changePlan}
                    </button>
                    <button onClick={() => setSubAction(null)} className="px-3 text-slate-500 hover:text-white">✕</button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setSubAction("extend")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    Extend trial
                  </button>
                  <button
                    onClick={() => setSubAction("grant")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
                  >
                    <Gift className="w-3.5 h-3.5 text-emerald-400" />
                    Grant free trial
                  </button>
                  <button
                    onClick={() => setSubAction("change_plan")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-violet-400" />
                    Change plan
                  </button>
                  {user.stripeCustomerId && (
                    <a
                      href={`https://dashboard.stripe.com/test/customers/${user.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      View in Stripe
                    </a>
                  )}
                  <div className="my-1 border-t border-white/5" />
                  <button
                    onClick={() => {
                      if (confirm(`Cancel subscription for ${user.email}?`)) {
                        runAction("cancel_subscription");
                      }
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-all"
                  >
                    <ShieldOff className="w-3.5 h-3.5" />
                    Cancel subscription
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSubAction(null); }} />
      )}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [tab, setTab] = useState<"overview" | "subscribers">("overview");

  async function loadStats() {
    const res = await fetch("/api/admin/stats");
    if (res.status === 403) { setForbidden(true); return; }
    setStats(await res.json());
  }

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/login"); return; }
    loadStats().finally(() => setLoading(false));
  }, [isLoaded, clerkUser, router]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center text-center p-4">
        <div>
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-slate-500 text-sm mb-6">You don&apos;t have admin privileges.</p>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const o = stats?.overview;
  const planBadgeClass: Record<string, string> = {
    free: "bg-slate-500/10 text-slate-400",
    growth: "bg-indigo-500/10 text-indigo-400",
    agency: "bg-violet-500/10 text-violet-400",
  };

  const paidUsers = stats?.recentUsers.filter(u =>
    u.plan !== "free" || u.stripeSubscriptionStatus === "trialing"
  ) ?? [];

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#080d1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadStats()} className="text-slate-500 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1">
            Internal Only
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/5 bg-[#080d1a] px-6">
        <div className="flex gap-0">
          {(["overview", "subscribers"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-all capitalize",
                tab === t
                  ? "border-indigo-500 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {t}
              {t === "subscribers" && paidUsers.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full px-1.5 py-0.5">
                  {paidUsers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "MRR", value: `$${o?.mrr.toLocaleString() ?? 0}`, sub: `ARR $${(o?.arr ?? 0).toLocaleString()}`, icon: DollarSign, color: "emerald" },
                { label: "Total Users", value: String(o?.totalUsers ?? 0), sub: `+${o?.newUsersThisMonth ?? 0} this month`, icon: Users, color: "indigo" },
                { label: "Agent Runs", value: String(o?.totalAgentRuns ?? 0), sub: `${o?.agentRunsThisMonth ?? 0} this month`, icon: Bot, color: "violet" },
                { label: "Churn (30d)", value: String(o?.churned30d ?? 0), sub: "cancelled subscriptions", icon: UserX, color: "rose" },
              ].map((card) => (
                <div key={card.label} className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-slate-500">{card.label}</span>
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", `bg-${card.color}-500/10`)}>
                      <card.icon className={cn("w-3.5 h-3.5", `text-${card.color}-400`)} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{card.value}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan breakdown */}
              <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-white">Plan Breakdown</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { plan: "Agency", count: stats?.planBreakdown.agency ?? 0, color: "bg-violet-400", price: 199 },
                    { plan: "Growth", count: stats?.planBreakdown.growth ?? 0, color: "bg-indigo-400", price: 49 },
                    { plan: "Free", count: stats?.planBreakdown.free ?? 0, color: "bg-slate-600", price: 0 },
                  ].map((item) => {
                    const total = stats?.overview.totalUsers ?? 1;
                    const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    return (
                      <div key={item.plan}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300">{item.plan}</span>
                          <span className="text-slate-500">{item.count} users · {pct}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", item.color)} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t border-white/5">
                  <div className="text-xs text-slate-500">Total sites: <span className="text-white font-semibold">{o?.totalSites ?? 0}</span></div>
                </div>
              </div>

              {/* Top agents */}
              <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-white">Top Agents</h2>
                </div>
                <div className="space-y-2.5">
                  {(stats?.topAgents ?? []).map((agent) => {
                    const maxRuns = stats?.topAgents[0]?.runs ?? 1;
                    const pct = Math.round((agent.runs / maxRuns) * 100);
                    return (
                      <div key={agent.name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 capitalize">{agent.name.replace(/-/g, " ")}</span>
                          <span className="text-slate-500">{agent.runs.toLocaleString()} runs</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full opacity-70" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-white">Quick Stats</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Paid conversion", value: stats ? `${Math.round(((stats.planBreakdown.growth + stats.planBreakdown.agency) / Math.max(stats.overview.totalUsers, 1)) * 100)}%` : "—" },
                    { label: "Avg sites / paid user", value: stats && (stats.planBreakdown.growth + stats.planBreakdown.agency) > 0 ? (stats.overview.totalSites / (stats.planBreakdown.growth + stats.planBreakdown.agency)).toFixed(1) : "—" },
                    { label: "Agent runs / user", value: stats ? (stats.overview.totalAgentRuns / Math.max(stats.overview.totalUsers, 1)).toFixed(1) : "—" },
                    { label: "New users this month", value: String(o?.newUsersThisMonth ?? 0) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="text-white font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent signups */}
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Recent Signups</h2>
              <UsersTable users={stats?.recentUsers ?? []} planBadgeClass={planBadgeClass} onAction={loadStats} />
            </div>
          </>
        )}

        {/* ── SUBSCRIBERS TAB ── */}
        {tab === "subscribers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Active Subscribers & Trials</h2>
                <p className="text-xs text-slate-500 mt-0.5">All users on paid plans or active trials. Extend trial, change plan, or view in Stripe.</p>
              </div>
            </div>

            {paidUsers.length === 0 ? (
              <div className="bg-[#080d1a] border border-white/5 rounded-xl p-12 text-center">
                <div className="text-3xl mb-3">💳</div>
                <p className="text-slate-500 text-sm">No paid subscribers yet.</p>
                <p className="text-slate-600 text-xs mt-1">Users who sign up for Growth or Agency will appear here.</p>
              </div>
            ) : (
              <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                <SubscriberTable users={paidUsers} onAction={loadStats} />
              </div>
            )}

            {/* All users with manage button */}
            <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">All Users</h3>
              <UsersTable users={stats?.recentUsers ?? []} planBadgeClass={planBadgeClass} onAction={loadStats} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SubscriberTable({ users, onAction }: { users: AdminUser[]; onAction: () => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-white/5">
            <th className="text-left font-medium pb-2 pr-4">User</th>
            <th className="text-left font-medium pb-2 pr-4">Plan</th>
            <th className="text-left font-medium pb-2 pr-4">Status</th>
            <th className="text-left font-medium pb-2 pr-4">Trial / Renewal</th>
            <th className="text-right font-medium pb-2 pr-4">Sites</th>
            <th className="text-right font-medium pb-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/2 transition-colors">
              <td className="py-3 pr-4">
                <div className="text-slate-200 font-medium">{u.name ?? "—"}</div>
                <div className="text-slate-500">{u.email}</div>
              </td>
              <td className="py-3 pr-4">
                <span className={cn("rounded-full px-2 py-0.5 capitalize text-[10px] font-medium",
                  u.plan === "agency" ? "bg-violet-500/10 text-violet-400" :
                  u.plan === "growth" ? "bg-indigo-500/10 text-indigo-400" :
                  "bg-slate-500/10 text-slate-400"
                )}>
                  {u.plan}
                </span>
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={u.stripeSubscriptionStatus} />
              </td>
              <td className="py-3 pr-4">
                {u.planCurrentPeriodEnd ? (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-600" />
                    <span className={cn("font-medium",
                      new Date(u.planCurrentPeriodEnd) < new Date(Date.now() + 3 * 86400000)
                        ? "text-amber-400" : "text-slate-300"
                    )}>
                      {new Date(u.planCurrentPeriodEnd).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric"
                      })}
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="py-3 pr-4 text-right text-slate-400">{u._count.sites}</td>
              <td className="py-3 text-right">
                <UserActionsMenu user={u} onDone={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersTable({
  users, planBadgeClass, onAction
}: {
  users: AdminUser[];
  planBadgeClass: Record<string, string>;
  onAction: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b border-white/5">
            <th className="text-left font-medium pb-2 pr-4">User</th>
            <th className="text-left font-medium pb-2 pr-4">Plan</th>
            <th className="text-left font-medium pb-2 pr-4">Status</th>
            <th className="text-left font-medium pb-2 pr-4">Renewal / Trial end</th>
            <th className="text-right font-medium pb-2 pr-4">Sites</th>
            <th className="text-right font-medium pb-2 pr-4">Joined</th>
            <th className="text-right font-medium pb-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/2 transition-colors">
              <td className="py-2.5 pr-4">
                <div className="text-slate-300 font-medium">{u.name ?? "—"}</div>
                <div className="text-slate-600">{u.email}</div>
              </td>
              <td className="py-2.5 pr-4">
                <span className={cn("rounded-full px-2 py-0.5 capitalize text-[10px]", planBadgeClass[u.plan] ?? planBadgeClass.free)}>
                  {u.plan}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <StatusBadge status={u.stripeSubscriptionStatus} />
              </td>
              <td className="py-2.5 pr-4 text-slate-500">
                {u.planCurrentPeriodEnd
                  ? new Date(u.planCurrentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </td>
              <td className="py-2.5 pr-4 text-right text-slate-400">{u._count.sites}</td>
              <td className="py-2.5 pr-4 text-right text-slate-500">
                {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
              <td className="py-2.5 text-right">
                <UserActionsMenu user={u} onDone={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
