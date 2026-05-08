import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. Next.js dev mode hot-reloads modules, which
 * would otherwise create a new client (and a new connection pool) on
 * every save. We stash the instance on `globalThis` to survive HMR.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
