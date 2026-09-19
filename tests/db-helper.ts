import { prisma } from "../lib/prisma";

let isDbReachable: boolean | null = null;

/**
 * Checks if the PostgreSQL database configured at DATABASE_URL is reachable.
 * If reachable, tests proceed normally.
 * If not reachable (e.g. running in an offline environment without local PostgreSQL),
 * the calling test is safely skipped.
 */
export async function ensureDatabaseConnection(ctx: any): Promise<boolean> {
  if (isDbReachable === null) {
    try {
      // Fast probe to verify connection
      await prisma.$connect();
      isDbReachable = true;
    } catch {
      isDbReachable = false;
      console.warn("\n⚠️ PostgreSQL database not reachable at current DATABASE_URL. Skipping live database test.");
    }
  }

  if (!isDbReachable && ctx && typeof ctx.skip === "function") {
    ctx.skip();
    return false;
  }

  return isDbReachable ?? false;
}
