import type { Exam } from "@/data/types";

const CATS = ["GEN", "OBC", "EWS", "SC", "ST"] as const;

export function CutoffTable({ exam, highlight }: { exam: Exam; highlight?: string }) {
  const rows = exam.cutoff.rows;
  if (!rows.length) return <p className="muted text-sm">{exam.cutoff.note}</p>;
  const cats = CATS.filter((c) => rows.some((r) => r[c] != null));
  const hasLabel = rows.some((r) => r.label);
  const max = exam.cutoff.unit;
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="faint border-b text-left text-xs uppercase hairline">
              <th className="py-2 pr-3">Year</th>
              {hasLabel && <th className="py-2 pr-3">State / Zone</th>}
              {cats.map((c) => (
                <th key={c} className={`py-2 pr-3 text-right ${highlight === c ? "text-brand-600" : ""}`}>{c === "GEN" ? "GEN/UR" : c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {rows.map((r, i) => (
              <tr key={i} className="border-b hairline last:border-0">
                <td className="py-2 pr-3 font-semibold">{r.year}</td>
                {hasLabel && <td className="muted py-2 pr-3">{r.label}</td>}
                {cats.map((c) => (
                  <td key={c} className={`py-2 pr-3 text-right ${highlight === c ? "font-bold text-brand-600 dark:text-brand-300" : ""}`}>
                    {r[c] != null ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-[var(--grid)] sm:inline-block">
                          <span className="block h-full rounded-full bg-[var(--s1)]" style={{ width: `${((r[c] as number) / max) * 100}%` }} />
                        </span>
                        {r[c]}
                      </span>
                    ) : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint mt-3 text-xs">
        {exam.cutoff.note} Marks out of {exam.cutoff.unit}.{" "}
        <a href={exam.cutoff.source} target="_blank" rel="noreferrer" className="underline">Source</a> · Verify with the official notice on{" "}
        <a href={exam.officialSite} target="_blank" rel="noreferrer" className="underline">{new URL(exam.officialSite).hostname}</a>.
      </p>
    </div>
  );
}
