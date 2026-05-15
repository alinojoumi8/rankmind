"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, Mail, BookOpen, Play, Loader2, ChevronDown, ChevronUp,
  CheckCircle2, Clock, Send, Trophy, XCircle, SkipForward, ExternalLink,
  Copy, Check, AlertTriangle, Zap, TrendingUp, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  type: string;
  status: string;
  priority: string;
  targetUrl: string | null;
  targetDomain: string | null;
  contactEmail: string | null;
  pitchAngle: string | null;
  outreachCopy: string | null;
  notes: string | null;
  createdAt: string;
}

interface OpportunitySummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  withOutreach: number;
}

interface AgentResult {
  success: boolean;
  summary: string;
  data?: Record<string, unknown>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AUTHORITY_AGENTS = [
  {
    id: "authority-audit",
    name: "Authority Audit",
    icon: Shield,
    color: "violet",
    endpoint: "/api/agents/authority-audit",
    description: "Analyses your authority profile and identifies high-priority link opportunities",
  },
  {
    id: "prospect-research",
    name: "Prospect Research",
    icon: Search,
    color: "blue",
    endpoint: "/api/agents/prospect-research",
    description: "Finds unlinked mentions, competitor backlinks, and outreach targets",
  },
  {
    id: "outreach-writer",
    name: "Outreach Writer",
    icon: Mail,
    color: "emerald",
    endpoint: "/api/agents/outreach-writer",
    description: "Writes personalised outreach emails for your queued opportunities",
  },
  {
    id: "linkable-asset",
    name: "Linkable Asset",
    icon: BookOpen,
    color: "amber",
    endpoint: "/api/agents/linkable-asset",
    description: "Identifies content assets that attract editorial links and AI citations",
  },
];

const STATUS_META: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  identified:    { label: "Identified",    icon: Zap,          color: "text-slate-400" },
  researching:   { label: "Researching",   icon: Search,       color: "text-blue-400" },
  drafting:      { label: "Drafting",      icon: Mail,         color: "text-violet-400" },
  "outreach-sent":{ label: "Sent",         icon: Send,         color: "text-indigo-400" },
  won:           { label: "Won",           icon: Trophy,       color: "text-emerald-400" },
  lost:          { label: "Lost",          icon: XCircle,      color: "text-red-400" },
  skipped:       { label: "Skipped",       icon: SkipForward,  color: "text-slate-500" },
};

const PRIORITY_META: Record<string, { label: string; dot: string }> = {
  high:   { label: "High",   dot: "bg-red-400" },
  medium: { label: "Medium", dot: "bg-yellow-400" },
  low:    { label: "Low",    dot: "bg-slate-500" },
};

const TYPE_LABELS: Record<string, string> = {
  "guest-post":        "Guest Post",
  "resource-link":     "Resource Link",
  "broken-link":       "Broken Link",
  "digital-pr":        "Digital PR",
  "podcast":           "Podcast",
  "community":         "Community",
  "unlinked-mention":  "Unlinked Mention",
};

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-400",  border: "border-violet-500/20" },
  blue:    { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20" },
};

// ── Opportunity Card ───────────────────────────────────────────────────────────

function OpportunityCard({ opp, onUpdate }: { opp: Opportunity; onUpdate: () => void }) {
  const [expanded, setExpanded]   = useState(false);
  const [copied, setCopied]       = useState(false);
  const [updating, setUpdating]   = useState(false);

  const statusMeta = STATUS_META[opp.status] ?? STATUS_META["identified"];
  const StatusIcon = statusMeta.icon;
  const priorityMeta = PRIORITY_META[opp.priority] ?? PRIORITY_META["medium"];

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      await fetch(`/api/authority-opportunity/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onUpdate();
    } finally {
      setUpdating(false);
    }
  }

  function copyOutreach() {
    if (opp.outreachCopy) {
      navigator.clipboard.writeText(opp.outreachCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const nextStatuses = {
    identified:     ["researching", "skipped"],
    researching:    ["drafting", "skipped"],
    drafting:       ["outreach-sent", "skipped"],
    "outreach-sent":["won", "lost"],
    won:            [],
    lost:           [],
    skipped:        ["identified"],
  }[opp.status] ?? [];

  return (
    <div className={cn(
      "border rounded-xl transition-all",
      opp.priority === "high" ? "border-red-500/20 bg-red-500/3" :
      opp.priority === "medium" ? "border-yellow-500/15 bg-[#080d1a]" :
      "border-white/5 bg-[#080d1a]"
    )}>
      {/* Header row */}
      <button
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Priority dot */}
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", priorityMeta.dot)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-slate-300 bg-white/5 px-2 py-0.5 rounded-full">
              {TYPE_LABELS[opp.type] ?? opp.type}
            </span>
            {opp.targetDomain && (
              <span className="text-xs text-slate-500 truncate max-w-[160px]">{opp.targetDomain}</span>
            )}
          </div>
          {opp.pitchAngle && (
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{opp.pitchAngle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={cn("flex items-center gap-1 text-xs", statusMeta.color)}>
            <StatusIcon className="w-3 h-3" />
            <span>{statusMeta.label}</span>
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {opp.targetUrl && (
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
              <a href={opp.targetUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 truncate">
                {opp.targetUrl}
              </a>
            </div>
          )}

          {opp.notes && (
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">Notes</p>
              <p className="text-xs text-slate-400 whitespace-pre-line">{opp.notes}</p>
            </div>
          )}

          {opp.outreachCopy && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Outreach Copy</p>
                <button
                  onClick={copyOutreach}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-slate-300 bg-white/3 border border-white/5 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {opp.outreachCopy}
              </pre>
            </div>
          )}

          {/* Status progression buttons */}
          {nextStatuses.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-slate-500">Move to:</span>
              {nextStatuses.map((s) => {
                const meta = STATUS_META[s];
                const Icon = meta?.icon ?? CheckCircle2;
                return (
                  <button
                    key={s}
                    disabled={updating}
                    onClick={() => updateStatus(s)}
                    className={cn(
                      "flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border transition-colors",
                      "bg-white/3 border-white/10 text-slate-300 hover:bg-white/8 hover:text-white",
                      "disabled:opacity-50"
                    )}
                  >
                    {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                    {meta?.label ?? s}
                  </button>
                );
              })}
            </div>
          )}

          {(opp.status === "won" || opp.status === "lost") && (
            <div className={cn(
              "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
              opp.status === "won" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {opp.status === "won" ? <Trophy className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {opp.status === "won" ? "Link secured!" : "Not a match this time"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Agent Run Card ─────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  siteId,
  running,
  lastResult,
  onRun,
}: {
  agent: typeof AUTHORITY_AGENTS[0];
  siteId: string;
  running: boolean;
  lastResult: AgentResult | null;
  onRun: (agentId: string, endpoint: string, siteId: string) => void;
}) {
  const colors = colorMap[agent.color];
  const Icon = agent.icon;

  return (
    <div className={cn("border rounded-xl p-4 space-y-3", colors.border, "bg-[#080d1a]")}>
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", colors.bg)}>
          <Icon className={cn("w-4.5 h-4.5", colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{agent.description}</p>
        </div>
      </div>

      {lastResult && (
        <div className={cn(
          "text-[11px] rounded-lg px-3 py-2 leading-relaxed",
          lastResult.success ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
        )}>
          {lastResult.summary}
        </div>
      )}

      <button
        disabled={running}
        onClick={() => onRun(agent.id, agent.endpoint, siteId)}
        className={cn(
          "w-full flex items-center justify-center gap-2 text-xs font-medium",
          "px-3 py-2 rounded-lg border transition-all",
          running
            ? "bg-white/3 border-white/10 text-slate-500 cursor-not-allowed"
            : cn("border-transparent text-white", colors.bg, `hover:opacity-90`)
        )}
      >
        {running ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running…</>
        ) : (
          <><Play className="w-3.5 h-3.5" /> Run Agent</>
        )}
      </button>
    </div>
  );
}

// ── Main AuthorityHub component ────────────────────────────────────────────────

interface AuthorityHubProps {
  siteId: string;
  userPlan: string;
}

export default function AuthorityHub({ siteId, userPlan }: AuthorityHubProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [summary, setSummary]             = useState<OpportunitySummary | null>(null);
  const [loading, setLoading]             = useState(true);
  const [running, setRunning]             = useState<Record<string, boolean>>({});
  const [results, setResults]             = useState<Record<string, AgentResult>>({});
  const [filter, setFilter]               = useState<string>("all");
  const [error, setError]                 = useState<string | null>(null);

  const isAgencyPlan = userPlan === "agency";

  const loadOpportunities = useCallback(async () => {
    if (!isAgencyPlan) return;
    try {
      const r = await fetch(`/api/authority-opportunity?siteId=${siteId}`);
      if (r.ok) {
        const d = await r.json();
        setOpportunities(d.opportunities ?? []);
        setSummary(d.summary ?? null);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [siteId, isAgencyPlan]);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  async function runAgent(agentId: string, endpoint: string, sid: string) {
    setRunning((prev) => ({ ...prev, [agentId]: true }));
    setError(null);
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: sid }),
      });
      const d = await r.json();
      if (!r.ok) {
        if (d.upgrade) {
          setError("This feature requires the Agency plan.");
        } else {
          setError(d.error ?? "Agent failed");
        }
      } else {
        setResults((prev) => ({ ...prev, [agentId]: d }));
        // Reload opportunities (agents persist new ones)
        await loadOpportunities();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setRunning((prev) => ({ ...prev, [agentId]: false }));
    }
  }

  // Filter opportunities
  const filtered = opportunities.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return !["won", "lost", "skipped"].includes(o.status);
    if (filter === "won") return o.status === "won";
    if (filter === "has-copy") return !!o.outreachCopy;
    return o.priority === filter;
  });

  // Upgrade gate
  if (!isAgencyPlan) {
    return (
      <div className="bg-[#080d1a] border border-violet-500/20 rounded-xl p-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-violet-400" />
        </div>
        <h3 className="font-semibold text-white">Earned Authority Hub</h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Run 4 AI agents to audit your authority, research prospects, write outreach, and plan linkable assets. Available on the Agency plan.
        </p>
        <a
          href="/billing"
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg transition-colors"
        >
          <Zap className="w-4 h-4" /> Upgrade to Agency
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Earned Authority Hub</h2>
            <p className="text-[11px] text-slate-500">AI-powered link building & authority workflows</p>
          </div>
        </div>
        <button
          onClick={loadOpportunities}
          className="p-2 rounded-lg bg-white/3 hover:bg-white/8 text-slate-400 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300 flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary stats */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: summary.total, color: "text-slate-300" },
            { label: "Active", value: summary.byStatus.identified + summary.byStatus.researching + summary.byStatus.drafting + (summary.byStatus["outreach-sent"] ?? 0), color: "text-indigo-400" },
            { label: "Won", value: summary.byStatus.won ?? 0, color: "text-emerald-400" },
            { label: "With Copy", value: summary.withOutreach, color: "text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#080d1a] border border-white/5 rounded-xl p-3 text-center">
              <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Agent grid */}
      <div>
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Run Agents</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AUTHORITY_AGENTS.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              siteId={siteId}
              running={!!running[agent.id]}
              lastResult={results[agent.id] ?? null}
              onRun={runAgent}
            />
          ))}
        </div>
      </div>

      {/* Opportunities list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Opportunities
            {summary && summary.total > 0 && (
              <span className="ml-2 text-slate-500 normal-case font-normal">({summary.total} total)</span>
            )}
          </h3>
          {/* Filter pills */}
          {opportunities.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {["all", "active", "high", "has-copy", "won"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full border transition-colors capitalize",
                    filter === f
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-white/3 border-white/10 text-slate-400 hover:text-white"
                  )}
                >
                  {f === "has-copy" ? "Has Copy" : f}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Loading opportunities…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <TrendingUp className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              {opportunities.length === 0
                ? "Run the Authority Audit or Prospect Research agent to discover opportunities"
                : "No opportunities match this filter"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} onUpdate={loadOpportunities} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
