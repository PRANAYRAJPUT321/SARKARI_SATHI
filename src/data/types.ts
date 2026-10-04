export type SubjectId = "quant" | "reasoning" | "english" | "gk";

/** Exam families decide which topics appear (e.g. quadratic equations are a banking favourite, trigonometry is SSC-only). */
export type Family = "bank" | "ssc" | "rrb" | "ib" | "insurance" | "regulator";

export interface Topic {
  id: string;
  subject: SubjectId;
  name: string;
  /** relative weight inside a subject when generating a mock (1-5) */
  weight: number;
  families: Family[] | "all";
  /** short concept explanation */
  concept: string;
  formulas?: string[];
  tricks: string[];
  /** typical number of questions asked, for display */
  asked?: string;
}

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
  color: string;
  icon: string;
  description: string;
}

export interface Section {
  name: string;
  subject: SubjectId;
  questions: number;
  marks: number;
  /** sectional time limit in minutes, only when exam.sectionalTiming */
  minutes?: number;
  /** restrict questions to these topic ids (e.g. General Science for RRB) */
  topics?: string[];
  /** override exam level negative marking (fraction of question marks) */
  negative?: number;
}

export interface CutoffRow {
  year: number;
  label?: string;
  GEN?: number;
  OBC?: number;
  EWS?: number;
  SC?: number;
  ST?: number;
}

export interface Exam {
  slug: string;
  name: string;
  short: string;
  body: string;
  category: "Banking" | "Railways" | "SSC" | "RBI & Regulators" | "Insurance" | "Intelligence & Police";
  family: Family;
  stage: string;
  officialSite: string;
  durationMin: number;
  sectionalTiming: boolean;
  options: 4 | 5;
  sections: Section[];
  /** negative marks as a fraction of the marks for the question (0.25, 1/3 ...) */
  negative: number;
  negativeLabel: string;
  qualifyingNote?: string;
  eligibility: string;
  ageLimit: string;
  selection: string[];
  cutoff: { unit: number; note: string; rows: CutoffRow[]; source: string };
  tips: string[];
  color: string;
}

export interface Question {
  id: string;
  subject: SubjectId;
  topic: string;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
  table?: { headers: string[]; rows: (string | number)[][] };
  passage?: string;
}
