/**
 * Upcoming exam calendar.
 *
 * Only dates that were officially announced are listed here: exam notices / admit-card
 * releases ("confirmed") or the conducting body's published annual calendar ("tentative" –
 * IBPS and SSC label their calendars tentative themselves). Exams without an announced date
 * are deliberately left out and the app shows "Not announced yet" for them.
 *
 * Last verified: 5 October 2026. Re-check the official websites before relying on a date.
 */
export interface ExamEvent {
  id: string;
  examSlug: string;
  stage: string;
  /** individual exam days (YYYY-MM-DD) – used when the exam runs on specific days */
  days?: string[];
  /** continuous window */
  start: string;
  end?: string;
  /** only the month(s) are announced */
  monthOnly?: boolean;
  status: "confirmed" | "tentative";
  note: string;
  official: string;
  source: string;
}

export const CALENDAR_VERIFIED_ON = "2026-10-05";

export const EXAM_EVENTS: ExamEvent[] = [
  {
    id: "ssc-cgl-2026-t1",
    examSlug: "ssc-cgl",
    stage: "Tier 1 (CBE)",
    start: "2026-09-30",
    end: "2026-10-30",
    status: "confirmed",
    note: "Exam window 30 Sep – 30 Oct 2026; admit cards released on ssc.gov.in a few days before each candidate's date.",
    official: "https://ssc.gov.in",
    source: "https://www.shiksha.com/exams/ssc-cgl-exam",
  },
  {
    id: "ibps-clerk-2026-pre",
    examSlug: "ibps-clerk",
    stage: "Prelims (CRP CSA-XVI)",
    days: ["2026-10-10", "2026-10-11"],
    start: "2026-10-10",
    end: "2026-10-11",
    status: "confirmed",
    note: "Prelims call letters released on 1 Oct 2026 at ibps.in.",
    official: "https://www.ibps.in",
    source: "https://www.practicemock.com/blog/ibps-clerk-admit-card-2026/",
  },
  {
    id: "rrb-je-2026-cbt1",
    examSlug: "rrb-je",
    stage: "CBT 1 (CEN 04/2026)",
    days: ["2026-10-27", "2026-10-28"],
    start: "2026-10-27",
    end: "2026-10-28",
    status: "confirmed",
    note: "As per RRB's revised notice of 2 Oct 2026 (earlier schedule also listed 30 Oct). Check your city slip on rrbapply.gov.in.",
    official: "https://www.rrbapply.gov.in",
    source: "https://testbook.com/news/rrb-je-new-cbt-1-exam-date-2026-out/",
  },
  {
    id: "ssc-cpo-2026-p1",
    examSlug: "ssc-cpo",
    stage: "Paper 1",
    start: "2026-11-20",
    end: "2026-11-28",
    status: "confirmed",
    note: "Announced in SSC's notice of 1 Oct 2026.",
    official: "https://ssc.gov.in",
    source: "https://www.pw.live/ssc/exams/ssc-cpo-exam-date-2026-out",
  },
  {
    id: "ibps-rrb-po-2026-pre",
    examSlug: "ibps-rrb-po",
    stage: "Officer Scale-I Prelims",
    days: ["2026-11-21", "2026-11-22"],
    start: "2026-11-21",
    end: "2026-11-22",
    status: "tentative",
    note: "IBPS Calendar 2026-27 (tentative dates published by IBPS).",
    official: "https://www.ibps.in",
    source: "https://news.careers360.com/ibps-exam-calendar-2026-27-po-mt-spl-csa-crp-rrbs-officers-scale-office-assistants-prelims-main-dates-documents-required/amp",
  },
  {
    id: "ssc-chsl-2026-t1",
    examSlug: "ssc-chsl",
    stage: "Tier 1 (CBE)",
    start: "2026-11-30",
    end: "2026-12-31",
    status: "confirmed",
    note: "Announced by SSC on 1 Oct 2026; applications close 7 Oct 2026.",
    official: "https://ssc.gov.in",
    source: "https://www.oliveboard.in/ssc-chsl-exam-date/",
  },
  {
    id: "ibps-rrb-clerk-2026-pre",
    examSlug: "ibps-rrb-clerk",
    stage: "Office Assistant Prelims",
    days: ["2026-12-06", "2026-12-12", "2026-12-13"],
    start: "2026-12-06",
    end: "2026-12-13",
    status: "tentative",
    note: "IBPS Calendar 2026-27 (tentative dates published by IBPS).",
    official: "https://www.ibps.in",
    source: "https://news.careers360.com/ibps-exam-calendar-2026-27-po-mt-spl-csa-crp-rrbs-officers-scale-office-assistants-prelims-main-dates-documents-required/amp",
  },
  {
    id: "ibps-rrb-po-2026-mains",
    examSlug: "ibps-rrb-po",
    stage: "Officer Scale-I Mains",
    days: ["2026-12-20"],
    start: "2026-12-20",
    status: "tentative",
    note: "IBPS Calendar 2026-27 (tentative).",
    official: "https://www.ibps.in",
    source: "https://news.careers360.com/ibps-exam-calendar-2026-27-po-mt-spl-csa-crp-rrbs-officers-scale-office-assistants-prelims-main-dates-documents-required/amp",
  },
  {
    id: "ibps-clerk-2026-mains",
    examSlug: "ibps-clerk",
    stage: "Mains",
    days: ["2026-12-27"],
    start: "2026-12-27",
    status: "tentative",
    note: "IBPS Calendar 2026-27 (tentative).",
    official: "https://www.ibps.in",
    source: "https://news.careers360.com/ibps-exam-calendar-2026-27-po-mt-spl-csa-crp-rrbs-officers-scale-office-assistants-prelims-main-dates-documents-required/amp",
  },
  {
    id: "ssc-gd-2027-cbe",
    examSlug: "ssc-gd",
    stage: "Constable (GD) 2027 CBE",
    start: "2027-01-01",
    end: "2027-02-28",
    monthOnly: true,
    status: "tentative",
    note: "SSC revised calendar 2026-27 lists the exam in January – February 2027; exact dates not announced yet.",
    official: "https://ssc.gov.in",
    source: "https://www.careerpower.me/2026/03/ssc-revised-exam-calendar-2026-out-new.html",
  },
  {
    id: "ibps-rrb-clerk-2027-mains",
    examSlug: "ibps-rrb-clerk",
    stage: "Office Assistant Mains",
    days: ["2027-01-30"],
    start: "2027-01-30",
    status: "tentative",
    note: "IBPS Calendar 2026-27 (tentative).",
    official: "https://www.ibps.in",
    source: "https://news.careers360.com/ibps-exam-calendar-2026-27-po-mt-spl-csa-crp-rrbs-officers-scale-office-assistants-prelims-main-dates-documents-required/amp",
  },
];

/** Events that have not finished yet (relative to `today`, YYYY-MM-DD). */
export function upcomingEvents(today: string, slug?: string) {
  return EXAM_EVENTS.filter((e) => (e.end ?? e.start) >= today && (!slug || e.examSlug === slug)).sort((a, b) => a.start.localeCompare(b.start));
}

/** First day of the next upcoming (or ongoing) event for an exam. */
export function nextEventFor(slug: string, today: string) {
  return upcomingEvents(today, slug)[0];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const d = (k: string) => {
  const [y, m, day] = k.split("-").map(Number);
  return { y, m, day };
};
/** Human friendly date text, e.g. "10 & 11 Oct 2026", "30 Sep – 30 Oct 2026", "Jan – Feb 2027". */
export function eventDateText(e: ExamEvent) {
  if (e.monthOnly) {
    const a = d(e.start), b = d(e.end ?? e.start);
    return a.m === b.m ? `${MONTHS[a.m - 1]} ${a.y}` : `${MONTHS[a.m - 1]} – ${MONTHS[b.m - 1]} ${b.y}`;
  }
  if (e.days && e.days.length > 1) {
    const parts = e.days.map(d);
    const sameMonth = parts.every((p) => p.m === parts[0].m && p.y === parts[0].y);
    if (sameMonth) return `${parts.map((p) => p.day).join(", ").replace(/, (\d+)$/, " & $1")} ${MONTHS[parts[0].m - 1]} ${parts[0].y}`;
  }
  const a = d(e.start);
  if (!e.end || e.end === e.start) return `${a.day} ${MONTHS[a.m - 1]} ${a.y}`;
  const b = d(e.end);
  if (a.m === b.m && a.y === b.y) return `${a.day} – ${b.day} ${MONTHS[a.m - 1]} ${a.y}`;
  return `${a.day} ${MONTHS[a.m - 1]} – ${b.day} ${MONTHS[b.m - 1]} ${b.y}`;
}

/** Calendar days on which an event should be drawn (month-only events are not drawn on days). */
export function eventDays(e: ExamEvent): string[] {
  if (e.monthOnly) return [];
  if (e.days) return e.days;
  const out: string[] = [];
  const cur = new Date(e.start + "T00:00:00Z");
  const end = new Date((e.end ?? e.start) + "T00:00:00Z");
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
