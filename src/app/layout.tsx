import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sarkari Sathi – Govt Exam Preparation", template: "%s · Sarkari Sathi" },
  description: "Mock tests, previous-year pattern papers, cut-offs, syllabus tracker and a smart study planner for SBI, IBPS, RBI, SSC, RRB, LIC and IB exams.",
  applicationName: "Sarkari Sathi",
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
