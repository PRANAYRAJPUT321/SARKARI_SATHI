"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { examBySlug, PYP_YEARS } from "@/data/exams";
import { TOPICS, topicById } from "@/data/syllabus";
import { commitWrites, createSession, destroySession, requireUser } from "@/lib/auth";
import { addDays, dayKey, daysBetween, istStart } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { gradePaper, xpFor, type Response } from "@/lib/grading";
import { notify } from "@/lib/notify";
import { buildDailyChallenge, buildFullPaper, buildSectional, buildTopicTest, mockSeed, pypSeed, sectionalSeed, type Paper } from "@/lib/questions";
import { hashString } from "@/lib/questions/rng";

const COLORS = ["#6366f1", "#f97316", "#10b981", "#ec4899", "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6"];

export type FormState = { error?: string } | undefined;

// ───────────── Auth ─────────────
export async function registerAction(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const category = String(form.get("category") ?? "GEN");
  const exams = form.getAll("exams").map(String).filter((s) => examBySlug(s));
  const dailyGoal = Number(form.get("dailyGoal") ?? 4);
  if (name.length < 2) return { error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };
  if (await prisma.user.findUnique({ where: { email } })) return { error: "An account with this email already exists. Please log in." };
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      category,
      dailyGoalMin: Math.min(12, Math.max(1, dailyGoal)) * 60,
      avatarColor: COLORS[hashString(email) % COLORS.length],
      targets: { create: (exams.length ? exams : ["sbi-po"]).map((slug, i) => ({ examSlug: slug, primary: i === 0 })) },
    },
  });
  await notify(user.id, `Welcome to Sarkari Sathi, ${name.split(" ")[0]}! 🎉`, "Start with the Daily Challenge, mark the topics you already know in the Syllabus Tracker, and generate your study plan in the Planner.", "achievement", "/dashboard");
  await commitWrites();
  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // the account may have been created on another server instance – refresh once
    await prisma.refresh();
    user = await prisma.user.findUnique({ where: { email } });
  }
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Invalid email or password." };
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

// ───────────── Profile & targets ─────────────
export async function updateProfileAction(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "GEN");
  const goal = Number(form.get("dailyGoal") ?? 4);
  if (name.length < 2) return { error: "Name is too short." };
  await prisma.user.update({ where: { id: user.id }, data: { name, category, dailyGoalMin: Math.min(12, Math.max(1, goal)) * 60 } });
  await commitWrites();
  revalidatePath("/", "layout");
  return {};
}

export async function saveTargetsAction(targets: { slug: string; date: string | null; primary: boolean }[]) {
  const user = await requireUser();
  const valid = targets.filter((t) => examBySlug(t.slug));
  await prisma.examTarget.deleteMany({ where: { userId: user.id, examSlug: { notIn: valid.map((v) => v.slug) } } });
  for (const t of valid)
    await prisma.examTarget.upsert({
      where: { userId_examSlug: { userId: user.id, examSlug: t.slug } },
      create: { userId: user.id, examSlug: t.slug, examDate: t.date ? istStart(t.date) : null, primary: t.primary },
      update: { examDate: t.date ? istStart(t.date) : null, primary: t.primary },
    });
  await commitWrites();
  revalidatePath("/", "layout");
}

export async function addTargetAction(slug: string) {
  const user = await requireUser();
  if (!examBySlug(slug)) return;
  const count = await prisma.examTarget.count({ where: { userId: user.id } });
  await prisma.examTarget.upsert({
    where: { userId_examSlug: { userId: user.id, examSlug: slug } },
    create: { userId: user.id, examSlug: slug, primary: count === 0 },
    update: {},
  });
  await commitWrites();
  revalidatePath("/", "layout");
}

// ───────────── Syllabus ─────────────
export async function setTopicStatusAction(topicId: string, status: string) {
  const user = await requireUser();
  if (!topicById(topicId) || !["not_started", "learning", "revising", "mastered"].includes(status)) return;
  await prisma.topicProgress.upsert({
    where: { userId_topicId: { userId: user.id, topicId } },
    create: { userId: user.id, topicId, status },
    update: { status },
  });
  if (status === "mastered") await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: 15 } } });
  await commitWrites();
  revalidatePath("/syllabus");
  revalidatePath("/dashboard");
}

// ───────────── Tests ─────────────
export type StartSpec =
  | { type: "full"; exam: string; n: number }
  | { type: "pyp"; exam: string; year: number }
  | { type: "sectional"; exam: string; section: number; n: number }
  | { type: "topic"; topic: string; n: number; exam?: string }
  | { type: "daily" };

export async function startTestAction(spec: StartSpec) {
  const user = await requireUser();
  let paper: Paper;
  if (spec.type === "full" || spec.type === "pyp" || spec.type === "sectional") {
    const exam = examBySlug(spec.exam);
    if (!exam) throw new Error("Unknown exam");
    if (spec.type === "full") paper = buildFullPaper(exam, mockSeed(exam.slug, spec.n), `${exam.short} · Full Mock ${spec.n}`);
    else if (spec.type === "pyp") {
      if (!PYP_YEARS.includes(spec.year)) throw new Error("Unknown year");
      paper = buildFullPaper(exam, pypSeed(exam.slug, spec.year), `${exam.short} · ${spec.year} Previous-Year Pattern Paper`, "pyp");
    } else paper = buildSectional(exam, spec.section, sectionalSeed(exam.slug, spec.section, spec.n));
  } else if (spec.type === "topic") {
    if (!topicById(spec.topic)) throw new Error("Unknown topic");
    paper = buildTopicTest(spec.topic, hashString(`${spec.topic}:${spec.n}`), 15, spec.exam);
  } else {
    const primary = user.targets.find((t) => t.primary) ?? user.targets[0];
    paper = buildDailyChallenge(dayKey(), user.id, primary ? examBySlug(primary.examSlug) : undefined);
  }
  // resume an unfinished identical attempt instead of creating duplicates
  const open = await prisma.attempt.findFirst({ where: { userId: user.id, status: "in_progress", seed: paper.seed, kind: paper.kind } });
  if (open) redirect(`/test/${open.id}`);
  const a = await prisma.attempt.create({
    data: {
      userId: user.id,
      examSlug: paper.examSlug,
      kind: paper.kind,
      title: paper.title,
      seed: paper.seed,
      questions: JSON.stringify(paper),
      durationSec: paper.durationSec,
      maxScore: paper.sections.reduce((acc, s) => acc + s.marksPer * s.questions.length, 0),
    },
  });
  await commitWrites();
  redirect(`/test/${a.id}`);
}

export async function saveProgressAction(attemptId: string, responses: Response[]) {
  const user = await requireUser();
  await prisma.attempt.updateMany({ where: { id: attemptId, userId: user.id, status: "in_progress" }, data: { responses: JSON.stringify(responses) } });
}

export async function submitTestAction(attemptId: string, responses: Response[]) {
  const user = await requireUser();
  const a = await prisma.attempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!a) throw new Error("Attempt not found");
  if (a.status === "submitted") redirect(`/results/${a.id}`);
  const paper = JSON.parse(a.questions) as Paper;
  const summary = gradePaper(paper, responses);
  const xp = xpFor(summary);
  await prisma.attempt.update({
      where: { id: a.id },
      data: {
        status: "submitted",
        responses: JSON.stringify(responses),
        score: summary.score,
        maxScore: summary.maxScore,
        correct: summary.correct,
        wrong: summary.wrong,
        skipped: summary.skipped,
        timeTakenSec: summary.timeTakenSec,
        summary: JSON.stringify(summary),
        submittedAt: new Date(),
      },
    });
  await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: xp } } });
  await prisma.studySession.create({ data: { userId: user.id, day: dayKey(), minutes: Math.max(1, Math.round(summary.timeTakenSec / 60)), kind: "mock" } });
  const pct = summary.maxScore ? Math.round((summary.score / summary.maxScore) * 100) : 0;
  await notify(user.id, `📊 Report ready: ${a.title}`, `You scored ${summary.score}/${summary.maxScore} (${pct}%) with ${summary.accuracy}% accuracy. +${xp} XP`, pct >= 60 ? "achievement" : "info", `/results/${a.id}`);
  const count = await prisma.attempt.count({ where: { userId: user.id, status: "submitted" } });
  if ([1, 10, 25, 50, 100].includes(count)) await notify(user.id, `🏅 Milestone: ${count} test${count > 1 ? "s" : ""} completed!`, "Consistency beats intensity. Keep going!", "achievement", "/analytics");
  // tick off matching planner task for today
  const start = istStart(dayKey());
  await prisma.plannerTask.updateMany({
    where: { userId: user.id, type: "mock", done: false, date: { gte: start, lt: new Date(start.getTime() + 86400000) }, examSlug: a.examSlug },
    data: { done: true },
  });
  await commitWrites();
  redirect(`/results/${a.id}`);
}

export async function abandonTestAction(attemptId: string) {
  const user = await requireUser();
  await prisma.attempt.deleteMany({ where: { id: attemptId, userId: user.id, status: "in_progress" } });
  await commitWrites();
  redirect("/mocks");
}

// ───────────── Study time ─────────────
export async function logStudyAction(minutes: number, kind = "focus") {
  const user = await requireUser();
  const m = Math.round(minutes);
  if (m <= 0 || m > 240) return;
  await prisma.studySession.create({ data: { userId: user.id, day: dayKey(), minutes: m, kind } });
  await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: Math.round(m / 5) } } });
  await commitWrites();
  revalidatePath("/dashboard");
}

// ───────────── Planner ─────────────
export async function addTaskAction(input: { date: string; time?: string; title: string; type: string; examSlug?: string; durationMin?: number }) {
  const user = await requireUser();
  if (!input.title.trim()) return;
  const date = new Date(`${input.date}T${input.time || "09:00"}:00+05:30`);
  await prisma.plannerTask.create({
    data: { userId: user.id, date, title: input.title.trim().slice(0, 140), type: input.type, examSlug: input.examSlug || null, durationMin: input.durationMin ?? 60 },
  });
  await commitWrites();
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

export async function toggleTaskAction(id: string) {
  const user = await requireUser();
  const t = await prisma.plannerTask.findFirst({ where: { id, userId: user.id } });
  if (!t) return;
  await prisma.plannerTask.update({ where: { id }, data: { done: !t.done } });
  if (!t.done) await prisma.user.update({ where: { id: user.id }, data: { xp: { increment: 10 } } });
  await commitWrites();
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

export async function deleteTaskAction(id: string) {
  const user = await requireUser();
  await prisma.plannerTask.deleteMany({ where: { id, userId: user.id } });
  await commitWrites();
  revalidatePath("/planner");
  revalidatePath("/dashboard");
}

/**
 * Generate a day-by-day plan from tomorrow until the exam (max 90 days):
 * mocks per day ramp up as the exam approaches, topics rotate through un-mastered syllabus,
 * Sundays are revision + analysis days.
 */
export async function autoPlanAction(input: { examSlug: string; examDate: string; mocksPerDay: number; studyHours: number; replace: boolean }) {
  const user = await requireUser();
  const exam = examBySlug(input.examSlug);
  if (!exam) return { error: "Choose an exam" };
  const today = dayKey();
  const total = Math.min(90, daysBetween(today, input.examDate));
  if (total < 1) return { error: "Exam date must be in the future" };
  await prisma.examTarget.upsert({
    where: { userId_examSlug: { userId: user.id, examSlug: exam.slug } },
    create: { userId: user.id, examSlug: exam.slug, examDate: istStart(input.examDate) },
    update: { examDate: istStart(input.examDate) },
  });
  if (input.replace)
    await prisma.plannerTask.deleteMany({ where: { userId: user.id, examSlug: exam.slug, done: false, date: { gte: new Date() } } });
  const progress = await prisma.topicProgress.findMany({ where: { userId: user.id } });
  const done = new Set(progress.filter((p) => p.status === "mastered").map((p) => p.topicId));
  const subjects = Array.from(new Set(exam.sections.map((s) => s.subject)));
  const topics = TOPICS.filter((t) => subjects.includes(t.subject) && (t.families === "all" || t.families.includes(exam.family)) && !done.has(t.id)).sort((a, b) => b.weight - a.weight);
  const rows: { userId: string; date: Date; title: string; type: string; examSlug: string; durationMin: number }[] = [];
  let ti = 0;
  let mockNo = 1;
  for (let d = 0; d <= total; d++) {
    const key = addDays(today, d);
    const left = total - d;
    const weekday = new Date(key + "T00:00:00Z").getUTCDay();
    const mocks = Math.min(4, left <= 10 ? input.mocksPerDay + 1 : input.mocksPerDay);
    if (left === 0) {
      rows.push({ userId: user.id, date: new Date(`${key}T07:00:00+05:30`), title: `🎯 ${exam.short} exam day – all the best!`, type: "exam", examSlug: exam.slug, durationMin: exam.durationMin });
      continue;
    }
    if (weekday === 0) {
      rows.push({ userId: user.id, date: new Date(`${key}T08:00:00+05:30`), title: `Revision: formulas, vocab & GK flashcards`, type: "revision", examSlug: exam.slug, durationMin: 90 });
      rows.push({ userId: user.id, date: new Date(`${key}T11:00:00+05:30`), title: `Analyse the week's mocks – list repeated mistakes`, type: "revision", examSlug: exam.slug, durationMin: 60 });
    } else {
      const topicSlots = Math.max(1, Math.round(input.studyHours / 2) - (mocks > 2 ? 1 : 0));
      for (let k = 0; k < topicSlots && topics.length; k++) {
        const t = topics[ti++ % topics.length];
        rows.push({ userId: user.id, date: new Date(`${key}T${String(7 + k * 2).padStart(2, "0")}:00:00+05:30`), title: `Study: ${t.name}`, type: "study", examSlug: exam.slug, durationMin: 60 });
      }
    }
    for (let m = 0; m < mocks; m++) {
      const hour = 15 + m * 2;
      rows.push({ userId: user.id, date: new Date(`${key}T${String(Math.min(hour, 22)).padStart(2, "0")}:00:00+05:30`), title: `${exam.short} Full Mock ${mockNo++} + analysis`, type: "mock", examSlug: exam.slug, durationMin: exam.durationMin + 20 });
    }
  }
  const now = new Date();
  const upcoming = rows.filter((r) => r.date > now); // today's slots that already passed are skipped
  await prisma.plannerTask.createMany({ data: upcoming });
  await notify(user.id, `🗓️ Study plan created for ${exam.short}`, `${upcoming.length} tasks scheduled over ${total} days. Check your Planner every morning!`, "info", "/planner");
  await commitWrites();
  revalidatePath("/planner");
  revalidatePath("/dashboard");
  return { ok: true, count: upcoming.length };
}

// ───────────── Notifications & bookmarks ─────────────
export async function markNotificationReadAction(id?: string) {
  const user = await requireUser();
  await prisma.notification.updateMany({ where: { userId: user.id, ...(id ? { id } : {}) }, data: { read: true } });
  await commitWrites();
  revalidatePath("/", "layout");
}

export async function toggleBookmarkAction(attemptId: string, qid: string) {
  const user = await requireUser();
  const key = `${attemptId}:${qid}`;
  const existing = await prisma.bookmark.findUnique({ where: { userId_key: { userId: user.id, key } } });
  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await commitWrites();
    revalidatePath("/bookmarks");
    return false;
  }
  const a = await prisma.attempt.findFirst({ where: { id: attemptId, userId: user.id } });
  if (!a) return false;
  const paper = JSON.parse(a.questions) as Paper;
  const q = paper.sections.flatMap((s) => s.questions).find((x) => x.id === qid);
  if (!q) return false;
  await prisma.bookmark.create({ data: { userId: user.id, key, question: JSON.stringify(q) } });
  await commitWrites();
  revalidatePath("/bookmarks");
  return true;
}

export async function deleteAccountDataAction() {
  const user = await requireUser();
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.persistNow();
  await destroySession();
  redirect("/");
}

export async function updatePushPrefsAction(prefs: { morningPush?: boolean; taskPush?: boolean }) {
  const user = await requireUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { ...(typeof prefs.morningPush === "boolean" ? { morningPush: prefs.morningPush } : {}), ...(typeof prefs.taskPush === "boolean" ? { taskPush: prefs.taskPush } : {}) },
  });
  await commitWrites();
  revalidatePath("/notifications");
  revalidatePath("/profile");
}
