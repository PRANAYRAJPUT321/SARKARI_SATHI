import { Clock, FileText, Info, Layers, Shuffle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StartButton } from "@/components/StartButton";
import { Card } from "@/components/ui";
import { examBySlug, PYP_YEARS, totalMarks, totalQuestions } from "@/data/exams";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mockSeed, pypSeed, sectionalSeed } from "@/lib/questions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const e = examBySlug((await params).slug);
  return { title: e ? `${e.short} mocks` : "Mocks" };
}

const MOCKS = 30;
const SETS = 5;

export default async function ExamMocks({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const exam = examBySlug(slug);
  if (!exam) notFound();
  const user = await requireUser();
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, examSlug: exam.slug },
    select: { id: true, seed: true, status: true, score: true, maxScore: true, kind: true },
    orderBy: { startedAt: "desc" },
  });
  const bySeed = new Map<number, { id: string; status: string; score: number; maxScore: number }[]>();
  for (const a of attempts) bySeed.set(a.seed, [...(bySeed.get(a.seed) ?? []), a]);
  const info = (seed: number) => {
    const list = bySeed.get(seed) ?? [];
    const done = list.filter((a) => a.status === "submitted");
    const best = done.length ? done.reduce((b, a) => (a.score > b.score ? a : b)) : null;
    return { best, open: list.find((a) => a.status === "in_progress"), latest: done[0] };
  };
  const cutByYear = new Map<number, number | undefined>();
  for (const r of exam.cutoff.rows) if (!r.label || !cutByYear.has(r.year)) cutByYear.set(r.year, (r[user.category as "GEN"] as number | undefined) ?? r.GEN);
  const max = totalMarks(exam);

  const tile = (seed: number, label: string, spec: Parameters<typeof StartButton>[0]["spec"], sub?: string) => {
    const { best, open, latest } = info(seed);
    const pct = best ? Math.round((best.score / best.maxScore) * 100) : null;
    return (
      <div key={label} className="card flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-bold">{label}</div>
            {sub && <div className="faint text-xs">{sub}</div>}
          </div>
          {pct != null && (
            <span className="chip" style={{ background: `color-mix(in srgb, ${pct >= 60 ? "var(--good)" : pct >= 40 ? "var(--warning)" : "var(--critical)"} 16%, transparent)` }}>
              Best {best!.score}/{best!.maxScore}
            </span>
          )}
        </div>
        <div className="mt-auto flex gap-2">
          {open ? (
            <Link href={`/test/${open.id}`} className="btn-accent flex-1 py-2">Resume</Link>
          ) : (
            <StartButton spec={spec} className={`${best ? "btn-ghost" : "btn-primary"} flex-1 py-2`}>{best ? "Re-attempt" : "Start"}</StartButton>
          )}
          {latest && <Link href={`/results/${latest.id}`} className="btn-ghost py-2">Report</Link>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: exam.color }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="faint text-xs font-bold uppercase">{exam.body}</div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{exam.short} Mock Tests</h1>
            <div className="muted mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="flex items-center gap-1"><FileText size={14} /> {totalQuestions(exam)} Qs · {max} marks</span>
              <span className="flex items-center gap-1"><Clock size={14} /> {exam.durationMin} min {exam.sectionalTiming ? "(sectional)" : "(composite)"}</span>
              <span>➖ {exam.negativeLabel}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <StartButton spec={{ type: "full", exam: exam.slug, n: 1 }} random className="btn-accent"><Shuffle size={16} /> Fresh random mock</StartButton>
            <Link href={`/exams/${exam.slug}`} className="btn-ghost"><Info size={16} /> Pattern & cut-offs</Link>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
          {exam.sections.map((s) => (
            <div key={s.name} className="rounded-xl bg-[var(--surface-2)] px-3 py-2">
              <b>{s.name}</b> <span className="faint">· {s.questions} Qs{s.minutes ? ` · ${s.minutes} min` : ""}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-extrabold">📜 Previous-year pattern papers</h2>
          <p className="muted text-sm">One paper per year from {PYP_YEARS[PYP_YEARS.length - 1]} to {PYP_YEARS[0]}, built on that exam&apos;s pattern and topic weightage. The year&apos;s cut-off (your category) is shown so you know the target.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PYP_YEARS.map((y) => tile(pypSeed(exam.slug, y), `${exam.short} ${y}`, { type: "pyp", exam: exam.slug, year: y }, cutByYear.get(y) != null ? `Cut-off ${y}: ${cutByYear.get(y)}/${exam.cutoff.unit}` : "Pattern paper"))}
        </div>
        <p className="faint mt-3 text-xs">
          Official question papers & answer keys, when released, are published on <a className="underline" href={exam.officialSite} target="_blank" rel="noreferrer">{new URL(exam.officialSite).hostname}</a>. These practice papers contain original questions so you can attempt each year&apos;s format as many times as you like.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-extrabold">🧪 Full-length mocks</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: MOCKS }, (_, i) => tile(mockSeed(exam.slug, i + 1), `Full Mock ${i + 1}`, { type: "full", exam: exam.slug, n: i + 1 }))}
        </div>
      </section>

      <Card title={<span className="flex items-center gap-2"><Layers size={18} /> Sectional tests</span>} subtitle="Practise one section at a time with its own timer">
        <div className="space-y-4">
          {exam.sections.map((s, si) => (
            <div key={s.name}>
              <div className="mb-2 text-sm font-bold">{s.name} <span className="faint font-normal">· {s.questions} Qs</span></div>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: SETS }, (_, n) => {
                  const { best, open } = info(sectionalSeed(exam.slug, si, n + 1));
                  return open ? (
                    <Link key={n} href={`/test/${open.id}`} className="btn-accent px-3 py-1.5 text-xs">Set {n + 1} · resume</Link>
                  ) : (
                    <StartButton key={n} spec={{ type: "sectional", exam: exam.slug, section: si, n: n + 1 }} className="btn-ghost px-3 py-1.5 text-xs">
                      Set {n + 1}{best ? ` · ${best.score}/${best.maxScore}` : ""}
                    </StartButton>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
