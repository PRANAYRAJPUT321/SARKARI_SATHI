import type { Metadata, Viewport } from "next";
import { HelpBot } from "@/components/HelpBot";
import { SWRegister } from "@/components/pwa/SWRegister";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sarkari Sathi – Govt Exam Preparation", template: "%s · Sarkari Sathi" },
  description: "Mock tests, previous-year pattern papers, cut-offs, syllabus tracker and a smart study planner for SBI, IBPS, RBI, SSC, RRB, LIC and IB exams. Built by Pranay.",
  applicationName: "Sarkari Sathi",
  authors: [{ name: "Pranay" }],
  creator: "Pranay",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/favicon-32.png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Sarkari Sathi", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4338ca" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <SWRegister />
        {children}
        <HelpBot />
      </body>
    </html>
  );
}
