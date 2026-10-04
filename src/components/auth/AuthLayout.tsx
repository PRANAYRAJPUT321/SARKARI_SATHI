import Link from "next/link";

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
          <span className="text-xl font-extrabold">Sarkari Sathi</span>
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
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-lg">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <img src="/icon.svg" alt="" className="h-9 w-9" />
            <span className="text-lg font-extrabold">Sarkari Sathi</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="muted mb-8 mt-1">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
