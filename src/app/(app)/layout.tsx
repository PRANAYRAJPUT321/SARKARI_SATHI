import { Shell } from "@/components/Shell";
import { requireUser } from "@/lib/auth";
import { dayKey, istStart } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { ensureDailyNotifications } from "@/lib/notify";
import { levelFor } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await ensureDailyNotifications(user.id);
  const start = istStart(dayKey());
  const [notifications, unread, tasks] = await Promise.all([
    prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.plannerTask.findMany({ where: { userId: user.id, date: { gte: start, lt: new Date(start.getTime() + 86400000) } }, orderBy: { date: "asc" } }),
  ]);
  const lv = levelFor(user.xp);
  return (
    <Shell
      user={{ name: user.name, avatarColor: user.avatarColor, xp: user.xp, level: lv.level, levelTitle: lv.title, levelProgress: lv.progress }}
      notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
      unread={unread}
      todayTasks={tasks.map((t) => ({ id: t.id, title: t.title, at: t.date.toISOString(), done: t.done }))}
    >
      {children}
    </Shell>
  );
}
