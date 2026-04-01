import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

// ─── Singleton PrismaClient ────────────────────────────
// Prevents exhausting the DB connection pool during
// hot-reloads in development (tsx watch / nodemon).

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
