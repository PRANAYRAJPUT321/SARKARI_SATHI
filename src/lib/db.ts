import { PrismaClient } from "@prisma/client";
import { beginQuery, endQuery, ensureDatabase, journalWrite, newId, persistNow, refreshDatabase, schedulePersist, syncDiagnostics, syncEnabled, syncIfStale, syncToVersion } from "./db-sync";

const WRITES = new Set(["create", "createMany", "createManyAndReturn", "update", "updateMany", "upsert", "delete", "deleteMany"]);

/** Give new rows an explicit id so a journaled write replays to the exact same row. */
function withIds(operation: string, args: Record<string, unknown>) {
  if (!syncEnabled) return args;
  const add = (d: unknown) => (d && typeof d === "object" && !("id" in (d as object)) ? { id: newId(), ...(d as object) } : d);
  if (operation === "create") return { ...args, data: add(args.data) };
  if (operation === "upsert") return { ...args, create: add(args.create) };
  if (operation === "createMany" || operation === "createManyAndReturn") return { ...args, data: Array.isArray(args.data) ? args.data.map(add) : add(args.data) };
  return args;
}

function createClient() {
  const base = new PrismaClient();
  const client = base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const write = WRITES.has(operation);
        await ensureDatabase(base);
        const autosave = model === "Attempt" && operation === "updateMany";
        await syncIfStale(base, write ? (autosave ? 15_000 : 3_000) : 60_000);
        const finalArgs = write ? withIds(operation, args as Record<string, unknown>) : args;
        await beginQuery();
        try {
          const result = await query(finalArgs as typeof args);
          if (write && model) {
            journalWrite(model, operation, finalArgs);
            // test autosaves are frequent and also kept in the browser – they don't trigger an upload on their own
            schedulePersist(base, !autosave);
          }
          return result;
        } finally {
          endQuery();
        }
      },
    },
  });
  return Object.assign(client, {
    refresh: () => refreshDatabase(base),
    persistNow: () => persistNow(base),
    syncTo: (version: number) => syncToVersion(base, version),
    // read through the client so it reports the sync state that belongs to it (see the note below)
    syncStatus: () => syncDiagnostics(),
  });
}

// One client per process, also in production: Next.js bundles this module separately for server
// actions, pages and route handlers, and several clients syncing the same SQLite file would clash.
const g = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };
export const prisma = (g.prisma ??= createClient());
