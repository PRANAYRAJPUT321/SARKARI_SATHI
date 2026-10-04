import { Target } from "lucide-react";
import Link from "next/link";
import { CutoffTable } from "@/components/CutoffTable";
import { Card, PageHeader } from "@/components/ui";
import { EXAM_CATEGORIES, EXAMS } from "@/data/exams";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Cut-offs" };

export default async function CutoffsPage() {
  const user = await requireUser();
  const mine = new Set(user.targets.map((t) => t.examSlug));
  const ordered = [...EXAMS].sort((a, b) => Number(mine.has(b.slug)) - Number(mine.has(a.slug)));
  return (
    <div className="space-y-6">
      <PageHeader icon={<Target />} title="Previous-year cut-offs" subtitle={`Passing criteria for the last 4–5 years. Your category (${user.category}) is highlighted; change it in Profile.`} />
      <div className="flex flex-wrap gap-2">
        {EXAM_CATEGORIES.map((c) => <a key={c} href={`#${c.replace(/\W+/g, "-")}`} className="chip border hairline hover:bg-[var(--surface-2)]">{c}</a>)}
      </div>
      {EXAM_CATEGORIES.map((c) => (
        <section key={c} id={c.replace(/\W+/g, "-")} className="scroll-mt-20 space-y-4">
          <h2 className="faint text-xs font-bold uppercase tracking-wider">{c}</h2>
          {ordered.filter((e) => e.category === c).map((e) => (
            <Card key={e.slug} title={<span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />{e.short} <span className="faint text-xs font-normal">· {e.stage}</span>{mine.has(e.slug) && <span className="chip bg-saffron-500/15 text-saffron-600">My exam</span>}</span>} action={<Link href={`/mocks/${e.slug}`} className="text-xs font-semibold text-brand-600">Practise →</Link>}>
              <CutoffTable exam={e} highlight={user.category} />
            </Card>
          ))}
        </section>
      ))}
    </div>
  );
}
