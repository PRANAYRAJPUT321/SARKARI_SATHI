"use client";

import clsx from "clsx";
import Link from "next/link";
import { useState, useTransition } from "react";
import { setTopicStatusAction } from "@/app/actions";
import type { Subject } from "@/data/types";
import { Progress, Ring, STATUS_META } from "./ui";

const ORDER = ["not_started", "learning", "revising", "mastered"] as const;
const WEIGHT: Record<string, number> = { not_started: 0, learning: 0.35, revising: 0.7, mastered: 1 };

type T = { id: string; name: string; subject: string; asked: string; relevant: boolean; accuracy: number | null };

export function SyllabusBoard({ subjects, topics, initial }: { subjects: Subject[]; topics: T[]; initial: Record<string, string> }) {
  const [status, setStatus] = useState<Record<string, string>>(initial);
  const [onlyRelevant, setOnlyRelevant] = useState(true);
  const [, start] = useTransition();
  const set = (id: string, s: string) => {
    setStatus((p) => ({ ...p, [id]: s }));
    start(() => setTopicStatusAction(id, s));
  };
  const visible = topics.filter((t) => !onlyRelevant || t.relevant);
  const overall = Math.round((visible.reduce((a, t) => a + WEIGHT[status[t.id] ?? "not_started"], 0) / Math.max(1, visible.length)) * 100);
  const counts = ORDER.map((o) => visible.filter((t) => (status[t.id] ?? "not_started") === o).length);

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
        <Ring value={overall} size={110} stroke={11} color="var(--good)">
          <div><div className="text-2xl font-extrabold">{overall}%</div><div className="faint text-[10px]">covered</div></div>
        </Ring>
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ORDER.map((o, i) => (
              <div key={o} className="rounded-xl bg-[var(--surface-2)] p-3">
                <div className="text-xl font-extrabold">{counts[i]}</div>
                <div className="faint text-xs">{STATUS_META[o].emoji} {STATUS_META[o].label}</div>
              </div>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyRelevant} onChange={(e) => setOnlyRelevant(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Show only topics asked in my target exams
          </label>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {subjects.map((s) => {
          const ts = visible.filter((t) => t.subject === s.id);
          if (!ts.length) return null;
          const pct = Math.round((ts.reduce((a, t) => a + WEIGHT[status[t.id] ?? "not_started"], 0) / ts.length) * 100);
          return (
            <section key={s.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-bold"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name}</h2>
                <span className="text-sm font-bold">{pct}%</span>
              </div>
              <Progress value={pct} color={s.color} className="mb-4" />
              <ul className="space-y-2">
                {ts.map((t) => {
                  const st = status[t.id] ?? "not_started";
                  return (
                    <li key={t.id} className="rounded-xl border p-3 hairline">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/syllabus/${t.id}`} className="text-sm font-semibold hover:text-brand-600">{t.name}</Link>
                          <div className="faint text-[11px]">{t.asked}{t.accuracy != null && ` · your accuracy ${t.accuracy}%`}</div>
                        </div>
                        <Link href={`/syllabus/${t.id}`} className="shrink-0 text-xs font-semibold text-brand-600">Notes →</Link>
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-1">
                        {ORDER.map((o) => (
                          <button
                            key={o}
                            onClick={() => set(t.id, o)}
                            className={clsx("rounded-lg px-1 py-1 text-[10px] font-semibold transition sm:text-[11px]", st === o ? "text-white" : "bg-[var(--surface-2)] faint hover:text-[var(--ink)]")}
                            style={st === o ? { background: STATUS_META[o].color } : undefined}
                          >
                            {STATUS_META[o].label}
                          </button>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
