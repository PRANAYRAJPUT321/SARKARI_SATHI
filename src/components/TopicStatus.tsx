"use client";

import { useState, useTransition } from "react";
import { setTopicStatusAction } from "@/app/actions";
import { STATUS_META } from "./ui";

export function TopicStatus({ topicId, initial }: { topicId: string; initial: string }) {
  const [s, setS] = useState(initial);
  const [, start] = useTransition();
  return (
    <select
      value={s}
      onChange={(e) => {
        setS(e.target.value);
        start(() => setTopicStatusAction(topicId, e.target.value));
      }}
      className="input py-2 text-sm"
      aria-label="Topic status"
    >
      {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
    </select>
  );
}
