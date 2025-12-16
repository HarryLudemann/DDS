import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        surface: "#fafafa",
        panel: "#f4f4f5",
        border: "#e4e4e7",
        text: "#09090b",
        muted: "#71717a",
        accent: "#18181b",       // almost-black
        accentSoft: "#f1f1f4",
        danger: "#dc2626",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        md: "0 6px 20px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
