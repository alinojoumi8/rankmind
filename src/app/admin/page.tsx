"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Users, TrendingUp, Activity, ArrowLeft,
  Loader2, BarChart3, DollarSign, UserX, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: string;
    stripeSubscriptionStatus: string | null;
    createdAt: string;
    _count: { sites: number };
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/login"); return; }

    fetch("/api/admin/stats")
      .then(async (r) => {
        if (r.status === 403) { setForbidden(true); return; }
        setStats(await r.json());
      })
      .finally(() => setLoading(false));
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
        <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1">
          Internal Only
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "MRR", value: `$${o?.mrr.toLocaleString() ?? 0}`, sub: `ARR $${((o?.arr ?? 0)).toLocaleString()}`, icon: DollarSign, color: "emerald" },
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
                const total = (stats?.overview.totalUsers ?? 1);
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
              {(stats?.topAgents ?? []).map((agent, i) => {
                const maxRuns = stats?.topAgents[0]?.runs ?? 1;
                const pct = Math.round((agent.runs / maxRuns) * 100);
                return (
                  <div key={agent.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 capitalize">{agent.name.replace(/-/g, " ")}</span>
                      <span className="text-slate-500">{agent.runs.toLocaleString()} runs</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full opacity-70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth summary */}
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

        {/* Recent signups table */}
        <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Signups</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-white/5">
                  <th className="text-left font-medium pb-2 pr-4">User</th>
                  <th className="text-left font-medium pb-2 pr-4">Plan</th>
                  <th className="text-left font-medium pb-2 pr-4">Status</th>
                  <th className="text-right font-medium pb-2 pr-4">Sites</th>
                  <th className="text-right font-medium pb-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.recentUsers ?? []).map((u) => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="text-slate-300 font-medium">{u.name ?? "—"}</div>
                      <div className="text-slate-600">{u.email}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("rounded-full px-2 py-0.5 capitalize", planBadgeClass[u.plan] ?? planBadgeClass.free)}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className={cn("text-[10px]",
                        u.stripeSubscriptionStatus === "active" ? "text-emerald-400" :
                        u.stripeSubscriptionStatus === "trialing" ? "text-blue-400" :
                        u.stripeSubscriptionStatus === "canceled" ? "text-rose-400" :
                        "text-slate-500"
                      )}>
                        {u.stripeSubscriptionStatus ?? "free"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-right text-slate-400">{u._count.sites}</td>
                    <td className="py-2.5 text-right text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
