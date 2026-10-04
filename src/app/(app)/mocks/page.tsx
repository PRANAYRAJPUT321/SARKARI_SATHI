import { ClipboardList, PlayCircle } from "lucide-react";
import Link from "next/link";
import { EXAM_CATEGORIES, EXAMS, totalQuestions } from "@/data/exams";
import { Badge, Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Mock Tests" };

export default async function MocksHub() {
  const user = await requireUser();
  const [open, counts] = await Promise.all([
    prisma.attempt.findMany({ where: { userId: user.id, status: "in_progress" }, orderBy: { startedAt: "desc" }, take: 5 }),
    prisma.attempt.groupBy({ by: ["examSlug"], where: { userId: user.id, status: "submitted" }, _count: true }),
  ]);
  const cnt = new Map(counts.map((c) => [c.examSlug, c._count]));
  const mine = user.targets.map((t) => EXAMS.find((e) => e.slug === t.examSlug)).filter((e): e is (typeof EXAMS)[number] => !!e);
  return (
    <div className="space-y-8">
      <PageHeader icon={<ClipboardList />} title="Mock Tests" subtitle="Full-length mocks, previous-year pattern papers (2016–2025) and sectional tests with the exact exam interface and marking scheme." />
      {open.length > 0 && (
        <Card title="⏸️ Unfinished tests">
          <div className="space-y-2">
            {open.map((a) => (
              <Link key={a.id} href={`/test/${a.id}`} className="flex items-center justify-between rounded-xl border p-3 text-sm hairline hover:bg-[var(--surface-2)]">
                <span className="font-semibold">{a.title}</span>
                <span className="faint flex items-center gap-1 text-xs">Started {prettyDate(a.startedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} <PlayCircle size={16} className="text-brand-600" /></span>
              </Link>
            ))}
          </div>
        </Card>
      )}
      {mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-extrabold">Your exams</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {mine.map((e) => (
              <Link key={e.slug} href={`/mocks/${e.slug}`} className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${e.color}, #312e81)` }}>
                <div className="text-2xl font-extrabold">{e.short}</div>
                <div className="text-sm text-white/80">{e.stage} · {totalQuestions(e)} Qs · {e.durationMin} min</div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span>{cnt.get(e.slug) ?? 0} tests taken</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 font-semibold">Open →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {EXAM_CATEGORIES.map((c) => (
        <section key={c}>
          <h2 className="faint mb-3 text-xs font-bold uppercase tracking-wider">{c}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {EXAMS.filter((e) => e.category === c).map((e) => (
              <Link key={e.slug} href={`/mocks/${e.slug}`} className="card flex items-center justify-between gap-2 p-4 transition hover:shadow-md">
                <div>
                  <div className="font-bold">{e.short}</div>
                  <div className="faint text-xs">{totalQuestions(e)} Qs · {e.durationMin} min · {e.negativeLabel.split(" per")[0]}</div>
                </div>
                {(cnt.get(e.slug) ?? 0) > 0 && <Badge color="var(--good)">{cnt.get(e.slug)}</Badge>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
