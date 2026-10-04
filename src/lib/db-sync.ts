import "server-only";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { get, put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import type { PrismaClient } from "@prisma/client";
import { SCHEMA_SQL } from "./schema-sql";

/**
 * Serverless persistence for SQLite.
 *
 * On hosts without a persistent disk (e.g. Vercel) set DATABASE_URL to an absolute
 * path such as "file:/tmp/sarkari.db" and connect a Vercel Blob store
 * (BLOB_READ_WRITE_TOKEN). The database file is restored from Blob on a cold start
 * and a consistent snapshot is uploaded shortly after writes.
 *
 * Locally (relative DATABASE_URL, no token) this module does nothing.
 */
const url = process.env.DATABASE_URL ?? "";
const FILE = url.startsWith("file:/") ? url.slice("file:".length) : null;
const SYNC = Boolean(FILE && process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_PATH = "db/sarkari-sathi.sqlite";

let ready: Promise<void> | null = null;

export function ensureDatabase(base: PrismaClient): Promise<void> | undefined {
  if (!FILE) return;
  ready ??= init(base).catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

async function init(base: PrismaClient) {
  if (existsSync(FILE!)) return;
  if (SYNC) {
    const res = await get(BLOB_PATH, { access: "private", useCache: false }).catch(() => null);
    if (res && res.statusCode === 200 && res.stream) {
      const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
      await fs.writeFile(FILE!, buf);
      return;
    }
  }
  await fs.writeFile(FILE!, "");
  for (const stmt of SCHEMA_SQL) await base.$executeRawUnsafe(stmt);
}

let dirty = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();

/** Mark the DB as changed. `urgent` writes are uploaded after a short debounce; others ride along with the next one. */
export function schedulePersist(base: PrismaClient, urgent: boolean) {
  if (!SYNC) return;
  dirty = true;
  if (!urgent || timer) return;
  const done = new Promise<void>((resolve) => {
    timer = setTimeout(() => {
      timer = null;
      chain = chain.then(() => flush(base)).catch((e) => console.error("[db-sync] upload failed", e));
      chain.then(resolve, resolve);
    }, 1200);
  });
  try {
    waitUntil(done);
  } catch {
    /* not running on Vercel – the timer still fires */
  }
}

async function flush(base: PrismaClient) {
  if (!dirty) return;
  dirty = false;
  const snap = `${FILE}.snapshot`;
  try {
    await fs.rm(snap, { force: true });
    await base.$executeRawUnsafe(`VACUUM INTO '${snap}'`);
    const data = await fs.readFile(snap);
    await put(BLOB_PATH, data, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType: "application/vnd.sqlite3" });
  } catch (e) {
    dirty = true;
    throw e;
  }
}
