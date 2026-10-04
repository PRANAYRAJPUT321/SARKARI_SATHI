"use client";

import clsx from "clsx";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className, hero }: { className?: string; hero?: boolean }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={toggle} className={clsx(hero ? "btn border border-white/30 p-2.5 text-white hover:bg-white/10" : "btn-ghost p-2.5", className)} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} title={dark ? "Light theme" : "Dark theme"}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
