import { Zap } from "lucide-react";
import Link from "next/link";
import { StartButton } from "@/components/StartButton";
import { Badge, Card, PageHeader, Progress } from "@/components/ui";
import { SUBJECTS, TOPICS } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { hashString } from "@/lib/questions/rng";
import { getAttemptStats } from "@/lib/stats";

export const metadata = { title: "Practice" };

export default async function PracticePage() {
  const user = await requireUser();
  const seed = hashString(`${dayKey()}:${user.id}`);
  const [daily, { topicAgg }] = await Promise.all([
    prisma.attempt.findFirst({ where: { userId: user.id, kind: "daily", seed }, orderBy: { startedAt: "desc" } }),
    getAttemptStats(user.id),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader icon={<Zap />} title="Practice" subtitle="Daily challenge to keep your streak alive, plus unlimited topic tests to fix weak areas." />
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-saffron-500 to-rose-500 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-6 -top-6 text-[120px] opacity-20">⚡</div>
        <div className="relative">
          <div className="text-sm font-semibold text-white/80">Daily Challenge · {dayKey()}</div>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">12 questions. 8 minutes. One streak.</h2>
          <p className="mt-2 max-w-xl text-white/85">A fresh mixed set every day from your primary exam&apos;s subjects. Same set for the whole day – come back tomorrow for a new one.</p>
          <div className="mt-5">
            {daily?.status === "submitted" ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-xl bg-white/20 px-4 py-2 font-bold">Done today: {daily.score}/{daily.maxScore} ✅</span>
                <Link href={`/results/${daily.id}`} className="btn bg-white text-rose-600 hover:bg-white/90">View report</Link>
              </div>
            ) : daily ? (
              <Link href={`/test/${daily.id}`} className="btn bg-white text-rose-600 hover:bg-white/90">Resume challenge</Link>
            ) : (
              <StartButton spec={{ type: "daily" }} className="btn bg-white text-rose-600 hover:bg-white/90">Start today&apos;s challenge</StartButton>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {SUBJECTS.map((s) => (
          <Card key={s.id} title={<span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}</span>} subtitle="15-question topic tests · new questions every time">
            <ul className="divide-y hairline">
              {TOPICS.filter((t) => t.subject === s.id).map((t) => {
                const a = topicAgg.get(t.id);
                const att = a ? a.correct + a.wrong : 0;
                const acc = att ? Math.round((a!.correct / att) * 100) : null;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <Link href={`/syllabus/${t.id}`} className="text-sm font-semibold hover:text-brand-600">{t.name}</Link>
                      <div className="mt-1 flex items-center gap-2">
                        <Progress value={acc ?? 0} color={acc == null ? "var(--grid)" : acc >= 75 ? "var(--good)" : acc >= 50 ? "var(--warning)" : "var(--critical)"} height={5} className="max-w-[140px]" />
                        <span className="faint text-[11px]">{acc != null ? `${acc}% · ${att} Qs` : "not practised"}</span>
                      </div>
                    </div>
                    {acc != null && acc < 60 && <Badge color="var(--critical)">weak</Badge>}
                    <StartButton spec={{ type: "topic", topic: t.id, n: 1 }} random className="btn-ghost px-3 py-1.5 text-xs">Practice</StartButton>
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
