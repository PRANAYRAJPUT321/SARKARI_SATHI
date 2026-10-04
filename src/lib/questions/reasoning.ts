import { fmt, int, numQ, pick, sample, shuffle, withOptions, type Rng } from "./rng";
import type { Gen, QBody } from "./types";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const L = (n: number) => ALPHA[(((n - 1) % 26) + 26) % 26];
const pos = (c: string) => ALPHA.indexOf(c) + 1;
const NAMES = ["Aman", "Bhavna", "Chirag", "Deepa", "Eshan", "Farhan", "Gita", "Harsh", "Isha", "Jatin", "Kavya", "Lalit", "Meera", "Nikhil", "Ojas", "Pooja", "Rohit", "Sneha", "Tarun", "Usha", "Varun", "Yash"];

// ───────────── Series ─────────────
const series: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const s = int(r, 1, 8), k = int(r, 2, 4);
    const terms = Array.from({ length: 5 }, (_, i) => L(s + i * k));
    const ans = L(s + 5 * k);
    return {
      text: `Find the next term in the series: ${terms.join(", ")}, ?`,
      ...withOptions(r, ans, [L(s + 5 * k + 1), L(s + 5 * k - 1), L(s + 4 * k + 2), L(s + 6 * k), L(s + 5 * k + 2)]),
      explanation: `Each letter moves +${k} positions. ${terms[4]} + ${k} = ${ans}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const s = int(r, 1, 6);
    const term = (i: number) => L(s + i) + L(27 - s - i);
    const ans = term(4);
    return {
      text: `Find the next term: ${[0, 1, 2, 3].map(term).join(", ")}, ?`,
      ...withOptions(r, ans, [L(s + 4) + L(26 - s - 4), L(s + 5) + L(27 - s - 4), L(s + 4) + L(28 - s - 4), L(s + 3) + L(27 - s - 3)]),
      explanation: `First letter moves forward by 1, second letter moves backward by 1 (opposite pairs). Next = ${ans}.`,
      difficulty: 1,
    };
  }
  const s = int(r, 1, 10), k = int(r, 1, 3);
  const grp = (i: number) => L(s + i) + L(s + i + k) + L(s + i + 2 * k);
  const ans = grp(4);
  return {
    text: `Find the next term: ${[0, 1, 2, 3].map(grp).join(", ")}, ?`,
    ...withOptions(r, ans, [grp(5), L(s + 4) + L(s + 4 + k + 1) + L(s + 4 + 2 * k), grp(3), L(s + 5) + L(s + 4 + k) + L(s + 4 + 2 * k)]),
    explanation: `Each group shifts by one letter; letters inside a group are ${k} apart. Next = ${ans}.`,
    difficulty: 1,
  };
};

// ───────────── Coding-decoding ─────────────
const WORDS = ["CAT", "DOG", "MILK", "BANK", "TRAIN", "PAPER", "MONEY", "NOTE", "PLANT", "RIVER", "STONE", "LIGHT", "WATER", "CHAIR", "FRUIT", "SMILE"];
const shiftWord = (w: string, k: number) => w.split("").map((c) => L(pos(c) + k)).join("");
const opposite = (w: string) => w.split("").map((c) => L(27 - pos(c))).join("");
const coding: Gen = (r) => {
  const [w1, w2] = sample(r, WORDS, 2);
  const v = int(r, 0, 2);
  if (v === 0) {
    const k = pick(r, [1, 2, 3, -1, -2]);
    const ans = shiftWord(w2, k);
    return {
      text: `In a certain code language, ${w1} is written as ${shiftWord(w1, k)}. How will ${w2} be written in that code?`,
      ...withOptions(r, ans, [shiftWord(w2, k + 1), shiftWord(w2, -k), ans.split("").reverse().join(""), shiftWord(w2, k * 2), shiftWord(w2, k - 1)].filter((x) => x !== w2)),
      explanation: `Each letter is shifted by ${k > 0 ? "+" : ""}${k}. ${w2} → ${ans}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const ans = shiftWord(w2, 1).split("").reverse().join("");
    return {
      text: `In a certain code, ${w1} is written as ${shiftWord(w1, 1).split("").reverse().join("")}. How is ${w2} written in that code?`,
      ...withOptions(r, ans, [shiftWord(w2, 1), shiftWord(w2, -1).split("").reverse().join(""), w2.split("").reverse().join(""), shiftWord(w2, 2).split("").reverse().join("")]),
      explanation: `Each letter is moved +1 and then the word is reversed. ${w2} → ${ans}.`,
      difficulty: 2,
    };
  }
  const ans = opposite(w2);
  return {
    text: `If ${w1} is coded as ${opposite(w1)}, then how will ${w2} be coded?`,
    ...withOptions(r, ans, [shiftWord(w2, 1), ans.split("").reverse().join(""), shiftWord(ans, 1), shiftWord(w2, -1)]),
    explanation: `Each letter is replaced by its opposite letter (A↔Z, B↔Y…; positions add to 27). ${w2} → ${ans}.`,
    difficulty: 2,
  };
};

// ───────────── Blood relations ─────────────
const BLOOD: { t: string; a: string; d: string[] }[] = [
  { t: "Pointing to a man, {A} said, \"He is the son of my grandfather's only son.\" How is the man related to {A}?", a: "Brother", d: ["Cousin", "Uncle", "Father", "Nephew"] },
  { t: "Pointing to a woman, {A} said, \"She is the daughter of the only child of my mother.\" How is the woman related to {A}?", a: "Daughter", d: ["Sister", "Niece", "Mother", "Cousin"] },
  { t: "{A} is the brother of {B}. {B} is the sister of {C}. {C} is the father of {D}. How is {A} related to {D}?", a: "Uncle", d: ["Father", "Brother", "Cousin", "Grandfather"] },
  { t: "{A}'s mother is the only daughter of {B}'s father. How is {B} related to {A}? ({B} is male)", a: "Maternal uncle", d: ["Father", "Brother", "Grandfather", "Cousin"] },
  { t: "Introducing a man, a woman said, \"His wife is the only daughter of my father.\" How is the man related to the woman?", a: "Husband", d: ["Brother", "Father-in-law", "Son", "Brother-in-law"] },
  { t: "{A} is the father of {B}. {C} is the mother of {A}. How is {C} related to {B}?", a: "Grandmother", d: ["Mother", "Aunt", "Sister", "Daughter"] },
  { t: "{A} is the husband of {B}. {C} is the daughter of {B}. {D} is the brother of {C}. How is {D} related to {A}?", a: "Son", d: ["Nephew", "Brother", "Son-in-law", "Grandson"] },
  { t: "{A}'s father's sister's husband is {B}. How is {B} related to {A}?", a: "Uncle (Phupha)", d: ["Brother-in-law", "Father", "Grandfather", "Cousin"] },
  { t: "Pointing to a photograph, {A} said, \"Her mother is the only daughter of my mother.\" How is {A} related to the girl in the photograph? ({A} is female)", a: "Mother", d: ["Sister", "Aunt", "Grandmother", "Cousin"] },
  { t: "{A} and {B} are brothers. {C} is the father of {A}. {D} is the brother of {C}. How is {B} related to {D}?", a: "Nephew", d: ["Brother", "Son", "Cousin", "Uncle"] },
];
const blood: Gen = (r) => {
  const q = pick(r, BLOOD);
  const [A, B, C, D] = sample(r, NAMES, 4);
  const text = q.t.replaceAll("{A}", A).replaceAll("{B}", B).replaceAll("{C}", C).replaceAll("{D}", D);
  return { text, ...withOptions(r, q.a, q.d), explanation: `Draw a family tree step by step from the last clue: the relation is "${q.a}".`, difficulty: 2 };
};

// ───────────── Direction sense ─────────────
const DIRS = ["North", "East", "South", "West"];
const direction: Gen = (r) => {
  const triple = pick(r, [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20]]);
  const [dx, dy, dist] = r() > 0.5 ? triple : [triple[1], triple[0], triple[2]];
  const name = pick(r, NAMES);
  const y2 = int(r, 2, 9);
  const y1 = dy + y2;
  const x1 = int(r, 1, dx - 1 > 0 ? dx - 1 : 1), x2 = dx - x1;
  const text = `${name} walks ${y1} km towards North, turns right and walks ${x1} km, then turns right and walks ${y2} km, then turns left and walks ${x2} km. How far and in which direction is ${name} from the starting point?`;
  const correct = `${dist} km, North-East`;
  const d = [`${dist} km, North-West`, `${dx + dy} km, North-East`, `${dist} km, South-East`, `${dist + 2} km, North-East`, `${dy} km, North`];
  return {
    text,
    ...withOptions(r, correct, d),
    explanation: `Net displacement: ${dx} km East and ${y1} − ${y2} = ${dy} km North. Distance = √(${dx}² + ${dy}²) = ${dist} km towards North-East.`,
    difficulty: 2,
  };
};
const facing: Gen = (r) => {
  let d = int(r, 0, 3);
  const start = DIRS[d];
  const turns = Array.from({ length: int(r, 3, 5) }, () => pick(r, ["right", "left", "right", "about"]));
  for (const t of turns) d = (d + (t === "right" ? 1 : t === "left" ? 3 : 2)) % 4;
  const ans = DIRS[d];
  return {
    text: `A person is facing ${start}. He turns ${turns.map((t) => (t === "about" ? "about (180°)" : `90° ${t}`)).join(", then ")}. In which direction is he facing now?`,
    ...withOptions(r, ans, [...DIRS, "North-East"]),
    explanation: `Right = clockwise 90°, left = anticlockwise 90°, about = 180°. Final direction: ${ans}.`,
    difficulty: 1,
  };
};

// ───────────── Inequality ─────────────
type Sym = ">" | "≥" | "=" | "<" | "≤";
function relation(chain: string[], syms: Sym[], a: number, b: number): Sym | null {
  const [i, j] = a < b ? [a, b] : [b, a];
  const seg = syms.slice(i, j);
  const up = seg.every((s) => s === ">" || s === "≥" || s === "=");
  const down = seg.every((s) => s === "<" || s === "≤" || s === "=");
  let rel: Sym | null = null;
  if (up) rel = seg.includes(">") ? ">" : seg.includes("≥") ? "≥" : "=";
  else if (down) rel = seg.includes("<") ? "<" : seg.includes("≤") ? "≤" : "=";
  if (!rel) return null;
  if (a > b) rel = ({ ">": "<", "<": ">", "≥": "≤", "≤": "≥", "=": "=" } as const)[rel];
  return rel;
}
const OPTS5 = ["Only conclusion I follows", "Only conclusion II follows", "Either I or II follows", "Neither I nor II follows", "Both I and II follow"];
const inequality: Gen = (r) => {
  const letters = sample(r, "ABCDEFGHJKLMNPQRSTUVWXYZ".split(""), 5);
  const syms: Sym[] = Array.from({ length: 4 }, () => pick(r, [">", "≥", "=", "<", "≤", ">", "<"] as Sym[]));
  const stmt = letters.map((l, i) => (i < 4 ? `${l} ${syms[i]} ` : l)).join("");
  const makeConclusion = (): { s: string; ok: boolean } => {
    for (let g = 0; g < 20; g++) {
      const a = int(r, 0, 4);
      let b = int(r, 0, 4);
      if (a === b) b = (b + 2) % 5;
      const rel = relation(letters, syms, a, b);
      if (rel && r() < 0.55) return { s: `${letters[a]} ${rel} ${letters[b]}`, ok: true };
      if (!rel) return { s: `${letters[a]} ${pick(r, [">", "<"])} ${letters[b]}`, ok: false };
      const wrong: Sym = rel === ">" || rel === "≥" ? "<" : rel === "=" ? ">" : ">";
      return { s: `${letters[a]} ${wrong} ${letters[b]}`, ok: false };
    }
    return { s: `${letters[0]} = ${letters[4]}`, ok: false };
  };
  const c1 = makeConclusion();
  let c2 = makeConclusion();
  for (let g = 0; g < 5 && c2.s === c1.s; g++) c2 = makeConclusion();
  const ans = c1.ok && c2.ok ? 4 : c1.ok ? 0 : c2.ok ? 1 : 3;
  return {
    text: `Statement: ${stmt}\nConclusions:\nI. ${c1.s}\nII. ${c2.s}`,
    options: OPTS5,
    answer: ans,
    explanation: `A conclusion is true only if every sign on the path between the two elements points the same way. I is ${c1.ok ? "true" : "false"}, II is ${c2.ok ? "true" : "false"}.`,
    difficulty: 2,
  };
};

// ───────────── Syllogism ─────────────
const NOUNS = ["pens", "books", "cats", "tables", "phones", "flowers", "rings", "trees", "boxes", "clouds", "doors", "birds", "chairs", "papers", "stones"];
type SylT = { s: string[]; c: [string, boolean][]; either?: [number, number] };
const SYL: SylT[] = [
  { s: ["All A are B.", "All B are C."], c: [["All A are C.", true], ["Some C are A.", true], ["All C are A.", false], ["Some A are not C.", false]] },
  { s: ["All A are B.", "No B is C."], c: [["No A is C.", true], ["Some A are C.", false], ["Some B are A.", true], ["All C are A.", false]] },
  { s: ["Some A are B.", "All B are C."], c: [["Some A are C.", true], ["Some C are A.", true], ["All A are C.", false], ["No A is C.", false]] },
  { s: ["Some A are B.", "No B is C."], c: [["Some A are not C.", true], ["No A is C.", false], ["All A are C.", false], ["Some B are A.", true]] },
  { s: ["No A is B.", "All C are B."], c: [["No C is A.", true], ["Some C are A.", false], ["Some B are not A.", true], ["All A are C.", false]] },
  { s: ["Some A are B.", "Some B are C."], c: [["Some A are C.", false], ["No A is C.", false]], either: [0, 1] },
  { s: ["All A are B.", "Some B are C."], c: [["Some A are C.", false], ["Some C are B.", true], ["Some B are A.", true], ["No A is C.", false]] },
];
const syllogism: Gen = (r) => {
  const t = pick(r, SYL);
  const [A, B, C] = sample(r, NOUNS, 3);
  const sub = (x: string) => x.replace(/\bA\b/g, A).replace(/\bB\b/g, B).replace(/\bC\b/g, C);
  let i1: number, i2: number;
  if (t.either) [i1, i2] = t.either;
  else [i1, i2] = sample(r, t.c.map((_, i) => i), 2);
  const [c1, ok1] = t.c[i1], [c2, ok2] = t.c[i2];
  const ans = t.either ? 2 : ok1 && ok2 ? 4 : ok1 ? 0 : ok2 ? 1 : 3;
  return {
    text: `Statements:\n${t.s.map(sub).join("\n")}\nConclusions:\nI. ${sub(c1)}\nII. ${sub(c2)}`,
    options: OPTS5,
    answer: ans,
    explanation: t.either
      ? "Neither conclusion is definite on its own, but the two form a complementary pair ('Some' + 'No' with the same subject and predicate), so either I or II follows."
      : `Using Venn diagrams: I ${ok1 ? "definitely follows" : "does not definitely follow"}; II ${ok2 ? "definitely follows" : "does not definitely follow"}.`,
    difficulty: 2,
  };
};

// ───────────── Ranking ─────────────
const ranking: Gen = (r) => {
  const name = pick(r, NAMES);
  const p = int(r, 5, 25), q = int(r, 5, 30);
  if (r() < 0.6)
    return {
      text: `In a row of students, ${name} is ${p}th from the left end and ${q}th from the right end. How many students are there in the row?`,
      ...numQ(r, p + q - 1, { spread: 0.2 }),
      explanation: `Total = left + right − 1 = ${p} + ${q} − 1 = ${p + q - 1}.`,
      difficulty: 1,
    };
  const total = p + q + int(r, 5, 15);
  return {
    text: `In a class of ${total} students, ${name} ranks ${p}th from the top. What is ${name}'s rank from the bottom?`,
    ...numQ(r, total - p + 1, { spread: 0.2 }),
    explanation: `Rank from bottom = total − rank from top + 1 = ${total} − ${p} + 1 = ${total - p + 1}.`,
    difficulty: 1,
  };
};

// ───────────── Analogy & classification ─────────────
const FN: { f: (n: number) => number; d: string }[] = [
  { f: (n) => n * n, d: "square" },
  { f: (n) => n * n * n, d: "cube" },
  { f: (n) => n * n + 1, d: "square + 1" },
  { f: (n) => n * (n + 1), d: "n × (n + 1)" },
  { f: (n) => 2 * n + 3, d: "2n + 3" },
  { f: (n) => n * n - 1, d: "square − 1" },
];
const isPrime = (n: number) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};
const analogy: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const fn = pick(r, FN);
    const a = int(r, 2, 9);
    let b = int(r, 2, 12);
    if (b === a) b = a + 1;
    const ans = fn.f(b);
    return {
      text: `${a} : ${fn.f(a)} :: ${b} : ?`,
      ...numQ(r, ans, { spread: 0.2 }),
      explanation: `Relationship is ${fn.d}: ${a} → ${fn.f(a)}. So ${b} → ${ans}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const sq = sample(r, [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196], 3);
    let odd = int(r, 15, 200);
    while (Number.isInteger(Math.sqrt(odd))) odd++;
    return {
      text: `Find the odd one out: ${shuffle(r, [...sq, odd]).join(", ")}`,
      ...withOptions(r, String(odd), sq.map(String), 4),
      explanation: `All others are perfect squares; ${odd} is not.`,
      difficulty: 1,
    };
  }
  const primes = sample(r, [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71], 3);
  let odd = pick(r, [21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 87, 91]);
  if (isPrime(odd)) odd = 91;
  return {
    text: `Find the odd number out: ${shuffle(r, [...primes, odd]).join(", ")}`,
    ...withOptions(r, String(odd), primes.map(String), 4),
    explanation: `All others are prime numbers; ${odd} is composite.`,
    difficulty: 1,
  };
};

// ───────────── Calendar & clock ─────────────
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const calendarClock: Gen = (r) => {
  if (r() < 0.5) {
    const y = int(r, 1950, 2030), m = int(r, 0, 11), d = int(r, 1, 28);
    const day = DAYS[new Date(Date.UTC(y, m, d)).getUTCDay()];
    return {
      text: `What day of the week was/will be ${d} ${MONTHS[m]} ${y}?`,
      ...withOptions(r, day, DAYS),
      explanation: `Count odd days from a reference date (or use the century code method). ${d} ${MONTHS[m]} ${y} is a ${day}.`,
      difficulty: 2,
    };
  }
  const H = int(r, 1, 12), M = 5 * int(r, 0, 11);
  let ang = Math.abs(30 * (H % 12) - 5.5 * M);
  if (ang > 180) ang = 360 - ang;
  return {
    text: `What is the angle between the hour hand and the minute hand of a clock at ${H}:${String(M).padStart(2, "0")}?`,
    ...numQ(r, ang, { spread: 0.4, suffix: "°", integer: Number.isInteger(ang) }),
    explanation: `Angle = |30H − 5.5M| = |${30 * (H % 12)} − ${5.5 * M}| = ${fmt(Math.abs(30 * (H % 12) - 5.5 * M))}°${Math.abs(30 * (H % 12) - 5.5 * M) > 180 ? ` → 360 − that = ${fmt(ang)}°` : ""}.`,
    difficulty: 1,
  };
};

// ───────────── Mathematical operations ─────────────
const mathOps: Gen = (r) => {
  const c = int(r, 2, 6), a = c * int(r, 2, 6), b = int(r, 2, 9), d = int(r, 5, 30), e = int(r, 1, 20);
  const ans = (a * b) / c + d - e;
  const real = ["×", "÷", "+", "−"];
  let fake = shuffle(r, real);
  for (let g = 0; g < 50 && fake.some((f, i) => f === real[i]); g++) fake = shuffle(r, real);
  if (fake.some((f, i) => f === real[i])) fake = ["+", "−", "×", "÷"];
  const map: Record<string, string> = {};
  real.forEach((op, i) => (map[op] = fake[i]));
  const expr = `${a} ${map["×"]} ${b} ${map["÷"]} ${c} ${map["+"]} ${d} ${map["−"]} ${e}`;
  return {
    text: `If '${map["×"]}' means '×', '${map["÷"]}' means '÷', '${map["+"]}' means '+' and '${map["−"]}' means '−', then what is the value of: ${expr} = ?`,
    ...numQ(r, ans, { spread: 0.3 }),
    explanation: `Replace symbols: ${a} × ${b} ÷ ${c} + ${d} − ${e} = ${(a * b) / c} + ${d} − ${e} = ${ans}.`,
    difficulty: 1,
  };
};

// ───────────── Seating / floor puzzles (brute-force verified unique) ─────────────
function permutations(n: number): number[][] {
  if (n === 1) return [[0]];
  const res: number[][] = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) res.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return res;
}
const PERM5 = permutations(5);
type Clue = { text: string; test: (posOf: number[]) => boolean };
function makeClues(r: Rng, names: string[], solution: number[], kind: "seat" | "floor"): Clue[] {
  // solution[i] = position (0..4) of person i
  const ord = (n: number) => ["first", "second", "third", "fourth", "fifth"][n];
  const right = kind === "seat" ? "to the right of" : "above";
  const imm = kind === "seat" ? "immediately to the right of" : "immediately above";
  const all: Clue[] = [];
  for (let i = 0; i < 5; i++)
    for (let j = 0; j < 5; j++) {
      if (i === j) continue;
      const d = solution[i] - solution[j];
      if (d === 1) all.push({ text: `${names[i]} is ${imm} ${names[j]}.`, test: (p) => p[i] - p[j] === 1 });
      if (d >= 2) all.push({ text: `${names[i]} is ${kind === "seat" ? `${ord(d - 1)} to the right of` : `${d} floors above`} ${names[j]}.`, test: (p) => p[i] - p[j] === d });
      if (d > 0 && r() < 0.3) all.push({ text: `${names[i]} is somewhere ${right} ${names[j]}.`, test: (p) => p[i] > p[j] });
      if (Math.abs(d) > 1 && i < j) all.push({ text: `${names[i]} and ${names[j]} are not ${kind === "seat" ? "adjacent" : "on adjacent floors"}.`, test: (p) => Math.abs(p[i] - p[j]) > 1 });
    }
  for (let i = 0; i < 5; i++) {
    const s = solution[i];
    if (s === 0 || s === 4) all.push({ text: kind === "seat" ? `${names[i]} sits at one of the extreme ends.` : `${names[i]} lives on either the top or the bottom floor.`, test: (p) => p[i] === 0 || p[i] === 4 });
    if (kind === "floor") all.push({ text: `${names[i]} lives on an ${s % 2 === 0 ? "odd" : "even"}-numbered floor.`, test: (p) => p[i] % 2 === s % 2 });
    if (kind === "seat" && s === 2) all.push({ text: `${names[i]} sits exactly in the middle.`, test: (p) => p[i] === 2 });
  }
  const chosen: Clue[] = [];
  let candidates = PERM5;
  for (const c of shuffle(r, all)) {
    const next = candidates.filter((p) => c.test(p));
    if (next.length < candidates.length) {
      chosen.push(c);
      candidates = next;
    }
    if (candidates.length === 1) break;
  }
  return chosen;
}
const puzzle = (kind: "seat" | "floor"): Gen => (r) => {
  const names = sample(r, ["P", "Q", "R", "S", "T", "U", "V", "W"], 5);
  const solution = shuffle(r, [0, 1, 2, 3, 4]);
  const clues = makeClues(r, names, solution, kind);
  const at = (p: number) => names[solution.indexOf(p)];
  const intro =
    kind === "seat"
      ? `Five persons ${names.join(", ")} are sitting in a straight line facing North (position 1 is the left end).\n${clues.map((c) => "• " + c.text).join("\n")}`
      : `Five persons ${names.join(", ")} live on different floors of a five-storey building (ground floor = 1, top floor = 5).\n${clues.map((c) => "• " + c.text).join("\n")}`;
  const arrangement = kind === "seat" ? [0, 1, 2, 3, 4].map(at).join(" – ") : [4, 3, 2, 1, 0].map((p) => `Floor ${p + 1}: ${at(p)}`).join(", ");
  const exp = `Final arrangement (${kind === "seat" ? "left to right" : "top to bottom"}): ${arrangement}.`;
  const qs: QBody[] = [];
  const p1 = kind === "seat" ? 2 : 4;
  qs.push({
    passage: intro,
    text: kind === "seat" ? "Who sits in the middle of the row?" : "Who lives on the top floor?",
    ...withOptions(r, at(p1), names),
    explanation: exp,
    difficulty: 3,
  });
  const k = int(r, 0, 4);
  const person = names[k];
  const pp = solution[k];
  qs.push({
    passage: intro,
    text: kind === "seat" ? `How many persons sit to the right of ${person}?` : `How many persons live below ${person}?`,
    ...withOptions(r, String(kind === "seat" ? 4 - pp : pp), ["0", "1", "2", "3", "4"]),
    explanation: exp,
    difficulty: 3,
  });
  const p3 = int(r, 0, 3);
  qs.push({
    passage: intro,
    text: kind === "seat" ? `Who sits immediately to the right of ${at(p3)}?` : `Who lives immediately above ${at(p3)}?`,
    ...withOptions(r, at(p3 + 1), names.filter((n) => n !== at(p3))),
    explanation: exp,
    difficulty: 3,
  });
  return qs;
};

// ───────────── Statements ─────────────
const STATEMENTS: { s: string; c1: string; c2: string; ans: number; why: string }[] = [
  { s: "Regular exercise keeps the body fit. Ravi exercises daily.", c1: "Ravi is fit.", c2: "Ravi never falls ill.", ans: 0, why: "I follows directly; II is an over-generalisation ('never')." },
  { s: "The government has decided to increase the price of petrol by ₹2 per litre.", c1: "Transport costs may rise.", c2: "People will stop using vehicles.", ans: 0, why: "I is a probable consequence; II is extreme." },
  { s: "All students who scored above 90% were given scholarships. Meena got a scholarship.", c1: "Meena scored above 90%.", c2: "Only students above 90% get scholarships everywhere.", ans: 3, why: "The statement does not say scholarships were given ONLY to such students; II goes beyond the statement." },
  { s: "Use our toothpaste for stronger teeth – an advertisement.", c1: "People want stronger teeth.", c2: "Other toothpastes do not strengthen teeth.", ans: 0, why: "Advertisements assume people want the benefit (I). II is not implied." },
  { s: "The bank has announced that its branches will remain closed on Saturday.", c1: "Customers will not be able to visit branches on Saturday.", c2: "The bank is shutting down permanently.", ans: 0, why: "I follows; II is not supported." },
  { s: "Many candidates failed the exam because they did not manage time well.", c1: "Time management is important in exams.", c2: "All candidates who failed were weak in studies.", ans: 0, why: "I follows; II contradicts the given reason." },
  { s: "A city with good public transport has less traffic congestion. City X has heavy congestion.", c1: "City X may not have good public transport.", c2: "City X has no vehicles.", ans: 0, why: "I is a reasonable inference; II is absurd." },
  { s: "Reading newspapers daily improves general awareness.", c1: "Students preparing for exams should read newspapers.", c2: "Newspapers are the only source of general awareness.", ans: 0, why: "I is a sensible implication; II uses 'only'." },
];
const statements: Gen = (r) => {
  const s = pick(r, STATEMENTS);
  return {
    text: `Statement: ${s.s}\nConclusions:\nI. ${s.c1}\nII. ${s.c2}`,
    options: OPTS5,
    answer: s.ans,
    explanation: s.why,
    difficulty: 1,
  };
};

// ───────────── Alphabet test ─────────────
const alphabet: Gen = (r) => {
  if (r() < 0.5) {
    const a = int(r, 3, 20), b = int(r, 2, 6);
    const ans = L(a + b);
    return {
      text: `Which letter is ${b}th to the right of the ${a}th letter from the left in the English alphabet?`,
      ...withOptions(r, ans, [L(a + b + 1), L(a + b - 1), L(a - b), L(27 - a - b), L(a + b + 2)]),
      explanation: `${a} + ${b} = ${a + b}th letter = ${ans}.`,
      difficulty: 1,
    };
  }
  const n = int(r, 3, 20);
  const ans = L(27 - n);
  return {
    text: `If the English alphabet is written in reverse order, which letter will be ${n}th from the left?`,
    ...withOptions(r, ans, [L(n), L(28 - n), L(26 - n), L(27 - n + 2)]),
    explanation: `${n}th from left in reverse = (27 − ${n}) = ${27 - n}th letter = ${ans}.`,
    difficulty: 1,
  };
};

// ───────────── Non-verbal (text-friendly): figure counting ─────────────
const nonVerbal: Gen = (r) => {
  const n = int(r, 2, 6);
  const ans = (n * (n + 1)) / 2;
  return {
    text: `A big triangle is divided by drawing ${n - 1} line(s) from its top vertex to the base, creating ${n} small adjacent triangles along the base. How many triangles are there in total in the figure?`,
    ...numQ(r, ans, { spread: 0.4 }),
    explanation: `With n segments on the base, total triangles = n(n + 1)/2 = ${n}×${n + 1}/2 = ${ans}.`,
    difficulty: 2,
  };
};

export const REASONING_GENERATORS: Record<string, Gen> = {
  "r-seating": puzzle("seat"),
  "r-puzzles": puzzle("floor"),
  "r-syllogism": syllogism,
  "r-inequality": inequality,
  "r-blood": blood,
  "r-direction": (r) => (r() < 0.6 ? direction(r) : facing(r)),
  "r-coding": coding,
  "r-series": (r) => (r() < 0.6 ? series(r) : alphabet(r)),
  "r-ranking": ranking,
  "r-analogy": analogy,
  "r-calendar-clock": calendarClock,
  "r-math-ops": mathOps,
  "r-statements": statements,
  "r-nonverbal": nonVerbal,
};
