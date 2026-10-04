import { topicById } from "@/data/syllabus";
import type { SubjectId } from "@/data/types";
import type { Paper } from "./questions";

export interface Response {
  qid: string;
  chosen: number | null;
  timeSec: number;
  marked?: boolean;
}

export type QStatus = "correct" | "wrong" | "skipped";
export type QFlag = "time-sink" | "slow-correct" | "rushed-wrong" | "quick-win" | null;

export interface QResult {
  qid: string;
  n: number;
  section: number;
  topic: string;
  status: QStatus;
  timeSec: number;
  idealSec: number;
  flag: QFlag;
  marks: number;
}

export interface SectionResult {
  name: string;
  subject: SubjectId;
  score: number;
  max: number;
  correct: number;
  wrong: number;
  skipped: number;
  timeSec: number;
  allowedSec: number;
  accuracy: number;
}

export interface TopicResult {
  topic: string;
  name: string;
  subject: SubjectId;
  correct: number;
  wrong: number;
  skipped: number;
  timeSec: number;
}

export interface Summary {
  score: number;
  maxScore: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  timeTakenSec: number;
  negativeLost: number;
  scoreIfNoWrong: number;
  timeWastedSec: number;
  extraQuestionsPossible: number;
  sections: SectionResult[];
  topics: TopicResult[];
  questions: QResult[];
  insights: { tone: "good" | "warn" | "bad" | "info"; text: string }[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function gradePaper(paper: Paper, responses: Response[]): Summary {
  const byId = new Map(responses.map((r) => [r.qid, r]));
  const totalQ = paper.sections.reduce((a, s) => a + s.questions.length, 0);
  const questions: QResult[] = [];
  const sections: SectionResult[] = [];
  const topics = new Map<string, TopicResult>();
  let n = 0;

  paper.sections.forEach((s, si) => {
    const allowedSec = s.minutes ? s.minutes * 60 : Math.round((paper.durationSec * s.questions.length) / totalQ);
    const idealSec = allowedSec / Math.max(1, s.questions.length);
    const sec: SectionResult = { name: s.name, subject: s.subject, score: 0, max: r2(s.marksPer * s.questions.length), correct: 0, wrong: 0, skipped: 0, timeSec: 0, allowedSec, accuracy: 0 };
    for (const q of s.questions) {
      n++;
      const resp = byId.get(q.id);
      const t = Math.round(resp?.timeSec ?? 0);
      const status: QStatus = resp?.chosen == null ? "skipped" : resp.chosen === q.answer ? "correct" : "wrong";
      const marks = status === "correct" ? s.marksPer : status === "wrong" ? -s.negPer : 0;
      let flag: QFlag = null;
      if (status === "wrong" && t > idealSec * 1.75) flag = "time-sink";
      else if (status === "correct" && t > idealSec * 2) flag = "slow-correct";
      else if (status === "wrong" && t < Math.max(8, idealSec * 0.3)) flag = "rushed-wrong";
      else if (status === "correct" && t <= idealSec * 0.6) flag = "quick-win";
      questions.push({ qid: q.id, n, section: si, topic: q.topic, status, timeSec: t, idealSec: Math.round(idealSec), flag, marks: r2(marks) });
      sec.timeSec += t;
      sec[status]++;
      sec.score += marks;
      const tr = topics.get(q.topic) ?? { topic: q.topic, name: topicById(q.topic)?.name ?? q.topic, subject: s.subject, correct: 0, wrong: 0, skipped: 0, timeSec: 0 };
      tr[status]++;
      tr.timeSec += t;
      topics.set(q.topic, tr);
    }
    sec.score = r2(sec.score);
    sec.accuracy = sec.correct + sec.wrong ? Math.round((sec.correct / (sec.correct + sec.wrong)) * 100) : 0;
    sections.push(sec);
  });

  const correct = sections.reduce((a, s) => a + s.correct, 0);
  const wrong = sections.reduce((a, s) => a + s.wrong, 0);
  const skipped = sections.reduce((a, s) => a + s.skipped, 0);
  const score = r2(sections.reduce((a, s) => a + s.score, 0));
  const maxScore = r2(sections.reduce((a, s) => a + s.max, 0));
  const negativeLost = r2(questions.filter((q) => q.status === "wrong").reduce((a, q) => a - q.marks, 0));
  const timeTakenSec = questions.reduce((a, q) => a + q.timeSec, 0);
  const wrongTime = questions.filter((q) => q.status === "wrong").reduce((a, q) => a + Math.max(0, q.timeSec - q.idealSec), 0);
  const slowTime = questions.filter((q) => q.flag === "slow-correct").reduce((a, q) => a + Math.max(0, q.timeSec - q.idealSec), 0);
  const avgIdeal = paper.durationSec / Math.max(1, totalQ);
  const timeWastedSec = Math.round(wrongTime + slowTime * 0.5);
  const extraQuestionsPossible = Math.floor(timeWastedSec / avgIdeal);

  const summary: Summary = {
    score,
    maxScore,
    correct,
    wrong,
    skipped,
    accuracy: correct + wrong ? Math.round((correct / (correct + wrong)) * 100) : 0,
    timeTakenSec,
    negativeLost,
    scoreIfNoWrong: r2(score + negativeLost),
    timeWastedSec,
    extraQuestionsPossible,
    sections,
    topics: [...topics.values()],
    questions,
    insights: [],
  };
  summary.insights = buildInsights(summary);
  return summary;
}

function buildInsights(s: Summary): Summary["insights"] {
  const out: Summary["insights"] = [];
  const sinks = s.questions.filter((q) => q.flag === "time-sink").sort((a, b) => b.timeSec - a.timeSec);
  if (sinks.length) {
    const list = sinks.slice(0, 3).map((q) => `Q${q.n} (${q.timeSec}s vs ideal ${q.idealSec}s)`).join(", ");
    out.push({ tone: "bad", text: `Time sinks: you spent far too long on ${list} and still got them wrong. Skip such questions after ~${Math.round(sinks[0].idealSec * 1.5)}s and come back later.` });
  }
  if (s.timeWastedSec > 30)
    out.push({ tone: "warn", text: `About ${Math.round(s.timeWastedSec / 60)} min ${s.timeWastedSec % 60}s went into wrong answers and over-long correct ones. Used well, that is ~${s.extraQuestionsPossible} more questions you could have attempted.` });
  const rushed = s.questions.filter((q) => q.flag === "rushed-wrong");
  if (rushed.length >= 2)
    out.push({ tone: "warn", text: `${rushed.length} answers were marked in a few seconds and were wrong (e.g. Q${rushed.slice(0, 3).map((q) => q.n).join(", Q")}). Blind guessing costs marks under negative marking.` });
  if (s.negativeLost > 0)
    out.push({ tone: "bad", text: `Negative marking cost you ${s.negativeLost} marks. Without the wrong answers your score would have been ${s.scoreIfNoWrong}.` });
  const slow = s.questions.filter((q) => q.flag === "slow-correct");
  if (slow.length)
    out.push({ tone: "info", text: `${slow.length} correct answers took more than double the ideal time (Q${slow.slice(0, 4).map((q) => q.n).join(", Q")}). Learn shortcuts for these topics to bank time.` });
  for (const sec of s.sections) {
    if (sec.correct + sec.wrong === 0) out.push({ tone: "bad", text: `You did not attempt anything in ${sec.name}. Never leave a section blank – sectional cut-offs apply in many exams.` });
    else if (sec.accuracy < 60) out.push({ tone: "bad", text: `${sec.name}: accuracy only ${sec.accuracy}%. Attempt fewer, surer questions here until accuracy crosses 80%.` });
    else if (sec.accuracy >= 90 && sec.correct >= 5) out.push({ tone: "good", text: `${sec.name}: excellent ${sec.accuracy}% accuracy. You can afford to attempt a few more questions here.` });
    if (sec.timeSec < sec.allowedSec * 0.6 && sec.skipped > 3) out.push({ tone: "warn", text: `${sec.name}: you used only ${Math.round(sec.timeSec / 60)} of ${Math.round(sec.allowedSec / 60)} minutes but skipped ${sec.skipped} questions. Use the remaining time to attempt easy ones.` });
  }
  const weak = s.topics.filter((t) => t.correct + t.wrong >= 2 && t.correct / (t.correct + t.wrong) < 0.5).map((t) => t.name);
  if (weak.length) out.push({ tone: "info", text: `Weak topics in this test: ${weak.slice(0, 5).join(", ")}. Take a topic test on each from the Practice page.` });
  const quick = s.questions.filter((q) => q.flag === "quick-win").length;
  if (quick >= 5) out.push({ tone: "good", text: `${quick} questions solved quickly and correctly – these are your strengths. Attempt such questions first in the real exam.` });
  if (!out.length) out.push({ tone: "good", text: "Well-balanced attempt! Keep the same strategy and increase difficulty." });
  return out;
}

/** XP awarded for a submitted attempt */
export function xpFor(s: Summary) {
  return Math.max(5, s.correct * 4 + Math.round(s.accuracy / 10) * 2);
}
