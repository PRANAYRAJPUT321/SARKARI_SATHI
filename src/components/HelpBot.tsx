"use client";

import clsx from "clsx";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["How do I install the app?", "Turn on phone notifications", "Upcoming exam dates", "How does negative marking work?", "What does the test report show?"];

/** Minimal formatter: **bold**, "- " bullets, numbered lines and internal /links. */
function Formatted({ text }: { text: string }) {
  const inline = (s: string, key: string) =>
    s.split(/(\*\*[^*]+\*\*|\s\/[a-z][a-z0-9/-]*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <b key={key + i}>{part.slice(2, -2)}</b>;
      if (/^\s\/[a-z]/.test(part)) {
        const href = part.trim();
        return (
          <span key={key + i}>
            {" "}
            <Link href={href} className="font-semibold text-brand-600 underline dark:text-brand-300">{href}</Link>
          </span>
        );
      }
      return <span key={key + i}>{part}</span>;
    });
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((l, i) =>
        /^\s*[-•]\s+/.test(l) ? (
          <div key={i} className="flex gap-1.5"><span>•</span><span>{inline(l.replace(/^\s*[-•]\s+/, ""), `l${i}`)}</span></div>
        ) : /^\s*\d+[.)]\s+/.test(l) ? (
          <div key={i} className="flex gap-1.5"><span className="font-semibold">{l.match(/^\s*(\d+)/)![1]}.</span><span>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `l${i}`)}</span></div>
        ) : l.trim() ? (
          <p key={i}>{inline(l, `l${i}`)}</p>
        ) : null,
      )}
    </div>
  );
}

export function HelpBot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  if (pathname?.startsWith("/test/")) return null;
  const inApp = !["/", "/login", "/register"].includes(pathname ?? "");

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next }) });
      const data = (await res.json()) as { reply?: string };
      setMsgs([...next, { role: "assistant", content: data.reply ?? "Sorry, I couldn't answer that. Please try again." }]);
    } catch {
      setMsgs([...next, { role: "assistant", content: "I couldn't connect. Check your internet and try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "no-print fixed right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-brand-600 to-violet-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-brand-600/30 transition hover:scale-105",
          inApp ? "bottom-20 lg:bottom-6" : "bottom-5",
        )}
        aria-label={open ? "Close help assistant" : "Open help assistant"}
      >
        {open ? <X size={18} /> : <Bot size={18} />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask Sathi"}</span>
      </button>
      {open && (
        <div
          className={clsx(
            "no-print fixed right-4 z-40 flex w-[min(92vw,380px)] flex-col overflow-hidden rounded-3xl border bg-[var(--surface)] shadow-2xl hairline animate-fade-up",
            inApp ? "bottom-36 h-[min(68vh,560px)] lg:bottom-20" : "bottom-20 h-[min(70vh,560px)]",
          )}
          role="dialog"
          aria-label="Sathi help assistant"
        >
          <div className="flex items-center gap-3 bg-gradient-to-br from-brand-600 to-violet-600 px-4 py-3 text-white">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20"><Sparkles size={18} /></div>
            <div className="leading-tight">
              <div className="font-bold">Sathi · AI help</div>
              <div className="text-[11px] text-white/80">Questions about using Sarkari Sathi</div>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <div className="rounded-2xl rounded-tl-sm bg-[var(--surface-2)] p-3">
              Namaste! 🙏 I&apos;m Sathi. Ask me how to use any part of the app – installing it, notifications, mocks, reports, the planner, cut-offs or exam dates.
            </div>
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="chip border hairline hover:bg-[var(--surface-2)]">{s}</button>
                ))}
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={clsx("max-w-[88%] rounded-2xl p-3", m.role === "user" ? "ml-auto rounded-tr-sm bg-brand-600 text-white" : "rounded-tl-sm bg-[var(--surface-2)]")}>
                {m.role === "user" ? m.content : <Formatted text={m.content} />}
              </div>
            ))}
            {busy && (
              <div className="faint flex items-center gap-2 text-xs"><Loader2 size={14} className="animate-spin" /> Sathi is typing…</div>
            )}
            <div ref={end} />
          </div>
          <form
            className="flex items-center gap-2 border-t p-3 hairline"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="Ask about the app…" className="input py-2" aria-label="Your question" />
            <button className="btn-primary p-2.5" disabled={busy || !input.trim()} aria-label="Send"><Send size={16} /></button>
          </form>
          <div className="faint px-3 pb-2 text-center text-[10px]">AI answers can be imperfect – exam dates & cut-offs come only from official data.</div>
        </div>
      )}
    </>
  );
}
