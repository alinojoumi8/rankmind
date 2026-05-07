/**
 * End-to-end agent test — creates a site and runs all 3 agents for real.
 * Run: node scripts/test-agents.mjs
 */

const BASE = "http://localhost:3001";

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, data: await res.json() };
}

// ── Step 1: Register the site ─────────────────────────────────────────────
console.log("1️⃣  Creating test site...");
const { data: siteResp } = await post("/api/sites", {
  userId: "demo-user-001",
  domain: "rankmind.ai",
  name: "RankMind",
  industry: "AI marketing software",
  keywords: ["AI SEO tools", "generative engine optimization", "GEO optimization"],
});
const siteId = siteResp.site?.id;
console.log("   Site ID:", siteId);
console.log("   Domain:", siteResp.site?.domain);
console.log("");

if (!siteId) {
  console.error("❌ Failed to create site:", siteResp);
  process.exit(1);
}

// ── Step 2: Run GEO Scout ─────────────────────────────────────────────────
console.log("2️⃣  Running GEO Scout agent (Perplexity citation scan)...");
console.log("   ⏳ This takes ~30s (5 live Perplexity queries)...");
const geoStart = Date.now();
const { status: geoStatus, data: geoResult } = await post("/api/agents/geo-scout", { siteId });
console.log(`   Done in ${((Date.now() - geoStart) / 1000).toFixed(1)}s — HTTP ${geoStatus}`);
if (geoResult.success) {
  console.log("   ✅", geoResult.summary);
  console.log("   Citation rate:", geoResult.data?.citationRate + "%");
  geoResult.data?.results?.forEach((r) => {
    const icon = r.cited ? "🟢" : "🔴";
    console.log(`   ${icon} "${r.query.slice(0, 60)}..." → ${r.cited ? `cited (${r.sentiment})` : "not cited"}`);
  });
} else {
  console.error("   ❌ GEO Scout failed:", geoResult.error);
}
console.log("");

// ── Step 3: Run Site Doctor ───────────────────────────────────────────────
console.log("3️⃣  Running Site Doctor agent (technical SEO crawl)...");
const sdStart = Date.now();
const { status: sdStatus, data: sdResult } = await post("/api/agents/site-doctor", { siteId });
console.log(`   Done in ${((Date.now() - sdStart) / 1000).toFixed(1)}s — HTTP ${sdStatus}`);
if (sdResult.success) {
  console.log("   ✅", sdResult.summary);
  if (sdResult.data?.fixPlan) {
    console.log("\n   📋 MiniMax Fix Plan:");
    sdResult.data.fixPlan.split("\n").forEach((line) => {
      if (line.trim()) console.log("   ", line);
    });
  }
} else {
  console.error("   ❌ Site Doctor failed:", sdResult.error);
}
console.log("");

// ── Step 4: Run Content Architect ────────────────────────────────────────
console.log("4️⃣  Running Content Architect agent (MiniMax M2.7 article generation)...");
console.log("   ⏳ Generating full article — this takes ~60s...");
const caStart = Date.now();
const { status: caStatus, data: caResult } = await post("/api/agents/content", { siteId });
console.log(`   Done in ${((Date.now() - caStart) / 1000).toFixed(1)}s — HTTP ${caStatus}`);
if (caResult.success) {
  console.log("   ✅", caResult.summary);
  console.log("   Title:", caResult.data?.title);
  console.log("   Words:", caResult.data?.wordCount);
  console.log("   SEO Score:", caResult.data?.seoScore + "/100");
  console.log("   GEO Score:", caResult.data?.geoScore + "/100");
  console.log("   Status:", caResult.data?.status);
} else {
  console.error("   ❌ Content Architect failed:", caResult.error);
}
console.log("");

// ── Step 5: Pull dashboard data ───────────────────────────────────────────
console.log("5️⃣  Fetching dashboard data from DB...");
const { data: dash } = await get(`/api/dashboard?siteId=${siteId}`);
console.log("   Citation share:", dash.metrics?.citationShare + "%");
console.log("   Tech score:", dash.metrics?.techScore + "/100");
console.log("   Agent runs recorded:", dash.agentStatuses?.filter(a => a.status !== "never_run").length + "/7");
console.log("   Citations stored:", dash.recentCitations?.length);
console.log("   Issues found:", dash.issues?.length);
console.log("   Content pieces:", dash.contents?.length);

console.log("\n🎉 All agents tested successfully!");
console.log(`   Dashboard: ${BASE}/dashboard`);
