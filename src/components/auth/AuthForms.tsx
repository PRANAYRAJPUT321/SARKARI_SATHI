"use client";

import clsx from "clsx";
import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required className="input" placeholder="••••••••" autoComplete="current-password" />
      </div>
      {state?.error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Logging in…" : "Log in"}</button>
      <p className="muted text-center text-sm">
        New here? <Link href="/register" className="font-semibold text-brand-600">Create a free account</Link>
      </p>
    </form>
  );
}

export function RegisterForm({ exams }: { exams: { slug: string; short: string; category: string }[] }) {
  const [state, action, pending] = useActionState(registerAction, undefined);
  const [picked, setPicked] = useState<string[]>(["sbi-po"]);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const cats = Array.from(new Set(exams.map((e) => e.category)));
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">Your name</label>
          <input id="name" name="name" required className="input" placeholder="e.g. Pranay" autoComplete="name" />
          <p className="faint mt-1 text-xs">The app will greet and motivate you by name.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required minLength={6} className="input" placeholder="min 6 characters" autoComplete="new-password" />
        </div>
        <div>
          <label className="label" htmlFor="category">Category (for cut-off comparison)</label>
          <select id="category" name="category" className="input" defaultValue="GEN">
            <option value="GEN">General / UR</option>
            <option value="OBC">OBC (NCL)</option>
            <option value="EWS">EWS</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dailyGoal">Daily study goal (hours)</label>
          <input id="dailyGoal" name="dailyGoal" type="number" min={1} max={12} defaultValue={4} className="input" />
        </div>
      </div>
      <div>
        <div className="label">Target exams (pick one or more – first is primary)</div>
        <div className="space-y-2">
          {cats.map((c) => (
            <div key={c}>
              <div className="faint mb-1 text-[11px] font-semibold uppercase">{c}</div>
              <div className="flex flex-wrap gap-1.5">
                {exams.filter((e) => e.category === c).map((e) => (
                  <button
                    type="button"
                    key={e.slug}
                    onClick={() => toggle(e.slug)}
                    className={clsx("chip border transition hairline", picked.includes(e.slug) ? "border-brand-600 bg-brand-600 text-white" : "hover:bg-[var(--surface-2)]")}
                  >
                    {picked[0] === e.slug && "★ "}
                    {e.short}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {picked.map((p) => <input key={p} type="hidden" name="exams" value={p} />)}
      </div>
      {state?.error && <p className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600">{state.error}</p>}
      <button className="btn-primary w-full py-3" disabled={pending}>{pending ? "Creating your account…" : "Start preparing – it's free"}</button>
      <p className="muted text-center text-sm">
        Already have an account? <Link href="/login" className="font-semibold text-brand-600">Log in</Link>
      </p>
    </form>
  );
}
