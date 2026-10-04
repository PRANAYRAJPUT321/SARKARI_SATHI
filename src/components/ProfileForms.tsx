"use client";

import { Star, Trash2 } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { deleteAccountDataAction, saveTargetsAction, updateProfileAction } from "@/app/actions";

export function ProfileForm({ user }: { user: { name: string; email: string; category: string; dailyGoal: number } }) {
  const [state, action, pending] = useActionState(updateProfileAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">Name</label>
        <input name="name" defaultValue={user.name} className="input" required />
      </div>
      <div>
        <label className="label">Email</label>
        <input value={user.email} disabled className="input opacity-60" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select name="category" defaultValue={user.category} className="input">
            <option value="GEN">General / UR</option><option value="OBC">OBC</option><option value="EWS">EWS</option><option value="SC">SC</option><option value="ST">ST</option>
          </select>
        </div>
        <div>
          <label className="label">Daily goal (hours)</label>
          <input name="dailyGoal" type="number" min={1} max={12} defaultValue={user.dailyGoal} className="input" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state && !state.error && <p className="text-sm" style={{ color: "var(--good-ink)" }}>Saved ✓</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
    </form>
  );
}

export function TargetsEditor({ exams, initial }: { exams: { slug: string; short: string; next: string | null }[]; initial: { slug: string; date: string | null; primary: boolean }[] }) {
  const [rows, setRows] = useState(initial);
  const [add, setAdd] = useState("");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const update = (i: number, patch: Partial<(typeof rows)[number]>) => {
    setSaved(false);
    setRows((r) => r.map((x, k) => (k === i ? { ...x, ...patch } : patch.primary ? { ...x, primary: false } : x)));
  };
  return (
    <div className="space-y-3">
      {rows.length === 0 && <p className="muted text-sm">No exams selected.</p>}
      {rows.map((r, i) => (
        <div key={r.slug} className="flex items-center gap-2 rounded-xl border p-2 hairline">
          <button onClick={() => update(i, { primary: true })} className={r.primary ? "text-saffron-500" : "faint"} title="Make primary" aria-label="Make primary">
            <Star size={18} fill={r.primary ? "currentColor" : "none"} />
          </button>
          <div className="w-28 shrink-0 text-sm font-bold">{exams.find((e) => e.slug === r.slug)?.short}</div>
          <input type="date" className="input py-1.5" value={r.date ?? ""} onChange={(e) => update(i, { date: e.target.value || null })} />
          <button onClick={() => { setSaved(false); setRows((x) => x.filter((_, k) => k !== i)); }} className="faint p-1 hover:text-red-600" aria-label="Remove"><Trash2 size={16} /></button>
        </div>
      ))}
      <div className="flex gap-2">
        <select className="input" value={add} onChange={(e) => setAdd(e.target.value)}>
          <option value="">+ Add an exam…</option>
          {exams.filter((e) => !rows.some((r) => r.slug === e.slug)).map((e) => <option key={e.slug} value={e.slug}>{e.short}</option>)}
        </select>
        <button
          className="btn-ghost"
          disabled={!add}
          onClick={() => {
            setRows((r) => [...r, { slug: add, date: exams.find((e) => e.slug === add)?.next ?? null, primary: r.length === 0 }]);
            setAdd("");
            setSaved(false);
          }}
        >
          Add
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending} onClick={() => start(async () => { await saveTargetsAction(rows); setSaved(true); })}>{pending ? "Saving…" : "Save exams"}</button>
        {saved && <span className="text-sm" style={{ color: "var(--good-ink)" }}>Saved ✓</span>}
      </div>
      <p className="faint text-xs">★ = primary exam (used for the daily challenge and dashboard focus). Pre-filled dates are tentative estimates.</p>
    </div>
  );
}

export function DangerZone() {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="muted text-sm">Delete your account and all preparation data (tests, plan, progress). This cannot be undone.</p>
      {confirm ? (
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
          <button className="btn bg-red-600 text-white hover:bg-red-700" disabled={pending} onClick={() => start(() => deleteAccountDataAction())}>Yes, delete everything</button>
        </div>
      ) : (
        <button className="btn-ghost text-red-600" onClick={() => setConfirm(true)}>Delete account</button>
      )}
    </div>
  );
}
