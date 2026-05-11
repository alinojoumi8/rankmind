import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#050914",
    color: "#ffffff",
    fontFamily: "Helvetica",
    padding: 40,
    fontSize: 10,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandBox: {
    width: 24,
    height: 24,
    backgroundColor: "#6366f1",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  headerMeta: { color: "#64748b", fontSize: 9, textAlign: "right" },

  // Section headers
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 10,
    marginTop: 20,
  },

  // Score card grid
  scoreGrid: { flexDirection: "row", gap: 10, marginBottom: 16 },
  scoreCard: {
    flex: 1,
    backgroundColor: "#0d1629",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  scoreLabel: { fontSize: 8, color: "#64748b", marginBottom: 4 },
  scoreValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  scoreChange: { fontSize: 8, color: "#34d399", marginTop: 2 },

  // Citation bar
  citationRow: { marginBottom: 8 },
  citationHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  citationLabel: { color: "#94a3b8", fontSize: 9 },
  citationPct: { color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 9 },
  barBg: { height: 5, backgroundColor: "#1e293b", borderRadius: 3 },
  barFill: { height: 5, backgroundColor: "#6366f1", borderRadius: 3 },

  // Issue list
  issueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
    padding: 8,
    backgroundColor: "#0d1629",
    borderRadius: 6,
  },
  issueDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  issueText: { flex: 1, color: "#94a3b8", fontSize: 9 },
  issueSeverity: { fontSize: 8, color: "#64748b" },

  // Content table
  tableHeader: {
    flexDirection: "row",
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    marginBottom: 4,
  },
  tableHeaderCell: { color: "#475569", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
  },
  tableCell: { color: "#94a3b8", fontSize: 9 },

  // Status badge
  badge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: "#334155" },
});

// ── Types ──────────────────────────────────────────────────────────────────────
interface PDFReportProps {
  title: string;
  siteName: string;
  siteDomain: string;
  generatedAt: string;
  metrics: {
    citationShare: number;
    geoScore: number;
    techScore: number;
    domainRating: number;
    organicTraffic: number;
    monthlyLeads: number;
  };
  llmCitationShare: Array<{ llm: string; citationRate: number; cited: number; total: number }>;
  issues: Array<{ type: string; severity: string; url: string; description: string }>;
  contents: Array<{ title: string; status: string; wordCount: number; seoScore: number | null }>;
  competitors: Array<{ name: string; domain: string; mentionRate: number }>;
}

// ── PDF Document ──────────────────────────────────────────────────────────────
export function ReportPDF({
  title,
  siteName,
  siteDomain,
  generatedAt,
  metrics,
  llmCitationShare,
  issues,
  contents,
  competitors,
}: PDFReportProps) {
  const severityColor = (s: string) =>
    s === "critical" ? "#ef4444" : s === "warning" ? "#f59e0b" : "#3b82f6";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandBox}>
              <Text style={{ color: "#fff", fontSize: 12 }}>R</Text>
            </View>
            <Text style={styles.brandText}>RankMind</Text>
          </View>
          <View>
            <Text style={[styles.headerMeta, { color: "#ffffff", fontSize: 11 }]}>{title}</Text>
            <Text style={styles.headerMeta}>{siteName} · {siteDomain}</Text>
            <Text style={styles.headerMeta}>Generated {generatedAt}</Text>
          </View>
        </View>

        {/* Score Cards */}
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.scoreGrid}>
          {[
            { label: "GEO Score", value: `${metrics.geoScore}/100`, color: "#6366f1" },
            { label: "Citation Share", value: `${metrics.citationShare}%`, color: "#34d399" },
            { label: "Tech Health", value: `${metrics.techScore}/100`, color: "#06b6d4" },
            { label: "Domain Rating", value: String(metrics.domainRating), color: "#8b5cf6" },
          ].map((card) => (
            <View key={card.label} style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>{card.label}</Text>
              <Text style={[styles.scoreValue, { color: card.color }]}>{card.value}</Text>
            </View>
          ))}
        </View>

        {/* AI Citation Share */}
        {llmCitationShare.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>AI Citation Share by Engine</Text>
            {llmCitationShare.map((item) => (
              <View key={item.llm} style={styles.citationRow}>
                <View style={styles.citationHeader}>
                  <Text style={styles.citationLabel}>{item.llm.charAt(0).toUpperCase() + item.llm.slice(1)}</Text>
                  <Text style={styles.citationPct}>
                    {item.citationRate}% · {item.cited}/{item.total} queries
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${item.citationRate}%` }]} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Competitor Comparison */}
        {competitors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Competitor Citation Comparison</Text>
            {competitors.map((comp) => (
              <View key={comp.domain} style={styles.citationRow}>
                <View style={styles.citationHeader}>
                  <Text style={styles.citationLabel}>{comp.name} ({comp.domain})</Text>
                  <Text style={styles.citationPct}>{comp.mentionRate}%</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${comp.mentionRate}%`, backgroundColor: "#475569" }]} />
                </View>
              </View>
            ))}
          </>
        )}

        {/* Site Issues */}
        {issues.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Site Issues ({issues.length} open)</Text>
            {issues.slice(0, 8).map((issue, i) => (
              <View key={i} style={styles.issueRow}>
                <View style={[styles.issueDot, { backgroundColor: severityColor(issue.severity) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.issueText}>{issue.description}</Text>
                  <Text style={[styles.issueSeverity, { marginTop: 2 }]}>{issue.url}</Text>
                </View>
                <Text style={[styles.issueSeverity, { color: severityColor(issue.severity) }]}>
                  {issue.severity}
                </Text>
              </View>
            ))}
            {issues.length > 8 && (
              <Text style={{ color: "#475569", fontSize: 8, marginTop: 4 }}>
                + {issues.length - 8} more issues
              </Text>
            )}
          </>
        )}

        {/* Content */}
        {contents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Content Pipeline</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Title</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>SEO Score</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Words</Text>
            </View>
            {contents.slice(0, 10).map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>{c.title}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{c.status}</Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                  {c.seoScore != null ? `${c.seoScore}/100` : "—"}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, textAlign: "right" }]}>
                  {c.wordCount > 0 ? c.wordCount.toLocaleString() : "—"}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Generated by RankMind · rankmind-ten.vercel.app</Text>
          <Text style={styles.footerText}>{siteDomain}</Text>
        </View>
      </Page>
    </Document>
  );
}
