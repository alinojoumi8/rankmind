import { readFileSync } from "fs";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });

const sql = readFileSync(
  "prisma/migrations/20260507170001_init/migration.sql",
  "utf-8"
);

// Split on -- CreateTable / -- CreateIndex chunks, keep statements
const statements = sql
  .split(/\r?\n/)
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Executing ${statements.length} statements against Turso...`);

for (const stmt of statements) {
  const preview = stmt.slice(0, 60).replace(/\s+/g, " ");
  try {
    await client.execute(stmt);
    console.log("  ✅", preview);
  } catch (e) {
    console.log("  ⚠️ ", preview, "—", e.message);
  }
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
);
console.log("\nTables in Turso:", tables.rows.map((r) => r.name).join(", "));
client.close();
