import "server-only";
import { examBySlug } from "@/data/exams";
import { prisma } from "./db";
import { syncDiagnostics } from "./db-sync";
import { addDays, dayKey, istStart, prettyDate } from "./dates";

/** Accounts created by automated checks – hidden from the numbers unless asked for. */
const TEST_EMAIL = /@(example\.com|test\.com|t\.com)$/i;

export type DayCount = { day: string; label: string; count: number };

const shortDay = (day: string) => prettyDate(istStart(day), { day: "numeric", month: "short" });

/**
 * Usage numbers for the owner. A student counts as active on a day (IST) if they opened the app,
 * started a mock, logged study time or signed up that day.
 */
export async function usageStats({ includeTests = false } = {}) {
  await prisma.refresh(); // this function may hold an older copy of the database
  const today = dayKey();
  const from30 = addDays(today, -29);
  const from7 = addDays(today, -6);

  const [users, visits, attempts30, sessions30, mocksByUser, lastMock, lastVisit, lastStudy, pushUsers, firstVisit] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true, email: true, category: true, createdAt: true, targets: { select: { examSlug: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.activeDay.findMany({ where: { day: { gte: from30 } }, select: { userId: true, day: true } }),
    prisma.attempt.findMany({ where: { startedAt: { gte: istStart(from30) } }, select: { userId: true, startedAt: true, submittedAt: true } }),
    prisma.studySession.findMany({ where: { day: { gte: from30 } }, select: { userId: true, day: true, minutes: true } }),
    prisma.attempt.groupBy({ by: ["userId"], where: { status: "submitted" }, _count: { _all: true } }),
    prisma.attempt.groupBy({ by: ["userId"], _max: { startedAt: true } }),
    prisma.activeDay.groupBy({ by: ["userId"], _max: { day: true } }),
    prisma.studySession.groupBy({ by: ["userId"], _max: { day: true } }),
    prisma.pushSubscription.groupBy({ by: ["userId"] }),
    prisma.activeDay.findFirst({ orderBy: { day: "asc" }, select: { day: true } }),
  ]);

  const testIds = new Set(users.filter((u) => TEST_EMAIL.test(u.email)).map((u) => u.id));
  const shown = users.filter((u) => includeTests || !testIds.has(u.id));
  const counted = new Set(shown.map((u) => u.id));

  // who was active on which day
  const activeOn = new Map<string, Set<string>>();
  const mark = (userId: string, day: string) => {
    if (!counted.has(userId) || day < from30 || day > today) return;
    if (!activeOn.has(day)) activeOn.set(day, new Set());
    activeOn.get(day)!.add(userId);
  };
  visits.forEach((v) => mark(v.userId, v.day));
  attempts30.forEach((a) => mark(a.userId, dayKey(a.startedAt)));
  sessions30.forEach((s) => mark(s.userId, s.day));
  shown.forEach((u) => mark(u.id, dayKey(u.createdAt)));

  const days = Array.from({ length: 30 }, (_, i) => addDays(from30, i));
  const activeIn = (from: string) => {
    const set = new Set<string>();
    for (const [day, ids] of activeOn) if (day >= from) ids.forEach((id) => set.add(id));
    return set.size;
  };
  const joinedOn = new Map<string, number>();
  shown.forEach((u) => {
    const d = dayKey(u.createdAt);
    joinedOn.set(d, (joinedOn.get(d) ?? 0) + 1);
  });

  const mocks = new Map(mocksByUser.map((m) => [m.userId, m._count._all]));
  const lastSeen = new Map<string, string>();
  const seen = (userId: string, day?: string | null) => {
    if (day && day > (lastSeen.get(userId) ?? "")) lastSeen.set(userId, day);
  };
  shown.forEach((u) => seen(u.id, dayKey(u.createdAt)));
  lastMock.forEach((m) => seen(m.userId, m._max.startedAt ? dayKey(m._max.startedAt) : null));
  lastVisit.forEach((v) => seen(v.userId, v._max.day));
  lastStudy.forEach((s) => seen(s.userId, s._max.day));

  const examCounts = new Map<string, number>();
  shown.forEach((u) => u.targets.forEach((t) => examCounts.set(t.examSlug, (examCounts.get(t.examSlug) ?? 0) + 1)));

  const relDay = (day: string) => (day === today ? "Today" : day === addDays(today, -1) ? "Yesterday" : prettyDate(istStart(day)));

  return {
    today,
    totals: {
      students: shown.length,
      newToday: joinedOn.get(today) ?? 0,
      new7: days.filter((d) => d >= from7).reduce((a, d) => a + (joinedOn.get(d) ?? 0), 0),
      activeToday: activeOn.get(today)?.size ?? 0,
      active7: activeIn(from7),
      active30: activeIn(from30),
      mocks: shown.reduce((a, u) => a + (mocks.get(u.id) ?? 0), 0),
      mocks7: attempts30.filter((a) => counted.has(a.userId) && a.submittedAt && dayKey(a.submittedAt) >= from7).length,
      studyHours30: Math.round(sessions30.filter((s) => counted.has(s.userId)).reduce((a, s) => a + s.minutes, 0) / 60),
      pushOn: pushUsers.filter((p) => counted.has(p.userId)).length,
    },
    dailyActive: days.map((day): DayCount => ({ day, label: shortDay(day), count: activeOn.get(day)?.size ?? 0 })),
    dailySignups: days.map((day): DayCount => ({ day, label: shortDay(day), count: joinedOn.get(day) ?? 0 })),
    exams: [...examCounts.entries()]
      .map(([slug, count]) => ({ slug, name: examBySlug(slug)?.short ?? slug, color: examBySlug(slug)?.color, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    students: shown.slice(0, 300).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      category: u.category,
      exams: u.targets.map((t) => examBySlug(t.examSlug)?.short ?? t.examSlug).join(", "),
      joined: prettyDate(u.createdAt),
      lastActive: relDay(lastSeen.get(u.id) ?? dayKey(u.createdAt)),
      mocks: mocks.get(u.id) ?? 0,
      test: testIds.has(u.id),
    })),
    hiddenTests: includeTests ? 0 : testIds.size,
    backup: await syncDiagnostics(),
    visitsTrackedSince: firstVisit ? prettyDate(istStart(firstVisit.day)) : null,
  };
}
