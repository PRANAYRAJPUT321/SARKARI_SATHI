import "server-only";
import { prisma } from "./db";
import { dayKey } from "./dates";

// last day each user was recorded by this server instance, so it writes at most once per user per day
const g = globalThis as unknown as { ssSeenDay?: Map<string, string> };
const seen = (g.ssSeenDay ??= new Map<string, string>());

/** Remember that a student used the app today (IST). Powers the active-user counts on /admin. */
export async function recordActive(userId: string) {
  const day = dayKey();
  if (seen.get(userId) === day) return;
  seen.set(userId, day);
  try {
    await prisma.activeDay.upsert({ where: { userId_day: { userId, day } }, create: { userId, day }, update: {} });
  } catch (e) {
    seen.delete(userId);
    console.warn("[activity] could not record visit", (e as Error).message?.slice(0, 120));
  }
}
