import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Examen Blanc — BEPC Mada",
  description: "Passe un examen blanc complet dans les conditions du BEPC et reçois un rapport personnalisé par l'IA.",
};

export default function ExamenBlancLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
