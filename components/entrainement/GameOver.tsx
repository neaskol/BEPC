"use client";

import { RotateCcw, Home } from "lucide-react";
import Link from "next/link";

type Props = {
  score: number;
  total: number;
  onReessayer: () => void;
};

export function GameOver({ score, total, onReessayer }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8 space-y-6 text-center">
      {/* Icone */}
      <div className="text-6xl">💪</div>

      {/* Titre */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-gray-900">Tu as tout donné !</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          Ce n&apos;est pas une défaite — c&apos;est de l&apos;entraînement. Chaque essai te rapproche du BEPC.
        </p>
      </div>

      {/* Score */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 w-full max-w-xs space-y-1">
        <div className="text-4xl font-bold text-bepc-vert">{score}/{total}</div>
        <div className="text-sm text-gray-500">exercices réussis</div>
      </div>

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
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
          Tableau de bord
        </Link>
      </div>
    </div>
  );
}
