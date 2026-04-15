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
          vert: "#639922",      // couleur dominante, succès, progression
          ambre: "#BA7517",     // recommandations, alertes douces
          rouge: "#D85A30",     // erreurs (jamais seul, toujours + message bienveillant)
          gris: "#5F5E5A",      // textes secondaires, éléments inactifs
          "ambre-clair": "#FAEEDA", // fond ambre léger
          "vert-clair": "#EBF3D9",  // fond vert léger
          "rouge-clair": "#FAE9E3", // fond rouge léger
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Mobile-first typographie (max 22px titres sur mobile)
        "titre-xl": ["22px", { lineHeight: "1.3", fontWeight: "500" }],
        "titre-lg": ["20px", { lineHeight: "1.3", fontWeight: "500" }],
        "titre-md": ["18px", { lineHeight: "1.4", fontWeight: "500" }],
        "corps": ["16px", { lineHeight: "1.6" }],
        "corps-sm": ["14px", { lineHeight: "1.6" }],
      },
      minHeight: {
        "touch": "44px", // hauteur minimum boutons (accessibilité tactile)
      },
      spacing: {
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
      screens: {
        // Mobile-first : 375px est la taille de référence
        "xs": "375px",
        "sm": "640px",
        "md": "768px",
        "lg": "1024px",
      },
    },
  },
  plugins: [],
};
export default config;
