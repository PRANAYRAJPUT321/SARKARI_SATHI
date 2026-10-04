import clsx from "clsx";
import Link from "next/link";
import { Credit } from "./Credit";
import { InstallButton } from "./pwa/InstallButton";
import { ThemeToggle } from "./ThemeToggle";

/** Header for pages before login (landing, login, register). */
export function PublicHeader({ hero, loggedIn, showAuth = true }: { hero?: boolean; loggedIn?: boolean; showAuth?: boolean }) {
  return (
    <nav className={clsx("flex flex-wrap items-center justify-between gap-3", hero ? "text-white" : "")}>
      <Link href="/" className="flex items-center gap-2.5">
        <img src="/icon.svg" alt="" className="h-10 w-10" />
        <div className="leading-tight">
          <div className="text-xl font-extrabold">Sarkari Sathi</div>
          <div className={clsx("text-[11px] font-semibold", hero ? "text-white/75" : "faint")}>Built by Pranay</div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Credit hero={hero} className="hidden md:inline-flex" />
        <InstallButton variant={hero ? "hero" : "default"} />
        <ThemeToggle hero={hero} />
        {showAuth &&
          (loggedIn ? (
            <Link href="/dashboard" className={hero ? "btn bg-white text-brand-700 hover:bg-white/90" : "btn-primary"}>Dashboard →</Link>
          ) : (
            <>
              <Link href="/login" className={hero ? "btn text-white hover:bg-white/10" : "btn-ghost"}>Log in</Link>
              <Link href="/register" className={hero ? "btn bg-white text-brand-700 hover:bg-white/90" : "btn-primary"}>Sign up free</Link>
            </>
          ))}
      </div>
    </nav>
  );
}
