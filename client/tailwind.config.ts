import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: "#3B82F6",
        purple: "#8B5CF6",
        cyan: "#06B6D4",
        bg: "#0B0F1A",
        bg2: "#111827",
      },
      fontFamily: {
        sans: ["var(--font-pretendard)", "var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
        display: ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px rgba(59, 130, 246, 0.18)",
      },
      backgroundImage: {
        "hero-grid":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
        "fade-up": "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
        "drift-x": "driftX 18s ease-in-out infinite alternate",
        "drift-y": "driftY 15s ease-in-out infinite alternate",
        shimmer: "shimmer 2.8s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        driftX: {
          "0%": { transform: "translateX(-2%)" },
          "100%": { transform: "translateX(2%)" },
        },
        driftY: {
          "0%": { transform: "translateY(-10px)" },
          "100%": { transform: "translateY(10px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
