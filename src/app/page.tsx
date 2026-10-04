import { BarChart3, BellRing, BookOpen, CalendarDays, ClipboardList, Flame, Lightbulb, Target, Timer } from "lucide-react";
import Link from "next/link";
import { EXAM_CATEGORIES, EXAMS, PYP_YEARS } from "@/data/exams";
import { TOPICS } from "@/data/syllabus";
import { currentUser } from "@/lib/auth";

const FEATURES = [
  { icon: ClipboardList, title: "Unlimited full-length mocks", text: "Fresh papers for every exam with the exact pattern, sectional timers and negative marking (¼, ⅓, 0.5 – whatever your exam uses)." },
  { icon: Timer, title: "Second-by-second feedback", text: "See how long you spent on each question, where you wasted time, which guesses cost you marks and how many extra questions you could have attempted." },
  { icon: Target, title: "Cut-offs & passing criteria", text: "Category-wise cut-offs for the last 4–5 years, compared live against your mock scores." },
  { icon: BookOpen, title: "Complete syllabus tracker", text: `${TOPICS.length} topics across Quants, Reasoning, English & GA with notes, formulas and shortcut tricks.` },
  { icon: CalendarDays, title: "Smart study planner", text: "Set your exam date and get a day-by-day plan: topics, mocks per day and revision days – it adapts as the exam gets closer." },
  { icon: BarChart3, title: "Analytics that pinpoint flaws", text: "Topic-wise accuracy, speed, weak areas and readiness score for each target exam." },
  { icon: Flame, title: "Streaks, XP & badges", text: "Daily challenges, focus timer and levels keep you coming back for those 4–5 hours a day." },
  { icon: BellRing, title: "Reminders that motivate", text: "Exam countdowns, planned-task alerts and streak savers – right in your browser." },
  { icon: Lightbulb, title: "Tips & tricks library", text: "Exam-wise strategy, subject shortcuts, GK flashcards and exam-day checklists." },
];

export default async function Landing() {
  const user = await currentUser();
  return (
    <div>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="" className="h-10 w-10" />
              <span className="text-xl font-extrabold">Sarkari Sathi</span>
            </div>
            <div className="flex gap-2">
              {user ? (
                <Link href="/dashboard" className="btn bg-white text-brand-700 hover:bg-white/90">Go to dashboard →</Link>
              ) : (
                <>
                  <Link href="/login" className="btn text-white hover:bg-white/10">Log in</Link>
                  <Link href="/register" className="btn bg-white text-brand-700 hover:bg-white/90">Sign up free</Link>
                </>
              )}
            </div>
          </nav>
          <div className="mt-16 grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="chip bg-white/15 text-white">🇮🇳 Banking · Railways · SSC · RBI · Insurance · IB</span>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
                Crack your <span className="text-saffron-400">Sarkari exam</span> with a companion that knows you.
              </h1>
              <p className="mt-4 max-w-xl text-lg text-white/80">
                Full mocks with real marking schemes, previous-year pattern papers from {PYP_YEARS[PYP_YEARS.length - 1]}–{PYP_YEARS[0]}, cut-off trends, a syllabus tracker and a planner that tells you exactly what to do today.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={user ? "/dashboard" : "/register"} className="btn-accent px-6 py-3 text-base">Start preparing – free</Link>
                <Link href="#exams" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">Explore exams</Link>
              </div>
              <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {[
                  [EXAMS.length, "Exams covered"],
                  [`${EXAMS.length * (30 + PYP_YEARS.length)}+`, "Full mocks"],
                  [TOPICS.length, "Syllabus topics"],
                ].map(([v, l]) => (
                  <div key={String(l)}>
                    <div className="text-3xl font-extrabold">{v}</div>
                    <div className="text-sm text-white/70">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-3xl bg-white/10 p-5 shadow-2xl ring-1 ring-white/20 backdrop-blur">
                <div className="text-sm text-white/70">Mock report · SBI PO Full Mock 7</div>
                <div className="mt-1 text-4xl font-extrabold">68.25 <span className="text-lg font-semibold text-white/60">/ 100</span></div>
                <div className="mt-1 text-sm text-emerald-300">▲ 6.5 marks above last year&apos;s GEN cut-off (61.75)</div>
                <div className="mt-5 space-y-2">
                  {[["English", 76], ["Quants", 61], ["Reasoning", 70]].map(([n, v]) => (
                    <div key={n as string}>
                      <div className="flex justify-between text-xs text-white/80"><span>{n}</span><span>{v}%</span></div>
                      <div className="mt-1 h-2 rounded-full bg-white/15"><div className="h-2 rounded-full bg-saffron-400" style={{ width: `${v}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-black/20 p-3 text-sm text-white/85">
                  ⏱️ You spent <b>142s</b> on Q38 (ideal 34s) and got it wrong. Skipping it would have given time for <b>3 more questions</b>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold">Everything you need, in one place</h2>
        <p className="muted mx-auto mt-2 max-w-2xl text-center">Designed around how toppers actually prepare: practise, analyse, fix weak areas, repeat.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600/10 text-brand-600"><Icon size={22} /></div>
              <h3 className="mt-4 font-bold">{title}</h3>
              <p className="muted mt-1 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="exams" className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-3xl font-extrabold">Exams covered</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {EXAM_CATEGORIES.map((c) => (
            <div key={c} className="card">
              <div className="faint text-xs font-bold uppercase tracking-wide">{c}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMS.filter((e) => e.category === c).map((e) => (
                  <span key={e.slug} className="chip border hairline" title={e.name}>
                    <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
                    {e.short}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="hero-gradient rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-extrabold">Your selection starts with today&apos;s mock.</h2>
          <p className="mx-auto mt-2 max-w-xl text-white/80">Create a free account, pick your exams and let Sarkari Sathi plan your journey.</p>
          <Link href={user ? "/dashboard" : "/register"} className="btn-accent mt-6 px-8 py-3 text-base">Let&apos;s go 🚀</Link>
        </div>
        <p className="faint mt-8 text-center text-xs">
          Exam patterns and cut-offs are compiled from official notifications and results; always verify with the official website before applying. Practice papers are original questions modelled on each year&apos;s pattern.
        </p>
      </section>
    </div>
  );
}
