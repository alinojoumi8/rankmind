import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

const dbPath = "C:/Users/world/OneDrive/Documents/myprojects/rankmind/dev.db";
console.log("db path:", dbPath);

const db = new Database(dbPath);
const adapter = new PrismaBetterSqlite3(db);
const prisma = new PrismaClient({ adapter });

try {
  const result = await prisma.$queryRaw`SELECT 1 as test`;
  console.log("raw query works:", result);
  const users = await prisma.user.findMany();
  console.log("users:", users);
} catch (e) {
  console.error("error:", e.message);
  console.error("stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
} finally {
  await prisma.$disconnect();
}
