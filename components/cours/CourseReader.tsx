"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { MiniQuiz } from "./MiniQuiz";
import type { Cours } from "@/app/cours/actions";
import type { CoursContent } from "@/lib/ai/generateCours";

type Phase =
  | { type: "section"; index: number; step: "lecture" | "quiz" }
  | { type: "quiz_final"; questionIndex: number }
  | { type: "termine" };

type Props = { cours: Cours };

export function CourseReader({ cours }: Props) {
  const contenu = cours.contenu_json as CoursContent;
  const sections = contenu.sections ?? [];
  const quizFinal = contenu.quiz_final ?? [];
  const total = sections.length + quizFinal.length;

  const [phase, setPhase] = useState<Phase>(
    sections.length > 0
      ? { type: "section", index: 0, step: "lecture" }
      : { type: "quiz_final", questionIndex: 0 }
  );

  const currentStep = (() => {
    if (phase.type === "section") return phase.index * 2 + (phase.step === "quiz" ? 1 : 0);
    if (phase.type === "quiz_final") return sections.length * 2 + phase.questionIndex;
    return total * 2;
  })();
  const totalSteps = sections.length * 2 + quizFinal.length;
  const progressPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));

  function advanceFromLecture(sectionIndex: number) {
    const section = sections[sectionIndex];
    if (section?.quiz_section) {
      setPhase({ type: "section", index: sectionIndex, step: "quiz" });
    } else {
      advanceFromQuiz(sectionIndex);
    }
  }

  function advanceFromQuiz(sectionIndex: number) {
    const next = sectionIndex + 1;
    if (next < sections.length) {
      setPhase({ type: "section", index: next, step: "lecture" });
    } else if (quizFinal.length > 0) {
      setPhase({ type: "quiz_final", questionIndex: 0 });
    } else {
      setPhase({ type: "termine" });
    }
  }

  function advanceQuizFinal(questionIndex: number) {
    const next = questionIndex + 1;
    if (next < quizFinal.length) {
      setPhase({ type: "quiz_final", questionIndex: next });
    } else {
      setPhase({ type: "termine" });
    }
  }

  return (
    <div className="space-y-5">
      {/* Barre de progression */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-bepc-gris">
          <span>Progression du cours</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-bepc-vert rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Objectifs (affichés une fois en haut) */}
      {contenu.objectifs?.length > 0 && phase.type === "section" && phase.index === 0 && phase.step === "lecture" && (
        <div className="bg-bepc-vert-clair rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold text-bepc-vert">Objectifs de ce cours</p>
          <ul className="space-y-1">
            {contenu.objectifs.map((obj, i) => (
              <li key={i} className="flex gap-2 text-corps-sm text-gray-700">
                <CheckCircle size={14} className="text-bepc-vert mt-0.5 flex-shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section — lecture */}
      {phase.type === "section" && phase.step === "lecture" && (() => {
        const section = sections[phase.index];
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-bepc-vert text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {phase.index + 1}
                </span>
                <h2 className="text-titre-md text-gray-900">{section.titre}</h2>
              </div>
              <p className="text-corps text-gray-700 leading-relaxed whitespace-pre-line">
                {section.contenu}
              </p>

              {section.exemples?.length > 0 && (
                <div className="bg-bepc-ambre-clair rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-bepc-ambre uppercase tracking-wide">
                    Exemple{section.exemples.length > 1 ? "s" : ""}
                  </p>
                  {section.exemples.map((ex, i) => (
                    <div key={i} className="text-corps-sm text-gray-700">
                      {typeof ex === "string" ? (
                        <p>{ex}</p>
                      ) : (
                        <>
                          <p className="font-medium">{(ex as { enonce: string }).enonce}</p>
                          <p className="text-bepc-vert mt-1">{(ex as { solution: string }).solution}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => advanceFromLecture(phase.index)}
              className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
            >
              {section.quiz_section ? "Passer au mini-quiz" : "Section suivante"}
            </button>
          </div>
        );
      })()}

      {/* Section — quiz */}
      {phase.type === "section" && phase.step === "quiz" && (() => {
        const section = sections[phase.index];
        const quiz = section.quiz_section;
        if (!quiz) return null;
        return (
          <MiniQuiz
            quiz={quiz}
            onComplete={() => advanceFromQuiz(phase.index)}
          />
        );
      })()}

      {/* Quiz final */}
      {phase.type === "quiz_final" && (() => {
        const q = quizFinal[phase.questionIndex];
        return (
          <div className="space-y-3">
            <div className="bg-bepc-vert text-white rounded-2xl px-5 py-3 text-sm font-semibold">
              Quiz final — Question {phase.questionIndex + 1}/{quizFinal.length}
            </div>
            <MiniQuiz
              quiz={q}
              onComplete={() => advanceQuizFinal(phase.questionIndex)}
            />
          </div>
        );
      })()}

      {/* Fin du cours */}
      {phase.type === "termine" && (
        <div className="space-y-4">
          <div className="bg-bepc-vert rounded-2xl p-6 text-center text-white space-y-2">
            <span className="text-4xl">🎉</span>
            <p className="text-titre-md font-semibold">Cours terminé !</p>
            <p className="text-sm text-white/80">
              Excellent travail ! Tu maîtrises maintenant ce chapitre.
            </p>
          </div>

          {/* Résumé */}
          {contenu.resume && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Points clés à retenir</p>
              <p className="text-corps-sm text-gray-700">{contenu.resume}</p>
            </div>
          )}

          {/* Mots-clés */}
          {contenu.mots_cles?.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Vocabulaire clé</p>
              <div className="space-y-3">
                {contenu.mots_cles.map((mk, i) => (
                  <div key={i} className="border-l-2 border-bepc-vert pl-3">
                    <p className="text-sm font-semibold text-gray-800">{mk.terme}</p>
                    <p className="text-corps-sm text-gray-600">{mk.definition}</p>
                    {mk.exemple && (
                      <p className="text-corps-sm text-bepc-ambre mt-0.5">
                        Ex : {mk.exemple}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
