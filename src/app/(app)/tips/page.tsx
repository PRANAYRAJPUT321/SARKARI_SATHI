import { Lightbulb } from "lucide-react";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { EXAMS } from "@/data/exams";
import { SUBJECTS, TOPICS } from "@/data/syllabus";
import { GENERAL_TIPS } from "@/data/tips";

export const metadata = { title: "Tips & Tricks" };

export default function TipsPage() {
  return (
    <div className="space-y-8">
      <PageHeader icon={<Lightbulb />} title="Tips & Tricks" subtitle="Strategy, shortcuts and exam-day wisdom from what works for selected candidates." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {GENERAL_TIPS.map((g) => (
          <Card key={g.title} title={<span>{g.icon} {g.title}</span>}>
            <ul className="space-y-2 text-sm">{g.points.map((p) => <li key={p} className="flex gap-2"><span className="text-brand-600">•</span>{p}</li>)}</ul>
          </Card>
        ))}
      </div>
      {SUBJECTS.map((s) => (
        <section key={s.id}>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.name} shortcuts</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {TOPICS.filter((t) => t.subject === s.id).map((t) => (
              <Link key={t.id} href={`/syllabus/${t.id}`} className="card block p-4 transition hover:shadow-md">
                <div className="font-bold">{t.name}</div>
                <ul className="muted mt-2 space-y-1 text-sm">{t.tricks.slice(0, 2).map((x) => <li key={x}>⚡ {x}</li>)}</ul>
              </Link>
            ))}
          </div>
        </section>
      ))}
      <section>
        <h2 className="mb-3 text-lg font-extrabold">Exam-specific strategy</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {EXAMS.map((e) => (
            <Link key={e.slug} href={`/exams/${e.slug}`} className="card block p-4 transition hover:shadow-md">
              <div className="flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />{e.short}</div>
              <p className="muted mt-1.5 text-sm">{e.tips[0]}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
