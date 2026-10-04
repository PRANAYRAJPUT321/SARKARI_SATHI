import { PrismaClient } from "@prisma/client";
import { ensureDatabase, queryEnded, queryStarted, refreshDatabase, schedulePersist, syncIfStale } from "./db-sync";

const WRITES = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "upsert", "delete", "deleteMany"]);

function createClient() {
  const base = new PrismaClient();
  const client = base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const write = WRITES.has(operation);
        await ensureDatabase(base);
        await syncIfStale(base, write ? 15_000 : 300_000);
        queryStarted();
        try {
          const result = await query(args);
          // test autosaves are frequent and also kept in the browser – they don't trigger an upload on their own
          if (write) schedulePersist(base, !(model === "Attempt" && operation === "updateMany"));
          return result;
        } finally {
          queryEnded();
        }
      },
    },
  });
  return Object.assign(client, { refresh: () => refreshDatabase(base) });
}

const g = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const prisma = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
