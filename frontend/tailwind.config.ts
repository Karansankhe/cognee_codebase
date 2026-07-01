import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pulse: {
          ink: "#111111",
          muted: "#77777d",
          canvas: "#f2f1f5",
          surface: "#e5e5e8",
          line: "#d6d6dc",
          green: "#d8fb64",
          mint: "#eefbd0",
          blue: "#111111",
          sky: "#f7f7f8",
          amber: "#111111",
          rose: "#111111",
        },
      },
      boxShadow: {
        pulse: "0 18px 45px rgba(20, 20, 24, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
