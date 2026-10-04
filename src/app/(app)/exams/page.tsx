import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { EXAM_CATEGORIES, EXAMS, totalMarks, totalQuestions } from "@/data/exams";
import { Badge, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";

export const metadata = { title: "Exam Explorer" };

export default async function ExamsPage() {
  const user = await requireUser();
  const mine = new Set(user.targets.map((t) => t.examSlug));
  return (
    <div>
      <PageHeader icon={<GraduationCap />} title="Exam Explorer" subtitle="Patterns, marking schemes, syllabus, cut-offs and mocks for every major government exam." />
      <div className="space-y-8">
        {EXAM_CATEGORIES.map((c) => (
          <section key={c}>
            <h2 className="faint mb-3 text-xs font-bold uppercase tracking-wider">{c}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {EXAMS.filter((e) => e.category === c).map((e) => (
                <Link key={e.slug} href={`/exams/${e.slug}`} className="card group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="absolute inset-y-0 left-0 w-1" style={{ background: e.color }} />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-lg font-extrabold group-hover:text-brand-600">{e.short}</div>
                      <div className="muted text-xs">{e.name}</div>
                    </div>
                    {mine.has(e.slug) && <Badge color="var(--s2)">My exam</Badge>}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-[var(--surface-2)] p-2"><div className="font-extrabold">{totalQuestions(e)}</div><div className="faint">Qs</div></div>
                    <div className="rounded-xl bg-[var(--surface-2)] p-2"><div className="font-extrabold">{e.durationMin}m</div><div className="faint">{e.sectionalTiming ? "sectional" : "composite"}</div></div>
                    <div className="rounded-xl bg-[var(--surface-2)] p-2"><div className="font-extrabold">{totalMarks(e)}</div><div className="faint">marks</div></div>
                  </div>
                  <div className="muted mt-3 text-xs">➖ {e.negativeLabel}</div>
                  {e.nextExam && <div className="faint mt-1 text-xs">📅 Next: {prettyDate(e.nextExam + "T00:00:00+05:30")} (tentative)</div>}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
