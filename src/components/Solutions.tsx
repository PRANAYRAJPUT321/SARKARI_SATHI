"use client";

import clsx from "clsx";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toggleBookmarkAction } from "@/app/actions";
import type { Question } from "@/data/types";
import type { QResult } from "@/lib/grading";

const LETTERS = ["A", "B", "C", "D", "E"];

export function QuestionBody({ q, chosen }: { q: Question; chosen?: number | null }) {
  return (
    <div>
      {q.passage && (
        <details className="mb-3 rounded-xl bg-[var(--surface-2)] p-3 text-sm">
          <summary className="cursor-pointer text-xs font-bold uppercase">Passage / directions</summary>
          <div className="mt-2 whitespace-pre-wrap leading-relaxed">{q.passage}</div>
        </details>
      )}
      <div className="whitespace-pre-wrap text-sm font-medium leading-relaxed">{q.text}</div>
      {q.table && (
        <div className="mt-3 overflow-x-auto">
          <table className="text-xs">
            <thead><tr>{q.table.headers.map((h) => <th key={h} className="border bg-[var(--surface-2)] px-2 py-1 hairline">{h}</th>)}</tr></thead>
            <tbody className="tabular">{q.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border px-2 py-1 hairline">{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const isAns = i === q.answer, isMine = i === chosen;
          return (
            <div
              key={i}
              className={clsx(
                "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm hairline",
                isAns && "border-[var(--good)] bg-[color-mix(in_srgb,var(--good)_12%,transparent)]",
                isMine && !isAns && "border-[var(--critical)] bg-[color-mix(in_srgb,var(--critical)_12%,transparent)]",
              )}
            >
              <b className="shrink-0">{LETTERS[i]}.</b>
              <span className="flex-1">{o}</span>
              {isAns && <span className="text-xs font-bold" style={{ color: "var(--good-ink)" }}>✓ Correct</span>}
              {isMine && !isAns && <span className="text-xs font-bold text-red-600">Your answer</span>}
            </div>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl bg-brand-500/5 p-3 text-sm">
        <span className="font-bold text-brand-600 dark:text-brand-300">Solution: </span>
        {q.explanation}
      </div>
    </div>
  );
}

type Item = QResult & { sectionName: string; question: Question; chosen: number | null; topicName: string };
const FILTERS = [
  { id: "all", label: "All" },
  { id: "wrong", label: "Wrong" },
  { id: "skipped", label: "Skipped" },
  { id: "correct", label: "Correct" },
  { id: "slow", label: "Time sinks" },
] as const;

export function Solutions({ attemptId, items, bookmarked }: { attemptId: string; items: Item[]; bookmarked: string[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("wrong");
  const [marks, setMarks] = useState(new Set(bookmarked));
  const [, start] = useTransition();
  const shown = items.filter((q) =>
    filter === "all" ? true : filter === "slow" ? q.timeSec > q.idealSec * 1.5 : q.status === filter,
  );
  const count = (f: string) => items.filter((q) => (f === "all" ? true : f === "slow" ? q.timeSec > q.idealSec * 1.5 : q.status === f)).length;
  return (
    <section className="card">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold">📖 Solutions & explanations</h2>
          <p className="faint text-xs">Bookmark tricky questions to revise them later.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={clsx("chip border hairline", filter === f.id && "border-brand-600 bg-brand-600 text-white")}>
              {f.label} · {count(f.id)}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {shown.length === 0 && <p className="muted py-6 text-center text-sm">Nothing here 🎉</p>}
        {shown.map((q) => (
          <article key={q.qid} id={`q-${q.n}`} className="scroll-mt-24 rounded-2xl border p-4 hairline">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg bg-[var(--surface-2)] px-2 py-1 font-bold">Q{q.n}</span>
              <span className="faint">{q.sectionName} · {q.topicName}</span>
              <span className={clsx("chip !py-0.5", q.status === "correct" ? "text-[var(--good-ink)]" : q.status === "wrong" ? "text-red-600" : "faint")} style={{ background: "var(--surface-2)" }}>
                {q.status === "correct" ? "✓ Correct" : q.status === "wrong" ? `✗ Wrong (−${-q.marks})` : "– Skipped"}
              </span>
              <span className={clsx("chip !py-0.5", q.timeSec > q.idealSec * 1.5 ? "text-red-600" : "faint")} style={{ background: "var(--surface-2)" }}>
                ⏱ {q.timeSec}s / ideal {q.idealSec}s
              </span>
              <div className="flex-1" />
              <button
                onClick={() =>
                  start(async () => {
                    const on = await toggleBookmarkAction(attemptId, q.qid);
                    setMarks((m) => {
                      const n = new Set(m);
                      if (on) n.add(q.qid);
                      else n.delete(q.qid);
                      return n;
                    });
                  })
                }
                className="faint hover:text-brand-600"
                aria-label="Bookmark question"
              >
                {marks.has(q.qid) ? <BookmarkCheck size={18} className="text-brand-600" /> : <Bookmark size={18} />}
              </button>
            </div>
            <QuestionBody q={q.question} chosen={q.chosen} />
          </article>
        ))}
      </div>
    </section>
  );
}
