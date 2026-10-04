import { EXAMS, PYP_YEARS } from "../src/data/exams";
import { TOPICS } from "../src/data/syllabus";
import { buildFullPaper, buildTopicTest, GENERATORS, mockSeed, pypSeed } from "../src/lib/questions";

let problems = 0;
const check = (label: string, q: any) => {
  const bad =
    !q.text || q.answer < 0 || q.answer >= q.options.length || new Set(q.options).size !== q.options.length || q.options.length < 4 ||
    q.options.some((o: string) => o === undefined || o === "" || /NaN|undefined|Infinity/.test(o)) || /NaN|undefined/.test(q.text + q.explanation);
  if (bad) {
    problems++;
    if (problems < 25) console.log("BAD", label, q.topic, JSON.stringify({ t: q.text.slice(0, 120), o: q.options, a: q.answer }));
  }
};
for (const t of TOPICS) if (!GENERATORS[t.id]) console.log("no generator for", t.id);
let n = 0;
for (const e of EXAMS) {
  for (let m = 1; m <= 15; m++) {
    const p = buildFullPaper(e, mockSeed(e.slug, m), "x");
    p.sections.forEach((s, i) => {
      if (s.questions.length !== e.sections[i].questions) console.log("COUNT", e.slug, s.name, s.questions.length);
      s.questions.forEach((q) => (n++, check(e.slug, q)));
    });
  }
  for (const y of PYP_YEARS) buildFullPaper(e, pypSeed(e.slug, y), "x").sections.forEach((s) => s.questions.forEach((q) => (n++, check(e.slug + y, q))));
}
for (const t of TOPICS) for (let s = 0; s < 30; s++) buildTopicTest(t.id, s * 7919 + 1).sections[0].questions.forEach((q) => (n++, check(t.id, q)));
console.log("checked", n, "questions; problems:", problems);
