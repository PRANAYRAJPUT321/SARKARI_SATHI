"use client";

import clsx from "clsx";
import { Download, Monitor, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "desktop-chromium" | "mac-safari" | "firefox" | "other";

function detect(): Platform {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Safari/i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) return "mac-safari";
  if (/Chrome|Chromium|Edg/i.test(ua)) return "desktop-chromium";
  return "other";
}

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "Install on iPhone / iPad",
    steps: ["Open this site in Safari.", "Tap the Share button (square with an arrow) at the bottom.", "Scroll and tap “Add to Home Screen”.", "Tap “Add”. Open Sarkari Sathi from your home screen – notifications work from the installed app (iOS 16.4+)."],
  },
  android: {
    title: "Install on Android",
    steps: ["Open this site in Chrome.", "Tap the ⋮ menu (top-right).", "Tap “Install app” or “Add to Home screen”.", "Confirm – the app icon appears on your home screen."],
  },
  "desktop-chromium": {
    title: "Install on your laptop / PC",
    steps: ["In Chrome or Edge, click the install icon (⊕ / monitor with arrow) at the right end of the address bar.", "Or open the ⋮ menu → “Cast, save and share” → “Install page as app…” (Edge: “Apps” → “Install this site as an app”).", "Click “Install”. Sarkari Sathi opens in its own window and gets a desktop/Start-menu shortcut."],
  },
  "mac-safari": {
    title: "Install on Mac (Safari)",
    steps: ["In Safari 17+, open the File menu (or Share button).", "Choose “Add to Dock…”.", "Click “Add”. Sarkari Sathi now opens like a normal Mac app."],
  },
  firefox: {
    title: "Install the app",
    steps: ["Firefox on desktop can't install web apps yet.", "Open this site in Chrome, Edge or Safari and use their “Install” / “Add to Dock” option.", "On Android Firefox: ⋮ menu → “Install”."],
  },
  other: {
    title: "Install the app",
    steps: ["Open this site in Chrome, Edge (Windows/Android/Mac) or Safari (iPhone/Mac).", "Use the browser's “Install app”, “Add to Home Screen” or “Add to Dock” option."],
  },
};

export function InstallButton({ variant = "default", className }: { variant?: "default" | "hero" | "icon"; className?: string }) {
  const [installed, setInstalled] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detect());
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setCanPrompt(!!window.__ssInstallPrompt);
    const on = () => setCanPrompt(!!window.__ssInstallPrompt);
    const done = () => setInstalled(true);
    window.addEventListener("ss-install-available", on);
    window.addEventListener("ss-installed", done);
    return () => {
      window.removeEventListener("ss-install-available", on);
      window.removeEventListener("ss-installed", done);
    };
  }, []);

  if (installed) return null;

  const click = async () => {
    const p = window.__ssInstallPrompt;
    if (p) {
      await p.prompt();
      const choice = await p.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") {
        window.__ssInstallPrompt = null;
        setInstalled(true);
      }
      return;
    }
    setOpen(true);
  };

  const info = STEPS[platform];
  const mobile = platform === "ios" || platform === "android";
  return (
    <>
      <button
        onClick={click}
        className={clsx(
          variant === "hero" ? "btn border border-white/30 text-white hover:bg-white/10" : "btn-ghost",
          variant === "icon" ? "p-2.5" : "px-3 py-2",
          className,
        )}
        aria-label="Install app"
        title={canPrompt ? "Install Sarkari Sathi" : "How to install Sarkari Sathi"}
      >
        <Download size={17} />
        {variant !== "icon" && <span className="text-sm">Install app</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-black/50 p-0 sm:place-items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-[var(--surface)] p-6 text-[var(--ink)] shadow-2xl animate-fade-up sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
                <div>
                  <div className="text-lg font-extrabold">{info.title}</div>
                  <div className="faint text-xs">Free · opens like a normal app · no app store needed</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2" aria-label="Close"><X size={16} /></button>
            </div>
            <ol className="space-y-2.5">
              {info.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <div className="faint mt-5 flex items-center gap-4 border-t pt-4 text-xs hairline">
              <span className="flex items-center gap-1"><Smartphone size={14} /> Android & iPhone</span>
              <span className="flex items-center gap-1"><Monitor size={14} /> Windows, Mac & Linux</span>
            </div>
            {!mobile && <p className="faint mt-2 text-xs">Tip: on your phone, open this same link and tap “Install app”.</p>}
          </div>
        </div>
      )}
    </>
  );
}
