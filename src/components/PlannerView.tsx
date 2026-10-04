"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Plus, Wand2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { addTaskAction, autoPlanAction } from "@/app/actions";
import { longDay, monthLabel } from "@/lib/fmt";
import { TaskList } from "./TaskList";

type Task = { id: string; title: string; type: string; done: boolean; at: string; day: string; examSlug: string | null };
const DOT: Record<string, string> = { study: "var(--s1)", mock: "var(--s2)", revision: "var(--s3)", exam: "var(--critical)" };
const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(m: string, d: number) {
  const [y, mo] = m.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1 + d, 1));
  return dt.toISOString().slice(0, 7);
}

export function PlannerView({ month, today, tasks, exams, targets }: { month: string; today: string; tasks: Task[]; exams: { slug: string; short: string; next: string | null }[]; targets: { slug: string; date: string | null; primary: boolean }[] }) {
  const [sel, setSel] = useState(today.startsWith(month) ? today : `${month}-01`);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const primary = targets.find((t) => t.primary) ?? targets[0];
  const [plan, setPlan] = useState({ examSlug: primary?.slug ?? exams[0].slug, examDate: primary?.date ?? "", mocksPerDay: 2, studyHours: 4, replace: true });
  const [form, setForm] = useState({ title: "", type: "study", time: "18:00", examSlug: primary?.slug ?? "" });

  const days = useMemo(() => {
    const [y, mo] = month.split("-").map(Number);
    const first = new Date(Date.UTC(y, mo - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(Date.UTC(y, mo - 1, 1 - offset + i)).toISOString().slice(0, 10));
  }, [month]);
  const byDay = useMemo(() => {
    const m = new Map<string, Task[]>();
    for (const t of tasks) m.set(t.day, [...(m.get(t.day) ?? []), t]);
    return m;
  }, [tasks]);
  const examDays = new Map(targets.filter((t) => t.date).map((t) => [t.date!, exams.find((e) => e.slug === t.slug)?.short]));
  const selTasks = byDay.get(sel) ?? [];
  const label = monthLabel(month);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <Link href={`/planner?m=${shiftMonth(month, -1)}`} className="btn-ghost p-2" aria-label="Previous month"><ChevronLeft size={18} /></Link>
            <h2 className="text-lg font-extrabold">{label}</h2>
            <Link href={`/planner?m=${shiftMonth(month, 1)}`} className="btn-ghost p-2" aria-label="Next month"><ChevronRight size={18} /></Link>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold faint">{WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d) => {
              const ts = byDay.get(d) ?? [];
              const done = ts.filter((t) => t.done).length;
              const inMonth = d.startsWith(month);
              const exam = examDays.get(d);
              return (
                <button
                  key={d}
                  onClick={() => setSel(d)}
                  className={clsx(
                    "relative flex min-h-[64px] flex-col items-start rounded-xl border p-1.5 text-left transition sm:min-h-[84px]",
                    sel === d ? "border-brand-600 ring-2 ring-brand-500/30" : "hairline hover:bg-[var(--surface-2)]",
                    !inMonth && "opacity-40",
                    exam && "bg-red-500/10",
                  )}
                >
                  <span className={clsx("grid h-6 w-6 place-items-center rounded-full text-xs font-bold", d === today && "bg-brand-600 text-white")}>{Number(d.slice(8))}</span>
                  {exam && <span className="mt-0.5 truncate text-[9px] font-bold text-red-600 sm:text-[10px]">🎯 {exam}</span>}
                  <div className="mt-auto flex flex-wrap gap-0.5">
                    {ts.slice(0, 6).map((t) => <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ background: DOT[t.type] ?? DOT.study, opacity: t.done ? 0.35 : 1 }} />)}
                  </div>
                  {ts.length > 0 && <span className="faint absolute right-1.5 top-1.5 text-[9px]">{done}/{ts.length}</span>}
                </button>
              );
            })}
          </div>
          <div className="faint mt-3 flex flex-wrap gap-3 text-[11px]">
            {Object.entries(DOT).map(([k, c]) => <span key={k} className="flex items-center gap-1 capitalize"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{k}</span>)}
          </div>
        </section>

        <section className="card">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold"><Wand2 size={18} /> Auto-generate my study plan</h2>
          <p className="faint mb-4 text-xs">Creates daily topic sessions (weakest & highest-weight topics first), {plan.mocksPerDay} mock{plan.mocksPerDay > 1 ? "s" : ""}/day (more in the last 10 days) and Sunday revision, up to 90 days ahead.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="label">Exam</label>
              <select className="input" value={plan.examSlug} onChange={(e) => setPlan({ ...plan, examSlug: e.target.value, examDate: targets.find((t) => t.slug === e.target.value)?.date ?? exams.find((x) => x.slug === e.target.value)?.next ?? "" })}>
                {exams.map((e) => <option key={e.slug} value={e.slug}>{e.short}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Exam date</label>
              <input type="date" className="input" value={plan.examDate} min={today} onChange={(e) => setPlan({ ...plan, examDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Mocks / day</label>
              <select className="input" value={plan.mocksPerDay} onChange={(e) => setPlan({ ...plan, mocksPerDay: Number(e.target.value) })}>
                {[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Study hrs / day</label>
              <input type="number" min={1} max={12} className="input" value={plan.studyHours} onChange={(e) => setPlan({ ...plan, studyHours: Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-brand-600" checked={plan.replace} onChange={(e) => setPlan({ ...plan, replace: e.target.checked })} /> Replace my existing future plan for this exam</label>
            <button
              className="btn-accent"
              disabled={pending || !plan.examDate}
              onClick={() =>
                start(async () => {
                  const r = await autoPlanAction(plan);
                  setMsg(r && "error" in r ? r.error! : `✅ ${r?.count} tasks created. Your reminders are set!`);
                })
              }
            >
              <Wand2 size={16} /> {pending ? "Planning…" : "Generate plan"}
            </button>
          </div>
          {msg && <p className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">{msg}</p>}
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card">
          <h2 className="text-base font-bold">{longDay(sel)}</h2>
          <p className="faint mb-3 text-xs">{selTasks.length ? `${selTasks.filter((t) => t.done).length} of ${selTasks.length} done` : "No tasks for this day"}</p>
          {selTasks.length > 0 && <TaskList tasks={selTasks} allowDelete />}
          <form
            className="mt-4 space-y-2 border-t pt-4 hairline"
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.title.trim()) return;
              start(async () => {
                await addTaskAction({ date: sel, time: form.time, title: form.title, type: form.type, examSlug: form.examSlug || undefined });
                setForm({ ...form, title: "" });
              });
            }}
          >
            <div className="label">Add a task</div>
            <input className="input" placeholder="e.g. Revise Profit & Loss formulas" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <select className="input px-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="study">Study</option><option value="mock">Mock</option><option value="revision">Revision</option><option value="exam">Exam</option>
              </select>
              <input type="time" className="input px-2" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              <select className="input px-2" value={form.examSlug} onChange={(e) => setForm({ ...form, examSlug: e.target.value })}>
                <option value="">No exam</option>
                {exams.map((e) => <option key={e.slug} value={e.slug}>{e.short}</option>)}
              </select>
            </div>
            <button className="btn-primary w-full" disabled={pending}><Plus size={16} /> Add task</button>
          </form>
        </section>
        <section className="card text-sm">
          <h3 className="mb-2 font-bold">🧠 How toppers plan</h3>
          <ul className="muted space-y-1.5">
            <li>• Mornings for new concepts, evenings for mocks.</li>
            <li>• Analyse every mock for as long as you took it.</li>
            <li>• Last 15 days: 2–3 mocks daily, no new topics.</li>
            <li>• One rest-cum-revision day every week.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
