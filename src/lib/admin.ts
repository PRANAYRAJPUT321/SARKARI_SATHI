import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { cookies, headers } from "next/headers";

/**
 * Owner-only access to /admin. The password lives in the ADMIN_PASSWORD environment variable
 * (Vercel → Project → Settings → Environment Variables). Changing it signs out every admin session.
 */
const ADMIN_COOKIE = "ss_admin";
const sha = (s: string) => createHash("sha256").update(s).digest();
const key = () => new TextEncoder().encode(`${process.env.AUTH_SECRET || "dev-secret-change-me-please-0123456789"}:admin:${sha(process.env.ADMIN_PASSWORD ?? "").toString("hex")}`);

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export function adminPasswordMatches(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && timingSafeEqual(sha(input), sha(expected!));
}

export async function startAdminSession() {
  const token = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" }).setAudience("admin").setIssuedAt().setExpirationTime("7d").sign(key());
  (await cookies()).set(ADMIN_COOKIE, token, { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/admin", maxAge: 60 * 60 * 24 * 7 });
}

export async function endAdminSession() {
  (await cookies()).set(ADMIN_COOKIE, "", { path: "/admin", maxAge: 0 });
}

export async function isAdmin() {
  if (!adminConfigured()) return false;
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, key(), { audience: "admin" });
    return true;
  } catch {
    return false;
  }
}

// best-effort brute-force guard: 8 wrong passwords per IP per 15 minutes
const g = globalThis as unknown as { ssAdminTries?: Map<string, number[]> };
const tries = (g.ssAdminTries ??= new Map<string, number[]>());

export async function adminLoginBlocked() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < 15 * 60_000);
  tries.set(ip, recent);
  return { blocked: recent.length >= 8, fail: () => void tries.set(ip, [...recent, now]) };
}
