import { CheckCircle2, Clock, MinusCircle, RotateCcw, Target, TrendingDown, XCircle } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuestionTimeChart, SectionTimeBars } from "@/components/charts";
import { Solutions } from "@/components/Solutions";
import { Card, Ring, Stat } from "@/components/ui";
import { examBySlug, referenceCutoff } from "@/data/exams";
import { topicById } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { fmtDuration, prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import type { Response, Summary } from "@/lib/grading";
import type { Paper } from "@/lib/questions";

export const metadata = { title: "Test report" };

const TONE: Record<string, { bg: string; icon: string }> = {
  good: { bg: "var(--good)", icon: "✅" },
  warn: { bg: "var(--warning)", icon: "⚠️" },
  bad: { bg: "var(--critical)", icon: "🚩" },
  info: { bg: "var(--s1)", icon: "💡" },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const a = await prisma.attempt.findFirst({ where: { id, userId: user.id } });
  if (!a) notFound();
  if (a.status !== "submitted") redirect(`/test/${a.id}`);
  const paper = JSON.parse(a.questions) as Paper;
  const s = JSON.parse(a.summary) as Summary;
  const responses = JSON.parse(a.responses) as Response[];
  const bookmarks = await prisma.bookmark.findMany({ where: { userId: user.id, key: { startsWith: `${a.id}:` } }, select: { key: true } });
  const exam = examBySlug(a.examSlug);
  const pct = s.maxScore ? Math.round((s.score / s.maxScore) * 100) : 0;

  // cut-off comparison (full-length papers only)
  let cut: { value: number; year: number; label?: string } | null = null;
  if (exam && (a.kind === "full" || a.kind === "pyp")) {
    const year = a.kind === "pyp" ? Number(a.title.match(/(20\d\d)/)?.[1]) : undefined;
    const row = year ? exam.cutoff.rows.find((r) => r.year === year && !r.label) : undefined;
    const v = row ? ((row[user.category as "GEN"] as number | undefined) ?? row.GEN) : undefined;
    const ref = v != null ? { value: v, year: year! } : referenceCutoff(exam, user.category);
    if (ref) cut = { ...ref, value: Math.round((ref.value / exam.cutoff.unit) * s.maxScore * 100) / 100 };
  }
  const cleared = cut ? s.score >= cut.value : null;
  const sinks = [...s.questions].filter((q) => q.timeSec > q.idealSec * 1.5).sort((x, y) => y.timeSec - x.timeSec).slice(0, 10);
  const allQ = paper.sections.flatMap((sec) => sec.questions);
  const qById = new Map(allQ.map((q) => [q.id, q]));
  const topics = [...s.topics].sort((x, y) => x.correct / Math.max(1, x.correct + x.wrong) - y.correct / Math.max(1, y.correct + y.wrong));
  const retrySpec = a.kind;

  return (
    <div className="space-y-6">
      <section className="hero-gradient overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[auto_1fr_auto]">
          <Ring value={pct} size={150} stroke={14} color={pct >= 60 ? "#4ade80" : pct >= 40 ? "#fbbf24" : "#f87171"} track="rgba(255,255,255,.18)">
            <div>
              <div className="text-3xl font-extrabold">{s.score}</div>
              <div className="text-xs text-white/75">out of {s.maxScore}</div>
            </div>
          </Ring>
          <div>
            <div className="text-sm text-white/75">{a.submittedAt ? prettyDate(a.submittedAt, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{a.title}</h1>
            {cut && (
              <div className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-semibold ${cleared ? "bg-emerald-400/20 text-emerald-200" : "bg-red-400/20 text-red-200"}`}>
                <Target size={16} />
                {cleared
                  ? `Cleared the ${cut.year} ${user.category} cut-off (${cut.value}) by ${Math.round((s.score - cut.value) * 100) / 100} marks 🎉`
                  : `${Math.round((cut.value - s.score) * 100) / 100} marks short of the ${cut.year} ${user.category} cut-off (${cut.value})`}
              </div>
            )}
            <p className="mt-3 max-w-2xl text-sm text-white/80">
              {pct >= 70 ? `Outstanding, ${user.name.split(" ")[0]}! Keep this momentum.` : pct >= 50 ? `Good effort, ${user.name.split(" ")[0]}. Fix the time sinks below and you will jump ahead.` : `Every topper had days like this, ${user.name.split(" ")[0]}. Study the analysis carefully – it's your shortcut to improvement.`}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {exam && <Link href={`/mocks/${exam.slug}`} className="btn bg-white text-brand-700 hover:bg-white/90"><RotateCcw size={16} /> {retrySpec === "topic" ? "More tests" : "Next mock"}</Link>}
            <Link href="/analytics" className="btn border border-white/30 text-white hover:bg-white/10">Overall analytics</Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Correct" value={s.correct} icon={<CheckCircle2 size={20} />} accent="var(--good)" sub={`+${Math.round((s.score + s.negativeLost) * 100) / 100} marks`} />
        <Stat label="Wrong" value={s.wrong} icon={<XCircle size={20} />} accent="var(--critical)" sub={`−${s.negativeLost} marks`} />
        <Stat label="Skipped" value={s.skipped} icon={<MinusCircle size={20} />} accent="var(--muted)" />
        <Stat label="Accuracy" value={`${s.accuracy}%`} icon={<Target size={20} />} accent="var(--s1)" sub="target 85%+" />
        <Stat label="Time taken" value={fmtDuration(s.timeTakenSec)} icon={<Clock size={20} />} accent="var(--s2)" sub={`of ${fmtDuration(paper.durationSec)}`} />
        <Stat label="Time wasted" value={fmtDuration(s.timeWastedSec)} icon={<TrendingDown size={20} />} accent="var(--serious)" sub={`≈ ${s.extraQuestionsPossible} more Qs possible`} />
      </div>

      <Card title="🧠 Feedback on your attempt" subtitle="Where you lost marks and time – and what to change next time">
        <ul className="space-y-2.5">
          {s.insights.map((ins, i) => (
            <li key={i} className="flex gap-3 rounded-xl border p-3 text-sm hairline" style={{ borderLeft: `4px solid ${TONE[ins.tone].bg}` }}>
              <span>{TONE[ins.tone].icon}</span>
              <span>{ins.text}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="📊 Section-wise performance" className="lg:col-span-3">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="faint border-b text-left text-xs uppercase hairline">
                  <th className="py-2 pr-2">Section</th><th className="py-2 pr-2 text-right">Score</th><th className="py-2 pr-2 text-right">✓</th><th className="py-2 pr-2 text-right">✗</th><th className="py-2 pr-2 text-right">–</th><th className="py-2 pr-2 text-right">Accuracy</th><th className="py-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {s.sections.map((sec) => (
                  <tr key={sec.name} className="border-b hairline last:border-0">
                    <td className="py-2.5 pr-2 font-semibold">{sec.name}</td>
                    <td className="py-2.5 pr-2 text-right font-bold">{sec.score}/{sec.max}</td>
                    <td className="py-2.5 pr-2 text-right" style={{ color: "var(--good-ink)" }}>{sec.correct}</td>
                    <td className="py-2.5 pr-2 text-right text-red-600">{sec.wrong}</td>
                    <td className="faint py-2.5 pr-2 text-right">{sec.skipped}</td>
                    <td className="py-2.5 pr-2 text-right">{sec.accuracy}%</td>
                    <td className="py-2.5 text-right">{fmtDuration(sec.timeSec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="⏳ Time used per section" subtitle="Blue = used, grey = allowed" className="lg:col-span-2">
          <SectionTimeBars data={s.sections.map((x) => ({ name: x.name.replace(/^Session \d · /, ""), used: x.timeSec, allowed: x.allowedSec }))} />
        </Card>
      </div>

      <Card title="⏱️ Time spent on every question" subtitle="Green = correct, red = wrong, grey = skipped. Dashed line = ideal time per question. Hover a bar for details.">
        <QuestionTimeChart data={s.questions.map((q) => ({ n: q.n, timeSec: q.timeSec, idealSec: q.idealSec, status: q.status, topic: topicById(q.topic)?.name ?? q.topic }))} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="🐌 Biggest time sinks" subtitle="Questions where you overstayed the ideal time">
          {sinks.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="faint border-b text-left text-xs uppercase hairline"><th className="py-2">Q</th><th className="py-2">Topic</th><th className="py-2 text-right">Spent</th><th className="py-2 text-right">Ideal</th><th className="py-2 text-right">Result</th></tr>
                </thead>
                <tbody className="tabular">
                  {sinks.map((q) => (
                    <tr key={q.qid} className="border-b hairline last:border-0">
                      <td className="py-2 font-bold"><a href={`#q-${q.n}`} className="hover:text-brand-600">Q{q.n}</a></td>
                      <td className="muted py-2">{topicById(q.topic)?.name}</td>
                      <td className="py-2 text-right font-semibold">{q.timeSec}s</td>
                      <td className="faint py-2 text-right">{q.idealSec}s</td>
                      <td className="py-2 text-right">{q.status === "correct" ? "✅" : q.status === "wrong" ? "❌" : "➖"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="faint mt-3 text-xs">Rule of thumb: if you haven&apos;t cracked a question in 1.5× the ideal time, mark it for review and move on.</p>
            </div>
          ) : (
            <p className="muted text-sm">Excellent time management – no major time sinks! 🎯</p>
          )}
        </Card>
        <Card title="🧩 Topic-wise analysis" subtitle="Weakest first">
          <div className="max-h-[360px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface)]">
                <tr className="faint border-b text-left text-xs uppercase hairline"><th className="py-2">Topic</th><th className="py-2 text-right">✓/✗/–</th><th className="py-2 text-right">Accuracy</th><th className="py-2 text-right">Avg time</th></tr>
              </thead>
              <tbody className="tabular">
                {topics.map((t) => {
                  const att = t.correct + t.wrong;
                  const acc = att ? Math.round((t.correct / att) * 100) : null;
                  return (
                    <tr key={t.topic} className="border-b hairline last:border-0">
                      <td className="py-2"><Link href={`/syllabus/${t.topic}`} className="font-medium hover:text-brand-600">{t.name}</Link></td>
                      <td className="py-2 text-right text-xs">{t.correct}/{t.wrong}/{t.skipped}</td>
                      <td className="py-2 text-right font-semibold" style={{ color: acc == null ? "var(--muted)" : acc >= 75 ? "var(--good-ink)" : acc >= 50 ? "inherit" : "var(--critical)" }}>{acc != null ? `${acc}%` : "—"}</td>
                      <td className="faint py-2 text-right">{Math.round(t.timeSec / Math.max(1, t.correct + t.wrong + t.skipped))}s</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Solutions
        attemptId={a.id}
        items={s.questions.map((q) => {
          const full = qById.get(q.qid)!;
          const r = responses.find((x) => x.qid === q.qid);
          return { ...q, sectionName: paper.sections[q.section].name, question: full, chosen: r?.chosen ?? null, topicName: topicById(q.topic)?.name ?? q.topic };
        })}
        bookmarked={bookmarks.map((b) => b.key.split(":")[1])}
      />
    </div>
  );
}
