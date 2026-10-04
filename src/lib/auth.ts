import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";

export const SESSION_COOKIE = "ss_session";
/** version of the last database upload this browser caused (see db-sync) */
export const DB_VERSION_COOKIE = "ss_v";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me-please-0123456789");

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("60d").sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function verifyToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export const currentUser = cache(async () => {
  const jar = await cookies();
  const id = await verifyToken(jar.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  await prisma.syncTo(Number(jar.get(DB_VERSION_COOKIE)?.value ?? 0));
  const find = () => prisma.user.findUnique({ where: { id }, include: { targets: true } });
  let user = await find();
  if (!user) {
    // this function may hold an older copy of the database – refresh once before giving up
    await prisma.refresh();
    user = await find();
  }
  return user;
});

/** Upload pending writes and remember the version in a cookie, so the next page (possibly served by another function) sees them. */
export async function commitWrites() {
  const v = await prisma.persistNow();
  if (v) (await cookies()).set(DB_VERSION_COOKIE, String(v), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 60 });
}

export async function requireUser() {
  const u = await currentUser();
  if (!u) redirect("/login");
  return u;
}
