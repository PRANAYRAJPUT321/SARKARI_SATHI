import { PrismaClient } from "@prisma/client";
import { ensureDatabase, persistNow, queryEnded, queryStarted, refreshDatabase, schedulePersist, syncIfStale, syncToVersion } from "./db-sync";

const WRITES = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "upsert", "delete", "deleteMany"]);

function createClient() {
  const base = new PrismaClient();
  const client = base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const write = WRITES.has(operation);
        await ensureDatabase(base);
        const autosave = model === "Attempt" && operation === "updateMany";
        await syncIfStale(base, write ? (autosave ? 15_000 : 3_000) : 60_000);
        queryStarted();
        try {
          const result = await query(args);
          // test autosaves are frequent and also kept in the browser – they don't trigger an upload on their own
          if (write) schedulePersist(base, !autosave);
          return result;
        } finally {
          queryEnded();
        }
      },
    },
  });
  return Object.assign(client, {
    refresh: () => refreshDatabase(base),
    persistNow: () => persistNow(base),
    syncTo: (version: number) => syncToVersion(base, version),
  });
}

const g = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const prisma = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
