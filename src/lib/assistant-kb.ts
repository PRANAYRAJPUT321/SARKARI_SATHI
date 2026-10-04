import { EXAM_EVENTS, eventDateText } from "@/data/calendar";
import { EXAMS, totalMarks, totalQuestions } from "@/data/exams";
import { dayKey } from "./dates";

/** Help articles – the single source of truth for the in-app assistant. */
export interface HelpArticle {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
}

export const HELP: HelpArticle[] = [
  {
    id: "about",
    title: "What is Sarkari Sathi?",
    keywords: ["about", "made", "built", "pranay", "creator", "developer", "owner", "sathi", "sarkari"],
    answer:
      "Sarkari Sathi is a free preparation app for Indian government exam aspirants, built by **Pranay**. It covers 20 exams across Banking, Railways, SSC, RBI, Insurance and Intelligence/Police with full mocks, previous-year pattern papers, cut-offs, a syllabus tracker, a study planner, analytics and reminders.",
  },
  {
    id: "signup",
    title: "Sign up and log in",
    keywords: ["sign", "signup", "register", "account", "login", "log", "password", "email", "forgot", "reset"],
    answer:
      "Tap **Sign up free**, enter your name, email, a password (6+ characters), your category and target exams. Log in later from **Log in** with the same email and password. There is no self-service password reset yet, so keep your password safe.",
  },
  {
    id: "install",
    title: "Install the app on phone or laptop",
    keywords: ["install", "download", "app", "mobile", "phone", "android", "iphone", "ios", "laptop", "desktop", "pc", "home", "screen", "shortcut"],
    answer:
      "Tap **Install app** in the top bar (available before and after login).\n- **Android (Chrome):** confirm the install prompt, or ⋮ menu → Install app.\n- **iPhone/iPad (Safari):** Share → Add to Home Screen.\n- **Windows/Mac (Chrome/Edge):** install icon in the address bar → Install. Safari on Mac: File → Add to Dock.",
  },
  {
    id: "notifications",
    title: "Phone notifications and reminders",
    keywords: ["notification", "notifications", "push", "enable", "turn", "permission", "6", "am", "reminder", "reminders", "alert", "morning", "bell", "remind", "notify"],
    answer:
      "Open **Notifications** (bell icon → View all) or **Profile** and tap **Turn on** under *Phone & laptop notifications*. You'll get an **early-morning plan (~6–7 AM IST)** with today's tasks and days left for your exam, plus a **reminder when each planned task starts**. On iPhone, install the app first (Share → Add to Home Screen) and enable it from the installed app. Turn it on separately on each device.",
  },
  {
    id: "theme",
    title: "Dark and light theme",
    keywords: ["dark", "light", "theme", "mode", "night", "colour", "color"],
    answer: "Tap the **moon/sun** icon in the top bar to switch between dark and light theme. Your choice is remembered on that device.",
  },
  {
    id: "mocks",
    title: "Taking a mock test",
    keywords: ["mock", "test", "full", "paper", "start", "attempt", "exam", "practice", "random", "fresh"],
    answer:
      "Go to **Mock Tests** → choose your exam. You'll find **30 full mocks**, a **Fresh random mock** button (a new paper every time), **previous-year pattern papers (2016–2025)** and **sectional tests**. Each mock follows the real pattern, timing and negative marking of that exam. Unfinished tests can be resumed from the Mocks page.",
  },
  {
    id: "pyp",
    title: "Previous-year papers",
    keywords: ["previous", "year", "pyp", "old", "past", "papers", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025", "real"],
    answer:
      "Each exam has one **previous-year pattern paper per year (2016–2025)**. They contain **original practice questions built on that year's exam pattern and topic weightage** – not copies of the official papers (those are copyrighted). The year's cut-off is shown so you know the target. Official papers/answer keys, when released, are on the exam's official website (linked on the mock page).",
  },
  {
    id: "interface",
    title: "Test screen, palette and sections",
    keywords: ["palette", "mark", "review", "section", "sectional", "timer", "lock", "locked", "previous", "next", "keyboard", "shortcut", "submit", "resume", "exit", "colour", "green", "red", "purple"],
    answer:
      "The question palette shows **green = answered, red = not answered, grey = not visited, purple = marked for review** (purple with a green ring = answered & marked). In exams with **sectional timing** (e.g. SBI/IBPS prelims, SSC CPO) each section has its own timer and locks when time ends or you tap *Submit section*. Shortcuts: **1–5** choose option, **N** next, **P** previous, **M** mark. Answers autosave; tap ✕ → *Save & exit* to resume later.",
  },
  {
    id: "negative",
    title: "Negative marking",
    keywords: ["negative", "marking", "minus", "deduct", "deduction", "wrong", "penalty", "quarter", "third", "0.25", "1/3", "0.5"],
    answer:
      "Every mock uses its exam's real scheme. Banking/RBI/Insurance/IB ACIO/SSC CPO: **−¼ mark** per wrong answer. SSC CGL & CHSL: **−0.50** (each question is 2 marks). SSC GD: **−0.25** (each question 2 marks). SSC MTS: **no negative in Session 1, −1 in Session 2** (questions are 3 marks). RRB NTPC/Group D/ALP/JE: **−⅓ mark**. The exam page shows the break-even (e.g. 4 wrong answers cancel 1 right with −¼).",
  },
  {
    id: "report",
    title: "Test report and time analysis",
    keywords: ["report", "result", "analysis", "score", "time", "seconds", "spent", "ideal", "sink", "feedback", "solution", "solutions", "explanation", "wasted"],
    answer:
      "After submitting you get a report with your **score vs the cut-off**, section-wise table, a **bar chart of seconds spent on every question vs the ideal time**, the **biggest time sinks**, rushed guesses, **marks lost to negative marking**, how many more questions you could have attempted, topic-wise accuracy and **full solutions**. Bookmark tricky questions with the 🔖 icon.",
  },
  {
    id: "practice",
    title: "Daily challenge and topic tests",
    keywords: ["daily", "challenge", "topic", "practice", "streak", "quick", "weak"],
    answer:
      "Open **Practice**. The **Daily Challenge** is 12 mixed questions (~8 min) – the same set all day, a new one tomorrow – and keeps your streak alive. Below it, every topic has a **15-question topic test** with fresh questions each time; topics under 60% accuracy are marked *weak*.",
  },
  {
    id: "dashboard",
    title: "Dashboard, readiness, streak, XP",
    keywords: ["dashboard", "readiness", "streak", "xp", "level", "badge", "badges", "coach", "goal", "home"],
    answer:
      "The **Dashboard** greets you by name and shows today's study goal ring, **streak**, XP/level, **exam countdowns**, a **readiness %** (mix of syllabus covered and your last mock scores vs the cut-off), the coach's next steps, today's plan, score trend, subject mastery, weak topics, badges and a 12-week study heatmap.",
  },
  {
    id: "syllabus",
    title: "Syllabus tracker",
    keywords: ["syllabus", "topic", "topics", "tracker", "mastered", "revising", "learning", "notes", "formula", "formulas", "tricks"],
    answer:
      "Open **Syllabus Tracker** and set each topic to *Not started → Learning → Revising → Mastered*. Tap a topic for **concept notes, formulas, shortcut tricks, daily solved examples** and a topic test. Your readiness score and auto-plan use these statuses.",
  },
  {
    id: "planner",
    title: "Study planner and calendar",
    keywords: ["planner", "plan", "calendar", "schedule", "task", "tasks", "auto", "generate", "timetable", "routine"],
    answer:
      "Open **Study Planner**. Tap a day to add tasks with a time, or use **Auto-generate my study plan**: pick the exam and date, mocks/day and study hours – it creates daily topic sessions, mocks (more in the last 10 days) and Sunday revision. The calendar also shows **officially announced exam dates**. Turn on notifications to be reminded when tasks start.",
  },
  {
    id: "cutoffs",
    title: "Cut-offs",
    keywords: ["cutoff", "cut", "off", "cutoffs", "passing", "qualifying", "marks", "category", "obc", "sc", "st", "ews", "general"],
    answer:
      "Open **Cut-offs** (or an exam's page) for category-wise previous-year cut-offs (last 4–5 years where published) with source links. Your category is highlighted – change it in **Profile**. Some exams publish state- or zone-wise cut-offs, shown that way. Always confirm with the official notice.",
  },
  {
    id: "analytics",
    title: "Analytics",
    keywords: ["analytics", "progress", "history", "accuracy", "trend", "performance", "chart", "stats"],
    answer: "Open **Analytics** for your score trend, subject balance, topic-wise accuracy and speed (weakest first) and the full test history with links to every report.",
  },
  {
    id: "revision",
    title: "Flashcards, tips and bookmarks",
    keywords: ["flashcard", "flashcards", "gk", "vocab", "vocabulary", "tips", "tricks", "bookmark", "bookmarks", "revise", "revision"],
    answer: "**GK Flashcards** has decks for banking terms, HQs, Constitution articles, capitals, vocabulary, idioms and more. **Tips & Tricks** has strategy, negative-marking maths and exam-day checklists. **Bookmarks** keeps questions you saved from reports.",
  },
  {
    id: "profile",
    title: "Profile, exams and category",
    keywords: ["profile", "change", "edit", "exam", "exams", "target", "category", "goal", "hours", "name", "delete", "account", "primary"],
    answer:
      "Open **Profile** to change your name, category (for cut-off comparison) and daily goal hours, add/remove **target exams**, set your own exam date and choose the ★ primary exam. You can also delete your account and all data there.",
  },
  {
    id: "focus",
    title: "Focus timer",
    keywords: ["focus", "timer", "pomodoro", "study", "time", "minutes"],
    answer: "Tap **Focus** in the top bar, choose 25/45/60 minutes and start. Completed sessions (5+ minutes) are added to today's study time and streak.",
  },
  {
    id: "dates",
    title: "Exam dates",
    keywords: ["date", "dates", "when", "upcoming", "schedule", "exam", "notification", "calendar", "tentative"],
    answer: "", // filled in dynamically from the verified calendar
  },
  {
    id: "guide",
    title: "User guide",
    keywords: ["guide", "help", "manual", "pdf", "how", "use", "tutorial"],
    answer: "Download the 2-page **user guide with a flowchart** from the home page footer (Sarkari-Sathi-User-Guide.pdf), or ask me anything about a feature.",
  },
];

function datesAnswer() {
  const today = dayKey();
  const up = EXAM_EVENTS.filter((e) => (e.end ?? e.start) >= today);
  const lines = up.map((e) => `- **${EXAMS.find((x) => x.slug === e.examSlug)?.short} ${e.stage}:** ${eventDateText(e)} (${e.status === "confirmed" ? "official" : "official calendar, tentative"})`);
  return `Officially announced upcoming exams:\n${lines.join("\n")}\nOther exams don't have an announced date yet – I won't guess. They also appear in the **Study Planner** calendar.`;
}

export function article(id: string) {
  const a = HELP.find((h) => h.id === id)!;
  return id === "dates" ? { ...a, answer: datesAnswer() } : a;
}

/** Keyword retrieval used when the AI model is unavailable. */
export function searchHelp(question: string) {
  const words = question.toLowerCase().replace(/[^a-z0-9/.\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const scored = HELP.map((h) => {
    const hay = new Set([...h.keywords, ...h.title.toLowerCase().split(/\W+/)]);
    let score = 0;
    for (const w of words) if (hay.has(w)) score += h.keywords.includes(w) ? 2 : 1;
    return { id: h.id, score };
  }).sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0).slice(0, 2).map((s) => article(s.id));
}

/** Compact knowledge text for the model's system prompt. */
export function knowledgeText() {
  const help = HELP.map((h) => `## ${h.title}\n${article(h.id).answer}`).join("\n\n");
  const exams = EXAMS.map((e) => {
    const latest = e.cutoff.rows.length ? Math.max(...e.cutoff.rows.map((r) => r.year)) : null;
    const gen = latest ? e.cutoff.rows.filter((r) => r.year === latest && r.GEN != null).map((r) => `${r.label ? r.label + " " : ""}${r.GEN}`).join(", ") : "";
    return `- ${e.short} (${e.name}, ${e.body}) – ${e.stage}: ${totalQuestions(e)} Qs, ${totalMarks(e)} marks, ${e.durationMin} min${e.sectionalTiming ? " with sectional timing" : ""}; sections: ${e.sections.map((s) => `${s.name} ${s.questions}Q${s.minutes ? "/" + s.minutes + "m" : ""}`).join(", ")}; negative: ${e.negativeLabel}; eligibility: ${e.eligibility}; age: ${e.ageLimit}; official site: ${e.officialSite}${gen ? `; latest GEN cut-off (${latest}, out of ${e.cutoff.unit}): ${gen}` : ""}.`;
  }).join("\n");
  return `# App help\n${help}\n\n# Exams in the app\n${exams}`;
}
