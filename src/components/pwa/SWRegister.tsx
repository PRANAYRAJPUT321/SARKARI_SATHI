"use client";

import { useEffect } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global {
  interface Window {
    __ssInstallPrompt?: BIPEvent | null;
  }
}

/** Registers the service worker and keeps the browser's install prompt for the Install buttons. */
export function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__ssInstallPrompt = e as BIPEvent;
      window.dispatchEvent(new Event("ss-install-available"));
    };
    const onInstalled = () => {
      window.__ssInstallPrompt = null;
      window.dispatchEvent(new Event("ss-installed"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
