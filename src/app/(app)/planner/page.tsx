import { CalendarDays } from "lucide-react";
import { PlannerView } from "@/components/PlannerView";
import { PageHeader } from "@/components/ui";
import { EXAMS, examBySlug } from "@/data/exams";
import { requireUser } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Study Planner" };

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const user = await requireUser();
  const { m } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(m ?? "") ? m! : dayKey().slice(0, 7);
  const [y, mo] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, mo - 1, 1) - 6 * 86400000);
  const to = new Date(Date.UTC(y, mo, 1) + 7 * 86400000);
  const tasks = await prisma.plannerTask.findMany({ where: { userId: user.id, date: { gte: from, lt: to } }, orderBy: { date: "asc" } });
  return (
    <div>
      <PageHeader icon={<CalendarDays />} title="Study Planner" subtitle="Schedule study sessions, mocks and revision. Reminders pop up at the scheduled time while Sarkari Sathi is open." />
      <PlannerView
        month={month}
        today={dayKey()}
        tasks={tasks.map((t) => ({ id: t.id, title: t.title, type: t.type, done: t.done, at: t.date.toISOString(), day: dayKey(t.date), examSlug: t.examSlug }))}
        exams={EXAMS.map((e) => ({ slug: e.slug, short: e.short, next: e.nextExam ?? null }))}
        targets={user.targets.map((t) => ({ slug: t.examSlug, date: t.examDate ? dayKey(t.examDate) : examBySlug(t.examSlug)?.nextExam ?? null, primary: t.primary }))}
      />
    </div>
  );
}
