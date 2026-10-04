import { Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Flame, Target, Timer, TrendingUp, Zap } from "lucide-react";
import Link from "next/link";
import { ScoreTrend, SubjectRadar, WeeklyBars } from "@/components/charts";
import { TaskList } from "@/components/TaskList";
import { Badge, Card, Empty, Progress, Ring, Stat } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { coachAdvice } from "@/lib/coach";
import { dayKey, fmtDuration, greeting, istStart, prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { quoteOfDay } from "@/lib/quotes";
import { badgesFor, getDashboard, levelFor } from "@/lib/stats";

export const metadata = { title: "Dashboard" };

const TONE: Record<string, string> = { good: "var(--good)", warn: "var(--warning)", bad: "var(--critical)", info: "var(--s1)" };

export default async function Dashboard() {
  const user = await requireUser();
  const d = await getDashboard(user.id, user.category);
  const today = dayKey();
  const start = istStart(today);
  const [tasks, openAttempt] = await Promise.all([
    prisma.plannerTask.findMany({ where: { userId: user.id, date: { gte: start, lt: new Date(start.getTime() + 86400000) } }, orderBy: { date: "asc" } }),
    prisma.attempt.findFirst({ where: { userId: user.id, status: "in_progress" }, orderBy: { startedAt: "desc" }, select: { id: true, title: true } }),
  ]);
  const first = user.name.split(" ")[0];
  const goal = user.dailyGoalMin;
  const goalPct = Math.round((d.todayMinutes / goal) * 100);
  const quote = quoteOfDay(today);
  const lv = levelFor(user.xp);
  const advice = coachAdvice(d, goal);
  const badges = badgesFor({ ...d, xp: user.xp });
  const primary = d.examCards[0];
  const cutPct = primary?.cutoff ? Math.round((primary.cutoff.value / primary.cutoff.unit) * 100) : undefined;
  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-8 animate-fade-up">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="text-sm font-medium text-white/75">{prettyDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</div>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {greeting()}, {first}! {d.streak >= 3 ? "🔥" : "👋"}
            </h1>
            <p className="mt-2 max-w-2xl text-white/85">
              {primary?.daysLeft != null && primary.daysLeft >= 0
                ? `${primary.daysLeft} days to ${primary.short}${primary.tentative ? " (tentative)" : ""}. Today's mission: ${primary.mocksPerDay} mock${primary.mocksPerDay > 1 ? "s" : ""}, ${Math.round(goal / 60)} hours of focused study and zero excuses.`
                : `Today's mission: ${Math.round(goal / 60)} hours of focused study. Every mock you take today is a mark you won't lose in the exam.`}
            </p>
            <blockquote className="mt-4 border-l-2 border-saffron-400 pl-3 text-sm italic text-white/80">
              “{quote.q}” <span className="not-italic text-white/60">— {quote.a}</span>
            </blockquote>
            <div className="mt-5 flex flex-wrap gap-2">
              {openAttempt ? (
                <Link href={`/test/${openAttempt.id}`} className="btn bg-white text-brand-700 hover:bg-white/90"><ClipboardList size={16} /> Resume: {openAttempt.title}</Link>
              ) : (
                <Link href={primary ? `/mocks/${primary.slug}` : "/mocks"} className="btn bg-white text-brand-700 hover:bg-white/90"><ClipboardList size={16} /> Take a full mock</Link>
              )}
              <Link href="/practice" className="btn-accent"><Zap size={16} /> Daily challenge</Link>
              <Link href="/planner" className="btn border border-white/30 text-white hover:bg-white/10"><CalendarDays size={16} /> My plan</Link>
            </div>
          </div>
          <div className="flex items-center gap-6 justify-self-center">
            <Ring value={goalPct} size={140} stroke={13} color="#fb923c" track="rgba(255,255,255,.18)">
              <div>
                <div className="text-3xl font-extrabold">{Math.min(999, goalPct)}%</div>
                <div className="text-[11px] text-white/75">of daily goal</div>
                <div className="text-[11px] text-white/75">{fmtDuration(d.todayMinutes * 60)} / {Math.round(goal / 60)}h</div>
              </div>
            </Ring>
            <div className="text-center">
              <div className={`text-5xl ${d.streak > 0 ? "animate-flame" : "opacity-50 grayscale"}`}>🔥</div>
              <div className="mt-1 text-2xl font-extrabold">{d.streak}</div>
              <div className="text-[11px] text-white/75">day streak</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Study streak" value={`${d.streak} 🔥`} sub={`Best: ${d.bestStreak} days`} icon={<Flame size={20} />} accent="var(--s2)" />
        <Stat label="Today" value={fmtDuration(d.todayMinutes * 60)} sub={`Goal ${Math.round(goal / 60)}h`} icon={<Timer size={20} />} accent="var(--s1)" />
        <Stat label="Tests this week" value={d.mocksThisWeek} sub={`${d.totalAttempts} total`} icon={<ClipboardList size={20} />} accent="var(--s3)" />
        <Stat label="Accuracy" value={d.overallAccuracy != null ? `${d.overallAccuracy}%` : "—"} sub="across all tests" icon={<Target size={20} />} accent="var(--s4)" />
        <Stat label={`Level ${lv.level}`} value={`${user.xp} XP`} sub={lv.title} icon={<Award size={20} />} accent="var(--s1)" />
      </div>

      {/* Exam countdowns */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Your target exams</h2>
          <Link href="/profile" className="text-sm font-semibold text-brand-600">Edit exams & dates →</Link>
        </div>
        {d.examCards.length === 0 ? (
          <Empty title="No target exam yet" text="Pick the exams you are preparing for to unlock countdowns and readiness." href="/exams" cta="Choose exams" icon="🎯" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {d.examCards.map((c) => (
              <div key={c.slug} className="card relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1" style={{ background: c.color }} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold">{c.short}</span>
                      {c.primary && <Badge color="var(--s2)">Primary</Badge>}
                    </div>
                    <div className="faint text-xs">{c.dateKey ? `${prettyDate(c.dateKey + "T00:00:00+05:30")}${c.tentative ? " · tentative" : ""}` : "Date not set"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-extrabold leading-none" style={{ color: c.daysLeft != null && c.daysLeft <= 15 ? "var(--critical)" : "var(--ink)" }}>
                      {c.daysLeft != null ? Math.max(0, c.daysLeft) : "—"}
                    </div>
                    <div className="faint text-[11px]">days left</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <Ring value={c.readiness} size={78} stroke={8} color={c.readiness >= 70 ? "var(--good)" : c.readiness >= 40 ? "var(--s4)" : "var(--s2)"}>
                    <div className="text-base font-extrabold">{c.readiness}%</div>
                  </Ring>
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="muted">Readiness · {c.mocksTaken} mock{c.mocksTaken === 1 ? "" : "s"} taken</div>
                    <div>Best: <b>{c.bestPct != null ? `${c.bestPct}%` : "—"}</b>{c.cutoff && <span className="faint"> · cut-off {c.cutoff.year}: {c.cutoff.value}/{c.cutoff.unit}</span>}</div>
                    <div className="text-xs font-semibold text-brand-600 dark:text-brand-300">Do {c.mocksPerDay} mock{c.mocksPerDay > 1 ? "s" : ""}/day now</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/mocks/${c.slug}`} className="btn-primary flex-1 py-2">Mocks</Link>
                  <Link href={`/exams/${c.slug}`} className="btn-ghost flex-1 py-2">Syllabus & cut-offs</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coach */}
        <Card title="🧭 Your coach says" subtitle="Personalised from your tests, syllabus & plan" className="lg:col-span-2">
          <ul className="space-y-2.5">
            {advice.map((a, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-xl border p-3 hairline sm:flex-nowrap" style={{ borderLeft: `4px solid ${TONE[a.tone]}` }}>
                <span className="text-xl">{a.icon}</span>
                <span className="min-w-0 flex-1 basis-[200px] text-sm">{a.text}</span>
                <Link href={a.href} className="btn-ghost shrink-0 px-3 py-1.5 text-xs">{a.cta}</Link>
              </li>
            ))}
          </ul>
        </Card>
        {/* Today plan */}
        <Card title="📋 Today's plan" subtitle={tasks.length ? `${doneTasks}/${tasks.length} done` : "Nothing scheduled yet"} action={<Link href="/planner" className="text-xs font-semibold text-brand-600">Planner →</Link>}>
          {tasks.length ? (
            <>
              <Progress value={(doneTasks / tasks.length) * 100} color="var(--good)" className="mb-3" />
              <TaskList tasks={tasks.map((t) => ({ id: t.id, title: t.title, type: t.type, done: t.done, at: t.date.toISOString(), examSlug: t.examSlug }))} compact />
            </>
          ) : (
            <Empty title="Plan your day" text="Auto-generate a day-by-day plan till your exam in one click." href="/planner" cta="Create study plan" icon="🗓️" />
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><TrendingUp size={18} /> Score trend</span>} subtitle="Last 20 tests, score as % of maximum">
          {d.trend.length >= 2 ? <ScoreTrend data={d.trend} target={cutPct} /> : <Empty title="Not enough data" text="Take at least two tests to see your progress line." icon="📈" />}
        </Card>
        <Card title="⏱️ Study time this week" subtitle={`Green bars = daily goal of ${Math.round(goal / 60)}h met`}>
          <WeeklyBars data={d.last7} goal={goal} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title={<span className="flex items-center gap-2"><BookOpen size={18} /> Subject mastery</span>} subtitle={`Overall syllabus covered: ${d.overallCoverage}%`} className="lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            {d.coverage.map((s) => (
              <div key={s.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                  <span className="faint text-xs">{s.mastered}/{s.total} mastered</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs"><span className="faint w-16">Syllabus</span><Progress value={s.coverage} color={s.color} /><span className="tabular w-9 text-right">{s.coverage}%</span></div>
                  <div className="flex items-center gap-2 text-xs"><span className="faint w-16">Accuracy</span><Progress value={s.accuracy ?? 0} color={s.color} /><span className="tabular w-9 text-right">{s.accuracy != null ? `${s.accuracy}%` : "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[var(--s1)]" /> accuracy</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-[var(--s2)]" /> syllabus</span>
          </div>
          <SubjectRadar data={d.coverage.map((s) => ({ subject: s.short, accuracy: s.accuracy ?? 0, coverage: s.coverage }))} />
        </Card>
        <div className="space-y-6">
          <Card title="🎯 Focus areas" subtitle="Topics pulling your score down">
            {d.weak.length ? (
              <ul className="space-y-2">
                {d.weak.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <Link href={`/syllabus/${t.id}`} className="min-w-0 truncate font-semibold hover:text-brand-600">{t.name}</Link>
                    <Badge color="var(--critical)">{t.accuracy}%</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted text-sm">No weak topics detected yet. Take a few more tests – we&apos;ll pinpoint them for you.</p>
            )}
            {d.untouched.length > 0 && (
              <>
                <div className="faint mb-2 mt-4 text-xs font-semibold uppercase">Not started yet</div>
                <div className="flex flex-wrap gap-1.5">
                  {d.untouched.map((t) => <Link key={t.id} href={`/syllabus/${t.id}`} className="chip border hairline hover:bg-[var(--surface-2)]">{t.name}</Link>)}
                </div>
              </>
            )}
          </Card>
          <Card title="💪 Strengths">
            {d.strong.length ? (
              <div className="flex flex-wrap gap-1.5">{d.strong.map((t) => <Badge key={t.id} color="var(--good)">{t.name} · {t.accuracy}%</Badge>)}</div>
            ) : (
              <p className="muted text-sm">Strengths appear once you score 85%+ on a topic.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="📝 Recent tests" className="lg:col-span-2" action={<Link href="/analytics" className="text-xs font-semibold text-brand-600">All analytics →</Link>}>
          {d.attempts.length ? (
            <div className="divide-y hairline">
              {d.attempts.map((a) => {
                const pct = a.maxScore ? Math.round((a.score / a.maxScore) * 100) : 0;
                return (
                  <Link key={a.id} href={`/results/${a.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold" style={{ background: `color-mix(in srgb, ${pct >= 60 ? "var(--good)" : pct >= 40 ? "var(--warning)" : "var(--critical)"} 16%, transparent)` }}>{pct}%</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.title}</div>
                      <div className="faint text-xs">{a.submittedAt ? prettyDate(a.submittedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""} · {a.correct}✓ {a.wrong}✗ {a.skipped}–</div>
                    </div>
                    <div className="tabular text-sm font-bold">{a.score}/{a.maxScore}</div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Empty title="No tests yet" text="Your attempts and their detailed reports will show up here." href="/mocks" cta="Browse mocks" icon="📝" />
          )}
        </Card>
        <Card title="🏅 Badges" subtitle={`${badges.filter((b) => b.got).length}/${badges.length} unlocked`}>
          <div className="grid grid-cols-5 gap-2">
            {badges.map((b) => (
              <div key={b.id} title={`${b.name}: ${b.desc}`} className={`grid aspect-square place-items-center rounded-xl text-2xl ${b.got ? "bg-saffron-500/15" : "bg-[var(--surface-2)] opacity-40 grayscale"}`}>{b.icon}</div>
            ))}
          </div>
          <div className="faint mt-4 mb-2 text-xs font-semibold uppercase">Last 12 weeks</div>
          <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
            {d.heat.map((h) => {
              const lvl = h.minutes === 0 ? 0 : h.minutes < 60 ? 1 : h.minutes < 120 ? 2 : h.minutes < 240 ? 3 : 4;
              const bg = ["var(--grid)", "#9ec5f4", "#5598e7", "#256abf", "#0d366b"][lvl];
              return <div key={h.day} title={`${h.day}: ${h.minutes} min`} className="aspect-square rounded-[3px]" style={{ background: bg }} />;
            })}
          </div>
          <div className="faint mt-2 flex items-center justify-end gap-1 text-[10px]">less {["var(--grid)", "#9ec5f4", "#5598e7", "#256abf", "#0d366b"].map((c) => <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />)} more</div>
        </Card>
      </div>
      <p className="faint flex items-center justify-center gap-1 text-center text-xs"><CheckCircle2 size={12} /> Every minute in mocks and focus sessions counts towards your streak.</p>
    </div>
  );
}
