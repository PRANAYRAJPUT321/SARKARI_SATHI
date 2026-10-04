"use client";

import { useEffect } from "react";
import type { ShellNotification } from "./Shell";

/**
 * Browser notifications while the app is open:
 *  - new unread in-app notifications (once each)
 *  - planner tasks at their scheduled time today
 */
export function ReminderScheduler({ tasks, notifications }: { tasks: { id: string; title: string; at: string; done: boolean }[]; notifications: ShellNotification[] }) {
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    const fire = (title: string, body: string, tag: string) => {
      if (Notification.permission !== "granted") return;
      try {
        new Notification(title, { body, icon: "/icon.svg", tag });
      } catch {}
    };
    let shown: string[] = [];
    try { shown = JSON.parse(localStorage.getItem("notified") || "[]"); } catch {}
    const run = () => {
      for (const n of notifications.filter((x) => !x.read && !shown.includes(x.id)).slice(0, 3)) {
        fire(n.title, n.body, n.id);
        shown.push(n.id);
      }
      try { localStorage.setItem("notified", JSON.stringify(shown.slice(-200))); } catch {}
    };
    if (Notification.permission === "granted") run();
    else if (Notification.permission === "default") {
      const ask = () => Notification.requestPermission().then((p) => p === "granted" && run());
      window.addEventListener("click", ask, { once: true });
    }
    const timers = tasks
      .filter((t) => !t.done)
      .map((t) => {
        const ms = new Date(t.at).getTime() - Date.now();
        if (ms < 0 || ms > 24 * 3600 * 1000) return null;
        return setTimeout(() => fire("⏰ Time for: " + t.title, "Open Sarkari Sathi and get started. Small steps every day!", t.id), ms);
      });
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [tasks, notifications]);
  return null;
}
