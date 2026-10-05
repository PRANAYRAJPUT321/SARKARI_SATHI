"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const axis = { stroke: "var(--axis)", tick: { fill: "var(--muted)", fontSize: 11 }, tickLine: false };

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: { value: number; payload: Record<string, unknown> }[]; label?: string; fmt: (p: Record<string, unknown>, v: number, label?: string) => React.ReactNode }) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border bg-[var(--surface)] px-3 py-2 text-xs shadow-lg hairline">{fmt(payload[0].payload, payload[0].value, label)}</div>;
}

export function ScoreTrend({ data, target }: { data: { i: number; title: string; pct: number }[]; target?: number }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="i" {...axis} />
        <YAxis domain={[(min: number) => Math.min(0, Math.floor(min / 10) * 10), 100]} allowDecimals={false} {...axis} tickFormatter={(v) => `${v}%`} />
        {target != null && <ReferenceLine y={target} stroke="var(--good)" strokeDasharray="4 4" label={{ value: `cut-off ≈ ${target}%`, fill: "var(--good-ink)", fontSize: 10, position: "insideTopRight" }} />}
        <Tooltip cursor={{ stroke: "var(--axis)" }} content={<Tip fmt={(p, v) => (<><div className="font-semibold">{String(p.title)}</div><div className="muted">Score: <b className="text-[var(--ink)]">{v}%</b></div></>)} />} />
        <Line type="monotone" dataKey="pct" stroke="var(--s1)" strokeWidth={2} dot={{ r: 4, fill: "var(--s1)", stroke: "var(--surface)", strokeWidth: 2 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBars({ data, goal }: { data: { label: string; minutes: number; day: string }[]; goal: number }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} tickFormatter={(v: number) => (v >= 60 ? `${Math.round((v / 60) * 10) / 10}h` : `${v}m`)} />
        <ReferenceLine y={goal} stroke="var(--s2)" strokeDasharray="4 4" label={{ value: "goal", fill: "var(--muted)", fontSize: 10, position: "insideTopLeft" }} />
        <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<Tip fmt={(p, v) => (<><div className="font-semibold">{String(p.day)}</div><div>{Math.floor(v / 60)}h {v % 60}m studied</div></>)} />} />
        <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
          {data.map((d) => <Cell key={d.day} fill={d.minutes >= goal ? "var(--good)" : "var(--s1)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** One bar per day for a simple count (admin usage page). */
export function DailyCountBars({ data, one, many }: { data: { day: string; label: string; count: number }[]; one: string; many: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid stroke="var(--grid)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={18} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<Tip fmt={(p, v) => (<><div className="font-semibold">{String(p.label)}</div><div>{v} {v === 1 ? one : many}</div></>)} />} />
        <Bar dataKey="count" fill="var(--s1)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SubjectRadar({ data }: { data: { subject: string; accuracy: number; coverage: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--grid)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--ink-2)", fontSize: 12, fontWeight: 600 }} />
        <Tooltip content={<Tip fmt={(p) => (<><div className="font-semibold">{String(p.subject)}</div><div>Accuracy: {String(p.accuracy)}%</div><div>Syllabus: {String(p.coverage)}%</div></>)} />} />
        <Radar dataKey="coverage" stroke="var(--s2)" fill="var(--s2)" fillOpacity={0.12} strokeWidth={2} />
        <Radar dataKey="accuracy" stroke="var(--s1)" fill="var(--s1)" fillOpacity={0.2} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

const STATUS_FILL: Record<string, string> = { correct: "var(--good)", wrong: "var(--critical)", skipped: "var(--axis)" };

/** Per-question time chart for the result report. */
export function QuestionTimeChart({ data }: { data: { n: number; timeSec: number; idealSec: number; status: string; topic: string }[] }) {
  const ideal = data.length ? Math.round(data.reduce((a, d) => a + d.idealSec, 0) / data.length) : 0;
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: Math.max(520, data.length * 9) }}>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }} barCategoryGap={1}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis dataKey="n" {...axis} interval={data.length > 60 ? 9 : data.length > 30 ? 4 : 0} />
            <YAxis {...axis} tickFormatter={(v) => `${v}s`} />
            <ReferenceLine y={ideal} stroke="var(--s2)" strokeDasharray="4 4" label={{ value: `ideal ~${ideal}s`, fill: "var(--muted)", fontSize: 10, position: "insideTopRight" }} />
            <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<Tip fmt={(p) => (<><div className="font-semibold">Q{String(p.n)} · {String(p.topic)}</div><div>Time: <b>{String(p.timeSec)}s</b> (ideal {String(p.idealSec)}s)</div><div className="capitalize">{String(p.status)}</div></>)} />} />
            <Bar dataKey="timeSec" radius={[3, 3, 0, 0]}>
              {data.map((d) => <Cell key={d.n} fill={STATUS_FILL[d.status]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SectionTimeBars({ data }: { data: { name: string; used: number; allowed: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 48)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke="var(--grid)" horizontal={false} />
        <XAxis type="number" {...axis} tickFormatter={(v) => `${Math.round(v / 60)}m`} />
        <YAxis type="category" dataKey="name" {...axis} width={110} tick={{ fill: "var(--ink-2)", fontSize: 11 }} />
        <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<Tip fmt={(p) => (<><div className="font-semibold">{String(p.name)}</div><div>Used {Math.round(Number(p.used) / 60)} of {Math.round(Number(p.allowed) / 60)} min</div></>)} />} />
        <Bar dataKey="allowed" fill="var(--grid)" radius={[0, 4, 4, 0]} />
        <Bar dataKey="used" fill="var(--s1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
