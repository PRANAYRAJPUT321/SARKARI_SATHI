import "server-only";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { get, head, put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import type { PrismaClient } from "@prisma/client";
import { SCHEMA_SQL } from "./schema-sql";

/**
 * Serverless persistence for SQLite.
 *
 * On hosts without a persistent disk (e.g. Vercel) set DATABASE_URL to an absolute
 * path such as "file:/tmp/sarkari.db" and connect a Vercel Blob store
 * (BLOB_READ_WRITE_TOKEN). The database file is restored from Blob on a cold start,
 * refreshed when another instance has uploaded a newer copy, and a consistent snapshot
 * is uploaded shortly after writes. Schema changes are applied idempotently on start.
 *
 * Locally (relative DATABASE_URL, no token) this module does nothing.
 */
const url = process.env.DATABASE_URL ?? "";
const FILE = url.startsWith("file:/") ? url.slice("file:".length) : null;
const SYNC = Boolean(FILE && process.env.BLOB_READ_WRITE_TOKEN);
const BLOB_PATH = "db/sarkari-sathi.sqlite";

/** Columns added after the first release: [table, column, definition]. */
const COLUMN_MIGRATIONS: [string, string, string][] = [
  ["User", "morningPush", "BOOLEAN NOT NULL DEFAULT true"],
  ["User", "taskPush", "BOOLEAN NOT NULL DEFAULT true"],
];

let ready: Promise<void> | null = null;
let localVersion = 0; // uploadedAt (ms) of the blob our local file matches
let lastHead = 0;
let inFlight = 0;
let dirty = false;

export function ensureDatabase(base: PrismaClient): Promise<void> | undefined {
  if (!FILE) return;
  ready ??= init(base).catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

async function download(): Promise<boolean> {
  const res = await get(BLOB_PATH, { access: "private", useCache: false }).catch(() => null);
  if (!res || res.statusCode !== 200 || !res.stream) return false;
  const buf = Buffer.from(await new Response(res.stream).arrayBuffer());
  const tmp = `${FILE}.download`;
  await fs.writeFile(tmp, buf);
  await fs.rm(`${FILE}-journal`, { force: true });
  await fs.rename(tmp, FILE!);
  localVersion = new Date(res.blob.uploadedAt).getTime();
  lastHead = Date.now();
  return true;
}

async function init(base: PrismaClient) {
  if (!existsSync(FILE!)) {
    const restored = SYNC && (await download());
    if (!restored) await fs.writeFile(FILE!, "");
  }
  await migrate(base);
}

async function migrate(base: PrismaClient) {
  for (const stmt of SCHEMA_SQL) await base.$executeRawUnsafe(stmt);
  for (const [table, column, ddl] of COLUMN_MIGRATIONS) {
    const cols = await base.$queryRawUnsafe<{ name: string }[]>(`PRAGMA table_info("${table}")`);
    if (!cols.some((c) => c.name === column)) await base.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${ddl}`);
  }
}

/**
 * Pick up a newer copy uploaded by another instance. Checked at most every `maxAgeMs`
 * (short before writes, longer before reads) and only when nothing is running locally.
 */
export async function syncIfStale(base: PrismaClient, maxAgeMs: number) {
  if (!SYNC || dirty || inFlight > 0 || Date.now() - lastHead < maxAgeMs) return;
  lastHead = Date.now();
  const meta = await head(BLOB_PATH).catch(() => null);
  if (!meta) return;
  const remote = new Date(meta.uploadedAt).getTime();
  if (remote <= localVersion + 1000 || dirty || inFlight > 0) return;
  await base.$disconnect();
  if (await download()) await migrate(base);
}

/**
 * Read-your-writes across serverless functions: the browser carries the version of the
 * last upload it caused (cookie); a function holding an older copy downloads the newer one.
 */
export async function syncToVersion(base: PrismaClient, version: number) {
  if (!SYNC || !version || version <= localVersion) return;
  await ensureDatabase(base);
  if (version <= localVersion) return;
  await base.$disconnect();
  if (await download()) await migrate(base);
  localVersion = Math.max(localVersion, version);
}

/** Upload pending writes right away and return the new version (used before redirects). */
export async function persistNow(base: PrismaClient): Promise<number> {
  if (!SYNC) return 0;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  chain = chain.then(() => flush(base)).catch((e) => console.error("[db-sync] upload failed", e));
  await chain;
  return localVersion;
}

/** Force a fresh copy (used by scheduled jobs, which may run on a different instance). */
export async function refreshDatabase(base: PrismaClient) {
  lastHead = 0;
  await ensureDatabase(base);
  await syncIfStale(base, 0);
}

export const queryStarted = () => void inFlight++;
export const queryEnded = () => void (inFlight = Math.max(0, inFlight - 1));

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
    localVersion = Date.now();
    lastHead = Date.now();
  } catch (e) {
    dirty = true;
    throw e;
  }
}
