"use client";

import clsx from "clsx";
import { Check, Trash2 } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { deleteTaskAction, toggleTaskAction } from "@/app/actions";
import { istTime } from "@/lib/fmt";

const TYPE: Record<string, { label: string; color: string }> = {
  study: { label: "Study", color: "var(--s1)" },
  mock: { label: "Mock", color: "var(--s2)" },
  revision: { label: "Revision", color: "var(--s3)" },
  exam: { label: "Exam", color: "var(--critical)" },
};

export interface TaskItem { id: string; title: string; type: string; done: boolean; at: string; examSlug: string | null }

export function TaskList({ tasks, compact, allowDelete }: { tasks: TaskItem[]; compact?: boolean; allowDelete?: boolean }) {
  const [, start] = useTransition();
  const [items, apply] = useOptimistic(tasks, (state, a: { id: string; op: "toggle" | "delete" }) =>
    a.op === "delete" ? state.filter((t) => t.id !== a.id) : state.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)),
  );
  return (
    <ul className="space-y-1.5">
      {items.map((t) => {
        const meta = TYPE[t.type] ?? TYPE.study;
        const time = istTime(t.at);
        return (
          <li key={t.id} className={clsx("group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-[var(--surface-2)]", t.done && "opacity-60")}>
            <button
              onClick={() => start(async () => { apply({ id: t.id, op: "toggle" }); await toggleTaskAction(t.id); })}
              className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition", t.done ? "border-[var(--good)] bg-[var(--good)] text-white" : "border-[var(--axis)]")}
              aria-label={t.done ? "Mark as not done" : "Mark as done"}
            >
              {t.done && <Check size={13} strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <div className={clsx("truncate text-sm font-medium", t.done && "line-through")}>{t.title}</div>
              {!compact && <div className="faint text-[11px]">{time}</div>}
            </div>
            {compact && <span className="faint tabular text-[11px]">{time}</span>}
            <span className="chip shrink-0 !px-2 !py-0.5 text-[10px]" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>{meta.label}</span>
            {t.type === "mock" && t.examSlug && !t.done && <Link href={`/mocks/${t.examSlug}`} className="text-[11px] font-semibold text-brand-600">Start</Link>}
            {allowDelete && (
              <button onClick={() => start(async () => { apply({ id: t.id, op: "delete" }); await deleteTaskAction(t.id); })} className="faint opacity-0 transition hover:text-red-500 group-hover:opacity-100" aria-label="Delete task">
                <Trash2 size={14} />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
