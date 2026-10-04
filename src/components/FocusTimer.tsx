"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logStudyAction } from "@/app/actions";

const PRESETS = [25, 45, 60];

/** Pomodoro-style focus timer. Completed (or stopped after 5+ min) sessions are logged as study time. */
export function FocusTimer() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState(25);
  const [left, setLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const startedWith = useRef(25 * 60);
  const endAt = useRef<number | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("focus") || "null");
      if (saved?.endAt && saved.endAt > Date.now()) {
        endAt.current = saved.endAt;
        startedWith.current = saved.total;
        setPreset(Math.round(saved.total / 60));
        setRunning(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round(((endAt.current ?? Date.now()) - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        setRunning(false);
        finish(startedWith.current);
      }
    }, 500);
    return () => clearInterval(id);
  }, [running]);

  function finish(sec: number) {
    try { localStorage.removeItem("focus"); } catch {}
    endAt.current = null;
    const minutes = Math.round(sec / 60);
    if (minutes >= 5) logStudyAction(minutes, "focus");
    if (typeof Notification !== "undefined" && Notification.permission === "granted")
      new Notification("Focus session complete 🎉", { body: `${minutes} minutes added to today's study time. Take a 5-minute break!`, icon: "/icon.svg" });
    setLeft(preset * 60);
  }

  function start() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission();
    endAt.current = Date.now() + left * 1000;
    startedWith.current = startedWith.current || left;
    try { localStorage.setItem("focus", JSON.stringify({ endAt: endAt.current, total: startedWith.current })); } catch {}
    setRunning(true);
  }
  function pause() {
    setRunning(false);
    try { localStorage.removeItem("focus"); } catch {}
  }
  function stop() {
    const spent = startedWith.current - left;
    setRunning(false);
    finish(spent);
    startedWith.current = preset * 60;
  }
  function choose(m: number) {
    if (running) return;
    setPreset(m);
    setLeft(m * 60);
    startedWith.current = m * 60;
  }

  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className={`btn-ghost px-3 py-2 ${running ? "!border-saffron-500 text-saffron-600" : ""}`} aria-label="Focus timer">
        <Timer size={17} />
        <span className="tabular hidden text-sm sm:inline">{running ? `${mm}:${ss}` : "Focus"}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border bg-[var(--surface)] p-4 shadow-2xl hairline animate-fade-up">
          <div className="text-sm font-bold">Focus session</div>
          <p className="faint mt-0.5 text-xs">Study without distraction. Time is added to your daily goal.</p>
          <div className="tabular my-4 text-center text-5xl font-extrabold">{mm}:{ss}</div>
          <div className="mb-3 flex justify-center gap-2">
            {PRESETS.map((m) => (
              <button key={m} onClick={() => choose(m)} className={`chip border hairline ${preset === m ? "bg-brand-600 text-white" : ""}`} disabled={running}>
                {m} min
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {running ? (
              <button onClick={pause} className="btn-ghost flex-1"><Pause size={16} /> Pause</button>
            ) : (
              <button onClick={start} className="btn-primary flex-1"><Play size={16} /> Start</button>
            )}
            <button onClick={stop} className="btn-ghost" title="Finish & log time"><RotateCcw size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
