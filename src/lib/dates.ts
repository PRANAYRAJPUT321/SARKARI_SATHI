export const IST = "Asia/Kolkata";

/** YYYY-MM-DD in Indian Standard Time */
export function dayKey(d: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function addDays(key: string, n: number) {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Start of an IST day as a UTC Date */
export function istStart(key: string) {
  return new Date(key + "T00:00:00+05:30");
}

export function daysBetween(fromKey: string, toKey: string) {
  return Math.round((Date.parse(toKey + "T00:00:00Z") - Date.parse(fromKey + "T00:00:00Z")) / 86400000);
}

export function istHour(d: Date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", hour12: false }).format(d));
}

export function greeting(d: Date = new Date()) {
  const h = istHour(d);
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function prettyDate(d: Date | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: IST, ...opts }).format(typeof d === "string" ? new Date(d) : d);
}
