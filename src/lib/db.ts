import { PrismaClient } from "@prisma/client";
import { ensureDatabase, schedulePersist } from "./db-sync";

const WRITES = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "upsert", "delete", "deleteMany"]);

function createClient() {
  const base = new PrismaClient();
  return base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        await ensureDatabase(base);
        const result = await query(args);
        // test autosaves are frequent and also kept in the browser – they don't trigger an upload on their own
        if (WRITES.has(operation)) schedulePersist(base, !(model === "Attempt" && operation === "updateMany"));
        return result;
      },
    },
  });
}

const g = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const prisma = g.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
