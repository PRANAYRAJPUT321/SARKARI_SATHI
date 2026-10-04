/** Locale-independent formatters (identical output on server and browser, avoids hydration mismatches). */
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "6:05 PM" in IST for an ISO timestamp */
export function istTime(iso: string) {
  const d = new Date(new Date(iso).getTime() + 330 * 60000);
  const h = d.getUTCHours(), m = d.getUTCMinutes();
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** "Monday, 5 October" for a YYYY-MM-DD key */
export function longDay(key: string) {
  const d = new Date(key + "T00:00:00Z");
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "October 2026" for YYYY-MM */
export function monthLabel(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTHS[mo - 1]} ${y}`;
}

export const shortWeekday = (key: string) => WEEKDAYS[new Date(key + "T00:00:00Z").getUTCDay()].slice(0, 3);
