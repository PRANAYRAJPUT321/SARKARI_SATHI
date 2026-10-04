import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8",
          500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81",
        },
        saffron: { 400: "#fb923c", 500: "#f97316", 600: "#ea580c" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        flame: { "0%,100%": { transform: "scale(1) rotate(-3deg)" }, "50%": { transform: "scale(1.12) rotate(3deg)" } },
      },
      animation: { "fade-up": "fade-up .4s ease-out both", flame: "flame 1.2s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
