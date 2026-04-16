"use client";

import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";

type Props = {
  duree: number; // durée totale en secondes
  tempsRestant: number;
  actif: boolean;
  onTick: (tempsRestant: number) => void;
  onExpire: () => void;
};

/** Couleur de fond selon le temps restant (Mode Chrono uniquement) */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function couleurFondChrono(tempsRestant: number, _duree?: number): string {
  if (tempsRestant <= 10) return "bg-bepc-rouge-clair border-bepc-rouge";
  if (tempsRestant <= 30) return "bg-bepc-ambre-clair border-bepc-ambre";
  return "bg-bepc-vert-clair border-bepc-vert";
}

export function couleurTexteChrono(tempsRestant: number): string {
  if (tempsRestant <= 10) return "text-bepc-rouge";
  if (tempsRestant <= 30) return "text-bepc-ambre";
  return "text-bepc-vert";
}

export function Timer({ duree, tempsRestant, actif, onTick, onExpire }: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempsRef = useRef(tempsRestant);

  useEffect(() => {
    tempsRef.current = tempsRestant;
  }, [tempsRestant]);

  useEffect(() => {
    if (!actif) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tempsRef.current -= 1;
      if (tempsRef.current <= 0) {
        clearInterval(intervalRef.current!);
        onExpire();
      } else {
        onTick(tempsRef.current);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actif]);

  const pct = (tempsRestant / duree) * 100;
  const couleurTexte = couleurTexteChrono(tempsRestant);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            className={
              tempsRestant <= 10
                ? "stroke-bepc-rouge transition-all duration-1000"
                : tempsRestant <= 30
                ? "stroke-bepc-ambre transition-all duration-1000"
                : "stroke-bepc-vert transition-all duration-1000"
            }
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Clock size={14} className={couleurTexte} />
          <span className={`text-xl font-bold tabular-nums ${couleurTexte}`}>
            {tempsRestant}
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium ${couleurTexte}`}>secondes</span>
    </div>
  );
}

/** Timer global (barre horizontale) pour le mode Rattrapage */
export function TimerGlobal({ tempsRestant, dureeTotal }: { tempsRestant: number; dureeTotal: number }) {
  const pct = Math.max(0, (tempsRestant / dureeTotal) * 100);
  const min = Math.floor(tempsRestant / 60);
  const sec = tempsRestant % 60;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Temps restant
        </span>
        <span className="font-semibold tabular-nums text-gray-700">
          {min}:{sec.toString().padStart(2, "0")}
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            pct < 20 ? "bg-bepc-rouge" : pct < 40 ? "bg-bepc-ambre" : "bg-bepc-vert"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
