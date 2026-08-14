import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// ─── Singleton Pattern ───────────────────────────────────────────────
// Prevent multiple Prisma Client instances in development (Next.js hot reload)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaBetterSqlite3 | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  const adapter = globalForPrisma.adapter ?? new PrismaBetterSqlite3({ url: connectionString });

  const client =
    globalForPrisma.prisma ??
    new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.adapter = adapter;
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = createPrismaClient();
