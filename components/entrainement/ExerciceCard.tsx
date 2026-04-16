"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

export type ExerciceData = {
  id: string;
  question: string;
  type: "qcm" | "vrai_faux" | "calcul";
  choix?: string[];
  bonne_reponse: number | string;
  explication?: string;
  matiere?: string;
  competence?: string; // compétence ciblée (pour mode rattrapage)
};

type Props = {
  exercice: ExerciceData;
  mode: "chrono" | "survie" | "rattrapage";
  onReponse: (reponseDonnee: string | number, estCorrect: boolean) => void;
  afficherFeedback?: boolean; // false = chrono (juste correct/raté)
};

export function ExerciceCard({ exercice, mode, onReponse, afficherFeedback = true }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const choix = exercice.choix ?? [];
  const bonneReponseIndex =
    typeof exercice.bonne_reponse === "number"
      ? exercice.bonne_reponse
      : parseInt(String(exercice.bonne_reponse), 10);

  function handleSelect(i: number) {
    if (submitted) return;
    setSelected(i);
  }

  function handleSubmit() {
    if (selected === null || submitted) return;
    setSubmitted(true);
    const correct = selected === bonneReponseIndex;
    onReponse(selected, correct);
  }

  const isCorrect = submitted && selected === bonneReponseIndex;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      {/* Compétence ciblée (rattrapage uniquement) */}
      {exercice.competence && mode === "rattrapage" && (
        <div className="inline-flex items-center gap-1.5 bg-bepc-ambre-clair rounded-full px-3 py-1">
          <span className="text-xs font-semibold text-bepc-ambre">
            Compétence ciblée : {exercice.competence}
          </span>
        </div>
      )}

      {/* Matière */}
      {exercice.matiere && (
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {exercice.matiere}
        </span>
      )}

      {/* Question */}
      <p className="text-sm font-semibold text-gray-900 leading-relaxed">
        {exercice.question}
      </p>

      {/* Choix QCM */}
      <div className="space-y-2">
        {choix.map((c, i) => {
          let cls =
            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-colors min-h-[44px] ";

          if (!submitted) {
            cls +=
              selected === i
                ? "bg-bepc-vert-clair border-bepc-vert text-bepc-vert"
                : "bg-gray-50 border-gray-200 text-gray-800 active:bg-gray-100";
          } else if (i === bonneReponseIndex) {
            cls += "bg-bepc-vert-clair border-bepc-vert text-bepc-vert";
          } else if (i === selected) {
            cls += "bg-bepc-ambre-clair border-bepc-ambre text-bepc-ambre";
          } else {
            cls += "bg-gray-50 border-gray-200 text-gray-400";
          }

          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={submitted} className={cls}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Bouton valider */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-[44px] disabled:opacity-40 active:scale-95 transition-transform"
        >
          Valider ma réponse
        </button>
      )}

      {/* Feedback */}
      {submitted && (
        <div
          className={`rounded-xl p-4 flex gap-3 ${
            isCorrect ? "bg-bepc-vert-clair" : "bg-bepc-ambre-clair"
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {isCorrect ? (
              <CheckCircle size={18} className="text-bepc-vert" />
            ) : (
              <AlertCircle size={18} className="text-bepc-ambre" />
            )}
          </div>
          <div className="space-y-1">
            <p
              className={`text-sm font-semibold ${
                isCorrect ? "text-bepc-vert" : "text-bepc-ambre"
              }`}
            >
              {isCorrect
                ? "Excellent ! Tu maîtrises ça !"
                : selected === -1
                ? `Temps écoulé — la bonne réponse était : ${choix[bonneReponseIndex]}`
                : `Presque ! La bonne réponse était : ${choix[bonneReponseIndex]}`}
            </p>
            {afficherFeedback && exercice.explication && (
              <p className="text-xs text-gray-700 leading-relaxed">{exercice.explication}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
