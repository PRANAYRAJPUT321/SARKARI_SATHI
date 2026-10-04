import { CalendarDays, ClipboardList, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddTargetButton } from "@/components/AddTargetButton";
import { CutoffTable } from "@/components/CutoffTable";
import { Badge, Card, STATUS_META } from "@/components/ui";
import { examBySlug, totalMarks, totalQuestions } from "@/data/exams";
import { SUBJECTS, TOPICS } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = examBySlug((await params).slug);
  return { title: e ? `${e.short} – pattern, syllabus & cut-offs` : "Exam" };
}

function fraction(n: number) {
  if (Math.abs(n - 1 / 3) < 1e-6) return "⅓";
  if (n === 0.25) return "¼";
  if (n === 0.5) return "½";
  if (n === 0.125) return "⅛";
  return String(n);
}

export default async function ExamDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = examBySlug(slug);
  if (!exam) notFound();
  const user = await requireUser();
  const progress = await prisma.topicProgress.findMany({ where: { userId: user.id } });
  const status = new Map(progress.map((p) => [p.topicId, p.status]));
  const subjects = SUBJECTS.filter((s) => exam.sections.some((x) => x.subject === s.id));
  const target = user.targets.find((t) => t.examSlug === exam.slug);
  const marksPer = exam.sections[0].marks / exam.sections[0].questions;
  const negMarks = Math.round(exam.negative * marksPer * 100) / 100;
  const breakEven = exam.negative ? Math.round(1 / exam.negative) : null;

  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: exam.color }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="faint text-xs font-bold uppercase tracking-wider">{exam.category} · {exam.body}</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{exam.name}</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>{exam.stage}</Badge>
              <Badge color="var(--s2)">{totalQuestions(exam)} Qs · {totalMarks(exam)} marks</Badge>
              <Badge color="var(--s3)">{exam.durationMin} min {exam.sectionalTiming ? "· sectional timing" : "· composite time"}</Badge>
              <Badge color="var(--critical)">{exam.negativeLabel}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddTargetButton slug={exam.slug} added={!!target} />
            <Link href={`/mocks/${exam.slug}`} className="btn-primary"><ClipboardList size={16} /> Mocks & PYPs</Link>
            <a href={exam.officialSite} target="_blank" rel="noreferrer" className="btn-ghost"><ExternalLink size={16} /> Official site</a>
          </div>
        </div>
        {exam.nextExam && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-sm">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <div>
              <b>Next exam: {prettyDate((target?.examDate ? target.examDate.toISOString() : exam.nextExam + "T00:00:00+05:30"))}</b>
              <div className="muted text-xs">{exam.nextExamNote}</div>
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="📄 Exam pattern" className="lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="faint border-b text-left text-xs uppercase hairline">
                  <th className="py-2 pr-3">Section</th>
                  <th className="py-2 pr-3 text-right">Questions</th>
                  <th className="py-2 pr-3 text-right">Marks</th>
                  <th className="py-2 pr-3 text-right">Time</th>
                  <th className="py-2 text-right">Negative</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {exam.sections.map((s) => (
                  <tr key={s.name} className="border-b hairline">
                    <td className="py-2.5 pr-3 font-semibold">{s.name}</td>
                    <td className="py-2.5 pr-3 text-right">{s.questions}</td>
                    <td className="py-2.5 pr-3 text-right">{s.marks}</td>
                    <td className="py-2.5 pr-3 text-right">{s.minutes ? `${s.minutes} min` : "—"}</td>
                    <td className="py-2.5 text-right">{(s.negative ?? exam.negative) === 0 ? "None" : `−${fraction(s.negative ?? exam.negative)} of Q marks`}</td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2.5 pr-3">Total</td>
                  <td className="py-2.5 pr-3 text-right">{totalQuestions(exam)}</td>
                  <td className="py-2.5 pr-3 text-right">{totalMarks(exam)}</td>
                  <td className="py-2.5 pr-3 text-right">{exam.durationMin} min</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm"><div className="faint text-xs">Correct answer</div><div className="font-bold" style={{ color: "var(--good-ink)" }}>+{Math.round(marksPer * 100) / 100} mark{marksPer > 1 ? "s" : ""}</div></div>
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm"><div className="faint text-xs">Wrong answer</div><div className="font-bold text-red-600">−{negMarks}</div></div>
            <div className="rounded-xl bg-[var(--surface-2)] p-3 text-sm"><div className="faint text-xs">Break-even</div><div className="font-bold">{breakEven ? `${breakEven} wrong = 1 right lost` : "No penalty"}</div></div>
          </div>
          {exam.qualifyingNote && <p className="muted mt-3 text-sm">ℹ️ {exam.qualifyingNote}</p>}
        </Card>
        <Card title="✅ Eligibility & selection">
          <dl className="space-y-3 text-sm">
            <div><dt className="faint text-xs font-semibold uppercase">Education</dt><dd>{exam.eligibility}</dd></div>
            <div><dt className="faint text-xs font-semibold uppercase">Age limit</dt><dd>{exam.ageLimit}</dd></div>
            <div>
              <dt className="faint text-xs font-semibold uppercase">Selection process</dt>
              <dd>
                <ol className="mt-1 space-y-1">
                  {exam.selection.map((s, i) => (
                    <li key={s} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">{i + 1}</span>{s}</li>
                  ))}
                </ol>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card title="🎯 Previous-year cut-offs" subtitle={`Your category (${user.category}) is highlighted`}>
        <CutoffTable exam={exam} highlight={user.category} />
      </Card>

      <Card title="📚 Syllabus for this exam" subtitle="Click a topic for notes, formulas, tricks and a topic test. Your status is shown on each.">
        <div className="grid gap-6 md:grid-cols-2">
          {subjects.map((s) => {
            const topics = TOPICS.filter((t) => t.subject === s.id && (t.families === "all" || t.families.includes(exam.family)));
            return (
              <div key={s.id}>
                <div className="mb-2 flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</div>
                <ul className="space-y-1">
                  {topics.map((t) => {
                    const st = STATUS_META[status.get(t.id) ?? "not_started"];
                    return (
                      <li key={t.id}>
                        <Link href={`/syllabus/${t.id}`} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]">
                          <span>{st.emoji} {t.name}</span>
                          <span className="faint shrink-0 text-[11px]">{t.asked}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="💡 Strategy tips for this exam">
        <ul className="grid gap-3 md:grid-cols-2">
          {exam.tips.map((t) => (
            <li key={t} className="flex gap-2 rounded-xl bg-[var(--surface-2)] p-3 text-sm"><span>👉</span>{t}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
