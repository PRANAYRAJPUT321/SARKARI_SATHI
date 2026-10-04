import { examBySlug } from "../src/data/exams";
import { buildFullPaper } from "../src/lib/questions";
const p = buildFullPaper(examBySlug(process.argv[2] ?? "ssc-cgl")!, Number(process.argv[3] ?? 7), "x");
for (const s of p.sections) {
  console.log("=====", s.name, s.questions.length, "marks/q", s.marksPer, "neg", s.negPer);
  for (const q of s.questions.slice(0, 7)) console.log(`[${q.topic}] ${q.passage ? "(P) " : ""}${q.text.replace(/\n/g, " | ")}\n   ${q.options.map((o, i) => (i === q.answer ? "*" : "") + o).join("  /  ")}`);
}
