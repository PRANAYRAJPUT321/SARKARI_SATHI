import type { Question } from "@/data/types";
import type { Rng } from "./rng";

export type QBody = Omit<Question, "id" | "subject" | "topic">;
export type Gen = (r: Rng) => QBody | QBody[];
