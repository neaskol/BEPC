"use client";

import { useState, useTransition } from "react";
import { completerOnboarding } from "@/app/onboarding/actions";

const RAISONS = [
  {
    value: "difficultes_matieres",
    label: "J'ai eu des difficultés avec certaines matières",
    emoji: "📚",
  },
  {
    value: "problemes_familiaux",
    label: "Des problèmes familiaux m'ont éloigné(e) de l'école",
    emoji: "🏠",
  },
  {
    value: "travail_famille",
    label: "Je travaillais pour aider ma famille",
    emoji: "💪",
  },
  {
    value: "sens_etudes",
    label: "Je ne trouvais pas le sens des études",
    emoji: "🤔",
  },
  {
    value: "autre",
    label: "Une autre raison personnelle",
    emoji: "✨",
  },
];

const QUESTIONS = [
  {
    id: 1,
    matiere: "Mathématiques",
    couleur: "bg-green-100 text-green-800",
    question:
      "Tu as 2 500 Ariary et achètes du riz à 1 800 Ariary. Combien te reste-t-il ?",
    options: ["500 Ariary", "700 Ariary", "800 Ariary", "1 000 Ariary"],
    correct: 1,
  },
  {
    id: 2,
    matiere: "Mathématiques",
    couleur: "bg-green-100 text-green-800",
    question:
      "Un rectangle mesure 8 m de long et 5 m de large. Quelle est son aire ?",
    options: ["13 m²", "26 m²", "40 m²", "45 m²"],
    correct: 2,
  },
  {
    id: 3,
    matiere: "Français",
    couleur: "bg-orange-100 text-orange-800",
    question:
      "Quel est le sujet du verbe dans : « Les zébus paissent dans la prairie » ?",
    options: ["paissent", "la prairie", "Les zébus", "dans"],
    correct: 2,
  },
  {
    id: 4,
    matiere: "Français",
    couleur: "bg-orange-100 text-orange-800",
    question: "Choisissez la bonne forme : « Les élèves ___ partis à l'école »",
    options: ["son", "sont", "sons", "sond"],
    correct: 1,
  },
  {
    id: 5,
    matiere: "SVT",
    couleur: "bg-emerald-100 text-emerald-800",
    question:
      "De quoi les plantes ont-elles besoin pour faire la photosynthèse ?",
    options: [
      "De l'eau seulement",
      "De la lumière seulement",
      "De la lumière, de l'eau et du CO₂",
      "De la chaleur et du sel",
    ],
    correct: 2,
  },
  {
    id: 6,
    matiere: "SVT",
    couleur: "bg-emerald-100 text-emerald-800",
    question: "Combien de cavités le cœur humain possède-t-il ?",
    options: ["2", "3", "4", "6"],
    correct: 2,
  },
  {
    id: 7,
    matiere: "Physique-Chimie",
    couleur: "bg-blue-100 text-blue-800",
    question: "À quelle température l'eau bout-elle à pression normale ?",
    options: ["80°C", "90°C", "100°C", "120°C"],
    correct: 2,
  },
  {
    id: 8,
    matiere: "Physique-Chimie",
    couleur: "bg-blue-100 text-blue-800",
    question:
      "Quelle formule relie la vitesse (v), la distance (d) et le temps (t) ?",
    options: ["v = d + t", "v = d × t", "v = d ÷ t", "v = t ÷ d"],
    correct: 2,
  },
  {
    id: 9,
    matiere: "Histoire-Géographie",
    couleur: "bg-yellow-100 text-yellow-800",
    question: "Quelle est la capitale de Madagascar ?",
    options: ["Toamasina", "Antananarivo", "Fianarantsoa", "Mahajanga"],
    correct: 1,
  },
  {
    id: 10,
    matiere: "Anglais",
    couleur: "bg-purple-100 text-purple-800",
    question: 'Complète : "She ___ to school every day."',
    options: ["go", "goes", "going", "gone"],
    correct: 1,
  },
];

type Step = "raison" | "diagnostic" | "loading";

export default function OnboardingClient({ prenom }: { prenom: string }) {
  const [step, setStep] = useState<Step>("raison");
  const [raison, setRaison] = useState<string>("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleRaisonNext = () => {
    if (!raison) return;
    setStep("diagnostic");
  };

  const handleAnswer = (optionIndex: number) => {
    const qId = QUESTIONS[currentQ].id;
    const newAnswers = { ...answers, [qId]: optionIndex };
    setAnswers(newAnswers);

    if (currentQ < QUESTIONS.length - 1) {
      // Petite pause visuelle avant de passer à la suivante
      setTimeout(() => setCurrentQ((c) => c + 1), 400);
    } else {
      // Toutes les questions répondues → soumettre
      setStep("loading");
      const corrects: Record<string, number> = {};
      QUESTIONS.forEach((q) => {
        corrects[String(q.id)] = q.correct;
      });

      const answersStr: Record<string, number> = {};
      Object.entries(newAnswers).forEach(([k, v]) => {
        answersStr[k] = v;
      });

      startTransition(async () => {
        const result = await completerOnboarding({
          raison_decrochage: raison,
          answers: answersStr,
          corrects,
        });
        if (result?.error) {
          setError(result.error);
          setStep("diagnostic");
        }
        // Si succès → redirect géré côté serveur
      });
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bepc-green to-green-700 flex flex-col items-center justify-center p-4">
        <div className="text-center text-white">
          <div className="text-5xl mb-4 animate-bounce">🎓</div>
          <h2 className="text-xl font-bold mb-2">Ton profil est prêt !</h2>
          <p className="text-green-100 text-sm">
            On prépare ton tableau de bord…
          </p>
        </div>
      </div>
    );
  }

  if (step === "raison") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-bepc-green to-green-700 flex flex-col p-4 pt-12">
        <div className="max-w-sm mx-auto w-full">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="h-1.5 flex-1 bg-white rounded-full" />
            <div className="h-1.5 flex-1 bg-white/30 rounded-full" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Bonjour {prenom} !
          </h1>
          <p className="text-green-100 mb-8 text-sm leading-relaxed">
            Chaque parcours est unique. Pour mieux t&apos;accompagner, dis-nous
            pourquoi tu n&apos;as pas pu terminer l&apos;école.
          </p>

          <div className="space-y-3">
            {RAISONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRaison(r.value)}
                className={`w-full p-4 rounded-xl text-left flex items-start gap-3 transition-all
                  ${
                    raison === r.value
                      ? "bg-white text-gray-900 shadow-lg scale-[1.02]"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
              >
                <span className="text-xl shrink-0">{r.emoji}</span>
                <span className="text-sm font-medium leading-snug">
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={handleRaisonNext}
            disabled={!raison}
            className="mt-8 w-full py-3 bg-white text-bepc-green font-bold rounded-xl
                       disabled:opacity-40 disabled:cursor-not-allowed
                       hover:bg-green-50 active:scale-95 transition-transform"
          >
            Continuer →
          </button>
        </div>
      </div>
    );
  }

  // Étape diagnostic
  const q = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-bepc-green px-4 py-3">
        <div className="max-w-sm mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-1">
            <div className="h-1.5 flex-1 bg-green-900/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white/80 text-xs font-medium shrink-0">
              {currentQ + 1}/{QUESTIONS.length}
            </span>
          </div>
          <p className="text-green-100 text-xs">Diagnostic initial</p>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 p-4 max-w-sm mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 mb-8">
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${q.couleur}`}
          >
            {q.matiere}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">
            {q.question}
          </h2>
        </div>

        <div className="space-y-3">
          {q.options.map((option, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isChosen = answers[q.id] === idx;
            const isCorrect = idx === q.correct;

            let classes =
              "w-full p-4 rounded-xl text-left text-sm font-medium border-2 transition-all";

            if (isAnswered) {
              if (isCorrect) {
                classes += " border-green-500 bg-green-50 text-green-800";
              } else if (isChosen) {
                classes += " border-red-300 bg-red-50 text-red-700";
              } else {
                classes += " border-gray-200 bg-gray-50 text-gray-400";
              }
            } else {
              classes +=
                " border-gray-200 bg-white text-gray-800 hover:border-bepc-green hover:bg-green-50 active:scale-95";
            }

            return (
              <button
                key={idx}
                onClick={() => !isAnswered && !isPending && handleAnswer(idx)}
                disabled={isAnswered || isPending}
                className={classes}
              >
                <span className="text-gray-400 mr-2 text-xs">
                  {["A", "B", "C", "D"][idx]}.
                </span>{" "}
                {option}
              </button>
            );
          })}
        </div>

        {answers[q.id] !== undefined && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              {answers[q.id] === q.correct
                ? "✓ Bonne réponse ! Continue comme ça."
                : `La bonne réponse était : ${q.options[q.correct]}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
