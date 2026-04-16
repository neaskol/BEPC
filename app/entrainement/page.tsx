import type { Metadata } from "next";
import { ArrowLeft, Zap, Shield, Target } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "S'entraîner — BEPC Mada",
  description: "Entraîne-toi avec différents modes : Standard, Chrono, Mode Survie et Rattrapage pour préparer le BEPC.",
};

const MODES = [
  {
    href: "/entrainement/chrono",
    icone: Zap,
    couleur: "text-bepc-ambre",
    fond: "bg-bepc-ambre-clair",
    bordure: "border-bepc-ambre",
    titre: "Mode Chrono",
    description: "1 exercice, 60 secondes. Réponds vite pour gagner des XP bonus !",
    xpLabel: "15 XP + 5 bonus vitesse",
    difficulte: "Dynamique",
  },
  {
    href: "/entrainement/survie",
    icone: Shield,
    couleur: "text-bepc-rouge",
    fond: "bg-bepc-rouge-clair",
    bordure: "border-bepc-rouge",
    titre: "Mode Survie",
    description: "5 exercices, 3 cœurs. Une erreur = un cœur perdu. Tiens bon !",
    xpLabel: "75 XP session complète",
    difficulte: "Intense",
  },
  {
    href: "/entrainement/rattrapage",
    icone: Target,
    couleur: "text-bepc-vert",
    fond: "bg-bepc-vert-clair",
    bordure: "border-bepc-vert",
    titre: "Rattrapage Éclair",
    description: "5 exercices ciblés sur tes points faibles. 15 minutes pour progresser.",
    xpLabel: "30 XP si > 60% corrects",
    difficulte: "Ciblé",
  },
];

export default function PageEntrainement() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-sm font-semibold text-gray-900">Modes d&apos;entraînement</h1>
      </header>

      <div className="px-4 py-6 space-y-4">
        <p className="text-sm text-gray-500 leading-relaxed">
          Choisis ton mode d&apos;entraînement. Chaque mode t&apos;aide à progresser différemment.
        </p>

        {MODES.map((mode) => {
          const Icone = mode.icone;
          return (
            <Link
              key={mode.href}
              href={mode.href}
              className={`block bg-white rounded-2xl p-5 shadow-sm border-2 ${mode.bordure} active:scale-98 transition-transform`}
            >
              <div className="flex items-start gap-4">
                <div className={`${mode.fond} rounded-xl p-3 flex-shrink-0`}>
                  <Icone size={22} className={mode.couleur} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">{mode.titre}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${mode.fond} ${mode.couleur}`}>
                      {mode.difficulte}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{mode.description}</p>
                  <p className={`text-xs font-semibold ${mode.couleur}`}>{mode.xpLabel}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
