import "server-only";
import { examBySlug, examSchedule, referenceCutoff, totalMarks } from "@/data/exams";
import { SUBJECTS, TOPICS } from "@/data/syllabus";
import type { SubjectId } from "@/data/types";
import { addDays, dayKey, daysBetween } from "./dates";
import { prisma } from "./db";
import { shortWeekday } from "./fmt";
import type { Summary } from "./grading";

export const STATUS_WEIGHT: Record<string, number> = { not_started: 0, learning: 0.35, revising: 0.7, mastered: 1 };

export function levelFor(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 60)) + 1;
  const cur = (level - 1) ** 2 * 60, next = level ** 2 * 60;
  return { level, progress: Math.round(((xp - cur) / (next - cur)) * 100), next, title: rankTitle(level) };
}
function rankTitle(l: number) {
  if (l >= 15) return "Selection Pakka 🏆";
  if (l >= 10) return "Topper Material";
  if (l >= 7) return "Serious Contender";
  if (l >= 4) return "Rising Aspirant";
  return "Fresher";
}

export async function getStudyDays(userId: string, days = 120) {
  const since = new Date(Date.now() - days * 86400000);
  const sessions = await prisma.studySession.findMany({ where: { userId, createdAt: { gte: since } }, select: { day: true, minutes: true, kind: true } });
  const map = new Map<string, number>();
  for (const s of sessions) map.set(s.day, (map.get(s.day) ?? 0) + s.minutes);
  return map;
}

export function streakFrom(map: Map<string, number>) {
  const today = dayKey();
  let d = (map.get(today) ?? 0) > 0 ? today : addDays(today, -1);
  let streak = 0;
  while ((map.get(d) ?? 0) > 0) {
    streak++;
    d = addDays(d, -1);
  }
  let best = 0, run = 0;
  const keys = [...map.keys()].filter((k) => (map.get(k) ?? 0) > 0).sort();
  let prev = "";
  for (const k of keys) {
    run = prev && daysBetween(prev, k) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return { streak, best: Math.max(best, streak) };
}

export async function getAttemptStats(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, status: "submitted" },
    orderBy: { submittedAt: "desc" },
    take: 200,
    select: { id: true, title: true, examSlug: true, kind: true, score: true, maxScore: true, correct: true, wrong: true, skipped: true, timeTakenSec: true, submittedAt: true, summary: true },
  });
  const topicAgg = new Map<string, { correct: number; wrong: number; skipped: number; time: number }>();
  const subjAgg = new Map<SubjectId, { correct: number; wrong: number; skipped: number; time: number }>();
  for (const a of attempts) {
    const s = JSON.parse(a.summary || "{}") as Partial<Summary>;
    for (const t of s.topics ?? []) {
      const x = topicAgg.get(t.topic) ?? { correct: 0, wrong: 0, skipped: 0, time: 0 };
      x.correct += t.correct; x.wrong += t.wrong; x.skipped += t.skipped; x.time += t.timeSec;
      topicAgg.set(t.topic, x);
      const y = subjAgg.get(t.subject) ?? { correct: 0, wrong: 0, skipped: 0, time: 0 };
      y.correct += t.correct; y.wrong += t.wrong; y.skipped += t.skipped; y.time += t.timeSec;
      subjAgg.set(t.subject, y);
    }
  }
  return { attempts, topicAgg, subjAgg };
}

export async function getDashboard(userId: string, category: string) {
  const [progress, { attempts, topicAgg, subjAgg }, studyMap, targets, user] = await Promise.all([
    prisma.topicProgress.findMany({ where: { userId } }),
    getAttemptStats(userId),
    getStudyDays(userId),
    prisma.examTarget.findMany({ where: { userId }, orderBy: [{ primary: "desc" }, { examDate: "asc" }] }),
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);
  const status = new Map(progress.map((p) => [p.topicId, p.status]));
  const today = dayKey();

  const coverage = SUBJECTS.map((s) => {
    const ts = TOPICS.filter((t) => t.subject === s.id);
    const val = ts.reduce((a, t) => a + (STATUS_WEIGHT[status.get(t.id) ?? "not_started"] ?? 0), 0) / ts.length;
    const agg = subjAgg.get(s.id);
    const acc = agg && agg.correct + agg.wrong ? Math.round((agg.correct / (agg.correct + agg.wrong)) * 100) : null;
    return { ...s, coverage: Math.round(val * 100), accuracy: acc, attempted: agg ? agg.correct + agg.wrong : 0, mastered: ts.filter((t) => status.get(t.id) === "mastered").length, total: ts.length };
  });
  const overallCoverage = Math.round(coverage.reduce((a, c) => a + c.coverage, 0) / coverage.length);

  const topicStats = TOPICS.map((t) => {
    const a = topicAgg.get(t.id);
    const att = a ? a.correct + a.wrong : 0;
    return { id: t.id, name: t.name, subject: t.subject, attempted: att, accuracy: att ? Math.round((a!.correct / att) * 100) : null, avgTime: a && att + a.skipped ? Math.round(a.time / (att + a.skipped)) : null, status: status.get(t.id) ?? "not_started" };
  });
  const weak = topicStats.filter((t) => t.attempted >= 3 && (t.accuracy ?? 100) < 65).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).slice(0, 6);
  const strong = topicStats.filter((t) => t.attempted >= 4 && (t.accuracy ?? 0) >= 85).sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0)).slice(0, 5);
  const untouched = topicStats.filter((t) => t.status === "not_started" && t.attempted === 0).slice(0, 6);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(today, i - 6);
    return { day: k, label: shortWeekday(k), minutes: studyMap.get(k) ?? 0 };
  });
  const heat = Array.from({ length: 84 }, (_, i) => {
    const k = addDays(today, i - 83);
    return { day: k, minutes: studyMap.get(k) ?? 0 };
  });
  const { streak, best } = streakFrom(studyMap);

  const fullMocks = attempts.filter((a) => a.kind === "full" || a.kind === "pyp");
  const trend = [...attempts].slice(0, 20).reverse().map((a, i) => ({ i: i + 1, title: a.title, pct: a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0, kind: a.kind, exam: a.examSlug }));
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const mocksThisWeek = attempts.filter((a) => a.submittedAt && a.submittedAt > weekAgo && a.kind !== "topic" && a.kind !== "daily").length;
  const totalQ = attempts.reduce((a, x) => a + x.correct + x.wrong, 0);
  const totalCorrect = attempts.reduce((a, x) => a + x.correct, 0);

  const examCards = targets.flatMap((t) => {
    const exam = examBySlug(t.examSlug);
    if (!exam) return [];
    const sched = examSchedule(exam.slug, today);
    const dateKey = t.examDate ? dayKey(t.examDate) : sched?.date ?? null;
    const ongoing = !t.examDate && !!sched?.ongoing;
    const daysLeft = dateKey ? Math.max(0, daysBetween(today, dateKey)) : null;
    const dateText = t.examDate ? null : sched ? `${sched.event.stage}: ${sched.text}` : null;
    const dateStatus: "yours" | "confirmed" | "tentative" | "none" = t.examDate ? "yours" : sched ? sched.status : "none";
    const mine = fullMocks.filter((a) => a.examSlug === exam.slug);
    const last3 = mine.slice(0, 3);
    const avgPct = last3.length ? last3.reduce((a, x) => a + x.score / x.maxScore, 0) / last3.length : 0;
    const cut = referenceCutoff(exam, category);
    const cutPct = cut ? cut.value / exam.cutoff.unit : 0.6;
    const relTopics = TOPICS.filter((tp) => exam.sections.some((s) => s.subject === tp.subject) && (tp.families === "all" || tp.families.includes(exam.family)));
    const cov = relTopics.reduce((a, tp) => a + (STATUS_WEIGHT[status.get(tp.id) ?? "not_started"] ?? 0), 0) / Math.max(1, relTopics.length);
    const readiness = Math.round(Math.min(1, 0.45 * cov + 0.55 * (last3.length ? Math.min(1, avgPct / cutPct) : 0)) * 100);
    const mocksPerDay = daysLeft == null ? 1 : daysLeft <= 15 ? 3 : daysLeft <= 45 ? 2 : 1;
    return [{
      slug: exam.slug,
      short: exam.short,
      name: exam.name,
      color: exam.color,
      primary: t.primary,
      dateKey,
      dateText,
      dateStatus,
      ongoing,
      daysLeft,
      mocksTaken: mine.length,
      bestPct: mine.length ? Math.round(Math.max(...mine.map((x) => x.score / x.maxScore)) * 100) : null,
      lastScore: mine[0] ? { score: mine[0].score, max: mine[0].maxScore } : null,
      cutoff: cut ? { ...cut, unit: exam.cutoff.unit, scaled: Math.round(cutPct * totalMarks(exam) * 100) / 100 } : null,
      readiness,
      mocksPerDay,
    }];
  });

  return {
    user,
    coverage,
    overallCoverage,
    topicStats,
    weak,
    strong,
    untouched,
    last7,
    heat,
    streak,
    bestStreak: best,
    todayMinutes: studyMap.get(today) ?? 0,
    trend,
    attempts: attempts.slice(0, 8),
    mocksThisWeek,
    totalAttempts: attempts.length,
    overallAccuracy: totalQ ? Math.round((totalCorrect / totalQ) * 100) : null,
    examCards,
  };
}

export function badgesFor(d: { streak: number; bestStreak: number; totalAttempts: number; overallCoverage: number; overallAccuracy: number | null; xp: number }) {
  const all = [
    { id: "first-mock", icon: "🎯", name: "First Step", desc: "Complete your first test", got: d.totalAttempts >= 1 },
    { id: "ten-tests", icon: "🔟", name: "Test Warrior", desc: "Complete 10 tests", got: d.totalAttempts >= 10 },
    { id: "fifty-tests", icon: "⚔️", name: "Mock Machine", desc: "Complete 50 tests", got: d.totalAttempts >= 50 },
    { id: "streak-3", icon: "🔥", name: "On Fire", desc: "3-day study streak", got: d.bestStreak >= 3 },
    { id: "streak-7", icon: "🌟", name: "Week Warrior", desc: "7-day study streak", got: d.bestStreak >= 7 },
    { id: "streak-30", icon: "👑", name: "Unstoppable", desc: "30-day study streak", got: d.bestStreak >= 30 },
    { id: "syllabus-25", icon: "📘", name: "Quarter Done", desc: "25% syllabus covered", got: d.overallCoverage >= 25 },
    { id: "syllabus-75", icon: "📚", name: "Almost There", desc: "75% syllabus covered", got: d.overallCoverage >= 75 },
    { id: "sharp", icon: "🎓", name: "Sharp Shooter", desc: "85%+ overall accuracy", got: (d.overallAccuracy ?? 0) >= 85 && d.totalAttempts >= 5 },
    { id: "xp-1000", icon: "💎", name: "1000 XP", desc: "Earn 1000 XP", got: d.xp >= 1000 },
  ];
  return all;
}
