import { User } from "lucide-react";
import { ProfileForm, TargetsEditor, DangerZone } from "@/components/ProfileForms";
import { PushSettings } from "@/components/PushToggle";
import { Card, PageHeader } from "@/components/ui";
import { vapidPublicKey } from "@/lib/push";
import { EXAMS, examSchedule } from "@/data/exams";
import { requireUser } from "@/lib/auth";
import { dayKey, prettyDate } from "@/lib/dates";
import { levelFor } from "@/lib/stats";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const lv = levelFor(user.xp);
  return (
    <div className="space-y-6">
      <PageHeader icon={<User />} title="Profile & target exams" subtitle={`Member since ${prettyDate(user.createdAt)} · Level ${lv.level} (${lv.title}) · ${user.xp} XP`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="👤 Personal details">
          <ProfileForm user={{ name: user.name, email: user.email, category: user.category, dailyGoal: Math.round(user.dailyGoalMin / 60) }} />
        </Card>
        <Card title="🎯 Target exams & dates" subtitle="Set the exact date once the exam is notified – countdowns, reminders and your plan use it.">
          <TargetsEditor
            exams={EXAMS.map((e) => ({ slug: e.slug, short: e.short, next: examSchedule(e.slug, dayKey())?.date ?? null }))}
            initial={user.targets.map((t) => ({ slug: t.examSlug, date: t.examDate ? dayKey(t.examDate) : null, primary: t.primary }))}
          />
        </Card>
      </div>
      <Card title="📲 Notifications" subtitle="Morning plan and task reminders on this device">
        <PushSettings vapidKey={vapidPublicKey} morningPush={user.morningPush} taskPush={user.taskPush} />
      </Card>
      <Card title="⚠️ Danger zone">
        <DangerZone />
      </Card>
    </div>
  );
}
