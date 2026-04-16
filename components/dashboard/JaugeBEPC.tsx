"use client";

// Composant JaugeBEPC — barre de progression colorée avec formule pondérée
// Coefficients : maths×4 + français×4 + hist_geo×3 + svt×3 + physique×3 + anglais×2 / 19
// docs/regles-metier.md & docs/design.md

import { GraduationCap, CalendarDays, TrendingUp } from "lucide-react";

type ProgressionMatiere = {
  matiere_id: string;
  niveau_pct: number;
  matieres: { code: string; nom: string; couleur: string } | null;
};

type Props = {
  progressions: ProgressionMatiere[];
  joursAvantBepc?: number;
};

// Coefficients officiels BEPC Madagascar
const COEFFICIENTS: Record<string, number> = {
  maths: 4,
  francais: 4,
  hist_geo: 3,
  svt: 3,
  physique: 3,
  anglais: 2,
};
const TOTAL_COEFFICIENTS = 19;

function calculerJauge(progressions: ProgressionMatiere[]): number {
  if (!progressions || progressions.length === 0) return 0;
  let somme = 0;
  for (const p of progressions) {
    const code = p.matieres?.code ?? "";
    const coeff = COEFFICIENTS[code] ?? 1;
    somme += p.niveau_pct * coeff;
  }
  return Math.min(100, Math.round(somme / TOTAL_COEFFICIENTS));
}

function getJaugeColor(pct: number): { text: string; bg: string; bar: string; ring: string } {
  if (pct < 33) return {
    text: "text-bepc-rouge",
    bg: "bg-bepc-rouge-clair",
    bar: "#D85A30",
    ring: "ring-bepc-rouge/20",
  };
  if (pct < 66) return {
    text: "text-bepc-ambre",
    bg: "bg-bepc-ambre-clair",
    bar: "#BA7517",
    ring: "ring-bepc-ambre/20",
  };
  return {
    text: "text-bepc-vert",
    bg: "bg-bepc-vert-clair",
    bar: "#639922",
    ring: "ring-bepc-vert/20",
  };
}

function getJaugeLabel(pct: number): string {
  if (pct < 10) return "C'est un début — chaque cours compte !";
  if (pct < 25) return "Tu avances — continue comme ça !";
  if (pct < 50) return "Bien parti ! La moitié du chemin est franchie.";
  if (pct < 66) return "Plus de la moitié — le BEPC se rapproche !";
  if (pct < 80) return "Excellent niveau ! Tu es bien préparé.";
  return "Tu maîtrises ça ! Le BEPC n'a qu'à bien se tenir.";
}

export function JaugeBEPC({ progressions, joursAvantBepc }: Props) {
  const jaugePct = calculerJauge(progressions);
  const colors = getJaugeColor(jaugePct);
  const label = getJaugeLabel(jaugePct);

  return (
    <div className="card p-5 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <GraduationCap size={18} style={{ color: colors.bar }} />
          </div>
          <div>
            <p className="font-display text-[13px] font-bold text-gray-500 uppercase tracking-wide">
              Préparation BEPC
            </p>
          </div>
        </div>
        <div className={`${colors.bg} ${colors.text} font-display text-lg font-extrabold
                         px-3 py-1 rounded-xl ring-2 ${colors.ring}`}>
          {jaugePct}%
        </div>
      </div>

      {/* Barre de progression principale */}
      <div className="space-y-2">
        <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${jaugePct}%`, backgroundColor: colors.bar }}
            role="progressbar"
            aria-valuenow={jaugePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Préparation BEPC : ${jaugePct}%`}
          />
        </div>
        <p className="text-corps-sm text-gray-500 flex items-center gap-1.5">
          <TrendingUp size={13} className="text-bepc-gris flex-shrink-0" />
          {label}
        </p>
      </div>

      {/* Jours avant BEPC */}
      {joursAvantBepc !== undefined && joursAvantBepc > 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3">
          <CalendarDays size={16} className="text-bepc-gris flex-shrink-0" />
          <span className="text-corps-sm text-gray-600 flex-1">Jours avant le BEPC</span>
          <span className="font-display text-sm font-extrabold text-gray-800">
            {joursAvantBepc}j
          </span>
        </div>
      )}

      {/* Détail par matière */}
      {progressions.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Par matière
          </p>
          <div className="space-y-2">
            {progressions
              .sort((a, b) => (a.niveau_pct ?? 0) - (b.niveau_pct ?? 0))
              .map((p) => {
                const code = p.matieres?.code ?? "";
                const coeff = COEFFICIENTS[code] ?? 1;
                return (
                  <div key={p.matiere_id} className="flex items-center gap-2.5">
                    <div className="w-[72px] shrink-0">
                      <span className="text-[12px] font-medium text-gray-600 truncate block">
                        {p.matieres?.nom ?? "Matière"}
                      </span>
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${p.niveau_pct}%`,
                          backgroundColor: p.matieres?.couleur ?? "#639922",
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 w-8 text-right tabular-nums">
                      {p.niveau_pct}%
                    </span>
                    <span className="text-[10px] text-gray-400 w-10 text-right shrink-0">
                      ×{coeff}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {progressions.length === 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-center">
          <p className="text-corps-sm text-bepc-gris">
            Commence tes premiers exercices pour voir ta progression ici.
          </p>
        </div>
      )}
    </div>
  );
}
