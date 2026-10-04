"use client";

import { Check, Plus } from "lucide-react";
import { useTransition } from "react";
import { addTargetAction } from "@/app/actions";

export function AddTargetButton({ slug, added }: { slug: string; added: boolean }) {
  const [pending, start] = useTransition();
  if (added) return <span className="btn-ghost cursor-default"><Check size={16} /> In my exams</span>;
  return (
    <button className="btn-accent" disabled={pending} onClick={() => start(() => addTargetAction(slug))}>
      <Plus size={16} /> {pending ? "Adding…" : "Add to my exams"}
    </button>
  );
}
