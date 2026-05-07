import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

function createPrisma() {
  const projectRoot =
    process.env.npm_config_local_prefix ??
    process.env.RANKMIND_ROOT ??
    process.cwd();
  const dbPath = path.resolve(projectRoot, "dev.db").replace(/\\/g, "/");
  const url = `file:${dbPath}`;
  console.log("[prisma] db url:", url);
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
