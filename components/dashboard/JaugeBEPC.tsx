"use client";

// Composant JaugeBEPC — barre de progression colorée avec formule pondérée
// Coefficients : maths×4 + français×4 + hist_geo×3 + svt×3 + physique×3 + anglais×2 / 19
// docs/regles-metier.md & docs/design.md

import { BookOpen } from "lucide-react";

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

function getJaugeColor(pct: number): string {
  if (pct < 33) return "#D85A30"; // rouge — docs/design.md
  if (pct < 66) return "#BA7517"; // orange/ambre
  return "#639922"; // vert
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
  const couleur = getJaugeColor(jaugePct);
  const label = getJaugeLabel(jaugePct);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: couleur + "20" }}
          >
            <BookOpen size={16} style={{ color: couleur }} />
          </div>
          <span className="text-sm font-semibold text-gray-900">
            Préparation BEPC
          </span>
        </div>
        <span
          className="text-lg font-bold"
          style={{ color: couleur }}
        >
          {jaugePct}%
        </span>
      </div>

      {/* Barre de progression */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${jaugePct}%`, backgroundColor: couleur }}
            role="progressbar"
            aria-valuenow={jaugePct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-corps-sm text-gray-600">{label}</p>
      </div>

      {/* Jours avant BEPC */}
      {joursAvantBepc !== undefined && joursAvantBepc > 0 && (
        <div className="bg-gray-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <span className="text-corps-sm text-gray-600">Jours avant le BEPC</span>
          <span className="text-sm font-bold text-gray-800">{joursAvantBepc} jours</span>
        </div>
      )}

      {/* Détail par matière */}
      {progressions.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Par matière
          </p>
          <div className="space-y-1.5">
            {progressions
              .sort((a, b) => (a.niveau_pct ?? 0) - (b.niveau_pct ?? 0))
              .map((p) => {
                const code = p.matieres?.code ?? "";
                const coeff = COEFFICIENTS[code] ?? 1;
                return (
                  <div key={p.matiere_id} className="flex items-center gap-2">
                    <div className="w-20 shrink-0">
                      <span className="text-xs text-gray-600 truncate block">
                        {p.matieres?.nom ?? "Matière"}
                      </span>
                    </div>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${p.niveau_pct}%`,
                          backgroundColor: p.matieres?.couleur ?? "#639922",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {p.niveau_pct}%
                    </span>
                    <span className="text-xs text-bepc-gris w-10 text-right shrink-0">
                      coeff {coeff}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {progressions.length === 0 && (
        <p className="text-corps-sm text-bepc-gris text-center py-2">
          Commence tes premiers exercices pour voir ta progression ici.
        </p>
      )}
    </div>
  );
}
