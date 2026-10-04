import { notFound, redirect } from "next/navigation";
import { TestEngine } from "@/components/TestEngine";
import { examBySlug } from "@/data/exams";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Response } from "@/lib/grading";
import { publicPaper, type Paper } from "@/lib/questions";

export const metadata = { title: "Test in progress" };
export const dynamic = "force-dynamic";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const a = await prisma.attempt.findFirst({ where: { id, userId: user.id } });
  if (!a) notFound();
  if (a.status === "submitted") redirect(`/results/${a.id}`);
  const paper = JSON.parse(a.questions) as Paper;
  const exam = examBySlug(paper.examSlug);
  return (
    <TestEngine
      attemptId={a.id}
      paper={publicPaper(paper)}
      saved={JSON.parse(a.responses) as Response[]}
      userName={user.name}
      negativeLabel={exam?.negativeLabel ?? `−${paper.sections[0]?.negPer ?? 0.25} per wrong answer`}
    />
  );
}
