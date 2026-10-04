"use client";

import clsx from "clsx";
import { BellRing, CheckCircle2, Smartphone, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { updatePushPrefsAction } from "@/app/actions";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function b64ToBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function useDevicePush(vapidKey: string) {
  const [state, setState] = useState<State>("loading");
  useEffect(() => {
    (async () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) return setState(ios && !standalone ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, [vapidKey]);

  const enable = async () => {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
    const reg = await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(vapidKey) }));
    const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
    if (!res.ok) throw new Error("subscribe failed");
    setState("on");
    await fetch("/api/push/test", { method: "POST" }).catch(() => {});
  };
  const disable = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
  };
  return { state, enable, disable };
}

/** Full settings card: device toggle + morning/task preferences + test button. */
export function PushSettings({ vapidKey, morningPush, taskPush }: { vapidKey: string; morningPush: boolean; taskPush: boolean }) {
  const { state, enable, disable } = useDevicePush(vapidKey);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [prefs, setPrefs] = useState({ morningPush, taskPush });
  const [, start] = useTransition();
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const toggle = (k: "morningPush" | "taskPush") => {
    const next = { ...prefs, [k]: !prefs[k] };
    setPrefs(next);
    start(() => updatePushPrefsAction({ [k]: next[k] }));
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="mt-0.5 shrink-0 text-brand-600" size={20} />
          <div>
            <div className="font-semibold">Push notifications on this device</div>
            <div className="muted text-xs">
              {state === "on" && "On – you'll get notifications even when the app is closed."}
              {state === "off" && "Off – turn on to get your morning plan and task reminders."}
              {state === "denied" && "Blocked in browser settings. Allow notifications for this site, then reload."}
              {state === "unsupported" && "This browser doesn't support push notifications. Try Chrome, Edge, Firefox or Safari 16.4+."}
              {state === "ios-install" && "On iPhone/iPad, first install the app (Share → Add to Home Screen), open it from the home screen, then turn this on."}
              {state === "loading" && "Checking…"}
            </div>
          </div>
        </div>
        {state === "on" ? (
          <div className="flex gap-2">
            <button className="btn-ghost px-3 py-2 text-xs" disabled={busy} onClick={() => run(async () => { const r = await fetch("/api/push/test", { method: "POST" }); setMsg(r.ok ? "Test notification sent ✅" : "Couldn't send a test notification."); })}>Send test</button>
            <button className="btn-ghost px-3 py-2 text-xs text-red-600" disabled={busy} onClick={() => run(disable)}>Turn off</button>
          </div>
        ) : state === "off" ? (
          <button className="btn-primary" disabled={busy} onClick={() => run(enable)}><BellRing size={16} /> {busy ? "Enabling…" : "Turn on"}</button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { k: "morningPush" as const, t: "☀️ Early-morning plan (~6 AM)", d: "Today's tasks, days left for your exam and a motivational line." },
          { k: "taskPush" as const, t: "⏰ Task reminders", d: "A notification when each planned study session or mock is about to start." },
        ].map((o) => (
          <button key={o.k} onClick={() => toggle(o.k)} className={clsx("flex items-start gap-3 rounded-xl border p-3 text-left transition hairline", prefs[o.k] ? "border-brand-500 bg-brand-500/5" : "")}>
            <span className={clsx("mt-0.5 grid h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition", prefs[o.k] ? "bg-brand-600" : "bg-[var(--axis)]")}>
              <span className={clsx("h-4 w-4 rounded-full bg-white transition", prefs[o.k] && "translate-x-4")} />
            </span>
            <span>
              <span className="block text-sm font-semibold">{o.t}</span>
              <span className="muted block text-xs">{o.d}</span>
            </span>
          </button>
        ))}
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <p className="faint text-xs">Turn this on separately on each phone/laptop you use. Morning plans are sent once a day around 6–7 AM IST.</p>
    </div>
  );
}

/** Compact, dismissible prompt for the dashboard. Hidden once enabled or dismissed. */
export function PushPrompt({ vapidKey }: { vapidKey: string }) {
  const { state, enable } = useDevicePush(vapidKey);
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setHidden(localStorage.getItem("push-prompt-dismissed") === "1");
    } catch {
      setHidden(false);
    }
  }, []);
  if (hidden || !(state === "off" || state === "ios-install")) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4">
      <BellRing className="shrink-0 text-brand-600" />
      <div className="min-w-0 flex-1 text-sm">
        <b>Get reminders on your phone</b>
        <div className="muted text-xs">{state === "ios-install" ? "Install the app on your iPhone (Share → Add to Home Screen) to receive notifications." : "Early-morning plan at ~6 AM + a ping when each planned task starts."}</div>
      </div>
      {state === "off" && (
        <button className="btn-primary px-3 py-2 text-xs" disabled={busy} onClick={async () => { setBusy(true); try { await enable(); } finally { setBusy(false); } }}>
          <CheckCircle2 size={14} /> {busy ? "Enabling…" : "Enable notifications"}
        </button>
      )}
      <button className="faint p-1" aria-label="Dismiss" onClick={() => { setHidden(true); try { localStorage.setItem("push-prompt-dismissed", "1"); } catch {} }}><X size={16} /></button>
    </div>
  );
}
