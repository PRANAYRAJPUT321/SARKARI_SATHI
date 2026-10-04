# Sarkari Sathi 🇮🇳

**Your daily companion to a Sarkari Naukri.** A full-stack preparation app for Indian government exams – Banking, Railways, SSC, RBI & regulators, Insurance and Intelligence/Police – built around one loop: **practise → analyse → fix weak areas → repeat**.

## Features

| Area | What you get |
|---|---|
| **20 exams** | SBI PO/Clerk, IBPS PO/Clerk/RRB PO/RRB Clerk, RBI Grade B/Assistant, SSC CGL (Income Tax/GST Inspector)/CHSL/MTS/GD/CPO, RRB NTPC/Group D/ALP/JE, LIC AAO, NIACL AO, IB ACIO |
| **Exact exam patterns** | Sections, question counts, marks, sectional vs composite timing and the right **negative marking** (¼, ⅓, 0.5 of 2, 1 of 3, none in SSC MTS Session 1…) |
| **Mock tests** | 30 numbered full mocks + unlimited fresh random mocks per exam, **previous-year pattern papers 2016–2025**, 5 sectional sets per section, topic tests and a daily challenge |
| **Real exam interface** | Question palette (answered / not answered / marked / not visited), mark for review, section lock with per-section timers, auto-submit, keyboard shortcuts, autosave & resume |
| **Feedback report** | Score vs cut-off, section table, **time spent on every question vs ideal time**, time sinks, rushed guesses, marks lost to negative marking, "you could have attempted N more questions", topic-wise accuracy, full solutions, bookmarks |
| **Cut-offs** | Category-wise (GEN/OBC/EWS/SC/ST) previous-year cut-offs for the last 4–5 years with sources; compared against your mocks |
| **Syllabus tracker** | 56 topics across Quants, Reasoning, English and GA with concepts, formulas, shortcut tricks, daily solved examples and status tracking |
| **Dashboard** | Personalised greeting, exam countdowns, readiness score, daily goal ring, streak, XP/levels, badges, score trend, weekly study chart, subject mastery radar, weak/strong topics, 12-week heatmap and a "coach" with next actions |
| **Study planner** | Calendar, manual tasks, and **auto-generated day-by-day plans** till the exam (topics + N mocks/day + Sunday revision, ramping up in the last 10 days) |
| **Motivation & reminders** | Daily in-app notifications (countdown, today's tasks, streak saver), browser notifications at task time, Pomodoro focus timer that logs study time |
| **Revision** | GK & vocabulary flashcards, tips & tricks library, exam-day checklist, bookmarked questions |
| **UX** | Responsive (mobile bottom nav), dark mode, accessible charts |

## Tech stack

- **Next.js 15** (App Router, Server Components, Server Actions) + **React 19** + **TypeScript**
- **Prisma** ORM with **SQLite** (zero-config locally; switch `provider` to `postgresql` for production)
- **Tailwind CSS**, **Recharts**, **lucide-react**
- Auth: email + password (bcrypt) with a signed JWT session cookie (`jose`)

## Getting started

```bash
cp .env.example .env          # set AUTH_SECRET to a long random string
npm install                   # also runs `prisma generate`
npm run db:push               # creates the SQLite database
npm run dev                   # http://localhost:3000
```

Production: `npm run build && npm start`.

### Deploying on Vercel
The live app runs on Vercel without an external database:

- `DATABASE_URL=file:/tmp/sarkari.db` – SQLite in the function's writable `/tmp`.
- A **private Vercel Blob store** connected to the project (`BLOB_READ_WRITE_TOKEN`). `src/lib/db-sync.ts` restores the database file from Blob on a cold start (or creates it from the generated schema) and uploads a consistent `VACUUM INTO` snapshot shortly after writes.
- `AUTH_SECRET` – any long random string.

This is ideal for a personal/low-traffic deployment. For many concurrent users, switch to a hosted Postgres (Neon / Prisma Postgres via the Vercel Marketplace): change `provider` to `postgresql` in `prisma/schema.prisma`, set `DATABASE_URL`, remove the absolute file path, and run `npx prisma db push`.

## Project structure

```
src/
  app/
    (app)/          authenticated pages: dashboard, mocks, practice, syllabus, planner,
                    analytics, exams, cutoffs, tips, flashcards, bookmarks, notifications, profile, results
    test/[id]/      full-screen test engine
    actions.ts      all server actions (auth, tests, grading, planner, notifications…)
  components/       UI: Shell, TestEngine, charts, Solutions, PlannerView, SyllabusBoard…
  data/             exams.ts (patterns, marking, cut-offs), syllabus.ts (topics, formulas, tricks), tips.ts
  lib/
    questions/      seeded question generators (quant, reasoning) + curated banks (english, gk)
    grading.ts      scoring with negative marking + time analysis & feedback
    stats.ts        dashboard/analytics aggregation, readiness, streaks, badges
    notify.ts       daily reminder generation
prisma/schema.prisma
scripts/check-questions.ts   validates ~73,000 generated questions across all exams
```

## How questions work

- **Quantitative Aptitude & Reasoning** use deterministic, seeded generators (≈35 question families: DI tables, quadratic comparisons, seating/floor puzzles verified for a unique solution by brute force, syllogisms, inequalities, coding-decoding, clocks/calendars…). A mock with the same seed is always the same paper, so re-attempts and reports stay consistent.
- **English & General Awareness** come from curated banks (vocabulary, idioms, error spotting, original RC/cloze passages, para-jumbles, banking awareness, polity, history, geography, science, railways, recent affairs) with distractors drawn from the same category.
- Every question carries an explanation; `npm run check:questions` validates answer keys, option uniqueness and section counts.

## Data sources & disclaimer

- Exam patterns follow the latest official notifications (ibps.in, sbi.co.in/careers, opportunities.rbi.org.in, ssc.gov.in, rrbapply.gov.in, licindia.in, mha.gov.in).
- Cut-offs are compiled from official result notices as republished by exam portals; each exam links its source. IB does not publish official marks, so IB ACIO figures are estimates. **Always verify with the official notice.**
- Next-exam dates are tentative (IBPS/SSC 2026-27 calendars where available) and can be overridden per user.
- Previous-year *pattern papers* contain **original questions** modelled on each year's format and topic weightage – not reproductions of copyrighted papers. Official papers/answer keys are linked on each exam's mock page.
