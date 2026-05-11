"use client";

import { useState, useEffect, FormEvent } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Zap, ArrowLeft, User, Bell, Shield, Loader2, Check, X, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSettings {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  stripeSubscriptionStatus: string | null;
  planCurrentPeriodEnd: string | null;
  weeklyEmailEnabled: boolean;
  createdAt: string;
  _count: { sites: number };
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: Shield },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Profile form
  const [name, setName] = useState("");

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) { router.replace("/login"); return; }

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setName(d.name ?? "");
      })
      .finally(() => setLoading(false));
  }, [isLoaded, clerkUser, router]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const d = await res.json();
        setSettings((s) => s ? { ...s, name: d.name } : s);
        showToast("Name updated", true);
      } else showToast("Failed to save", false);
    } catch { showToast("Network error", false); }
    finally { setSaving(false); }
  }

  async function toggleWeeklyEmail() {
    if (!settings) return;
    const newVal = !settings.weeklyEmailEnabled;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeklyEmailEnabled: newVal }),
      });
      if (res.ok) {
        setSettings((s) => s ? { ...s, weeklyEmailEnabled: newVal } : s);
        showToast(newVal ? "Weekly reports enabled" : "Weekly reports disabled", true);
      }
    } catch { showToast("Network error", false); }
    finally { setSaving(false); }
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (res.ok) {
        await signOut({ redirectUrl: "/" });
      } else showToast("Failed to delete account", false);
    } catch { showToast("Network error", false); }
    finally { setDeleting(false); }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#050914] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const planBadge: Record<string, string> = {
    free: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    growth: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    agency: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border max-w-sm",
          toast.ok ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"
        )}>
          <span className={cn("w-2 h-2 rounded-full", toast.ok ? "bg-emerald-400" : "bg-rose-400")} />
          {toast.msg}
          <button onClick={() => setToast(null)}><X className="w-3.5 h-3.5 opacity-60" /></button>
        </div>
      )}

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
            <span className="font-semibold text-sm text-white">Settings</span>
          </div>
        </div>
        {settings && (
          <span className={cn("text-[11px] font-medium px-3 py-1 rounded-full border capitalize", planBadge[settings.plan] ?? planBadge.free)}>
            {settings.plan} plan
          </span>
        )}
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex gap-8">
          {/* Sidebar tabs */}
          <nav className="w-44 flex-shrink-0 space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id
                    ? "bg-indigo-500/15 text-indigo-300 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Tab content */}
          <div className="flex-1">

            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white mb-0.5">Profile</h2>
                  <p className="text-xs text-slate-500">Manage your display name and account details.</p>
                </div>

                <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5 space-y-4">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">
                      {(settings?.name ?? settings?.email ?? "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{settings?.name ?? "No name set"}</div>
                      <div className="text-xs text-slate-500">{settings?.email}</div>
                    </div>
                  </div>

                  <form onSubmit={saveName} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Display name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={settings?.email ?? ""}
                        disabled
                        className="w-full bg-white/3 border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-slate-600 mt-1">Email is managed by your auth provider.</p>
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 text-sm rounded-lg px-4 py-2 transition-all disabled:opacity-50 border border-indigo-500/20"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save changes
                    </button>
                  </form>
                </div>

                {/* Account info */}
                <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5">
                  <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Account info</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: "Member since", value: settings?.createdAt ? new Date(settings.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—" },
                      { label: "Sites", value: String(settings?._count.sites ?? 0) },
                      { label: "Plan", value: `${settings?.plan ?? "free"} · ${settings?.stripeSubscriptionStatus ?? "inactive"}` },
                      { label: "Renewal date", value: settings?.planCurrentPeriodEnd ? new Date(settings.planCurrentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="text-slate-300 capitalize">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5">
                    <Link href="/billing" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Manage subscription & billing →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications tab ── */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white mb-0.5">Notifications</h2>
                  <p className="text-xs text-slate-500">Control what emails RankMind sends you.</p>
                </div>

                <div className="bg-[#080d1a] border border-white/5 rounded-xl p-5 space-y-4">
                  {[
                    {
                      label: "Weekly performance reports",
                      desc: "Summary of your GEO score, citations, issues, and content — sent every Monday.",
                      key: "weeklyEmailEnabled",
                      value: settings?.weeklyEmailEnabled ?? true,
                      onChange: toggleWeeklyEmail,
                    },
                    {
                      label: "Agent run notifications",
                      desc: "Email when an agent completes a run. Requires Slack webhooks for real-time.",
                      key: "agentEmail",
                      value: true,
                      onChange: () => {},
                      locked: true,
                    },
                    {
                      label: "Billing & plan alerts",
                      desc: "Renewal reminders, payment failures, and plan change confirmations.",
                      key: "billingEmail",
                      value: true,
                      onChange: () => {},
                      locked: true,
                    },
                  ].map((item) => (
                    <div key={item.key} className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{item.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                      </div>
                      <button
                        onClick={item.onChange}
                        disabled={item.locked || saving}
                        className={cn(
                          "relative w-9 h-5 rounded-full transition-all flex-shrink-0 mt-0.5 disabled:opacity-50",
                          item.value ? "bg-indigo-500" : "bg-white/10"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all",
                          item.value ? "left-[18px]" : "left-0.5"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Danger Zone tab ── */}
            {activeTab === "danger" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-white mb-0.5">Danger Zone</h2>
                  <p className="text-xs text-slate-500">Irreversible actions. Please read carefully.</p>
                </div>

                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-white">Delete account</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        This permanently deletes your account, all sites, agent runs, content, reports, and citation data.
                        Your Stripe subscription will be cancelled immediately. <strong className="text-white">This cannot be undone.</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">
                        Type <strong className="text-rose-400">DELETE</strong> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="DELETE"
                        className="w-full bg-white/5 border border-rose-500/20 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 transition-all"
                      />
                    </div>
                    <button
                      onClick={deleteAccount}
                      disabled={deleteConfirm !== "DELETE" || deleting}
                      className="flex items-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-sm rounded-lg px-4 py-2 transition-all disabled:opacity-40 border border-rose-500/20"
                    >
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      Delete my account permanently
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
