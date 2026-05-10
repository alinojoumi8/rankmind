"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, Check, Loader2, ArrowLeft, CreditCard,
  BarChart3, Shield, Sparkles, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BillingStatus {
  plan: string;
  planName: string;
  subscriptionStatus: string | null;
  periodEnd: string | null;
  hasCustomer: boolean;
  usage: {
    runsUsed: number;
    runsLimit: number;
    sitesUsed: number;
    sitesLimit: number;
  };
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Get started with AI visibility monitoring",
    color: "slate",
    features: [
      "1 website",
      "5 agent runs / month",
      "GEO Scout agent",
      "Site Doctor agent",
      "Basic dashboard",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: 49,
    description: "For growing businesses serious about AI search",
    color: "indigo",
    badge: "Most Popular",
    features: [
      "3 websites",
      "Unlimited agent runs",
      "GEO Scout + Site Doctor",
      "Content Architect (full articles)",
      "Weekly email reports",
      "Historical analytics charts",
      "Competitor citation tracking",
    ],
    cta: "Start 14-Day Free Trial",
  },
  {
    id: "agency",
    name: "Agency",
    price: 199,
    description: "For agencies managing multiple clients",
    color: "violet",
    features: [
      "Unlimited websites",
      "Unlimited agent runs",
      "All 7 AI agents",
      "Shareable client reports",
      "Webhook integrations (Slack, Notion)",
      "White-label exports",
      "Priority support",
    ],
    cta: "Start 14-Day Free Trial",
  },
];

export default function BillingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { router.push("/login"); return; }
    fetch("/api/billing/status").then(r => r.json()).then(setStatus);
  }, [isLoaded, user, router]);

  async function handleUpgrade(planId: string) {
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoadingPlan(null);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally {
      setLoadingPortal(false);
    }
  }

  const currentPlan = status?.plan ?? "free";

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Plans & Billing</h1>
              <p className="text-slate-400 text-sm mt-1">Manage your subscription and usage</p>
            </div>
            {status?.hasCustomer && (
              <button
                onClick={handlePortal}
                disabled={loadingPortal}
                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 transition-all disabled:opacity-50"
              >
                {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Manage Subscription
              </button>
            )}
          </div>
        </div>

        {/* Current plan + usage */}
        {status && (
          <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Current plan</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-white">{status.planName}</span>
                  {status.subscriptionStatus === "trialing" && (
                    <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                      Trial active
                    </span>
                  )}
                  {status.subscriptionStatus === "active" && (
                    <span className="text-[11px] font-medium bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 rounded-full px-2.5 py-0.5">
                      Active
                    </span>
                  )}
                </div>
                {status.periodEnd && (
                  <p className="text-xs text-slate-600 mt-1">
                    Renews {new Date(status.periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Usage meters */}
              <div className="flex gap-8">
                {/* Agent runs */}
                {status.usage.runsLimit !== -1 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Agent runs this month</p>
                    <p className="text-lg font-bold text-white">
                      {status.usage.runsUsed}
                      <span className="text-sm font-normal text-slate-500"> / {status.usage.runsLimit}</span>
                    </p>
                    <div className="w-32 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all",
                          status.usage.runsUsed / status.usage.runsLimit > 0.8 ? "bg-rose-400" : "bg-indigo-400"
                        )}
                        style={{ width: `${Math.min(100, (status.usage.runsUsed / status.usage.runsLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sites */}
                {status.usage.sitesLimit !== -1 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Websites</p>
                    <p className="text-lg font-bold text-white">
                      {status.usage.sitesUsed}
                      <span className="text-sm font-normal text-slate-500"> / {status.usage.sitesLimit}</span>
                    </p>
                    <div className="w-32 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-violet-400 rounded-full"
                        style={{ width: `${Math.min(100, (status.usage.sitesUsed / status.usage.sitesLimit) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {status.usage.runsLimit === -1 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500 mb-1">Agent runs</p>
                    <p className="text-sm font-bold text-emerald-400">Unlimited</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upgrade nudge if nearing limit */}
            {status.usage.runsLimit !== -1 && status.usage.runsUsed >= status.usage.runsLimit - 1 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                You&apos;re at your run limit. Upgrade to Growth for unlimited agent runs.
              </div>
            )}
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isLoading = loadingPlan === plan.id;
            const isUpgrade = plan.id !== "free" &&
              (currentPlan === "free" || (currentPlan === "growth" && plan.id === "agency"));

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-[#080d1a] border rounded-2xl p-6 flex flex-col",
                  isCurrent ? "border-indigo-500/40 shadow-lg shadow-indigo-500/10" : "border-white/8",
                  plan.id === "growth" && !isCurrent && "border-indigo-500/20"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                    plan.id === "free" && "bg-slate-500/15",
                    plan.id === "growth" && "bg-indigo-500/15",
                    plan.id === "agency" && "bg-violet-500/15",
                  )}>
                    {plan.id === "free" && <Shield className={cn("w-5 h-5", "text-slate-400")} />}
                    {plan.id === "growth" && <BarChart3 className="w-5 h-5 text-indigo-400" />}
                    {plan.id === "agency" && <Sparkles className="w-5 h-5 text-violet-400" />}
                  </div>
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  {plan.price > 0 && <span className="text-sm text-slate-500 ml-1">/month</span>}
                  {plan.price === 0 && <span className="text-sm text-slate-500 ml-1">forever</span>}
                  {plan.price > 0 && (
                    <p className="text-xs text-emerald-400 mt-0.5">14-day free trial included</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={cn(
                        "w-3.5 h-3.5 flex-shrink-0 mt-0.5",
                        plan.id === "free" ? "text-slate-500" :
                        plan.id === "growth" ? "text-indigo-400" : "text-violet-400"
                      )} />
                      <span className="text-xs text-slate-400">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.id === "free" ? (
                  <div className="text-center text-xs text-slate-600 py-2.5 border border-white/5 rounded-lg">
                    {isCurrent ? "Your current plan" : "Downgrade"}
                  </div>
                ) : isCurrent ? (
                  <button
                    onClick={handlePortal}
                    disabled={loadingPortal}
                    className="w-full flex items-center justify-center gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 transition-all disabled:opacity-50"
                  >
                    {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Manage
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!loadingPlan}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-xl py-2.5 transition-all disabled:opacity-60",
                      plan.id === "growth"
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border border-violet-500/20"
                    )}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {isLoading ? "Redirecting…" : plan.cta}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-8">
          All plans include a 14-day free trial. No credit card required to start. Cancel anytime.
          <br />
          Payments are processed securely by Stripe.
        </p>
      </div>
    </div>
  );
}
