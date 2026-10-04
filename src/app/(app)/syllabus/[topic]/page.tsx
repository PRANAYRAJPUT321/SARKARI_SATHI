import { ArrowLeft, Lightbulb, Sigma } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuestionBody } from "@/components/Solutions";
import { StartButton } from "@/components/StartButton";
import { TopicStatus } from "@/components/TopicStatus";
import { Badge, Card } from "@/components/ui";
import { EXAMS } from "@/data/exams";
import { subjectById, topicById } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { dayKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { generateSection } from "@/lib/questions";
import { hashString, mulberry32 } from "@/lib/questions/rng";
import { getAttemptStats } from "@/lib/stats";

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const t = topicById((await params).topic);
  return { title: t ? `${t.name} – notes & tricks` : "Topic" };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic: id } = await params;
  const t = topicById(id);
  if (!t) notFound();
  const user = await requireUser();
  const [progress, { topicAgg }] = await Promise.all([
    prisma.topicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId: t.id } } }),
    getAttemptStats(user.id),
  ]);
  const subj = subjectById(t.subject);
  const agg = topicAgg.get(t.id);
  const att = agg ? agg.correct + agg.wrong : 0;
  const examples = generateSection(mulberry32(hashString(`${t.id}:${dayKey()}`)), t.subject, 3, { family: "all", topics: [t.id], idPrefix: "ex", options: 4 });
  const exams = EXAMS.filter((e) => e.sections.some((s) => s.subject === t.subject && (!s.topics || s.topics.includes(t.id))) && (t.families === "all" || t.families.includes(e.family)));

  return (
    <div className="space-y-6">
      <Link href="/syllabus" className="muted inline-flex items-center gap-1 text-sm hover:text-brand-600"><ArrowLeft size={14} /> Syllabus</Link>
      <section className="card relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: subj.color }} />
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="faint text-xs font-bold uppercase">{subj.name}</div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{t.name}</h1>
            <p className="muted mt-2 max-w-2xl">{t.concept}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {t.asked && <Badge>📌 {t.asked}</Badge>}
              {att > 0 && <Badge color={agg!.correct / att >= 0.75 ? "var(--good)" : "var(--critical)"}>Your accuracy: {Math.round((agg!.correct / att) * 100)}% ({att} Qs)</Badge>}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <StartButton spec={{ type: "topic", topic: t.id, n: 1 }} random>Take 15-Q topic test</StartButton>
            <TopicStatus topicId={t.id} initial={progress?.status ?? "not_started"} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {t.formulas && (
          <Card title={<span className="flex items-center gap-2"><Sigma size={18} /> Key formulas & facts</span>}>
            <ul className="space-y-2">
              {t.formulas.map((f) => <li key={f} className="rounded-xl bg-[var(--surface-2)] px-3 py-2 font-mono text-sm">{f}</li>)}
            </ul>
          </Card>
        )}
        <Card title={<span className="flex items-center gap-2"><Lightbulb size={18} /> Tips & shortcut tricks</span>} className={t.formulas ? "" : "lg:col-span-2"}>
          <ul className="space-y-2">
            {t.tricks.map((x) => <li key={x} className="flex gap-2 text-sm"><span>⚡</span>{x}</li>)}
          </ul>
        </Card>
      </div>

      <Card title="✍️ Solved examples" subtitle="Fresh examples every day – read the solution, then try the topic test">
        <div className="space-y-4">
          {examples.map((q, i) => (
            <div key={q.id} className="rounded-2xl border p-4 hairline">
              <div className="faint mb-2 text-xs font-bold">EXAMPLE {i + 1}</div>
              <QuestionBody q={q} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="🎯 Asked in">
        <div className="flex flex-wrap gap-2">
          {exams.map((e) => <Link key={e.slug} href={`/exams/${e.slug}`} className="chip border hairline hover:bg-[var(--surface-2)]"><span className="h-2 w-2 rounded-full" style={{ background: e.color }} />{e.short}</Link>)}
        </div>
      </Card>
    </div>
  );
}
