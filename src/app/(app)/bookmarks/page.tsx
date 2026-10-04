import { Bookmark } from "lucide-react";
import { QuestionBody } from "@/components/Solutions";
import { Empty, PageHeader } from "@/components/ui";
import type { Question } from "@/data/types";
import { topicById } from "@/data/syllabus";
import { requireUser } from "@/lib/auth";
import { prettyDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const user = await requireUser();
  const items = await prisma.bookmark.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader icon={<Bookmark />} title="Bookmarked questions" subtitle="Your personal revision bank. Bookmark questions from any test report." />
      {items.length === 0 ? (
        <Empty title="No bookmarks yet" text="Open a test report and tap the bookmark icon on tricky questions." href="/analytics" cta="Go to my reports" icon="🔖" />
      ) : (
        <div className="space-y-4">
          {items.map((b) => {
            const q = JSON.parse(b.question) as Question;
            return (
              <article key={b.id} className="card">
                <div className="faint mb-2 text-xs">{topicById(q.topic)?.name} · saved {prettyDate(b.createdAt)}</div>
                <QuestionBody q={q} />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
