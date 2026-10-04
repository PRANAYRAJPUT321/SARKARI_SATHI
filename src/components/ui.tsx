import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action, icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-600/10 text-brand-600 dark:text-brand-300">{icon}</div>}
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="muted mt-1 text-sm">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

export function Card({ className, children, title, action, subtitle }: { className?: string; children: ReactNode; title?: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <section className={clsx("card", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-bold">{title}</h2>}
            {subtitle && <p className="faint mt-0.5 text-xs">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Progress({ value, color = "var(--s1)", className, height = 8 }: { value: number; color?: string; className?: string; height?: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx("w-full overflow-hidden rounded-full bg-[var(--grid)]", className)} style={{ height }} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 120, stroke = 12, color = "var(--s1)", children, track = "var(--grid)" }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode; track?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (v / 100) * c} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function Stat({ label, value, sub, icon, accent }: { label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; accent?: string }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      {icon && (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${accent ?? "var(--s1)"} 14%, transparent)`, color: accent ?? "var(--s1)" }}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="faint text-xs font-semibold uppercase tracking-wide">{label}</div>
        <div className="mt-0.5 text-2xl font-extrabold leading-tight">{value}</div>
        {sub && <div className="muted mt-0.5 text-xs">{sub}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, color = "var(--s1)", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={clsx("chip", className)} style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color: `color-mix(in srgb, ${color} 75%, var(--ink))` }}>
      {children}
    </span>
  );
}

export function Empty({ title, text, href, cta, icon }: { title: string; text?: string; href?: string; cta?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center hairline">
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <div className="font-bold">{title}</div>
      {text && <p className="muted mt-1 max-w-sm text-sm">{text}</p>}
      {href && cta && (
        <Link href={href} className="btn-primary mt-4">
          {cta}
        </Link>
      )}
    </div>
  );
}

export const STATUS_META: Record<string, { label: string; color: string; emoji: string }> = {
  not_started: { label: "Not started", color: "var(--muted)", emoji: "⚪" },
  learning: { label: "Learning", color: "var(--s1)", emoji: "📖" },
  revising: { label: "Revising", color: "var(--s4)", emoji: "🔁" },
  mastered: { label: "Mastered", color: "var(--good)", emoji: "✅" },
};
