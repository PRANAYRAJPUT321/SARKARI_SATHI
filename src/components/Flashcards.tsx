"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function Flashcards({ decks }: { decks: { deck: string; items: [string, string][] }[] }) {
  const [d, setD] = useState(0);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [order, setOrder] = useState<number[]>([]);
  const [known, setKnown] = useState<Record<string, boolean>>({});
  const deck = decks[d];
  useEffect(() => {
    setOrder(deck.items.map((_, k) => k));
    setI(0);
    setFlipped(false);
    try { setKnown(JSON.parse(localStorage.getItem(`fc:${deck.deck}`) || "{}")); } catch { setKnown({}); }
  }, [d, deck]);
  const card = deck.items[order[i] ?? 0];
  const knownCount = useMemo(() => Object.values(known).filter(Boolean).length, [known]);
  const mark = (v: boolean) => {
    const next = { ...known, [card[0]]: v };
    setKnown(next);
    try { localStorage.setItem(`fc:${deck.deck}`, JSON.stringify(next)); } catch {}
    setFlipped(false);
    setI((x) => (x + 1) % deck.items.length);
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
        {decks.map((x, k) => (
          <button key={x.deck} onClick={() => setD(k)} className={clsx("shrink-0 rounded-xl border px-3 py-2 text-left text-sm font-semibold hairline", k === d ? "bg-brand-600 text-white" : "bg-[var(--surface)] hover:bg-[var(--surface-2)]")}>
            {x.deck} <span className="opacity-60">· {x.items.length}</span>
          </button>
        ))}
      </div>
      <div className="mx-auto w-full max-w-xl">
        <div className="faint mb-2 flex justify-between text-xs"><span>Card {i + 1} / {deck.items.length}</span><span>✅ {knownCount} known</span></div>
        <button onClick={() => setFlipped((f) => !f)} className={clsx("flip block h-64 w-full", flipped && "flipped")} aria-label="Flip card">
          <div className="flip-inner relative h-full w-full">
            <div className="flip-face card absolute inset-0 grid place-items-center p-6 text-center">
              <div>
                <div className="faint mb-2 text-xs uppercase">{deck.deck}</div>
                <div className="text-2xl font-extrabold">{card?.[0]}</div>
                <div className="faint mt-4 text-xs">tap to reveal</div>
              </div>
            </div>
            <div className="flip-face flip-back absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-brand-600 to-violet-600 p-6 text-center text-white">
              <div className="text-2xl font-extrabold">{card?.[1]}</div>
            </div>
          </div>
        </button>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button className="btn-ghost p-2.5" onClick={() => { setFlipped(false); setI((x) => (x - 1 + deck.items.length) % deck.items.length); }} aria-label="Previous"><ChevronLeft size={18} /></button>
          <button className="btn-ghost flex-1 text-red-600" onClick={() => mark(false)}>Still learning</button>
          <button className="btn-primary flex-1" onClick={() => mark(true)}>I know this ✓</button>
          <button className="btn-ghost p-2.5" onClick={() => { setOrder((o) => [...o].sort(() => Math.random() - 0.5)); setI(0); setFlipped(false); }} aria-label="Shuffle"><Shuffle size={18} /></button>
          <button className="btn-ghost p-2.5" onClick={() => { setFlipped(false); setI((x) => (x + 1) % deck.items.length); }} aria-label="Next"><ChevronRight size={18} /></button>
        </div>
      </div>
    </div>
  );
}
