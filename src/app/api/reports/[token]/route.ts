import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reports/[token] — public endpoint, no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const report = await prisma.report.findUnique({
    where: { token },
    select: {
      id: true,
      title: true,
      snapshotData: true,
      viewCount: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  if (report.expiresAt && new Date() > report.expiresAt) {
    return NextResponse.json({ error: "Report has expired" }, { status: 410 });
  }

  // Increment view count
  await prisma.report.update({
    where: { token },
    data: { viewCount: { increment: 1 } },
  });

  return NextResponse.json({
    title: report.title,
    createdAt: report.createdAt,
    expiresAt: report.expiresAt,
    viewCount: report.viewCount + 1,
    data: JSON.parse(report.snapshotData),
  });
}
