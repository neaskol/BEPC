import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Palette BEPC Mada
        bepc: {
          vert: "#639922",
          ambre: "#BA7517",
          rouge: "#D85A30",
          gris: "#5F5E5A",
          "ambre-clair": "#FAEEDA",
          "vert-clair": "#EBF3D9",
          "rouge-clair": "#FAE9E3",
        },
        // Alias direct utilisé dans les composants
        "bepc-green": "#639922",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "titre-xl": ["22px", { lineHeight: "1.3", fontWeight: "500" }],
        "titre-lg": ["20px", { lineHeight: "1.3", fontWeight: "500" }],
        "titre-md": ["18px", { lineHeight: "1.4", fontWeight: "500" }],
        "corps": ["16px", { lineHeight: "1.6" }],
        "corps-sm": ["14px", { lineHeight: "1.6" }],
      },
      minHeight: {
        "touch": "44px",
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      screens: {
        "xs": "375px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
      },
      keyframes: {
        "badge-unlock": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "70%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(99, 153, 34, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(99, 153, 34, 0)" },
        },
        "heart-lost": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.4)" },
          "60%": { transform: "scale(0.8)" },
          "100%": { transform: "scale(1)" },
        },
        "confetti": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
      },
      animation: {
        "badge-unlock": "badge-unlock 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "glow": "glow 2s ease-in-out infinite",
        "heart-lost": "heart-lost 0.6s ease-in-out",
        "confetti": "confetti 3s ease-in forwards",
      },
    },
  },
  plugins: [],
};
export default config;
