"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";

type QuizData = {
  question: string;
  type: "qcm";
  choix: string[];
  bonne_reponse: number;
  explication: string;
};

type Props = {
  quiz: QuizData;
  onComplete: () => void;
};

export function MiniQuiz({ quiz, onComplete }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === quiz.bonne_reponse;

  function handleSelect(index: number) {
    if (submitted) return;
    setSelected(index);
  }

  function handleSubmit() {
    if (selected === null) return;
    setSubmitted(true);
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
            btnClass += "bg-bepc-rouge-clair border-bepc-rouge text-bepc-rouge";
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
                ? "Parfait ! Tu as bien compris cette partie."
                : "Pas tout à fait — mais tu y es presque !"}
            </p>
            <p className="text-corps-sm text-gray-700">{quiz.explication}</p>
          </div>
        </div>
      )}

      {submitted && (
        <button
          onClick={onComplete}
          className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
        >
          Continuer
        </button>
      )}
    </div>
  );
}
