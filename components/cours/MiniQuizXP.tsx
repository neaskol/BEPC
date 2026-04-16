"use client";

// MiniQuizXP — variante du MiniQuiz qui accorde +20 XP si réussi (docs/regles-metier.md)
// Appelle /api/xp/add après un quiz de section réussi

import { useState } from "react";
import { CheckCircle, AlertCircle, Star } from "lucide-react";

type QuizData = {
  question: string;
  type: "qcm";
  choix: string[];
  bonne_reponse: number;
  explication: string;
};

type Props = {
  quiz: QuizData;
  onComplete: (reussi: boolean) => void;
};

export function MiniQuizXP({ quiz, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [xpAdded, setXpAdded] = useState(false);

  const isCorrect = selected === quiz.bonne_reponse;

  function handleSelect(index: number) {
    if (submitted) return;
    setSelected(index);
  }

  async function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);

    // Attribuer +20 XP si réussi (docs/regles-metier.md : "Quiz section réussi = +20 XP")
    if (selected === quiz.bonne_reponse) {
      try {
        const res = await fetch("/api/xp/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ xp: 20, raison: "quiz_section" }),
        });
        if (res.ok) setXpAdded(true);
      } catch {
        // Silencieux — le cours continue même si XP échoue
      }
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      <p className="text-sm font-semibold text-gray-900 leading-snug">
        {quiz.question}
      </p>

      <div className="space-y-2">
        {quiz.choix.map((choix, i) => {
          let btnClass =
            "w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-colors min-h-touch ";

          if (!submitted) {
            btnClass +=
              selected === i
                ? "bg-bepc-vert-clair border-bepc-vert text-bepc-vert"
                : "bg-gray-50 border-gray-200 text-gray-800 active:bg-gray-100";
          } else if (i === quiz.bonne_reponse) {
            btnClass += "bg-bepc-vert-clair border-bepc-vert text-bepc-vert";
          } else if (i === selected) {
            btnClass += "bg-bepc-ambre-clair border-bepc-ambre text-bepc-ambre";
          } else {
            btnClass += "bg-gray-50 border-gray-200 text-gray-400";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={submitted}
              className={btnClass}
            >
              {choix}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-touch
                     disabled:opacity-40 active:scale-95 transition-transform"
        >
          Valider ma réponse
        </button>
      )}

      {submitted && (
        <>
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
                  ? "Parfait ! Tu maîtrises cette partie."
                  : "Pas tout à fait — mais tu y es presque !"}
              </p>
              <p className="text-corps-sm text-gray-700">{quiz.explication}</p>
            </div>
          </div>

          {isCorrect && xpAdded && (
            <div className="flex items-center justify-center gap-1.5 bg-bepc-vert-clair rounded-xl py-2.5">
              <Star size={16} className="text-bepc-vert fill-bepc-vert" />
              <span className="text-sm font-semibold text-bepc-vert">
                +20 XP gagnés !
              </span>
            </div>
          )}

          <button
            onClick={() => onComplete(isCorrect)}
            className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
          >
            Continuer
          </button>
        </>
      )}
    </div>
  );
}
