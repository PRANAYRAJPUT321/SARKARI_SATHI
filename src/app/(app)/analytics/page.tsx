import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { ScoreTrend, SubjectRadar, WeeklyBars } from "@/components/charts";
import { Card, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { examBySlug } from "@/data/exams";
import { SUBJECTS } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { fmtDuration, prettyDate } from "@/lib/dates";
import { getAttemptStats, getDashboard } from "@/lib/stats";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireUser();
  const d = await getDashboard(user.id, user.category);
  const { attempts } = await getAttemptStats(user.id);
  const practised = d.topicStats.filter((t) => t.attempted > 0).sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0));
  const totalTime = attempts.reduce((a, x) => a + x.timeTakenSec, 0);
  const totalQs = attempts.reduce((a, x) => a + x.correct + x.wrong + x.skipped, 0);
  const goal = user.dailyGoalMin;

  if (!attempts.length)
    return (
      <div>
        <PageHeader icon={<BarChart3 />} title="Analytics" subtitle="Deep insights into your preparation." />
        <Empty title="No data yet" text="Complete a mock, sectional or topic test and your analytics will appear here." href="/mocks" cta="Take a test" icon="📊" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader icon={<BarChart3 />} title="Analytics" subtitle="Find exactly where you gain and lose marks." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Tests taken" value={attempts.length} sub={`${totalQs} questions`} />
        <Stat label="Overall accuracy" value={d.overallAccuracy != null ? `${d.overallAccuracy}%` : "—"} />
        <Stat label="Time in tests" value={fmtDuration(totalTime)} sub={`${totalQs ? Math.round(totalTime / totalQs) : 0}s per question`} />
        <Stat label="Syllabus covered" value={`${d.overallCoverage}%`} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="📈 Score trend" subtitle="All test types, % of max score">
          <ScoreTrend data={d.trend} />
        </Card>
        <Card title="🕸️ Subject balance" subtitle="Blue = accuracy, orange = syllabus coverage">
          <SubjectRadar data={d.coverage.map((s) => ({ subject: s.short, accuracy: s.accuracy ?? 0, coverage: s.coverage }))} />
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="📚 Subject-wise" className="lg:col-span-1">
          <div className="space-y-4">
            {d.coverage.map((s) => (
              <div key={s.id}>
                <div className="flex justify-between text-sm"><span className="font-semibold">{s.name}</span><span className="tabular">{s.accuracy != null ? `${s.accuracy}%` : "—"}</span></div>
                <Progress value={s.accuracy ?? 0} color={SUBJECTS.find((x) => x.id === s.id)!.color} className="mt-1.5" />
                <div className="faint mt-1 text-[11px]">{s.attempted} questions attempted</div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="⏱️ Study time – last 7 days" className="lg:col-span-2">
          <WeeklyBars data={d.last7} goal={goal} />
        </Card>
      </div>
      <Card title="🧩 Topic-wise accuracy & speed" subtitle="Weakest first. Avg time includes skipped questions.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="faint border-b text-left text-xs uppercase hairline"><th className="py-2">Topic</th><th className="py-2">Subject</th><th className="py-2 text-right">Attempted</th><th className="py-2">Accuracy</th><th className="py-2 text-right">Avg time</th><th /></tr>
            </thead>
            <tbody className="tabular">
              {practised.map((t) => (
                <tr key={t.id} className="border-b hairline last:border-0">
                  <td className="py-2 font-semibold"><Link href={`/syllabus/${t.id}`} className="hover:text-brand-600">{t.name}</Link></td>
                  <td className="faint py-2 text-xs">{SUBJECTS.find((s) => s.id === t.subject)?.short}</td>
                  <td className="py-2 text-right">{t.attempted}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={t.accuracy ?? 0} height={6} className="w-24" color={(t.accuracy ?? 0) >= 75 ? "var(--good)" : (t.accuracy ?? 0) >= 50 ? "var(--warning)" : "var(--critical)"} />
                      <span>{t.accuracy}%</span>
                    </div>
                  </td>
                  <td className="py-2 text-right">{t.avgTime ?? "—"}s</td>
                  <td className="py-2 text-right"><Link href={`/syllabus/${t.id}`} className="text-xs font-semibold text-brand-600">Improve →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="🗂️ Test history">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="faint border-b text-left text-xs uppercase hairline"><th className="py-2">Test</th><th className="py-2">Date</th><th className="py-2 text-right">Score</th><th className="py-2 text-right">✓ / ✗ / –</th><th className="py-2 text-right">Time</th><th /></tr>
            </thead>
            <tbody className="tabular">
              {attempts.map((a) => (
                <tr key={a.id} className="border-b hairline last:border-0">
                  <td className="py-2">
                    <div className="font-semibold">{a.title}</div>
                    <div className="faint text-[11px] capitalize">{a.kind === "pyp" ? "previous-year pattern" : a.kind} · {examBySlug(a.examSlug)?.short ?? "Practice"}</div>
                  </td>
                  <td className="faint py-2 text-xs">{a.submittedAt ? prettyDate(a.submittedAt) : ""}</td>
                  <td className="py-2 text-right font-bold">{a.score}/{a.maxScore}</td>
                  <td className="py-2 text-right text-xs">{a.correct} / {a.wrong} / {a.skipped}</td>
                  <td className="py-2 text-right text-xs">{fmtDuration(a.timeTakenSec)}</td>
                  <td className="py-2 text-right"><Link href={`/results/${a.id}`} className="text-xs font-semibold text-brand-600">Report →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
