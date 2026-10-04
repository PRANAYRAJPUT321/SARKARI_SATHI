"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
import { startTestAction, type StartSpec } from "@/app/actions";

export function StartButton({ spec, children, className, random }: { spec: StartSpec; children: React.ReactNode; className?: string; random?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className={clsx(className ?? "btn-primary", "relative")}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const s = random && "n" in spec ? { ...spec, n: 31 + Math.floor(Math.random() * 100000) } : spec;
          await startTestAction(s as StartSpec);
        })
      }
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Preparing…
        </>
      ) : (
        children
      )}
    </button>
  );
}
