import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

const localDbPath = path.resolve(process.cwd(), "dev.db").replace(/\\/g, "/");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      tursoUrl && tursoToken
        ? tursoUrl
        : `file:${localDbPath}`,
  },
  ...(tursoUrl && tursoToken
    ? {
        adapter: async () => {
          const { PrismaLibSql } = await import("@prisma/adapter-libsql");
          return new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
        },
      }
    : {}),
});
