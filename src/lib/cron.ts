import "server-only";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set. */
export function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
