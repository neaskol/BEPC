"use client";

import { Star, RotateCcw, Home, Trophy } from "lucide-react";
import Link from "next/link";

export type ResultatExercice = {
  question: string;
  reponseDonnee: string;
  bonneReponse: string;
  estCorrect: boolean;
  tempsReponse?: number; // secondes (chrono)
  matiere?: string;
};

type Props = {
  mode: "chrono" | "survie" | "rattrapage";
  resultats: ResultatExercice[];
  xpGagne: number;
  nouveauxBadges?: { code: string; nom: string }[];
  onReessayer: () => void;
};

export function Recapitulatif({ mode, resultats, xpGagne, nouveauxBadges, onReessayer }: Props) {
  const nbCorrects = resultats.filter((r) => r.estCorrect).length;
  const total = resultats.length;
  const score = Math.round((nbCorrects / total) * 100);

  const titreMode = {
    chrono: "Mode Chrono — Récapitulatif",
    survie: "Mode Survie — Récapitulatif",
    rattrapage: "Rattrapage Éclair — Récapitulatif",
  }[mode];

  const messageEncouragement = () => {
    if (score === 100) return "Score parfait ! Tu es impressionnant(e) !";
    if (score >= 80) return "Excellent travail ! Le BEPC n'a qu'à bien se tenir !";
    if (score >= 60) return "Bien joué ! Tu progresses vraiment.";
    if (score >= 40) return "Pas tout à fait — mais tu as bien essayé. Continue !";
    return "Ce n'était pas facile — mais tu as eu le courage d'essayer. C'est ce qui compte !";
  };

  const messageRattrapage =
    mode === "rattrapage"
      ? "Tu as progressé sur ces points. Continue demain !"
      : null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-lg font-semibold text-gray-900">{titreMode}</h1>
        <p className="text-sm text-gray-500">{messageEncouragement()}</p>
      </div>

      {/* Score global */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center space-y-3">
        <div className="text-5xl font-bold text-bepc-vert">{nbCorrects}/{total}</div>
        <div className="text-sm text-gray-500">bonnes réponses</div>

        {/* XP */}
        {xpGagne > 0 && (
          <div className="flex items-center justify-center gap-1.5 bg-bepc-vert-clair rounded-xl py-2.5">
            <Star size={16} className="text-bepc-vert fill-bepc-vert" />
            <span className="text-sm font-semibold text-bepc-vert">+{xpGagne} XP gagnés !</span>
          </div>
        )}
      </div>

      {/* Nouveaux badges */}
      {nouveauxBadges && nouveauxBadges.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-bepc-ambre" />
            <span className="text-sm font-semibold text-gray-900">Nouveau badge débloqué !</span>
          </div>
          {nouveauxBadges.map((b) => (
            <div key={b.code} className="bg-bepc-ambre-clair rounded-xl px-3 py-2">
              <span className="text-sm font-medium text-bepc-ambre">{b.nom}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message rattrapage */}
      {messageRattrapage && (
        <div className="bg-bepc-vert-clair rounded-2xl p-4 border border-bepc-vert">
          <p className="text-sm font-medium text-bepc-vert text-center">{messageRattrapage}</p>
        </div>
      )}

      {/* Détail par question */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">Détail de la session</h2>
        {resultats.map((r, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl p-4 border ${
              r.estCorrect ? "border-bepc-vert" : "border-bepc-ambre"
            } space-y-1`}
          >
            <div className="flex items-start gap-2">
              <span
                className={`text-xs font-bold mt-0.5 ${
                  r.estCorrect ? "text-bepc-vert" : "text-bepc-ambre"
                }`}
              >
                {r.estCorrect ? "✓" : "○"}
              </span>
              <p className="text-xs text-gray-700 leading-relaxed flex-1">{r.question}</p>
            </div>
            {!r.estCorrect && (
              <p className="text-xs text-gray-400 pl-4">
                Bonne réponse : <span className="font-semibold text-bepc-vert">{r.bonneReponse}</span>
              </p>
            )}
            {r.tempsReponse !== undefined && (
              <p className="text-xs text-gray-400 pl-4">Répondu en {r.tempsReponse}s</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3 pb-6">
        <button
          onClick={onReessayer}
          className="w-full flex items-center justify-center gap-2 bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
        >
          <RotateCcw size={16} />
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl py-3 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
        >
          <Home size={16} />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
