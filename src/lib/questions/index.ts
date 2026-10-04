import { examBySlug } from "@/data/exams";
import { TOPICS, topicById } from "@/data/syllabus";
import type { Exam, Family, Question, SubjectId } from "@/data/types";
import { ENGLISH_GENERATORS } from "./english";
import { GK_GENERATORS } from "./gk";
import { QUANT_GENERATORS } from "./quant";
import { REASONING_GENERATORS } from "./reasoning";
import { hashString, mulberry32, shuffle, type Rng } from "./rng";
import type { Gen } from "./types";

export const GENERATORS: Record<string, Gen> = {
  ...QUANT_GENERATORS,
  ...REASONING_GENERATORS,
  ...ENGLISH_GENERATORS,
  ...GK_GENERATORS,
};

export interface PaperSection {
  name: string;
  subject: SubjectId;
  minutes?: number;
  marksPer: number;
  negPer: number;
  questions: Question[];
}

export interface Paper {
  title: string;
  examSlug: string;
  kind: string;
  seed: number;
  durationSec: number;
  sectionalTiming: boolean;
  sections: PaperSection[];
}

function trimOptions(r: Rng, q: Question, count: number): Question {
  if (q.options.length <= count) return q;
  if (q.options[4] === "No error") {
    // error-spotting keeps parts A–D; "No error" stays only when it is the answer
    return q.answer === 4 ? q : { ...q, options: q.options.slice(0, 4) };
  }
  const wrongIdx = shuffle(r, q.options.map((_, i) => i).filter((i) => i !== q.answer)).slice(0, count - 1);
  const keep = shuffle(r, [q.answer, ...wrongIdx]);
  // keep fixed-order option sets (e.g. quadratic / statement answers) in their original order
  const fixedOrder = q.options.some((o) => /^(Only|Either|Neither|Both|x [><=≥≤])/.test(o));
  const ordered = fixedOrder ? [...keep].sort((a, b) => a - b) : keep;
  return { ...q, options: ordered.map((i) => q.options[i]), answer: ordered.indexOf(q.answer) };
}

function eligibleTopics(subject: SubjectId, family: Family | "all", only?: string[]) {
  return TOPICS.filter(
    (t) => t.subject === subject && GENERATORS[t.id] && (only ? only.includes(t.id) : family === "all" || t.families === "all" || t.families.includes(family as Family)),
  );
}

/** Generate `count` questions for a subject, weighted by topic weight. */
export function generateSection(
  r: Rng,
  subject: SubjectId,
  count: number,
  opts: { family: Family | "all"; topics?: string[]; idPrefix: string; options: number },
): Question[] {
  const pool = eligibleTopics(subject, opts.family, opts.topics);
  const out: Question[] = [];
  const seen = new Set<string>();
  const totalW = pool.reduce((a, t) => a + t.weight, 0);
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    let x = r() * totalW;
    let topic = pool[0];
    for (const t of pool) {
      x -= t.weight;
      if (x <= 0) {
        topic = t;
        break;
      }
    }
    const res = GENERATORS[topic.id](r);
    const arr = Array.isArray(res) ? res : [res];
    // a set (puzzle/RC/DI) only goes in if at least two of its questions fit
    const room = count - out.length;
    if (arr.length > 1 && room < 2) continue;
    for (const body of arr.slice(0, room)) {
      const key = body.text + (body.passage ?? "").slice(0, 40);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(trimOptions(r, { ...body, id: `${opts.idPrefix}-${out.length}`, subject, topic: topic.id }, opts.options));
    }
  }
  return out;
}

export function buildFullPaper(exam: Exam, seed: number, title: string, kind = "full"): Paper {
  const r = mulberry32(seed);
  const sections = exam.sections.map((s, i) => ({
    name: s.name,
    subject: s.subject,
    minutes: exam.sectionalTiming ? s.minutes : undefined,
    marksPer: s.marks / s.questions,
    negPer: (s.negative ?? exam.negative) * (s.marks / s.questions),
    questions: generateSection(r, s.subject, s.questions, { family: exam.family, topics: s.topics, idPrefix: `${seed}-${i}`, options: exam.options }),
  }));
  return { title, examSlug: exam.slug, kind, seed, durationSec: exam.durationMin * 60, sectionalTiming: exam.sectionalTiming, sections };
}

export function buildSectional(exam: Exam, sectionIdx: number, seed: number): Paper {
  const s = exam.sections[sectionIdx];
  const r = mulberry32(seed);
  const minutes = s.minutes ?? Math.round((exam.durationMin * s.questions) / exam.sections.reduce((a, x) => a + x.questions, 0));
  return {
    title: `${exam.short} · ${s.name} – Sectional Test`,
    examSlug: exam.slug,
    kind: "sectional",
    seed,
    durationSec: minutes * 60,
    sectionalTiming: false,
    sections: [
      {
        name: s.name,
        subject: s.subject,
        marksPer: s.marks / s.questions,
        negPer: (s.negative ?? exam.negative) * (s.marks / s.questions),
        questions: generateSection(r, s.subject, s.questions, { family: exam.family, topics: s.topics, idPrefix: `${seed}-0`, options: exam.options }),
      },
    ],
  };
}

export function buildTopicTest(topicId: string, seed: number, count = 15, examSlug?: string): Paper {
  const t = topicById(topicId)!;
  const exam = examSlug ? examBySlug(examSlug) : undefined;
  const r = mulberry32(seed);
  const perQ = t.subject === "quant" || t.subject === "reasoning" ? 50 : 30;
  const questions = generateSection(r, t.subject, count, { family: "all", topics: [topicId], idPrefix: `${seed}-0`, options: exam?.options ?? 4 });
  return {
    title: `${t.name} – Topic Test`,
    examSlug: exam?.slug ?? "practice",
    kind: "topic",
    seed,
    durationSec: questions.length * perQ,
    sectionalTiming: false,
    sections: [
      {
        name: t.name,
        subject: t.subject,
        marksPer: 1,
        negPer: exam?.negative ?? 0.25,
        questions,
      },
    ],
  };
}

/** 12-question mixed daily challenge (3 per subject relevant to the exam). */
export function buildDailyChallenge(dayKey: string, userId: string, exam?: Exam): Paper {
  const seed = hashString(`${dayKey}:${userId}`);
  const r = mulberry32(seed);
  const family = exam?.family ?? "all";
  const subjects: SubjectId[] = exam ? Array.from(new Set(exam.sections.map((s) => s.subject))) : ["quant", "reasoning", "english", "gk"];
  const per = Math.max(3, Math.floor(12 / subjects.length));
  return {
    title: `Daily Challenge · ${dayKey}`,
    examSlug: exam?.slug ?? "practice",
    kind: "daily",
    seed,
    durationSec: per * subjects.length * 40,
    sectionalTiming: false,
    sections: subjects.map((s, i) => ({
      name: s === "quant" ? "Quants" : s === "reasoning" ? "Reasoning" : s === "english" ? "English" : "General Awareness",
      subject: s,
      marksPer: 1,
      negPer: exam?.negative ?? 0.25,
      questions: generateSection(r, s, per, { family, idPrefix: `${seed}-${i}`, options: exam?.options ?? 4 }),
    })),
  };
}

export const mockSeed = (slug: string, n: number) => hashString(`${slug}:mock:${n}`);
export const pypSeed = (slug: string, year: number) => hashString(`${slug}:pyp:${year}`);
export const sectionalSeed = (slug: string, idx: number, n: number) => hashString(`${slug}:sec:${idx}:${n}`);

/** Strip answers & explanations before sending to the browser during a live test. */
export function publicPaper(p: Paper) {
  return {
    ...p,
    sections: p.sections.map((s) => ({
      ...s,
      questions: s.questions.map(({ answer: _a, explanation: _e, ...q }) => q),
    })),
  };
}
export type PublicPaper = ReturnType<typeof publicPaper>;
