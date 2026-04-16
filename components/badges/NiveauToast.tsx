"use client";

import { useEffect, useState } from "react";
import { NIVEAUX } from "@/lib/actions/xp";

interface NiveauToastProps {
  niveauApres: number;
  prenom: string;
  onClose?: () => void;
}

export function NiveauToast({ niveauApres, prenom, onClose }: NiveauToastProps) {
  const [visible, setVisible] = useState(true);
  const nomNiveau = NIVEAUX.find((n) => n.niveau === niveauApres)?.nom ?? "";

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center animate-badge-unlock pointer-events-auto">
        <div className="text-5xl mb-3">🎉</div>
        <h2 className="text-lg font-bold text-gray-800">Montée de niveau !</h2>
        <p className="text-bepc-green font-semibold text-xl mt-1">{nomNiveau}</p>
        <p className="text-gray-500 text-sm mt-2">
          Tu viens de passer <strong>{nomNiveau}</strong> ! Tu avances vraiment vite, {prenom}.
        </p>
        <button
          onClick={() => { setVisible(false); onClose?.(); }}
          className="mt-4 bg-bepc-green text-white px-6 py-2 rounded-xl text-sm font-semibold min-h-[44px] w-full"
        >
          Super !
        </button>
      </div>
    </div>
  );
}
