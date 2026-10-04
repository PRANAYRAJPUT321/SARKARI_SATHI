import { Bell } from "lucide-react";
import Link from "next/link";
import { MarkAllRead } from "@/components/MarkAllRead";
import { Empty, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Notifications" };

const KIND: Record<string, string> = { info: "var(--s1)", reminder: "var(--s2)", achievement: "var(--good)", warning: "var(--critical)" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <PageHeader icon={<Bell />} title="Notifications" subtitle="Reminders, reports and achievements. Allow browser notifications to get alerts while the app is open." action={<MarkAllRead />} />
      {items.length === 0 ? (
        <Empty title="Nothing yet" icon="🔔" />
      ) : (
        <div className="card divide-y p-0 hairline">
          {items.map((n) => (
            <Link key={n.id} href={n.link ?? "#"} className={`flex gap-3 p-4 transition hover:bg-[var(--surface-2)] ${n.read ? "" : "bg-brand-500/5"}`}>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: KIND[n.kind] ?? KIND.info }} />
              <div className="flex-1">
                <div className="font-semibold">{n.title}</div>
                <div className="muted text-sm">{n.body}</div>
                <div className="faint mt-1 text-xs">{prettyDate(n.createdAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
