import "server-only";
import { examBySlug, examSchedule } from "@/data/exams";
import { dayKey, daysBetween, istHour, istStart } from "./dates";
import { prisma } from "./db";

export async function notify(userId: string, title: string, body: string, kind = "info", link?: string) {
  return prisma.notification.create({ data: { userId, title, body, kind, link } });
}

/** Create the day's reminders once per day (idempotent). */
export async function ensureDailyNotifications(userId: string) {
  const today = dayKey();
  const start = istStart(today);
  let existing = await prisma.notification.findMany({ where: { userId, createdAt: { gte: start } }, select: { title: true } });
  if (!existing.length) {
    // first visit of the day on this server instance: make sure we have the latest copy before creating reminders
    await prisma.refresh();
    existing = await prisma.notification.findMany({ where: { userId, createdAt: { gte: start } }, select: { title: true } });
  }
  const have = new Set(existing.map((e) => e.title));
  const add = async (title: string, body: string, kind: string, link?: string) => {
    if (have.has(title)) return;
    have.add(title);
    await notify(userId, title, body, kind, link);
  };

  const [targets, tasksToday, studiedToday] = await Promise.all([
    prisma.examTarget.findMany({ where: { userId } }),
    prisma.plannerTask.findMany({ where: { userId, date: { gte: start, lt: new Date(start.getTime() + 86400000) } } }),
    prisma.studySession.aggregate({ where: { userId, day: today }, _sum: { minutes: true } }),
  ]);

  for (const t of targets) {
    const exam = examBySlug(t.examSlug);
    if (!exam) continue;
    const sched = examSchedule(exam.slug, today);
    if (!t.examDate && sched?.ongoing) {
      await add(`📝 ${exam.short} ${sched.event.stage} is underway`, `Exam window: ${sched.text}. Check your exam date & admit card on the official website and keep revising daily.`, "warning", `/exams/${exam.slug}`);
      continue;
    }
    const key = t.examDate ? dayKey(t.examDate) : sched?.date;
    if (!key) continue;
    const left = daysBetween(today, key);
    if (left < 0 || left > 90) continue; // ongoing windows are covered by the exam-day notice
    const mocks = left <= 15 ? 3 : left <= 45 ? 2 : 1;
    const urgency = left <= 7 ? "warning" : "reminder";
    await add(
      `⏳ ${left} day${left === 1 ? "" : "s"} left for ${exam.short}`,
      left === 0
        ? `Exam day! Stay calm, read every question carefully and trust your preparation. All the best!`
        : `Target today: ${mocks} full mock${mocks > 1 ? "s" : ""} of ${exam.short} + analysis of every mistake.${!t.examDate && sched?.status === "tentative" ? " (Date from the official calendar – tentative.)" : ""}`,
      urgency,
      `/mocks/${exam.slug}`,
    );
  }

  const pending = tasksToday.filter((t) => !t.done);
  if (pending.length)
    await add(`📋 ${pending.length} task${pending.length > 1 ? "s" : ""} planned for today`, pending.slice(0, 3).map((t) => t.title).join(" • "), "reminder", "/planner");

  if (!studiedToday._sum.minutes && istHour() >= 18)
    await add("🔥 Don't break your streak!", "You haven't studied yet today. A 15-minute Daily Challenge keeps the streak alive.", "warning", "/practice");
}
