import { NextRequest, NextResponse } from "next/server";
import { SiteDoctorAgent } from "@/lib/agents/site-doctor";
import { z } from "zod";

const schema = z.object({ siteId: z.string() });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "siteId required" }, { status: 400 });
  }

  if (!process.env.MINIMAX_API_KEY) {
    return NextResponse.json(
      { error: "MINIMAX_API_KEY not configured" },
      { status: 503 }
    );
  }

  const agent = new SiteDoctorAgent();
  const result = await agent.run(parsed.data.siteId);

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
