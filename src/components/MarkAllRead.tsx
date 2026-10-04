"use client";

import { useTransition } from "react";
import { markNotificationReadAction } from "@/app/actions";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <button className="btn-primary" disabled={pending} onClick={() => start(() => markNotificationReadAction())}>Mark all read</button>
    </div>
  );
}
