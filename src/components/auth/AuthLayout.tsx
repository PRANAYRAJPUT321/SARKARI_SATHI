import Link from "next/link";
import { Credit } from "../Credit";
import { InstallButton } from "../pwa/InstallButton";
import { ThemeToggle } from "../ThemeToggle";

const QUOTES = [
  "“Success is the sum of small efforts, repeated day in and day out.”",
  "“Arise, awake, and stop not till the goal is reached.” – Swami Vivekananda",
  "“You have to dream before your dreams can come true.” – Dr. A. P. J. Abdul Kalam",
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hero-gradient relative hidden flex-col justify-between p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" className="h-10 w-10" />
          <div className="leading-tight">
            <div className="text-xl font-extrabold">Sarkari Sathi</div>
            <div className="text-[11px] font-semibold text-white/75">Built by Pranay</div>
          </div>
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold leading-tight">Your daily companion to a<br />Sarkari Naukri.</h2>
          <ul className="mt-6 space-y-2 text-white/85">
            <li>✅ Unlimited full mocks for 20 exams with real marking schemes</li>
            <li>✅ Second-by-second feedback on every question</li>
            <li>✅ Previous-year pattern papers (2016–2025) & cut-off trends</li>
            <li>✅ Smart planner, streaks, reminders & syllabus tracker</li>
          </ul>
        </div>
        <p className="text-sm italic text-white/70">{QUOTES[new Date().getDate() % QUOTES.length]}</p>
      </div>
      <div className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-end gap-2">
          <Link href="/" className="mr-auto flex items-center gap-2 lg:hidden">
            <img src="/icon.svg" alt="" className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-lg font-extrabold">Sarkari Sathi</div>
              <div className="faint text-[11px] font-semibold">Built by Pranay</div>
            </div>
          </Link>
          <Credit className="hidden sm:inline-flex" />
          <InstallButton />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-8">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="muted mb-8 mt-1">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
