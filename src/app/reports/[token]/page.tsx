"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Zap, Globe, BarChart3, Shield, FileText, Users, ExternalLink, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportData {
  generatedAt: string;
  site: { domain: string; name: string; industry: string | null };
  metrics: { geoScore: number; techScore: number; citationShare: number; organicTraffic: number };
  citations: {
    total: number; cited: number; rate: number;
    recent: { llm: string; query: string; cited: boolean; sentiment: string | null; excerpt: string | null }[];
  };
  issues: {
    total: number; critical: number;
    list: { type: string; severity: string; description: string }[];
  };
  content: {
    total: number;
    list: { title: string; status: string; wordCount: number; seoScore: number | null }[];
  };
  competitors: { domain: string; name: string; mentionRate: number; totalChecks: number }[];
}

interface Report {
  title: string;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  data: ReportData;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 40 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className={cn("rounded-xl border p-5 text-center", color)}>
      <div className="text-4xl font-bold mb-1">{score}</div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-xs mt-1 opacity-50">/100</div>
    </div>
  );
}

export default function ReportPage() {
  const params = useParams();
  const token = params.token as string;
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reports/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 410 ? "This report has expired." : "Report not found.");
        return r.json();
      })
      .then(setReport)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  if (error || !report) return (
    <div className="min-h-screen bg-[#050914] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-4xl mb-4">📭</div>
        <h1 className="text-xl font-bold text-white mb-2">{error || "Report not found"}</h1>
        <p className="text-slate-500 text-sm">This link may be expired or invalid.</p>
      </div>
    </div>
  );

  const d = report.data;
  const ownCitationRate = d.citations.rate;

  return (
    <div className="min-h-screen bg-[#050914] text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base">
              Rank<span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Mind</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">{report.title}</div>
              <div className="text-[11px] text-slate-600">
                Generated {new Date(report.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                {" · "}{report.viewCount} views
              </div>
            </div>
            <a
              href={`/api/reports/${token}/pdf`}
              download
              className="flex items-center gap-1.5 text-xs font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 rounded-lg px-3 py-1.5 transition-all"
            >
              <Download className="w-3 h-3" />
              PDF
            </a>
          </div>
        </div>

        {/* Site identity */}
        <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Globe className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{d.site.name}</h1>
            <a href={`https://${d.site.domain}`} target="_blank" rel="noopener noreferrer"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              {d.site.domain} <ExternalLink className="w-3 h-3" />
            </a>
            {d.site.industry && (
              <span className="mt-1 inline-block text-[11px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {d.site.industry}
              </span>
            )}
          </div>
        </div>

        {/* Score cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <ScoreBadge score={d.metrics.geoScore} label="GEO Score" />
          <ScoreBadge score={d.metrics.techScore} label="Tech Health" />
          <ScoreBadge score={d.metrics.citationShare} label="Citation Rate" />
          <div className="rounded-xl border border-white/8 bg-[#080d1a] p-5 text-center">
            <div className="text-4xl font-bold mb-1 text-slate-200">{d.citations.cited}<span className="text-lg text-slate-500">/{d.citations.total}</span></div>
            <div className="text-sm text-slate-500">AI Citations</div>
            <div className="text-xs mt-1 text-slate-600">{d.citations.rate}% citation rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Recent Citations */}
          <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">AI Citation Results</h2>
            </div>
            {d.citations.recent.length > 0 ? (
              <div className="space-y-3">
                {d.citations.recent.slice(0, 6).map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5", c.cited ? "bg-emerald-400" : "bg-rose-400")} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-300 truncate">{c.query}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-600 capitalize">{c.llm}</span>
                        <span className={cn("text-[10px] font-medium", c.cited ? "text-emerald-400" : "text-slate-600")}>
                          {c.cited ? `✓ Cited${c.sentiment ? ` (${c.sentiment})` : ""}` : "Not cited"}
                        </span>
                      </div>
                      {c.excerpt && c.cited && (
                        <p className="text-[10px] text-slate-600 mt-0.5 italic truncate">"{c.excerpt}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No citation data available.</p>
            )}
          </div>

          {/* Competitors */}
          <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Competitor Comparison</h2>
            </div>
            {d.competitors.length > 0 ? (
              <div className="space-y-3">
                {/* Own site first */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white font-medium">{d.site.name} <span className="text-[10px] text-indigo-400 ml-1">You</span></span>
                    <span className="text-xs font-semibold text-indigo-400">{ownCitationRate}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${ownCitationRate}%` }} />
                  </div>
                </div>
                {d.competitors.map((comp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-400">{comp.name || comp.domain}</span>
                      <span className="text-xs font-semibold text-slate-400">{comp.mentionRate}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-600 rounded-full" style={{ width: `${comp.mentionRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <Users className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-600">No competitors tracked yet.</p>
              </div>
            )}
          </div>

          {/* Technical Issues */}
          <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-semibold text-white">Site Health</h2>
              </div>
              <div className="flex gap-2">
                {d.issues.critical > 0 && (
                  <span className="text-[10px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5">
                    {d.issues.critical} critical
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{d.issues.total} open</span>
              </div>
            </div>
            {d.issues.list.length > 0 ? (
              <div className="space-y-2.5">
                {d.issues.list.slice(0, 5).map((issue, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5",
                      issue.severity === "critical" ? "bg-rose-400" :
                      issue.severity === "warning" ? "bg-amber-400" : "bg-slate-500"
                    )} />
                    <div>
                      <p className="text-xs text-slate-300">{issue.description}</p>
                      <span className="text-[10px] text-slate-600 capitalize">{issue.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <span className="text-lg">✓</span>
                <p className="text-xs">No open issues found.</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-[#080d1a] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">AI-Generated Content</h2>
              <span className="text-[10px] text-slate-600 ml-auto">{d.content.total} articles</span>
            </div>
            {d.content.list.length > 0 ? (
              <div className="space-y-2.5">
                {d.content.list.map((article, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 truncate">{article.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                          "text-[10px] font-medium",
                          article.status === "published" ? "text-emerald-400" :
                          article.status === "review" ? "text-amber-400" : "text-slate-500"
                        )}>{article.status}</span>
                        {article.wordCount > 0 && <span className="text-[10px] text-slate-600">{article.wordCount.toLocaleString()} words</span>}
                      </div>
                    </div>
                    {article.seoScore != null && (
                      <span className="text-[10px] text-emerald-400 font-medium">SEO {article.seoScore}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-600">No content generated yet.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-white/5 pt-8">
          <p className="text-xs text-slate-600">
            Report generated by{" "}
            <a href="https://rankmind-ten.vercel.app" className="text-indigo-400 hover:text-indigo-300">RankMind</a>
            {" · "}AI Visibility Platform
            {report.expiresAt && ` · Expires ${new Date(report.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </p>
        </div>

      </div>
    </div>
  );
}
