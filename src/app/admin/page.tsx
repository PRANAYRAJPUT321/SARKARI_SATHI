import { Activity, BellRing, CalendarCheck, ClipboardCheck, Clock, Database, Lock, LogOut, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DailyCountBars } from "@/components/charts";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, Stat } from "@/components/ui";
import { adminConfigured, isAdmin } from "@/lib/admin";
import { usageStats, type DayCount } from "@/lib/admin-stats";
import { adminLoginAction, adminLogoutAction } from "./actions";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

const num = (n: number) => n.toLocaleString("en-IN");

function Brand({ sub }: { sub: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <div className="text-lg font-extrabold">Sarkari Sathi</div>
        <div className="faint text-[11px] font-semibold">{sub}</div>
      </div>
    </Link>
  );
}

function Gate({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="card w-full max-w-sm">
        <div className="flex items-center justify-between">
          <Brand sub="Owner dashboard" />
          <ThemeToggle />
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

const ERRORS: Record<string, string> = {
  wrong: "That password is not correct.",
  wait: "Too many wrong attempts. Please try again in 15 minutes.",
};

/** Peak and average under a daily chart, so the numbers are readable without hovering. */
function Summary({ data, noun }: { data: DayCount[]; noun: string }) {
  const total = data.reduce((a, d) => a + d.count, 0);
  const peak = data.reduce((a, d) => (d.count > a.count ? d : a), data[0]);
  if (!total) return <p className="faint mt-2 text-xs">No {noun} in the last 30 days yet.</p>;
  return (
    <p className="muted mt-2 text-xs">
      Busiest day: <b className="text-[var(--ink)]">{peak.label}</b> ({peak.count}) · Average {Math.round((total / data.length) * 10) / 10} a day
    </p>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ e?: string; tests?: string }> }) {
  const sp = await searchParams;

  if (!adminConfigured()) {
    return (
      <Gate>
        <h1 className="text-xl font-extrabold">Admin is not set up</h1>
        <p className="muted mt-2 text-sm">Add an <code>ADMIN_PASSWORD</code> environment variable to the project in Vercel and redeploy.</p>
      </Gate>
    );
  }

  if (!(await isAdmin())) {
    return (
      <Gate>
        <h1 className="flex items-center gap-2 text-xl font-extrabold"><Lock size={18} /> Owner login</h1>
        <p className="muted mt-1 text-sm">See how many students use Sarkari Sathi.</p>
        <form action={adminLoginAction} className="mt-5 space-y-3">
          <input name="password" type="password" required autoComplete="current-password" placeholder="Admin password" className="input" aria-label="Admin password" autoFocus />
          {sp.e && ERRORS[sp.e] && <p className="text-sm font-semibold text-[var(--critical)]" role="alert">{ERRORS[sp.e]}</p>}
          <button className="btn-primary w-full">Open dashboard</button>
        </form>
      </Gate>
    );
  }

  const includeTests = sp.tests === "1";
  const s = await usageStats({ includeTests });
  const t = s.totals;
  const examMax = Math.max(1, ...s.exams.map((e) => e.count));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <Brand sub="Owner dashboard · Built by Pranay" />
        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard" className="btn-ghost px-3 py-2 text-sm">Open app</Link>
          <ThemeToggle />
          <form action={adminLogoutAction}>
            <button className="btn-ghost px-3 py-2 text-sm" aria-label="Log out of admin"><LogOut size={16} /><span className="hidden sm:inline">Log out</span></button>
          </form>
        </div>
      </header>

      <div className="mb-6 mt-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Who is using Sarkari Sathi</h1>
        <p className="muted mt-1 text-sm">
          Live from the app&apos;s database · days are in IST
          {s.hiddenTests > 0 && (
            <> · {s.hiddenTests} test account{s.hiddenTests === 1 ? "" : "s"} hidden (<Link href="/admin?tests=1" className="text-brand-600 underline dark:text-brand-300">show</Link>)</>
          )}
          {includeTests && (
            <> · including test accounts (<Link href="/admin" className="text-brand-600 underline dark:text-brand-300">hide</Link>)</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Registered students" value={num(t.students)} icon={<Users size={20} />} sub="all time" />
        <Stat label="New sign-ups" value={num(t.new7)} icon={<UserPlus size={20} />} sub={`last 7 days · ${t.newToday} today`} />
        <Stat label="Active today" value={num(t.activeToday)} icon={<Activity size={20} />} sub="opened the app or practised" />
        <Stat label="Active this week" value={num(t.active7)} icon={<CalendarCheck size={20} />} sub={`last 7 days · ${num(t.active30)} in 30 days`} />
        <Stat label="Mocks completed" value={num(t.mocks)} icon={<ClipboardCheck size={20} />} sub={`all time · ${num(t.mocks7)} this week`} />
        <Stat label="Study time logged" value={`${num(t.studyHours30)} h`} icon={<Clock size={20} />} sub="last 30 days" />
        <Stat label="Phone notifications on" value={num(t.pushOn)} icon={<BellRing size={20} />} sub="students with push enabled" />
        <Stat label="Active this month" value={num(t.active30)} icon={<Activity size={20} />} sub="last 30 days" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Active students per day" subtitle="Last 30 days">
          <div role="img" aria-label={`Bar chart of daily active students for the last 30 days. Today: ${t.activeToday}.`}>
            <DailyCountBars data={s.dailyActive} one="active student" many="active students" />
          </div>
          <Summary data={s.dailyActive} noun="activity" />
        </Card>
        <Card title="New sign-ups per day" subtitle="Last 30 days">
          <div role="img" aria-label={`Bar chart of new sign-ups per day for the last 30 days. Last 7 days: ${t.new7}.`}>
            <DailyCountBars data={s.dailySignups} one="new student" many="new students" />
          </div>
          <Summary data={s.dailySignups} noun="sign-ups" />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Most-chosen exams" subtitle="Students preparing for each exam">
          {s.exams.length === 0 ? (
            <p className="faint text-sm">No exam targets yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {s.exams.map((e) => (
                <li key={e.slug} className="text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 font-semibold">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: e.color ?? "var(--s1)" }} />
                      <span className="truncate">{e.name}</span>
                    </span>
                    <span className="muted tabular-nums">{e.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-[var(--grid)]">
                    <div className="h-1.5 rounded-full bg-[var(--s1)]" style={{ width: `${(e.count / examMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2" title={`Students (${num(s.students.length)}${t.students > s.students.length ? ` of ${num(t.students)}` : ""})`} subtitle="Newest first">
          {s.students.length === 0 ? (
            <p className="faint text-sm">Nobody has signed up yet. Share the app link to get your first students!</p>
          ) : (
            <div className="-mx-5 max-h-[440px] overflow-auto px-5">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="faint sticky top-0 bg-[var(--surface)] text-xs uppercase tracking-wide">
                  <tr>
                    <th className="py-2 pr-3 font-semibold">Student</th>
                    <th className="py-2 pr-3 font-semibold">Last active</th>
                    <th className="py-2 pr-3 text-right font-semibold">Mocks</th>
                    <th className="py-2 pr-3 font-semibold">Joined</th>
                    <th className="py-2 font-semibold">Exams</th>
                  </tr>
                </thead>
                <tbody>
                  {s.students.map((u) => (
                    <tr key={u.id} className="border-t align-top hairline">
                      <td className="py-2 pr-3">
                        <div className="font-semibold">
                          {u.name}
                          <span className="faint ml-1.5 text-[11px] font-normal">{u.category}</span>
                          {u.test && <span className="chip ml-1.5 border px-1.5 py-0 text-[10px] hairline">test</span>}
                        </div>
                        <div className="muted break-all text-xs">{u.email}</div>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3">{u.lastActive}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{u.mocks}</td>
                      <td className="muted whitespace-nowrap py-2 pr-3">{u.joined}</td>
                      <td className="muted py-2">{u.exams || "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="card mt-4 flex gap-3 p-4 text-sm">
        <Database size={18} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-300" />
        <div className="muted space-y-1">
          <p>
            <b className="text-[var(--ink)]">Where the data lives:</b> a SQLite database file kept in your Vercel Blob store <code>sarkari-sathi-data</code> (Vercel → Storage →
            sarkari-sathi-data → <code>db/sarkari-sathi.sqlite</code>). You can download it there and open it with the free “DB Browser for SQLite” app.
          </p>
          <p>
            “Active” means the student opened the app, started a mock, logged study time or signed up that day.
            {s.visitsTrackedSince ? ` App visits are counted from ${s.visitsTrackedSince}; earlier days count mocks, study time and sign-ups only.` : " App visits are counted from now on; until then mocks, study time and sign-ups are counted."}
          </p>
        </div>
      </div>
    </div>
  );
}
