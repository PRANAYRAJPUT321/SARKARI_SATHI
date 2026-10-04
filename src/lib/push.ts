import "server-only";
import webpush from "web-push";
import { prisma } from "./db";

const PUBLIC = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
export const pushConfigured = Boolean(PUBLIC && PRIVATE);
export const vapidPublicKey = PUBLIC;

if (pushConfigured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://sarkari-sathi-blue.vercel.app", PUBLIC, PRIVATE);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  /** notifications with the same tag replace each other on the device */
  tag?: string;
  renotify?: boolean;
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

/** Send to one subscription. Returns "gone" when the browser has revoked it. */
export async function sendPush(sub: Sub, payload: PushPayload): Promise<"ok" | "gone" | "error"> {
  if (!pushConfigured) return "error";
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 60 * 60 * 6, urgency: "normal" });
    return "ok";
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    return code === 404 || code === 410 ? "gone" : "error";
  }
}

/**
 * Send to all devices of a user. `cleanup` removes revoked subscriptions – only used from
 * user-initiated requests so scheduled jobs never write to the database.
 */
export async function pushToUser(userId: string, payload: PushPayload, cleanup = true) {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  const results = await Promise.all(subs.map((s) => sendPush(s, payload)));
  const gone = subs.filter((_, i) => results[i] === "gone").map((s) => s.id);
  if (cleanup && gone.length) await prisma.pushSubscription.deleteMany({ where: { id: { in: gone } } });
  return { sent: results.filter((r) => r === "ok").length, total: subs.length };
}
