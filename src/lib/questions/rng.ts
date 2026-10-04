/** Deterministic PRNG so a mock with the same seed always produces the same paper. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // keep seeds within a signed 32-bit INT so they fit the database column
  return (h >>> 0) % 2147483647;
}

export const int = (r: Rng, min: number, max: number) => Math.floor(r() * (max - min + 1)) + min;
export const pick = <T,>(r: Rng, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];
export function shuffle<T>(r: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function sample<T>(r: Rng, arr: readonly T[], n: number): T[] {
  return shuffle(r, arr).slice(0, n);
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function fmt(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString("en-IN");
  return round2(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * Build a shuffled option list (5 items) containing the correct answer.
 * Returns options and index of the correct one.
 */
export function withOptions(r: Rng, correct: string, distractors: string[], count = 5): { options: string[]; answer: number } {
  const uniq: string[] = [];
  for (const d of distractors) if (d !== correct && !uniq.includes(d)) uniq.push(d);
  const chosen = shuffle(r, uniq).slice(0, count - 1);
  const options = shuffle(r, [correct, ...chosen]);
  return { options, answer: options.indexOf(correct) };
}

/** Numeric distractors near the correct value. */
export function numericDistractors(r: Rng, correct: number, opts: { spread?: number; integer?: boolean; suffix?: string; prefix?: string } = {}): string[] {
  const { spread = 0.25, integer = Number.isInteger(correct), suffix = "", prefix = "" } = opts;
  const set = new Set<string>();
  const base = Math.abs(correct) || 10;
  let guard = 0;
  while (set.size < 6 && guard++ < 200) {
    const delta = (r() * 2 - 1) * spread * base;
    let v = correct + (Math.abs(delta) < (integer ? 1 : 0.01) ? (r() > 0.5 ? 1 : -1) * Math.max(1, Math.round(base * 0.08)) : delta);
    v = integer ? Math.round(v) : round2(v);
    if (v === correct || (correct > 0 && v <= 0)) continue;
    set.add(prefix + fmt(v) + suffix);
  }
  // small answers leave little room for random spread – fill with fixed offsets
  const step = integer ? Math.max(1, Math.round((base * spread) / 3)) : round2(Math.max(0.5, (base * spread) / 3));
  for (const k of shuffle(r, [1, -1, 2, -2, 3, -3, 4, 5, 6, 7])) {
    if (set.size >= 6) break;
    const v = integer ? correct + k * step : round2(correct + k * step);
    if (correct > 0 && v <= 0) continue;
    set.add(prefix + fmt(v) + suffix);
  }
  return [...set];
}

export function numQ(r: Rng, correct: number, opts: Parameters<typeof numericDistractors>[2] = {}) {
  const c = (opts.prefix ?? "") + fmt(correct) + (opts.suffix ?? "");
  return withOptions(r, c, numericDistractors(r, correct, opts));
}

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => (a / gcd(a, b)) * b;
