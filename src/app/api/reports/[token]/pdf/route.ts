import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReportPDF } from "@/lib/pdf";
import React from "react";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const report = await prisma.report.findUnique({
    where: { token },
    include: {
      site: {
        select: {
          name: true,
          domain: true,
          metrics: { orderBy: { date: "desc" }, take: 1 },
          competitors: {
            include: {
              mentions: { orderBy: { checkedAt: "desc" }, take: 50 },
            },
          },
        },
      },
    },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Check expiry
  if (report.expiresAt && report.expiresAt < new Date()) {
    return NextResponse.json({ error: "Report has expired" }, { status: 410 });
  }

  // Parse snapshot
  let snapshot: {
    metrics?: Record<string, number>;
    llmCitationShare?: Array<{ llm: string; citationRate: number; cited: number; total: number }>;
    issues?: Array<{ type: string; severity: string; url: string; description: string }>;
    contents?: Array<{ title: string; status: string; wordCount: number; seoScore: number | null }>;
  } = {};

  try {
    snapshot = JSON.parse(report.snapshotData);
  } catch { /* use empty snapshot */ }

  const metric = report.site.metrics[0];

  // Build competitor mention rates
  const competitors = report.site.competitors.map((comp) => {
    const total = comp.mentions.length;
    const mentioned = comp.mentions.filter((m) => m.mentioned).length;
    return {
      name: comp.name,
      domain: comp.domain,
      mentionRate: total > 0 ? Math.round((mentioned / total) * 100) : 0,
    };
  });

  const pdfElement = React.createElement(ReportPDF, {
    title: report.title,
    siteName: report.site.name,
    siteDomain: report.site.domain,
    generatedAt: new Date(report.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    metrics: {
      citationShare: metric?.citationShare ?? snapshot.metrics?.citationShare ?? 0,
      geoScore: metric?.geoScore ?? snapshot.metrics?.geoScore ?? 0,
      techScore: metric?.techScore ?? snapshot.metrics?.techScore ?? 0,
      domainRating: metric?.domainRating ?? snapshot.metrics?.domainRating ?? 0,
      organicTraffic: metric?.organicTraffic ?? snapshot.metrics?.organicTraffic ?? 0,
      monthlyLeads: metric?.monthlyLeads ?? snapshot.metrics?.monthlyLeads ?? 0,
    },
    llmCitationShare: snapshot.llmCitationShare ?? [],
    issues: snapshot.issues ?? [],
    contents: snapshot.contents ?? [],
    competitors,
  });

  const buffer = await renderToBuffer(pdfElement);

  const safeTitle = report.title.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeTitle}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
