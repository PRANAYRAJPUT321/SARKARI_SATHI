"use client";

import clsx from "clsx";
import {
  BarChart3, Bell, Bookmark, BookOpen, CalendarDays, ClipboardList, GraduationCap, Layers, LayoutDashboard, Lightbulb, LogOut, Menu, Moon, Sun, Target, Trophy, User, X, Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { logoutAction, markNotificationReadAction } from "@/app/actions";
import { FocusTimer } from "./FocusTimer";
import { ReminderScheduler } from "./ReminderScheduler";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mocks", label: "Mock Tests", icon: ClipboardList },
  { href: "/practice", label: "Practice", icon: Zap },
  { href: "/syllabus", label: "Syllabus Tracker", icon: BookOpen },
  { href: "/planner", label: "Study Planner", icon: CalendarDays },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/exams", label: "Exam Explorer", icon: GraduationCap },
  { href: "/cutoffs", label: "Cut-offs", icon: Target },
  { href: "/tips", label: "Tips & Tricks", icon: Lightbulb },
  { href: "/flashcards", label: "GK Flashcards", icon: Layers },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];
const MOBILE = [NAV[0], NAV[1], NAV[2], NAV[4], NAV[5]];

export interface ShellNotification {
  id: string;
  title: string;
  body: string;
  kind: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function Shell({
  children,
  user,
  notifications,
  unread,
  todayTasks,
}: {
  children: React.ReactNode;
  user: { name: string; avatarColor: string; xp: number; level: number; levelTitle: string; levelProgress: number };
  notifications: ShellNotification[];
  unread: number;
  todayTasks: { id: string; title: string; at: string; done: boolean }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const [dark, setDark] = useState(false);
  const [, start] = useTransition();
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  useEffect(() => {
    setOpen(false);
    setBell(false);
  }, [pathname]);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  const first = user.name.split(" ")[0];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
            isActive(href) ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "muted hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <img src="/icon.svg" alt="" className="h-9 w-9" />
      <div className="leading-tight">
        <div className="text-[15px] font-extrabold tracking-tight">Sarkari Sathi</div>
        <div className="faint text-[11px] font-medium">{first}&apos;s prep companion</div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <ReminderScheduler tasks={todayTasks} notifications={notifications} />
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-[var(--surface)] p-4 hairline lg:flex">
        <div className="mb-6 px-1">{brand}</div>
        <div className="no-scrollbar flex-1 overflow-y-auto">{nav}</div>
        <Link href="/profile" className="mt-4 rounded-2xl bg-[var(--surface-2)] p-3 transition hover:ring-2 hover:ring-brand-500/30">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: user.avatarColor }}>
              {user.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{user.name}</div>
              <div className="faint flex items-center gap-1 text-xs">
                <Trophy size={12} /> Lv {user.level} · {user.levelTitle}
              </div>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--grid)]">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-saffron-500" style={{ width: `${user.levelProgress}%` }} />
          </div>
          <div className="faint mt-1 text-[11px]">{user.xp} XP</div>
        </Link>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[var(--surface)] p-4 shadow-xl animate-fade-up">
            <div className="mb-6 flex items-center justify-between">
              {brand}
              <button onClick={() => setOpen(false)} className="btn-ghost p-2" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            <Link href="/profile" className="btn-ghost mt-3">
              <User size={16} /> Profile & exams
            </Link>
            <form action={logoutAction} className="mt-2">
              <button className="btn-ghost w-full"><LogOut size={16} /> Log out</button>
            </form>
          </div>
        </div>
      )}

      {/* Topbar */}
      <header className="sticky top-0 z-20 border-b bg-[var(--page)]/85 backdrop-blur hairline no-print">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <button className="btn-ghost p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
            <img src="/icon.svg" alt="" className="h-8 w-8" />
            <span className="hidden whitespace-nowrap font-extrabold sm:inline">Sarkari Sathi</span>
          </Link>
          <div className="flex-1" />
          <FocusTimer />
          <button onClick={toggleTheme} className="btn-ghost p-2.5" aria-label="Toggle dark mode">
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div className="relative">
            <button onClick={() => setBell((b) => !b)} className="btn-ghost relative p-2.5" aria-label="Notifications">
              <Bell size={17} />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-saffron-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
            </button>
            {bell && (
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border bg-[var(--surface)] shadow-2xl hairline animate-fade-up">
                <div className="flex items-center justify-between border-b px-4 py-3 hairline">
                  <div className="font-bold">Notifications</div>
                  <button className="text-xs font-semibold text-brand-600" onClick={() => start(() => markNotificationReadAction())}>
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 && <div className="muted p-6 text-center text-sm">You&apos;re all caught up 🎉</div>}
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "/notifications"}
                      onClick={() => start(() => markNotificationReadAction(n.id))}
                      className={clsx("block border-b px-4 py-3 text-sm transition hairline hover:bg-[var(--surface-2)]", !n.read && "bg-brand-500/5")}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-saffron-500" />}
                        <div>
                          <div className="font-semibold">{n.title}</div>
                          <div className="muted mt-0.5 text-xs leading-relaxed">{n.body}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/notifications" className="block px-4 py-2.5 text-center text-xs font-semibold text-brand-600 hover:bg-[var(--surface-2)]">
                  View all
                </Link>
              </div>
            )}
          </div>
          <form action={logoutAction} className="hidden sm:block">
            <button className="btn-ghost p-2.5" aria-label="Log out" title="Log out">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-[var(--surface)]/95 backdrop-blur hairline lg:hidden no-print">
        {MOBILE.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={clsx("flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold", isActive(href) ? "text-brand-600 dark:text-brand-300" : "faint")}>
            <Icon size={20} />
            {label.split(" ")[0]}
          </Link>
        ))}
      </nav>
    </div>
  );
}
