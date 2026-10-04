import "server-only";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { BlobPreconditionFailedError, get as blobGet, head as blobHead, put as blobPut } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import type { PrismaClient } from "@prisma/client";
import { SCHEMA_SQL } from "./schema-sql";

/**
 * Serverless persistence for SQLite with safe concurrent writers.
 *
 * On hosts without a persistent disk (e.g. Vercel) set DATABASE_URL to an absolute path such
 * as "file:/tmp/sarkari.db" and connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN).
 *
 * Each server instance keeps a local copy of the database and a journal of the writes it
 * made since its last sync. Uploads are conditional on the blob's ETag: if another instance
 * uploaded in the meantime, this instance downloads the latest copy, replays its journal on
 * top (so increments, inserts and deletes from both sides are kept) and retries. Nothing is
 * overwritten blindly.
 *
 * Locally (relative DATABASE_URL, no token) this module does nothing.
 */
const url = process.env.DATABASE_URL ?? "";
const FILE = url.startsWith("file:/") ? url.slice("file:".length) : null;
// DB_SYNC_FAKE_DIR swaps Vercel Blob for a folder (used to test several instances locally)
const FAKE_DIR = process.env.DB_SYNC_FAKE_DIR;
const SYNC = Boolean(FILE && (process.env.BLOB_READ_WRITE_TOKEN || FAKE_DIR));
const BLOB_PATH = "db/sarkari-sathi.sqlite";

const fake = FAKE_DIR ? fakeBlob(FAKE_DIR) : null;
const get: typeof blobGet = fake ? (fake.get as unknown as typeof blobGet) : blobGet;
const head: typeof blobHead = fake ? (fake.head as unknown as typeof blobHead) : blobHead;
const put: typeof blobPut = fake ? (fake.put as unknown as typeof blobPut) : blobPut;

/** Folder-backed stand-in for Vercel Blob with ETag compare-and-swap (test only). */
function fakeBlob(dir: string) {
  const data = `${dir}/db.sqlite`, metaFile = `${dir}/meta.json`, lockDir = `${dir}/.lock`;
  const meta = async () => JSON.parse(await fs.readFile(metaFile, "utf8").catch(() => "null")) as { etag: string; uploadedAt: string } | null;
  const withLock = async <T,>(fn: () => Promise<T>) => {
    for (;;) {
      try {
        await fs.mkdir(lockDir);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 3));
      }
    }
    try {
      return await fn();
    } finally {
      await fs.rmdir(lockDir).catch(() => {});
    }
  };
  return {
    async get() {
      const m = await meta();
      if (!m) return null;
      const buf = await fs.readFile(data);
      return { statusCode: 200, stream: new Response(buf).body, headers: new Headers(), blob: { ...m, uploadedAt: new Date(m.uploadedAt), contentType: "application/octet-stream", size: buf.length } };
    },
    async head() {
      const m = await meta();
      if (!m) throw new Error("not found");
      return { ...m, uploadedAt: new Date(m.uploadedAt) };
    },
    async put(_path: string, body: Buffer, opts: { ifMatch?: string; allowOverwrite?: boolean }) {
      return withLock(async () => {
        const m = await meta();
        if (opts.ifMatch && m?.etag !== opts.ifMatch) throw new BlobPreconditionFailedError();
        if (!opts.ifMatch && m && opts.allowOverwrite === false) throw new Error("This blob already exists");
        await fs.writeFile(data, body);
        const next = { etag: randomBytes(8).toString("hex"), uploadedAt: new Date().toISOString() };
        await fs.writeFile(metaFile, JSON.stringify(next));
        return { etag: next.etag, url: "fake://" + data, pathname: BLOB_PATH };
      });
    },
  };
}

/** Columns added after the first release: [table, column, definition]. */
const COLUMN_MIGRATIONS: [string, string, string][] = [
  ["User", "morningPush", "BOOLEAN NOT NULL DEFAULT true"],
  ["User", "taskPush", "BOOLEAN NOT NULL DEFAULT true"],
];

type JournalEntry = { model: string; operation: string; args: unknown };

let ready: Promise<void> | null = null;
let baseEtag: string | null = null; // ETag of the blob our local file (minus the journal) matches
let localVersion = 0; // uploadedAt (ms) of that blob
let lastHead = 0;
let inFlight = 0;
let journal: JournalEntry[] = [];
let lock: Promise<void> = Promise.resolve();

export const syncEnabled = SYNC;
export const newId = () => `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;

/** Run `fn` exclusively: waits for running queries to finish and blocks new ones. */
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(async () => {
    while (inFlight > 0) await new Promise((r) => setTimeout(r, 5));
    return fn();
  });
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Wait for any exclusive section, then mark a query as running (atomically). */
export async function beginQuery() {
  for (;;) {
    const current = lock;
    await current;
    if (current === lock) break;
  }
  inFlight++;
}
export const endQuery = () => void (inFlight = Math.max(0, inFlight - 1));

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
  baseEtag = res.blob.etag;
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

/** Record a successful write so it can be replayed on a newer copy if an upload conflicts. */
export function journalWrite(model: string, operation: string, args: unknown) {
  if (!SYNC) return;
  const entry = { model, operation, args: structuredClone(args) };
  // test autosaves overwrite the same row – keep only the latest one
  if (model === "Attempt" && operation === "updateMany") {
    const key = JSON.stringify((args as { where?: unknown }).where);
    journal = journal.filter((j) => !(j.model === "Attempt" && j.operation === "updateMany" && JSON.stringify((j.args as { where?: unknown }).where) === key));
  }
  journal.push(entry);
}

async function replay(base: PrismaClient) {
  const kept: JournalEntry[] = [];
  for (const j of journal) {
    const delegate = (base as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[j.model[0].toLowerCase() + j.model.slice(1)];
    try {
      await delegate[j.operation](structuredClone(j.args));
      kept.push(j);
    } catch (e) {
      // e.g. the row was deleted meanwhile or a unique value was taken – the other write wins
      console.warn("[db-sync] dropped write during merge", j.model, j.operation, (e as Error).message?.slice(0, 120));
    }
  }
  journal = kept;
}

/** Download the latest copy and re-apply our unsynced writes on top of it. */
function rebase(base: PrismaClient) {
  return exclusive(async () => {
    await base.$disconnect();
    if (await download()) {
      await migrate(base);
      await replay(base);
    }
  });
}

/**
 * Pick up a newer copy uploaded by another instance. Checked at most every `maxAgeMs`
 * (short before writes, longer before reads).
 */
export async function syncIfStale(base: PrismaClient, maxAgeMs: number) {
  if (!SYNC || Date.now() - lastHead < maxAgeMs) return;
  lastHead = Date.now();
  const meta = await head(BLOB_PATH).catch(() => null);
  if (!meta || meta.etag === baseEtag) return;
  await rebase(base);
}

/**
 * Read-your-writes across serverless functions: the browser carries the version of the
 * last upload it caused (cookie); a function holding an older copy pulls the newer one.
 */
export async function syncToVersion(base: PrismaClient, version: number) {
  if (!SYNC || !version || version <= localVersion) return;
  await ensureDatabase(base);
  if (version <= localVersion) return;
  await rebase(base);
  localVersion = Math.max(localVersion, version);
}

/** Force a fresh copy (used by scheduled jobs, which may run on a different instance). */
export async function refreshDatabase(base: PrismaClient) {
  lastHead = 0;
  await ensureDatabase(base);
  await syncIfStale(base, 0);
}

let timer: ReturnType<typeof setTimeout> | null = null;
let chain: Promise<void> = Promise.resolve();

/** Mark the DB as changed. `urgent` writes are uploaded after a short debounce; others ride along with the next one. */
export function schedulePersist(base: PrismaClient, urgent: boolean) {
  if (!SYNC || !urgent || timer) return;
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

async function flush(base: PrismaClient) {
  for (let attempt = 0; attempt < 6; attempt++) {
    if (!journal.length) return;
    const snap = `${FILE}.snapshot`;
    // snapshot + count under the lock so the journal matches the uploaded file exactly
    const { data, count } = await exclusive(async () => {
      await fs.rm(snap, { force: true });
      await base.$executeRawUnsafe(`VACUUM INTO '${snap}'`);
      return { data: await fs.readFile(snap), count: journal.length };
    });
    try {
      const res = await put(BLOB_PATH, data, {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/vnd.sqlite3",
        ...(baseEtag ? { ifMatch: baseEtag } : { allowOverwrite: false }),
      });
      baseEtag = res.etag;
      journal = journal.slice(count);
      const meta = await head(BLOB_PATH).catch(() => null);
      localVersion = meta && meta.etag === res.etag ? new Date(meta.uploadedAt).getTime() : Math.max(localVersion, Date.now());
      lastHead = Date.now();
      return;
    } catch (e) {
      const conflict = e instanceof BlobPreconditionFailedError || (!baseEtag && /exist/i.test((e as Error).message ?? ""));
      if (!conflict) throw e;
      await rebase(base); // someone else uploaded first – merge and retry
    }
  }
  throw new Error("db-sync: could not upload after repeated conflicts");
}
