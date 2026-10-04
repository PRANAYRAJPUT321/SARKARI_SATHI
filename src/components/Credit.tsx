import clsx from "clsx";

/** "Built by Pranay" credit shown in every header and footer. */
export function Credit({ className, hero }: { className?: string; hero?: boolean }) {
  return (
    <span className={clsx("chip whitespace-nowrap", hero ? "bg-white/15 text-white" : "bg-saffron-500/15 text-saffron-600 dark:text-saffron-400", className)} title="Sarkari Sathi is built by Pranay">
      ✨ Built by Pranay
    </span>
  );
}
