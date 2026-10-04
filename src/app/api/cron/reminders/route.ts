import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { istTime } from "@/lib/fmt";
import { pushConfigured, pushToUser } from "@/lib/push";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

let lastRun = 0;

/**
 * Task reminders, pinged every ~10 minutes by an external scheduler (GitHub Actions).
 * Sends a push for planner tasks starting within ±10 minutes. It never writes to the
 * database and is idempotent: repeated calls reuse the same notification tag, so a device
 * shows each reminder once. That is why it does not need a secret.
 */
export async function GET() {
  if (!pushConfigured) return NextResponse.json({ error: "push not configured" }, { status: 503 });
  if (Date.now() - lastRun < 60_000) return NextResponse.json({ skipped: "ran recently" });
  lastRun = Date.now();
  await prisma.refresh();
  const now = Date.now();
  const tasks = await prisma.plannerTask.findMany({
    where: { done: false, date: { gt: new Date(now - 10 * 60_000), lte: new Date(now + 10 * 60_000) }, user: { taskPush: true, pushSubs: { some: {} } } },
    select: { id: true, title: true, date: true, type: true, userId: true, examSlug: true },
    take: 500,
  });
  let sent = 0;
  for (const t of tasks) {
    const url = t.type === "mock" && t.examSlug ? `/mocks/${t.examSlug}` : "/planner";
    const r = await pushToUser(t.userId, { title: `⏰ ${istTime(t.date.toISOString())} · ${t.title}`, body: t.type === "mock" ? "Time for your mock test – sit in a quiet place and start the timer." : "Your planned session is starting. Small steps every day!", url, tag: `task-${t.id}` }, false);
    sent += r.sent;
  }
  return NextResponse.json({ tasks: tasks.length, sent });
}
