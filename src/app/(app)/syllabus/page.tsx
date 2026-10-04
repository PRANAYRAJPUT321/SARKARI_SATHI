import { BookOpen } from "lucide-react";
import { SyllabusBoard } from "@/components/SyllabusBoard";
import { PageHeader } from "@/components/ui";
import { examBySlug } from "@/data/exams";
import { SUBJECTS, TOPICS } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAttemptStats } from "@/lib/stats";

export const metadata = { title: "Syllabus Tracker" };

export default async function SyllabusPage() {
  const user = await requireUser();
  const [progress, { topicAgg }] = await Promise.all([prisma.topicProgress.findMany({ where: { userId: user.id } }), getAttemptStats(user.id)]);
  const families = Array.from(new Set(user.targets.map((t) => examBySlug(t.examSlug)?.family).filter(Boolean))) as string[];
  return (
    <div>
      <PageHeader icon={<BookOpen />} title="Syllabus Tracker" subtitle="Mark each topic as you progress. Your readiness score, plan and recommendations use this." />
      <SyllabusBoard
        subjects={SUBJECTS}
        topics={TOPICS.map((t) => {
          const a = topicAgg.get(t.id);
          const att = a ? a.correct + a.wrong : 0;
          return {
            id: t.id, name: t.name, subject: t.subject, asked: t.asked ?? "",
            relevant: t.families === "all" || families.length === 0 || t.families.some((f) => families.includes(f)),
            accuracy: att ? Math.round((a!.correct / att) * 100) : null,
          };
        })}
        initial={Object.fromEntries(progress.map((p) => [p.topicId, p.status]))}
      />
    </div>
  );
}
