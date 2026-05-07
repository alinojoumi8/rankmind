import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env manually
const env = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
env.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
});

const MINIMAX_KEY = process.env.MINIMAX_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

console.log("🔑 MiniMax key loaded:", MINIMAX_KEY ? `${MINIMAX_KEY.slice(0, 12)}...` : "MISSING");
console.log("🔑 OpenRouter key loaded:", OPENROUTER_KEY ? `${OPENROUTER_KEY.slice(0, 12)}...` : "MISSING");
console.log("");

// ── Test 1: MiniMax M2.7 ──────────────────────────────────────────────────
console.log("📡 Testing MiniMax M2.7...");
try {
  const res = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "MiniMax-M2.7",
      messages: [{ role: "user", content: "Reply with exactly: MiniMax OK" }],
      max_tokens: 20,
      temperature: 0,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("  ❌ MiniMax error:", res.status, JSON.stringify(data));
  } else {
    const reply = data.choices?.[0]?.message?.content ?? "(empty)";
    console.log("  ✅ MiniMax M2.7 working! Reply:", reply.trim());
    console.log("  📊 Tokens used:", data.usage?.total_tokens ?? "?");
  }
} catch (err) {
  console.error("  ❌ MiniMax fetch failed:", err.message);
}

console.log("");

// ── Test 2: OpenRouter → Perplexity Sonar ────────────────────────────────
console.log("📡 Testing OpenRouter → Perplexity Sonar...");
try {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "RankMind",
    },
    body: JSON.stringify({
      model: "perplexity/sonar",
      messages: [{ role: "user", content: "Reply with exactly: Perplexity OK" }],
      max_tokens: 20,
      temperature: 0,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("  ❌ OpenRouter error:", res.status, JSON.stringify(data));
  } else {
    const reply = data.choices?.[0]?.message?.content ?? "(empty)";
    console.log("  ✅ OpenRouter/Perplexity working! Reply:", reply.trim());
    console.log("  📊 Tokens used:", data.usage?.total_tokens ?? "?");
  }
} catch (err) {
  console.error("  ❌ OpenRouter fetch failed:", err.message);
}

console.log("");
console.log("✅ API tests complete.");
