import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.resolve("C:/Users/world/OneDrive/Documents/myprojects/rankmind/dev.db").replace(/\\/g, "/");
const url = `file:${dbPath}`;
console.log("db url:", url);

const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

try {
  const users = await prisma.user.findMany();
  console.log("✅ users:", users);
} catch (e) {
  console.error("❌ error:", e.message);
} finally {
  await prisma.$disconnect();
}
