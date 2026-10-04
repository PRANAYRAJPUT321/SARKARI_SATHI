import { fmt, gcd, int, lcm, numQ, pick, round2, shuffle, withOptions, type Rng } from "./rng";
import type { QBody, Gen } from "./types";

const ratioStr = (a: number, b: number) => {
  const g = gcd(a, b);
  return `${a / g} : ${b / g}`;
};

const simplification: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const a = int(r, 12, 39), b = int(r, 6, 19), d = int(r, 3, 12), c = int(r, 4, 25), e = int(r, 10, 99);
    const ans = a * b + c - e;
    return {
      text: `${a} × ${b} + ${c * d} ÷ ${d} − ${e} = ?`,
      ...numQ(r, ans, { spread: 0.1 }),
      explanation: `BODMAS: ${a}×${b} = ${a * b}; ${c * d}÷${d} = ${c}. So ${a * b} + ${c} − ${e} = ${ans}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const p = pick(r, [5, 10, 15, 20, 25, 30, 40, 45, 50, 60, 75]);
    const n = 20 * int(r, 5, 60), k = int(r, 11, 29);
    const ans = (p * n) / 100 + k * k;
    return {
      text: `${p}% of ${n} + ${k}² = ?`,
      ...numQ(r, ans, { spread: 0.12 }),
      explanation: `${p}% of ${n} = ${(p * n) / 100}; ${k}² = ${k * k}. Total = ${ans}.`,
      difficulty: 1,
    };
  }
  const s = int(r, 12, 35), c = int(r, 4, 12), m = int(r, 3, 9);
  const ans = s * s - c * c * c + m * 11;
  return {
    text: `√${s * s} × ${s} − ${c}³ + ${m} × 11 = ?`,
    ...numQ(r, ans, { spread: 0.15 }),
    explanation: `√${s * s} = ${s}; ${s}×${s} = ${s * s}; ${c}³ = ${c ** 3}; ${m}×11 = ${m * 11}. Result = ${ans}.`,
    difficulty: 2,
  };
};

const approximation: Gen = (r) => {
  const p = pick(r, [10, 20, 25, 40, 50, 75]);
  const n = 40 * int(r, 5, 40);
  const k = int(r, 12, 30);
  const a = int(r, 11, 25), b = int(r, 4, 9);
  const ans = (p * n) / 100 + k + a * b;
  const noisy = (x: number) => (x + (r() > 0.5 ? 0.03 : -0.02) * (r() + 0.2)).toFixed(2);
  return {
    text: `${noisy(p)}% of ${noisy(n)} + √${k * k + int(r, -3, 3)} + ${noisy(a)} × ${noisy(b)} ≈ ?`,
    ...numQ(r, ans, { spread: 0.35 }),
    explanation: `Round off: ${p}% of ${n} = ${(p * n) / 100}, √≈${k * k} = ${k}, ${a}×${b} = ${a * b}. Total ≈ ${ans}.`,
    difficulty: 1,
  };
};

const numberSeries: Gen = (r) => {
  const kind = int(r, 0, 4);
  let terms: number[] = [];
  let rule = "";
  const s = int(r, 2, 20);
  if (kind === 0) {
    const d = int(r, 2, 7);
    terms = [s];
    for (let i = 1; i < 7; i++) terms.push(terms[i - 1] + d * i);
    rule = `Differences increase by ${d}: +${d}, +${2 * d}, +${3 * d}…`;
  } else if (kind === 1) {
    const k = int(r, 1, 5);
    terms = [s];
    for (let i = 1; i < 7; i++) terms.push(terms[i - 1] * 2 + k);
    rule = `Each term = previous × 2 + ${k}.`;
  } else if (kind === 2) {
    terms = [s];
    for (let i = 1; i < 7; i++) terms.push(terms[i - 1] + i * i);
    rule = "Add squares: +1², +2², +3²…";
  } else if (kind === 3) {
    terms = [s];
    for (let i = 1; i < 7; i++) terms.push(terms[i - 1] * i + i);
    rule = "×1+1, ×2+2, ×3+3 …";
  } else {
    const a = int(r, 2, 6);
    terms = [s * 10];
    for (let i = 1; i < 7; i++) terms.push(terms[i - 1] + (i % 2 ? a * 10 : -a * 3));
    rule = `Alternately +${a * 10} and −${a * 3}.`;
  }
  terms = terms.slice(0, 6);
  if (r() < 0.35) {
    // wrong number variant
    const idx = int(r, 1, 5);
    const wrong = terms[idx] + pick(r, [-3, -2, -1, 1, 2, 4]);
    const shown = terms.map((t, i) => (i === idx ? wrong : t));
    const correct = String(wrong);
    const distract = shown.filter((_, i) => i !== idx).map(String);
    return {
      text: `Find the wrong number in the series: ${shown.join(", ")}`,
      ...withOptions(r, correct, distract),
      explanation: `${rule} The correct term is ${terms[idx]}, so ${wrong} is wrong.`,
      difficulty: 2,
    };
  }
  const idx = r() < 0.6 ? 5 : int(r, 2, 4);
  const shown = terms.map((t, i) => (i === idx ? "?" : String(t)));
  return {
    text: `What should come in place of the question mark (?) in the series: ${shown.join(", ")}`,
    ...numQ(r, terms[idx], { spread: 0.12 }),
    explanation: `${rule} Missing term = ${terms[idx]}.`,
    difficulty: kind > 2 ? 2 : 1,
  };
};

function quadStr(v: string, p: number, q: number) {
  const b = -(p + q), c = p * q;
  const bs = b === 0 ? "" : ` ${b > 0 ? "+" : "−"} ${Math.abs(b) === 1 ? "" : Math.abs(b)}${v}`;
  const cs = c === 0 ? "" : ` ${c > 0 ? "+" : "−"} ${Math.abs(c)}`;
  return `${v}²${bs}${cs} = 0`;
}

const quadratic: Gen = (r) => {
  const roots = () => {
    const p = int(r, -9, 9) || 2, q = int(r, -9, 9) || -3;
    return [p, q];
  };
  const [x1, x2] = roots();
  const [y1, y2] = roots();
  const xs = [x1, x2], ys = [y1, y2];
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  let rel: string;
  if (minX > maxY) rel = "x > y";
  else if (maxX < minY) rel = "x < y";
  else if (minX >= maxY) rel = "x ≥ y";
  else if (maxX <= minY) rel = "x ≤ y";
  else rel = "x = y or relationship cannot be established";
  const options = ["x > y", "x < y", "x ≥ y", "x ≤ y", "x = y or relationship cannot be established"];
  return {
    text: `Solve and find the relation between x and y:\nI. ${quadStr("x", x1, x2)}\nII. ${quadStr("y", y1, y2)}`,
    options,
    answer: options.indexOf(rel),
    explanation: `Roots of I: x = ${x1}, ${x2}. Roots of II: y = ${y1}, ${y2}. Comparing every pair gives: ${rel}.`,
    difficulty: 2,
  };
};

const numberSystem: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const [a, b, c] = shuffle(r, [6, 8, 9, 10, 12, 15, 18, 20, 24, 30]).slice(0, 3);
    const L = lcm(lcm(a, b), c);
    const startH = int(r, 6, 10);
    const total = startH * 60 + L;
    const hh = Math.floor(total / 60) % 24, mm = total % 60;
    const t = (h: number, m: number) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
    const correct = t(hh, mm);
    const d = [L / 2, L + 10, L * 2, L - 12, L + 30].filter((x) => x > 0).map((x) => {
      const tt = startH * 60 + x;
      return t(Math.floor(tt / 60) % 24, Math.round(tt % 60));
    });
    return {
      text: `Three bells toll at intervals of ${a}, ${b} and ${c} minutes. If they toll together at ${startH}:00 AM, when will they next toll together?`,
      ...withOptions(r, correct, d),
      explanation: `LCM(${a}, ${b}, ${c}) = ${L} minutes. ${startH}:00 AM + ${L} min = ${correct}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const h = int(r, 7, 25), rem = int(r, 1, Math.min(6, h - 1));
    const nums = [int(r, 3, 9), int(r, 10, 17), int(r, 18, 29)].map((k) => h * k + rem);
    return {
      text: `Find the greatest number that divides ${nums.join(", ")} leaving remainder ${rem} in each case.`,
      ...numQ(r, h, { spread: 0.6 }),
      explanation: `Subtract the remainder: ${nums.map((n) => n - rem).join(", ")}. HCF of these = ${h}.`,
      difficulty: 2,
    };
  }
  const base = pick(r, [2, 3, 7, 8, 9]);
  const pow = int(r, 21, 99);
  const cycle: Record<number, number[]> = { 2: [2, 4, 8, 6], 3: [3, 9, 7, 1], 7: [7, 9, 3, 1], 8: [8, 4, 2, 6], 9: [9, 1, 9, 1] };
  const ud = cycle[base][(pow - 1) % 4];
  return {
    text: `What is the unit digit of ${base}^${pow}?`,
    ...withOptions(r, String(ud), ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]),
    explanation: `Unit digits of powers of ${base} repeat in cycle (${cycle[base].join(", ")}). ${pow} mod 4 = ${pow % 4}${pow % 4 === 0 ? " (take the 4th term)" : ""} → unit digit ${ud}.`,
    difficulty: 1,
  };
};

const percentage: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const p = pick(r, [20, 25, 50, 60, 100, 150, 75, 40]);
    const ans = round2((p / (100 + p)) * 100);
    return {
      text: `If A's salary is ${p}% more than B's salary, then B's salary is how much percent less than A's?`,
      ...numQ(r, ans, { spread: 0.3, suffix: "%", integer: false }),
      explanation: `Required % = ${p}/(100 + ${p}) × 100 = ${fmt(ans)}%.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const a = pick(r, [10, 20, 25, 30, 40]), b = pick(r, [10, 20, 25, 15]);
    const net = round2(a - b - (a * b) / 100);
    const correct = net >= 0 ? `${fmt(net)}% increase` : `${fmt(-net)}% decrease`;
    const d = [a - b, a + b, net + 2, -net, (a * b) / 100].map((x) => (x >= 0 ? `${fmt(round2(x))}% increase` : `${fmt(round2(-x))}% decrease`));
    return {
      text: `The price of an article is first increased by ${a}% and then decreased by ${b}%. What is the net change in price?`,
      ...withOptions(r, correct, d),
      explanation: `Net change = a − b − ab/100 = ${a} − ${b} − ${(a * b) / 100} = ${fmt(net)}%.`,
      difficulty: 1,
    };
  }
  const p = pick(r, [12, 15, 18, 24, 35, 45, 64]), n = 50 * int(r, 4, 40);
  const val = (p * n) / 100;
  return {
    text: `${p}% of a number is ${fmt(val)}. What is the number?`,
    ...numQ(r, n, { spread: 0.25 }),
    explanation: `Number = ${fmt(val)} × 100 / ${p} = ${n}.`,
    difficulty: 1,
  };
};

const profitLoss: Gen = (r) => {
  if (r() < 0.5) {
    const m = pick(r, [20, 25, 30, 40, 50, 60]), d = pick(r, [10, 12, 15, 20, 25]);
    const p = round2(((100 + m) * (100 - d)) / 100 - 100);
    const correct = p >= 0 ? `${fmt(p)}% profit` : `${fmt(-p)}% loss`;
    const dist = [m - d, m, d, p + 3, p - 4, m - d + 5].map((x) => (x >= 0 ? `${fmt(round2(x))}% profit` : `${fmt(round2(-x))}% loss`));
    return {
      text: `A shopkeeper marks an article ${m}% above its cost price and allows a discount of ${d}%. Find his profit or loss percentage.`,
      ...withOptions(r, correct, dist),
      explanation: `SP = CP × (1 + ${m}/100) × (1 − ${d}/100) = ${fmt(round2((100 + m) * (100 - d) / 100))}% of CP → ${correct}.`,
      difficulty: 1,
    };
  }
  const cp = 100 * int(r, 3, 60), p = pick(r, [5, 10, 12, 15, 20, 25]);
  const sp = (cp * (100 + p)) / 100;
  return {
    text: `By selling an article for ₹${fmt(sp)}, a man gains ${p}%. What is the cost price of the article?`,
    ...numQ(r, cp, { spread: 0.2, prefix: "₹" }),
    explanation: `CP = SP × 100/(100 + ${p}) = ${fmt(sp)} × 100/${100 + p} = ₹${fmt(cp)}.`,
    difficulty: 1,
  };
};

const siCi: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const P = 1000 * int(r, 2, 50), R = int(r, 4, 15), T = int(r, 2, 6);
    const si = (P * R * T) / 100;
    return {
      text: `Find the simple interest on ₹${fmt(P)} at ${R}% per annum for ${T} years.`,
      ...numQ(r, si, { spread: 0.25, prefix: "₹" }),
      explanation: `SI = PRT/100 = ${fmt(P)} × ${R} × ${T}/100 = ₹${fmt(si)}.`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const P = 5000 * int(r, 1, 8), R = pick(r, [5, 10, 20, 4, 8]);
    const ci = round2(P * ((1 + R / 100) ** 2 - 1));
    return {
      text: `What will be the compound interest on ₹${fmt(P)} at ${R}% per annum for 2 years, compounded annually?`,
      ...numQ(r, ci, { spread: 0.2, prefix: "₹", integer: Number.isInteger(ci) }),
      explanation: `CI = P[(1 + R/100)² − 1] = ${fmt(P)} × ${(2 * R + (R * R) / 100).toFixed(2)}% = ₹${fmt(ci)}.`,
      difficulty: 2,
    };
  }
  const R = pick(r, [5, 10, 4, 8, 20]), diff = pick(r, [25, 40, 50, 64, 80, 100, 160]);
  const P = round2(diff / (R / 100) ** 2);
  return {
    text: `The difference between compound interest and simple interest on a sum for 2 years at ${R}% per annum is ₹${diff}. Find the sum.`,
    ...numQ(r, P, { spread: 0.3, prefix: "₹" }),
    explanation: `CI − SI (2 yrs) = P(R/100)² → P = ${diff} / (${R}/100)² = ₹${fmt(P)}.`,
    difficulty: 2,
  };
};

const ratio: Gen = (r) => {
  if (r() < 0.5) {
    const a = int(r, 1, 7), b = int(r, 2, 9), c = int(r, 1, 8), k = 100 * int(r, 1, 30);
    const N = (a + b + c) * k;
    return {
      text: `₹${fmt(N)} is divided among A, B and C in the ratio ${a} : ${b} : ${c}. What is B's share?`,
      ...numQ(r, b * k, { spread: 0.35, prefix: "₹" }),
      explanation: `B's share = ${b}/${a + b + c} × ${fmt(N)} = ₹${fmt(b * k)}.`,
      difficulty: 1,
    };
  }
  const x = 1000 * int(r, 5, 40), y = 1000 * int(r, 5, 40), t1 = 12, t2 = pick(r, [4, 6, 8, 9, 10]);
  const sa = x * t1, sb = y * t2, g = gcd(sa, sb);
  const k = int(r, 2, 9) * 100;
  const total = ((sa + sb) / g) * k;
  const aShare = (sa / g) * k;
  return {
    text: `A starts a business with ₹${fmt(x)}. After ${12 - t2} months, B joins with ₹${fmt(y)}. At the end of the year the total profit is ₹${fmt(total)}. What is A's share?`,
    ...numQ(r, aShare, { spread: 0.3, prefix: "₹" }),
    explanation: `Ratio = ${fmt(x)}×12 : ${fmt(y)}×${t2} = ${(sa / g)} : ${(sb / g)}. A's share = ${sa / g}/${(sa + sb) / g} × ${fmt(total)} = ₹${fmt(aShare)}.`,
    difficulty: 2,
  };
};

const average: Gen = (r) => {
  const n = int(r, 5, 25), m = int(r, 20, 80), d = pick(r, [1, 2, 3, -1, -2]);
  const x = (n + 1) * (m + d) - n * m;
  return {
    text: `The average of ${n} numbers is ${m}. When a new number is included, the average becomes ${m + d}. Find the new number.`,
    ...numQ(r, x, { spread: 0.25 }),
    explanation: `New number = (n+1)(new avg) − n(old avg) = ${n + 1}×${m + d} − ${n}×${m} = ${x}.`,
    difficulty: 1,
  };
};

const ages: Gen = (r) => {
  let a = 0, b = 0, k = 0, t = 0, c = 0, d = 0;
  for (let i = 0; i < 30; i++) {
    a = int(r, 2, 7); b = int(r, a + 1, 9); k = int(r, 3, 8); t = int(r, 3, 12);
    if (gcd(a, b) !== 1) continue;
    const g = gcd(a * k + t, b * k + t);
    c = (a * k + t) / g; d = (b * k + t) / g;
    if (c !== a && c < 20 && d < 20) break;
  }
  return {
    text: `The present ages of A and B are in the ratio ${a} : ${b}. After ${t} years, the ratio will be ${c} : ${d}. What is A's present age?`,
    ...numQ(r, a * k, { spread: 0.4 }),
    explanation: `Let ages be ${a}x and ${b}x. (${a}x + ${t})/(${b}x + ${t}) = ${c}/${d} → x = ${k}. A = ${a * k} years.`,
    difficulty: 2,
  };
};

const WORK_PAIRS: [number, number][] = [[10, 15], [12, 24], [20, 30], [6, 12], [15, 30], [12, 36], [20, 60], [18, 36], [24, 40], [30, 45], [21, 42], [40, 60], [36, 45]];
const PIPE_PAIRS: [number, number][] = [[4, 6], [3, 4], [6, 8], [10, 15], [12, 20], [8, 12], [9, 12], [5, 6]];

const timeWork: Gen = (r) => {
  const v = int(r, 0, 2);
  const [a, b] = pick(r, WORK_PAIRS);
  const t = (a * b) / (a + b);
  if (v === 0)
    return {
      text: `A can finish a work in ${a} days and B can finish it in ${b} days. In how many days will they finish it working together?`,
      ...numQ(r, t, { spread: 0.4, suffix: " days" }),
      explanation: `Total work = LCM(${a}, ${b}) = ${lcm(a, b)}. Efficiencies: ${lcm(a, b) / a} + ${lcm(a, b) / b} = ${lcm(a, b) / a + lcm(a, b) / b}/day. Time = ${t} days.`,
      difficulty: 1,
    };
  if (v === 1)
    return {
      text: `A and B together can finish a work in ${t} days. A alone can do it in ${a} days. In how many days can B alone finish it?`,
      ...numQ(r, b, { spread: 0.4, suffix: " days" }),
      explanation: `B = (A × T)/(A − T) = ${a}×${t}/(${a}−${t}) = ${b} days.`,
      difficulty: 2,
    };
  const [f, e] = pick(r, PIPE_PAIRS);
  const net = (f * e) / (e - f);
  return {
    text: `Pipe A can fill a tank in ${f} hours and pipe B can empty it in ${e} hours. If both are opened together, in how many hours will the empty tank be filled?`,
    ...numQ(r, net, { spread: 0.4, suffix: " hours" }),
    explanation: `Net rate = 1/${f} − 1/${e} = 1/${net}. Time = ${net} hours.`,
    difficulty: 1,
  };
};

const speed: Gen = (r) => {
  const v = int(r, 0, 3);
  if (v === 0 || v === 1) {
    const S = pick(r, [36, 54, 72, 90, 108]), ms = (S * 5) / 18, t = int(r, 6, 20);
    const L = ms * t;
    if (v === 0)
      return {
        text: `A train running at ${S} km/h crosses a pole in ${t} seconds. What is the length of the train?`,
        ...numQ(r, L, { spread: 0.3, suffix: " m" }),
        explanation: `Speed = ${S} × 5/18 = ${ms} m/s. Length = ${ms} × ${t} = ${L} m.`,
        difficulty: 1,
      };
    const P = 10 * int(r, 10, 40);
    const T = (L + P) / ms;
    return {
      text: `A ${L} m long train running at ${S} km/h crosses a platform ${P} m long. How long does it take?`,
      ...numQ(r, round2(T), { spread: 0.3, suffix: " s", integer: Number.isInteger(T) }),
      explanation: `Distance = ${L} + ${P} = ${L + P} m. Speed = ${ms} m/s. Time = ${fmt(round2(T))} s.`,
      difficulty: 1,
    };
  }
  if (v === 2) {
    const b = int(r, 8, 20), s = int(r, 1, 6), t1 = int(r, 2, 5), t2 = int(r, 2, 6);
    return {
      text: `A boat covers ${(b + s) * t1} km downstream in ${t1} hours and ${(b - s) * t2} km upstream in ${t2} hours. Find the speed of the stream.`,
      ...numQ(r, s, { spread: 1, suffix: " km/h" }),
      explanation: `Downstream = ${b + s} km/h, upstream = ${b - s} km/h. Stream = (${b + s} − ${b - s})/2 = ${s} km/h.`,
      difficulty: 1,
    };
  }
  const [x, y] = pick(r, [[40, 60], [30, 60], [60, 90], [20, 30], [45, 90], [36, 45]] as [number, number][]);
  const avg = (2 * x * y) / (x + y);
  return {
    text: `A car travels from P to Q at ${x} km/h and returns from Q to P at ${y} km/h. What is the average speed for the whole journey?`,
    ...numQ(r, avg, { spread: 0.2, suffix: " km/h" }),
    explanation: `Average speed = 2xy/(x+y) = 2×${x}×${y}/${x + y} = ${avg} km/h.`,
    difficulty: 1,
  };
};

const mixture: Gen = (r) => {
  if (r() < 0.5) {
    const c = int(r, 20, 60), d = c + int(r, 10, 40), m = int(r, c + 2, d - 2);
    const correct = ratioStr(d - m, m - c);
    const dist = [ratioStr(m - c, d - m), ratioStr(d - m + 1, m - c), ratioStr(d - c, m - c), ratioStr(m, d), ratioStr(c, m)];
    return {
      text: `In what ratio must rice at ₹${c}/kg be mixed with rice at ₹${d}/kg so that the mixture costs ₹${m}/kg?`,
      ...withOptions(r, correct, dist),
      explanation: `Alligation: (${d} − ${m}) : (${m} − ${c}) = ${correct}.`,
      difficulty: 2,
    };
  }
  const a = int(r, 2, 7), b = int(r, 1, 5), k = int(r, 4, 12);
  const V = (a + b) * k, x = int(r, 1, 3) * k;
  const correct = ratioStr(a * k, b * k + x);
  const dist = [ratioStr(a * k + x, b * k), ratioStr(a, b + 1), ratioStr(a * k, b * k + 2 * x), ratioStr(a + 1, b + 1)];
  return {
    text: `A ${V}-litre mixture contains milk and water in the ratio ${a} : ${b}. If ${x} litres of water is added, what is the new ratio of milk to water?`,
    ...withOptions(r, correct, dist),
    explanation: `Milk = ${a * k} L, water = ${b * k} L. After adding ${x} L water: ${a * k} : ${b * k + x} = ${correct}.`,
    difficulty: 1,
  };
};

const C2 = (n: number) => (n * (n - 1)) / 2;
const frac = (a: number, b: number) => {
  const g = gcd(a, b);
  return `${a / g}/${b / g}`;
};

const probability: Gen = (r) => {
  if (r() < 0.6) {
    const red = int(r, 3, 7), green = int(r, 2, 6), blue = int(r, 2, 5), n = red + green + blue;
    const correct = frac(C2(red), C2(n));
    const dist = [frac(red, n), frac(C2(red) + 1, C2(n)), frac(red * green, C2(n)), frac(C2(green), C2(n)), frac(red - 1, n - 1)];
    return {
      text: `A bag contains ${red} red, ${green} green and ${blue} blue balls. Two balls are drawn at random. What is the probability that both are red?`,
      ...withOptions(r, correct, dist),
      explanation: `P = ⁽${red}⁾C₂ / ⁽${n}⁾C₂ = ${C2(red)}/${C2(n)} = ${correct}.`,
      difficulty: 2,
    };
  }
  const s = int(r, 4, 10);
  let c = 0;
  for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === s) c++;
  const correct = frac(c, 36);
  return {
    text: `Two dice are thrown together. What is the probability that the sum of the numbers is ${s}?`,
    ...withOptions(r, correct, [frac(c + 1, 36), frac(c, 12), frac(s, 36), frac(Math.max(1, c - 1), 36), frac(1, 6)]),
    explanation: `Favourable outcomes = ${c}, total = 36. P = ${correct}.`,
    difficulty: 1,
  };
};

const mensuration: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const rad = 7 * int(r, 1, 6);
    const area = (22 / 7) * rad * rad;
    return {
      text: `Find the area of a circle whose radius is ${rad} cm. (Use π = 22/7)`,
      ...numQ(r, area, { spread: 0.3, suffix: " cm²" }),
      explanation: `Area = πr² = 22/7 × ${rad}² = ${fmt(area)} cm².`,
      difficulty: 1,
    };
  }
  if (v === 1) {
    const rad = 7 * int(r, 1, 3), h = int(r, 5, 20);
    const vol = (22 / 7) * rad * rad * h;
    return {
      text: `Find the volume of a cylinder with radius ${rad} cm and height ${h} cm. (π = 22/7)`,
      ...numQ(r, vol, { spread: 0.3, suffix: " cm³" }),
      explanation: `V = πr²h = 22/7 × ${rad}² × ${h} = ${fmt(vol)} cm³.`,
      difficulty: 1,
    };
  }
  const l = int(r, 8, 30), b = int(r, 4, l - 1);
  return {
    text: `The perimeter of a rectangle is ${2 * (l + b)} m and its length is ${l} m. Find its area.`,
    ...numQ(r, l * b, { spread: 0.3, suffix: " m²" }),
    explanation: `Breadth = ${2 * (l + b)}/2 − ${l} = ${b} m. Area = ${l} × ${b} = ${l * b} m².`,
    difficulty: 1,
  };
};

const di: Gen = (r) => {
  const years = [2019, 2020, 2021, 2022, 2023];
  const A = years.map(() => 10 * int(r, 20, 90));
  const B = years.map(() => 10 * int(r, 20, 90));
  // make B's sum divisible by 5 for a clean average
  B[4] += (5 - ((B.reduce((s, x) => s + x, 0) / 10) % 5)) % 5 * 10;
  const table = { headers: ["Year", "Company A", "Company B"], rows: years.map((y, i) => [y, A[i], B[i]]) };
  const intro = "The table shows the production (in thousand units) of two companies over five years.";
  const sumA = A.reduce((s, x) => s + x, 0), sumB = B.reduce((s, x) => s + x, 0);
  const i = int(r, 0, 3);
  const pct = round2(((A[i + 1] - A[i]) / A[i]) * 100);
  const avgB = sumB / 5;
  const qs: QBody[] = [
    {
      text: `${intro}\nWhat is the ratio of the total production of Company A to that of Company B over all years?`,
      ...withOptions(r, ratioStr(sumA, sumB), [ratioStr(sumB, sumA), ratioStr(sumA + 10, sumB), ratioStr(sumA, sumB + 30), ratioStr(A[0], B[0])]),
      explanation: `Total A = ${sumA}, total B = ${sumB}. Ratio = ${ratioStr(sumA, sumB)}.`,
      difficulty: 2,
      table,
    },
    {
      text: `${intro}\nWhat is the percentage change in production of Company A from ${years[i]} to ${years[i + 1]}?`,
      ...withOptions(
        r,
        `${fmt(Math.abs(pct))}% ${pct >= 0 ? "increase" : "decrease"}`,
        [pct + 5, pct - 7, -pct, pct * 1.5, pct + 12].map((x) => `${fmt(Math.abs(round2(x)))}% ${x >= 0 ? "increase" : "decrease"}`),
      ),
      explanation: `Change = (${A[i + 1]} − ${A[i]})/${A[i]} × 100 = ${fmt(pct)}%.`,
      difficulty: 2,
      table,
    },
    {
      text: `${intro}\nWhat is the average annual production of Company B?`,
      ...numQ(r, avgB, { spread: 0.2, suffix: " thousand" }),
      explanation: `Sum of B = ${sumB}. Average = ${sumB}/5 = ${fmt(avgB)} thousand units.`,
      difficulty: 1,
      table,
    },
  ];
  return qs;
};

const algebra: Gen = (r) => {
  const v = int(r, 0, 2);
  const k = int(r, 3, 9);
  if (v === 0)
    return {
      text: `If x + 1/x = ${k}, then find the value of x² + 1/x².`,
      ...numQ(r, k * k - 2, { spread: 0.2 }),
      explanation: `x² + 1/x² = (x + 1/x)² − 2 = ${k * k} − 2 = ${k * k - 2}.`,
      difficulty: 1,
    };
  if (v === 1)
    return {
      text: `If x + 1/x = ${k}, then find the value of x³ + 1/x³.`,
      ...numQ(r, k ** 3 - 3 * k, { spread: 0.15 }),
      explanation: `x³ + 1/x³ = k³ − 3k = ${k ** 3} − ${3 * k} = ${k ** 3 - 3 * k}.`,
      difficulty: 2,
    };
  const s = int(r, 5, 15), p = int(r, 2, Math.floor((s * s) / 4));
  return {
    text: `If a + b = ${s} and ab = ${p}, find a² + b².`,
    ...numQ(r, s * s - 2 * p, { spread: 0.2 }),
    explanation: `a² + b² = (a + b)² − 2ab = ${s * s} − ${2 * p} = ${s * s - 2 * p}.`,
    difficulty: 1,
  };
};

const geometry: Gen = (r) => {
  const v = int(r, 0, 2);
  if (v === 0) {
    const sets = [[1, 2, 3], [2, 3, 4], [1, 1, 2], [2, 3, 5], [3, 4, 5], [1, 2, 6], [4, 5, 9], [2, 7, 9], [1, 3, 5]];
    const [a, b, c] = pick(r, sets);
    const sum = a + b + c, big = (180 * c) / sum;
    return {
      text: `The angles of a triangle are in the ratio ${a} : ${b} : ${c}. Find the largest angle.`,
      ...numQ(r, round2(big), { spread: 0.3, suffix: "°" }),
      explanation: `Largest angle = ${c}/${sum} × 180° = ${fmt(round2(big))}°.`,
      difficulty: 1,
    };
  }
  const n = pick(r, [5, 6, 8, 9, 10, 12, 15, 18, 20]);
  if (v === 1)
    return {
      text: `What is the measure of each exterior angle of a regular polygon with ${n} sides?`,
      ...numQ(r, 360 / n, { spread: 0.5, suffix: "°" }),
      explanation: `Each exterior angle = 360°/n = 360/${n} = ${360 / n}°.`,
      difficulty: 1,
    };
  return {
    text: `What is the sum of the interior angles of a polygon with ${n} sides?`,
    ...numQ(r, (n - 2) * 180, { spread: 0.25, suffix: "°" }),
    explanation: `Sum = (n − 2) × 180° = ${n - 2} × 180 = ${(n - 2) * 180}°.`,
    difficulty: 1,
  };
};

const trigonometry: Gen = (r) => {
  if (r() < 0.5) {
    const ang = pick(r, [30, 45, 60]);
    const d = ang === 30 ? 3 * int(r, 3, 15) : 5 * int(r, 2, 12);
    const correct = ang === 45 ? `${d} m` : ang === 60 ? `${d}√3 m` : `${d / 3}√3 m`;
    const dist = [`${d} m`, `${d}√3 m`, `${d / 3}√3 m`, `${d * 2} m`, `${d / 2} m`, `${d}√2 m`];
    return {
      text: `From a point ${d} m away from the foot of a tower, the angle of elevation of its top is ${ang}°. Find the height of the tower.`,
      ...withOptions(r, correct, dist),
      explanation: `h = d × tan ${ang}° = ${d} × ${ang === 45 ? "1" : ang === 60 ? "√3" : "1/√3"} = ${correct}.`,
      difficulty: 2,
    };
  }
  const exprs = [
    { t: "sin²30° + cos²30°", v: "1" },
    { t: "tan 45° + sin 30°", v: "3/2" },
    { t: "2 sin 30° × cos 60°", v: "1/2" },
    { t: "sec²45° − tan²45°", v: "1" },
    { t: "sin 60° × cos 30° + sin 30° × cos 60°", v: "1" },
    { t: "tan²60° + 2 tan²45°", v: "5" },
    { t: "cos 0° + sin 90° + tan 45°", v: "3" },
  ];
  const e = pick(r, exprs);
  return {
    text: `Find the value of: ${e.t}`,
    ...withOptions(r, e.v, ["0", "1", "2", "3", "1/2", "3/2", "5", "√3"]),
    explanation: `Use standard values: sin30 = 1/2, cos60 = 1/2, tan45 = 1, sin60 = cos30 = √3/2, tan60 = √3. Value = ${e.v}.`,
    difficulty: 1,
  };
};

export const QUANT_GENERATORS: Record<string, Gen> = {
  "q-simplification": simplification,
  "q-approximation": approximation,
  "q-number-series": numberSeries,
  "q-quadratic": quadratic,
  "q-number-system": numberSystem,
  "q-percentage": percentage,
  "q-profit-loss": profitLoss,
  "q-si-ci": siCi,
  "q-ratio": ratio,
  "q-average": average,
  "q-ages": ages,
  "q-time-work": timeWork,
  "q-speed": speed,
  "q-mixture": mixture,
  "q-probability": probability,
  "q-mensuration": mensuration,
  "q-di": di,
  "q-algebra": algebra,
  "q-geometry": geometry,
  "q-trigonometry": trigonometry,
};
