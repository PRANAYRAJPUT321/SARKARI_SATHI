import type { getDashboard } from "./stats";

type D = Awaited<ReturnType<typeof getDashboard>>;
export interface Advice { icon: string; text: string; href: string; cta: string; tone: "good" | "warn" | "bad" | "info" }

/** Personalised "what to do next" list for the dashboard. */
export function coachAdvice(d: D, goalMin: number): Advice[] {
  const out: Advice[] = [];
  const first = d.user.name.split(" ")[0];
  const primary = d.examCards[0];
  if (d.totalAttempts === 0)
    out.push({ icon: "🚀", tone: "info", text: `${first}, start with a full mock${primary ? ` of ${primary.short}` : ""} to get your baseline score – don't worry about the result.`, href: primary ? `/mocks/${primary.slug}` : "/mocks", cta: "Take first mock" });
  if (d.todayMinutes < goalMin) {
    const left = goalMin - d.todayMinutes;
    out.push({ icon: "⏱️", tone: d.todayMinutes === 0 ? "warn" : "info", text: `${Math.floor(left / 60)}h ${left % 60}m left to hit today's ${Math.round(goalMin / 60)}-hour goal. Start a focus session or a sectional test.`, href: "/practice", cta: "Practice now" });
  } else out.push({ icon: "🏆", tone: "good", text: `Daily goal achieved! ${d.todayMinutes} minutes today. A quick revision of flashcards will lock in the learning.`, href: "/flashcards", cta: "Revise GK" });
  for (const c of d.examCards.slice(0, 2)) {
    if (c.daysLeft != null && c.daysLeft >= 0 && c.daysLeft <= 60)
      out.push({ icon: "🎯", tone: c.daysLeft <= 15 ? "bad" : "warn", text: `${c.daysLeft} days to ${c.short}. Recommended: ${c.mocksPerDay} full mock${c.mocksPerDay > 1 ? "s" : ""} per day + analysis. Readiness is ${c.readiness}%.`, href: `/mocks/${c.slug}`, cta: "Open mocks" });
    if (c.cutoff && c.lastScore && c.lastScore.score < c.cutoff.scaled)
      out.push({ icon: "📉", tone: "bad", text: `Your last ${c.short} mock (${c.lastScore.score}) is below the ${c.cutoff.year} cut-off (${c.cutoff.scaled}). Focus on accuracy in your strongest section first.`, href: "/analytics", cta: "See analysis" });
  }
  if (d.weak[0]) out.push({ icon: "🛠️", tone: "warn", text: `Weakest topic: ${d.weak[0].name} (${d.weak[0].accuracy}% accuracy). Read the tricks and take a 15-question topic test.`, href: `/syllabus/${d.weak[0].id}`, cta: "Fix it" });
  if (d.overallCoverage < 30) out.push({ icon: "📘", tone: "info", text: `Only ${d.overallCoverage}% of the syllabus is marked as covered. Update the Syllabus Tracker so your plan and readiness are accurate.`, href: "/syllabus", cta: "Update syllabus" });
  if (d.streak === 0) out.push({ icon: "🔥", tone: "warn", text: "Start a new streak today – even the 12-question Daily Challenge counts.", href: "/practice", cta: "Daily challenge" });
  return out.slice(0, 5);
}
