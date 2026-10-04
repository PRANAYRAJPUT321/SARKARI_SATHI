import { NextResponse } from "next/server";
import { examBySlug, examSchedule } from "@/data/exams";
import { cronAuthorized } from "@/lib/cron";
import { dayKey, daysBetween, istStart } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { istTime } from "@/lib/fmt";
import { pushConfigured, pushToUser } from "@/lib/push";
import { quoteOfDay } from "@/lib/quotes";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Early-morning digest (scheduled daily ~6 AM IST): today's tasks, nearest exam, quote. */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!pushConfigured) return NextResponse.json({ error: "push not configured" }, { status: 503 });
  await prisma.refresh();
  const today = dayKey();
  const start = istStart(today);
  const end = new Date(start.getTime() + 86400000);
  const users = await prisma.user.findMany({
    where: { morningPush: true, pushSubs: { some: {} } },
    select: { id: true, name: true, targets: true, tasks: { where: { date: { gte: start, lt: end }, done: false }, orderBy: { date: "asc" } } },
  });
  const quote = quoteOfDay(today);
  let sent = 0;
  for (const u of users) {
    const first = u.name.split(" ")[0];
    const parts: string[] = [];
    if (u.tasks.length) parts.push(`📋 ${u.tasks.length} task${u.tasks.length > 1 ? "s" : ""} today: ${u.tasks.slice(0, 3).map((t) => `${t.title} (${istTime(t.date.toISOString())})`).join(", ")}${u.tasks.length > 3 ? "…" : ""}`);
    else parts.push("📋 No tasks planned yet – open the Planner and plan your day.");
    let nearest: { short: string; left: number } | null = null;
    for (const t of u.targets) {
      const exam = examBySlug(t.examSlug);
      if (!exam) continue;
      const date = t.examDate ? dayKey(t.examDate) : examSchedule(exam.slug, today)?.date;
      if (!date) continue;
      const left = daysBetween(today, date);
      if (left >= 0 && (!nearest || left < nearest.left)) nearest = { short: exam.short, left };
    }
    if (nearest) parts.push(nearest.left === 0 ? `🎯 ${nearest.short} today – all the best!` : `🎯 ${nearest.left} day${nearest.left > 1 ? "s" : ""} to ${nearest.short}.`);
    parts.push(`“${quote.q}”`);
    const r = await pushToUser(u.id, { title: `☀️ Good morning, ${first}!`, body: parts.join(" "), url: "/dashboard", tag: `morning-${today}` }, false);
    sent += r.sent;
  }
  return NextResponse.json({ users: users.length, sent });
}
