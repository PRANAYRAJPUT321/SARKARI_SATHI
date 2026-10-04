"use client";

import clsx from "clsx";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, Flag, LayoutGrid, Lock, Maximize, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { abandonTestAction, saveProgressAction, submitTestAction } from "@/app/actions";
import type { Response } from "@/lib/grading";
import type { PublicPaper } from "@/lib/questions";

type QState = { chosen: number | null; timeSec: number; marked: boolean; visited: boolean };
const LETTERS = ["A", "B", "C", "D", "E"];

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return (h ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function TestEngine({ attemptId, paper, saved, userName, negativeLabel }: { attemptId: string; paper: PublicPaper; saved: Response[]; userName: string; negativeLabel: string }) {
  const flat = useMemo(() => paper.sections.flatMap((s, si) => s.questions.map((q, qi) => ({ ...q, si, qi }))), [paper]);
  const sectionStart = useMemo(() => {
    const arr: number[] = [];
    let n = 0;
    for (const s of paper.sections) {
      arr.push(n);
      n += s.questions.length;
    }
    return arr;
  }, [paper]);
  const sectional = paper.sectionalTiming && paper.sections.every((s) => s.minutes);

  const [state, setState] = useState<Record<string, QState>>(() => {
    const init: Record<string, QState> = {};
    for (const q of flat) init[q.id] = { chosen: null, timeSec: 0, marked: false, visited: false };
    for (const r of saved) if (init[r.qid]) init[r.qid] = { chosen: r.chosen, timeSec: r.timeSec, marked: !!r.marked, visited: true };
    return init;
  });
  // newer progress kept in this browser (e.g. after a refresh between autosaves)
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(`attempt:${attemptId}`) || "null") as Record<string, QState> | null;
      if (local) setState((s) => {
        const n = { ...s };
        for (const [k, v] of Object.entries(local)) if (n[k] && v.timeSec >= n[k].timeSec) n[k] = v;
        return n;
      });
    } catch {}
  }, [attemptId]);
  const sectionUsed = useCallback((si: number) => paper.sections[si].questions.reduce((a, q) => a + (state[q.id]?.timeSec ?? 0), 0), [paper, state]);
  const firstOpenSection = () => {
    if (!sectional) return 0;
    for (let i = 0; i < paper.sections.length; i++) if (sectionUsed(i) < paper.sections[i].minutes! * 60 - 1) return i;
    return paper.sections.length - 1;
  };
  const [cur, setCur] = useState(() => sectionStart[firstOpenSection()] ?? 0);
  const [lockedUpTo, setLockedUpTo] = useState(() => (sectional ? firstOpenSection() : 0));
  const [showPalette, setShowPalette] = useState(false);
  const [confirm, setConfirm] = useState<null | "submit" | "section" | "quit">(null);
  const [submitting, startSubmit] = useTransition();
  const submitted = useRef(false);
  const curQ = flat[cur];
  const curSection = curQ.si;

  const totalUsed = flat.reduce((a, q) => a + (state[q.id]?.timeSec ?? 0), 0);
  const remaining = sectional ? paper.sections[curSection].minutes! * 60 - sectionUsed(curSection) : paper.durationSec - totalUsed;

  // mark visited
  useEffect(() => {
    setState((s) => (s[curQ.id].visited ? s : { ...s, [curQ.id]: { ...s[curQ.id], visited: true } }));
  }, [curQ.id]);

  // 1-second tick: time goes to the question on screen
  useEffect(() => {
    const id = setInterval(() => {
      if (submitted.current) return;
      setState((s) => ({ ...s, [curQ.id]: { ...s[curQ.id], timeSec: s[curQ.id].timeSec + 1, visited: true } }));
    }, 1000);
    return () => clearInterval(id);
  }, [curQ.id]);

  const responses = useCallback(
    (): Response[] => flat.map((q) => ({ qid: q.id, chosen: state[q.id].chosen, timeSec: state[q.id].timeSec, marked: state[q.id].marked })),
    [flat, state],
  );

  // local + server autosave
  useEffect(() => {
    try { localStorage.setItem(`attempt:${attemptId}`, JSON.stringify(state)); } catch {}
  }, [state, attemptId]);
  const latest = useRef(responses);
  latest.current = responses;
  useEffect(() => {
    const id = setInterval(() => !submitted.current && saveProgressAction(attemptId, latest.current()), 15000);
    return () => clearInterval(id);
  }, [attemptId]);

  const doSubmit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    const r = latest.current();
    try { localStorage.removeItem(`attempt:${attemptId}`); } catch {}
    startSubmit(() => submitTestAction(attemptId, r));
  }, [attemptId]);

  const nextSection = useCallback(() => {
    if (curSection >= paper.sections.length - 1) return doSubmit();
    const ns = curSection + 1;
    setLockedUpTo(ns);
    setCur(sectionStart[ns]);
  }, [curSection, paper.sections.length, sectionStart, doSubmit]);

  // time-up handling
  useEffect(() => {
    if (remaining > 0 || submitted.current) return;
    if (sectional && curSection < paper.sections.length - 1) nextSection();
    else doSubmit();
  }, [remaining, sectional, curSection, paper.sections.length, nextSection, doSubmit]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (!submitted.current) {
        saveProgressAction(attemptId, latest.current());
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [attemptId]);

  const canGo = (i: number) => i >= 0 && i < flat.length && (!sectional || flat[i].si === curSection);
  const go = (i: number) => {
    if (i < 0 || i >= flat.length) return;
    if (!canGo(i)) return;
    setCur(i);
    setShowPalette(false);
  };
  const choose = (opt: number) => setState((s) => ({ ...s, [curQ.id]: { ...s[curQ.id], chosen: opt } }));
  const clear = () => setState((s) => ({ ...s, [curQ.id]: { ...s[curQ.id], chosen: null } }));
  const markNext = () => {
    setState((s) => ({ ...s, [curQ.id]: { ...s[curQ.id], marked: !s[curQ.id].marked } }));
    if (canGo(cur + 1)) go(cur + 1);
  };
  const saveNext = () => {
    if (cur + 1 < flat.length && canGo(cur + 1)) go(cur + 1);
    else if (sectional && curSection < paper.sections.length - 1) setConfirm("section");
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (confirm || (e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = Number(e.key);
      if (n >= 1 && n <= curQ.options.length) choose(n - 1);
      else if (e.key === "ArrowRight" || e.key.toLowerCase() === "n") saveNext();
      else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "p") go(cur - 1);
      else if (e.key.toLowerCase() === "m") markNext();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const statusOf = (id: string) => {
    const s = state[id];
    if (s.marked && s.chosen != null) return "answered-marked";
    if (s.marked) return "marked";
    if (s.chosen != null) return "answered";
    if (s.visited) return "not-answered";
    return "not-visited";
  };
  const counts = (si?: number) => {
    const qs = si == null ? flat : flat.filter((q) => q.si === si);
    const c = { answered: 0, "not-answered": 0, marked: 0, "answered-marked": 0, "not-visited": 0 } as Record<string, number>;
    for (const q of qs) c[statusOf(q.id)]++;
    return c;
  };
  const PAL: Record<string, string> = {
    answered: "bg-[var(--good)] text-white border-transparent",
    "not-answered": "bg-[var(--critical)] text-white border-transparent",
    marked: "bg-violet-600 text-white border-transparent",
    "answered-marked": "bg-violet-600 text-white border-transparent ring-2 ring-[var(--good)] ring-offset-1 ring-offset-[var(--surface)]",
    "not-visited": "bg-[var(--surface-2)] border-[var(--border)]",
  };
  const lowTime = remaining <= 60;
  const qTime = state[curQ.id].timeSec;
  const ideal = sectional ? (paper.sections[curSection].minutes! * 60) / paper.sections[curSection].questions.length : paper.durationSec / flat.length;

  const palette = (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--surface-2)] p-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-bold text-white">{userName.slice(0, 1).toUpperCase()}</div>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold">{userName}</div>
          <div className="faint text-xs">Candidate</div>
        </div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-1.5 text-[11px]">
        {[
          ["answered", "Answered"],
          ["not-answered", "Not answered"],
          ["not-visited", "Not visited"],
          ["marked", "Marked for review"],
          ["answered-marked", "Answered & marked"],
        ].map(([k, l]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={clsx("grid h-6 w-6 place-items-center rounded-md border text-[10px] font-bold", PAL[k])}>{counts()[k]}</span>
            {l}
          </div>
        ))}
      </div>
      <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto pb-2">
        {paper.sections.map((s, si) => (
          <div key={si}>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold">
              {sectional && si !== curSection && <Lock size={12} className="faint" />}
              {s.name}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {s.questions.map((q, qi) => {
                const idx = sectionStart[si] + qi;
                return (
                  <button
                    key={q.id}
                    onClick={() => go(idx)}
                    disabled={!canGo(idx)}
                    className={clsx("h-8 rounded-md border text-xs font-bold transition disabled:opacity-40", PAL[statusOf(q.id)], idx === cur && "outline outline-2 outline-offset-1 outline-brand-500")}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setConfirm("submit")} className="btn-primary mt-2 w-full">Submit test</button>
    </div>
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--page)]">
      {/* Top bar */}
      <header className="flex items-center gap-3 border-b bg-[var(--surface)] px-3 py-2 hairline sm:px-5">
        <img src="/icon.svg" alt="" className="hidden h-8 w-8 sm:block" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold sm:text-base">{paper.title}</div>
          <div className="faint truncate text-[11px]">{negativeLabel} · keys: 1–{curQ.options.length} select, N next, P prev, M mark</div>
        </div>
        <div className={clsx("tabular flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-lg font-extrabold", lowTime ? "animate-pulse bg-red-500/15 text-red-600" : "bg-[var(--surface-2)]")}>
          <Clock size={16} /> {fmt(remaining)}
        </div>
        <button onClick={() => document.documentElement.requestFullscreen?.()} className="btn-ghost hidden p-2 md:inline-flex" aria-label="Full screen"><Maximize size={16} /></button>
        <button onClick={() => setShowPalette(true)} className="btn-ghost p-2 lg:hidden" aria-label="Question palette"><LayoutGrid size={16} /></button>
        <button onClick={() => setConfirm("quit")} className="btn-ghost p-2" aria-label="Exit test"><X size={16} /></button>
      </header>

      {/* Section tabs */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b bg-[var(--surface)] px-3 hairline sm:px-5">
        {paper.sections.map((s, si) => {
          const c = counts(si);
          const locked = sectional && si !== curSection;
          return (
            <button
              key={si}
              disabled={locked}
              onClick={() => go(sectionStart[si])}
              className={clsx("flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition", si === curSection ? "border-brand-600 text-brand-600 dark:text-brand-300" : "border-transparent faint", locked && "opacity-50")}
            >
              {locked && <Lock size={11} />}
              {s.name}
              <span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px]">{c.answered + c["answered-marked"]}/{s.questions.length}</span>
              {sectional && <span className="faint text-[10px]">{s.minutes}m</span>}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2 text-xs hairline sm:px-6">
            <div className="font-bold">Question {cur + 1} <span className="faint font-normal">of {flat.length}</span></div>
            <div className="flex items-center gap-3">
              <span className={clsx("tabular", qTime > ideal * 1.75 ? "font-bold text-red-600" : "faint")} title="Time spent on this question">
                ⏱ {qTime}s {qTime > ideal * 1.75 && "· consider moving on"}
              </span>
              <span className="faint">+{paper.sections[curSection].marksPer} / −{Math.round(paper.sections[curSection].negPer * 100) / 100}</span>
            </div>
          </div>
          <div className={clsx("min-h-0 flex-1 overflow-y-auto", curQ.passage && "lg:grid lg:grid-cols-2 lg:divide-x lg:divide-[var(--border)] lg:overflow-hidden")}>
            {curQ.passage && (
              <div className="whitespace-pre-wrap border-b p-4 text-sm leading-relaxed hairline sm:p-6 lg:overflow-y-auto lg:border-b-0">
                <div className="faint mb-2 text-xs font-bold uppercase">Directions / Passage</div>
                {curQ.passage}
              </div>
            )}
            <div className="p-4 sm:p-6 lg:overflow-y-auto">
              <div className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed">{curQ.text}</div>
              {curQ.table && (
                <div className="mt-4 overflow-x-auto">
                  <table className="text-sm">
                    <thead>
                      <tr>{curQ.table.headers.map((h) => <th key={h} className="border bg-[var(--surface-2)] px-3 py-1.5 text-left hairline">{h}</th>)}</tr>
                    </thead>
                    <tbody className="tabular">
                      {curQ.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className="border px-3 py-1.5 hairline">{c}</td>)}</tr>)}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-5 space-y-2.5">
                {curQ.options.map((o, i) => {
                  const sel = state[curQ.id].chosen === i;
                  return (
                    <button
                      key={i}
                      onClick={() => choose(i)}
                      className={clsx("flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left text-sm transition", sel ? "border-brand-600 bg-brand-600/10" : "border-[var(--border)] bg-[var(--surface)] hover:border-brand-300")}
                    >
                      <span className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold", sel ? "border-brand-600 bg-brand-600 text-white" : "border-[var(--axis)]")}>{LETTERS[i]}</span>
                      <span className="pt-0.5">{o}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <footer className="flex flex-wrap items-center gap-2 border-t bg-[var(--surface)] px-3 py-2.5 hairline sm:px-6">
            <button onClick={markNext} className="btn-ghost px-3 py-2 text-xs"><Flag size={14} /> {state[curQ.id].marked ? "Unmark" : "Mark for review"} & next</button>
            <button onClick={clear} className="btn-ghost px-3 py-2 text-xs">Clear response</button>
            <div className="flex-1" />
            <button onClick={() => go(cur - 1)} disabled={!canGo(cur - 1)} className="btn-ghost px-3 py-2 text-xs"><ChevronLeft size={14} /> Previous</button>
            {sectional && curSection < paper.sections.length - 1 && (
              <button onClick={() => setConfirm("section")} className="btn-ghost px-3 py-2 text-xs">Submit section</button>
            )}
            <button onClick={saveNext} className="btn-primary px-4 py-2 text-xs">Save & next <ChevronRight size={14} /></button>
          </footer>
        </main>
        <aside className="hidden w-80 shrink-0 border-l bg-[var(--surface)] p-4 hairline lg:block">{palette}</aside>
      </div>

      {showPalette && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPalette(false)} />
          <div className="absolute inset-y-0 right-0 w-[86vw] max-w-sm bg-[var(--surface)] p-4 shadow-xl animate-fade-up">{palette}</div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-6 shadow-2xl animate-fade-up">
            {confirm === "quit" ? (
              <>
                <h3 className="flex items-center gap-2 text-lg font-extrabold"><AlertTriangle className="text-amber-500" /> Leave the test?</h3>
                <p className="muted mt-2 text-sm">Your answers are saved – you can resume this test later from the Mocks page. Or discard it completely.</p>
                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setConfirm(null)}>Continue test</button>
                  <button className="btn-ghost text-red-600" onClick={() => { submitted.current = true; abandonTestAction(attemptId); }}>Discard</button>
                  <button className="btn-primary" onClick={() => { saveProgressAction(attemptId, latest.current()).then(() => (window.location.href = "/mocks")); }}>Save & exit</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-extrabold">{confirm === "section" ? `Submit ${paper.sections[curSection].name}?` : "Submit the test?"}</h3>
                <p className="muted mt-1 text-sm">{confirm === "section" ? "You will not be able to return to this section." : "You cannot change answers after submitting."}</p>
                <div className="mt-4 overflow-hidden rounded-xl border text-sm hairline">
                  <table className="w-full">
                    <thead className="bg-[var(--surface-2)] text-xs">
                      <tr><th className="px-3 py-2 text-left">Section</th><th className="px-2 py-2">Answered</th><th className="px-2 py-2">Marked</th><th className="px-2 py-2">Left</th></tr>
                    </thead>
                    <tbody className="tabular text-center">
                      {paper.sections.map((s, si) => {
                        if (confirm === "section" && si !== curSection) return null;
                        const c = counts(si);
                        return (
                          <tr key={si} className="border-t hairline">
                            <td className="px-3 py-2 text-left text-xs font-semibold">{s.name}</td>
                            <td>{c.answered + c["answered-marked"]}</td>
                            <td>{c.marked + c["answered-marked"]}</td>
                            <td>{c["not-answered"] + c["not-visited"] + c.marked}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="faint mt-3 text-xs">Time remaining: {fmt(remaining)}</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button className="btn-ghost" onClick={() => setConfirm(null)} disabled={submitting}>Go back</button>
                  <button
                    className="btn-primary"
                    disabled={submitting}
                    onClick={() => {
                      if (confirm === "section") { setConfirm(null); nextSection(); }
                      else doSubmit();
                    }}
                  >
                    {submitting ? "Generating report…" : confirm === "section" ? "Submit section" : "Submit test"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {submitting && !confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 text-white">
          <div className="text-center"><div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />Analysing your attempt…</div>
        </div>
      )}
    </div>
  );
}
