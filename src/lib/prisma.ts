import path from "path";
import { PrismaClient } from "@prisma/client";

// All schema additions — ALTER TABLE is idempotent (errors ignored on subsequent runs)
const BILLING_MIGRATIONS = [
  // Billing columns on User
  "ALTER TABLE User ADD COLUMN plan TEXT NOT NULL DEFAULT 'free'",
  "ALTER TABLE User ADD COLUMN stripeCustomerId TEXT",
  "ALTER TABLE User ADD COLUMN stripeSubscriptionId TEXT",
  "ALTER TABLE User ADD COLUMN stripeSubscriptionStatus TEXT",
  "ALTER TABLE User ADD COLUMN planCurrentPeriodEnd TEXT",
  // Schedule columns on Site
  "ALTER TABLE Site ADD COLUMN scheduleEnabled INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE Site ADD COLUMN scheduleFrequency TEXT NOT NULL DEFAULT 'weekly'",
  "ALTER TABLE Site ADD COLUMN lastScheduledRunAt TEXT",
];

async function applyMigrations(client: PrismaClient) {
  for (const sql of BILLING_MIGRATIONS) {
    try {
      await client.$executeRawUnsafe(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
}

function createPrisma() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoToken) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
    return new PrismaClient({ adapter, log: ["error"] });
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const projectRoot =
    process.env.npm_config_local_prefix ??
    process.env.RANKMIND_ROOT ??
    process.cwd();
  const dbPath = path.resolve(projectRoot, "dev.db").replace(/\\/g, "/");
  const url = `file:${dbPath}`;
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient;
  prismaMigrated: boolean;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Run billing migrations once per process startup
if (!globalForPrisma.prismaMigrated) {
  globalForPrisma.prismaMigrated = true;
  applyMigrations(prisma).catch(() => {});
}
