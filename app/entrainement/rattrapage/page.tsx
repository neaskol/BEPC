"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { TimerGlobal } from "@/components/entrainement/Timer";
import { Recapitulatif, ResultatExercice } from "@/components/entrainement/Recapitulatif";

type Exercice = {
  id: string;
  question: string;
  type: string;
  choix: string[];
  bonne_reponse: number;
  explication: string;
  matiere: string;
  competence?: string;
};

const DUREE_GLOBALE = 15 * 60; // 15 minutes en secondes
const NB_EXERCICES = 5;

export default function PageRattrapage() {
  const [etat, setEtat] = useState<"chargement" | "jeu" | "feedback" | "recapitulatif">("chargement");
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [indexActuel, setIndexActuel] = useState(0);
  const [tempsRestant, setTempsRestant] = useState(DUREE_GLOBALE);
  const [timerActif, setTimerActif] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultats, setResultats] = useState<ResultatExercice[]>([]);
  const [xpGagne, setXpGagne] = useState(0);
  const [nouveauxBadges, setNouveauxBadges] = useState<{ code: string; nom: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    chargerExercices();
  }, []);

  // Timer global
  useEffect(() => {
    if (!timerActif) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTempsRestant((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          // Temps écoulé — terminer la session
          setEtat("recapitulatif");
          terminerSessionGlobal();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActif]);

  async function chargerExercices() {
    setEtat("chargement");
    try {
      const res = await fetch("/api/entrainement/exercices?mode=rattrapage");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExercices(data.exercices ?? []);
      setEtat("jeu");
      setTimerActif(true);
    } catch {
      setErreur("Impossible de charger les exercices. Vérifie ta connexion.");
    }
  }

  const exerciceActuel = exercices[indexActuel];

  function soumettreReponse(indexChoix: number) {
    if (submitted || !exerciceActuel) return;
    setSubmitted(true);
    setSelected(indexChoix);

    const estCorrect = indexChoix === exerciceActuel.bonne_reponse;
    const bonneReponse = exerciceActuel.choix[exerciceActuel.bonne_reponse] ?? "";
    const reponseDonnee = exerciceActuel.choix[indexChoix] ?? "";

    setResultats((prev) => [
      ...prev,
      {
        question: exerciceActuel.question,
        reponseDonnee,
        bonneReponse,
        estCorrect,
        matiere: exerciceActuel.matiere,
      },
    ]);

    setEtat("feedback");
  }

  async function exerciceSuivant() {
    const suivant = indexActuel + 1;
    if (suivant >= Math.min(NB_EXERCICES, exercices.length)) {
      setTimerActif(false);
      await terminerSessionGlobal();
      setEtat("recapitulatif");
    } else {
      setIndexActuel(suivant);
      setSelected(null);
      setSubmitted(false);
      setEtat("jeu");
    }
  }

  async function terminerSessionGlobal() {
    setResultats((currentResultats) => {
      const resultatsApi = currentResultats.map((r, i) => ({
        exercice_id: exercices[i]?.id ?? "",
        est_correct: r.estCorrect,
      }));

      fetch("/api/entrainement/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rattrapage", resultats: resultatsApi }),
      })
        .then((res) => res.json())
        .then((data) => {
          setXpGagne(data.xp_gagne ?? 0);
          setNouveauxBadges(data.nouveaux_badges ?? []);
        })
        .catch(() => {/* Silencieux */});

      return currentResultats;
    });
  }

  function recommencer() {
    setIndexActuel(0);
    setSelected(null);
    setSubmitted(false);
    setResultats([]);
    setTempsRestant(DUREE_GLOBALE);
    setXpGagne(0);
    setNouveauxBadges([]);
    chargerExercices();
  }

  // ── Récapitulatif ──
  if (etat === "recapitulatif") {
    return (
      <Recapitulatif
        mode="rattrapage"
        resultats={resultats}
        xpGagne={xpGagne}
        nouveauxBadges={nouveauxBadges}
        onReessayer={recommencer}
      />
    );
  }

  // ── Chargement ──
  if (etat === "chargement" || !exerciceActuel) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 gap-4">
        {erreur ? (
          <>
            <p className="text-sm text-bepc-ambre text-center">{erreur}</p>
            <button
              onClick={chargerExercices}
              className="bg-bepc-vert text-white px-6 py-3 rounded-xl text-sm font-semibold"
            >
              Réessayer
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 rounded-full border-4 border-bepc-vert border-t-transparent animate-spin" />
            <p className="text-sm text-gray-500">Analyse de tes points faibles...</p>
          </>
        )}
      </div>
    );
  }

  const isCorrect = submitted && selected === exerciceActuel.bonne_reponse;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 space-y-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1 -ml-1 text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-bepc-rouge" />
              <span className="text-sm font-semibold text-gray-900">Rattrapage Éclair</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Tes points faibles</p>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {indexActuel + 1}/{Math.min(NB_EXERCICES, exercices.length)}
          </span>
        </div>

        {/* Timer global */}
        <TimerGlobal tempsRestant={tempsRestant} dureeTotal={DUREE_GLOBALE} />
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-bepc-vert transition-all duration-300"
          style={{
            width: `${(indexActuel / Math.min(NB_EXERCICES, exercices.length)) * 100}%`,
          }}
        />
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
        {/* Badge compétence ciblée */}
        {exerciceActuel.competence && (
          <div className="flex items-center gap-2 bg-bepc-ambre-clair rounded-xl px-4 py-2.5">
            <Target size={14} className="text-bepc-ambre flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-bepc-ambre">Compétence ciblée</p>
              <p className="text-xs text-gray-700">{exerciceActuel.competence}</p>
            </div>
          </div>
        )}

        {/* Exercice */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          {exerciceActuel.matiere && (
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {exerciceActuel.matiere}
            </span>
          )}
          <p className="text-sm font-semibold text-gray-900 leading-relaxed">
            {exerciceActuel.question}
          </p>

          {/* Choix */}
          <div className="space-y-2">
            {exerciceActuel.choix.map((c, i) => {
              let cls =
                "w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-colors min-h-[44px] ";

              if (!submitted) {
                cls +=
                  selected === i
                    ? "bg-bepc-vert-clair border-bepc-vert text-bepc-vert"
                    : "bg-gray-50 border-gray-200 text-gray-800 active:bg-gray-100";
              } else if (i === exerciceActuel.bonne_reponse) {
                cls += "bg-bepc-vert-clair border-bepc-vert text-bepc-vert";
              } else if (i === selected) {
                cls += "bg-bepc-ambre-clair border-bepc-ambre text-bepc-ambre";
              } else {
                cls += "bg-gray-50 border-gray-200 text-gray-400";
              }

              return (
                <button
                  key={i}
                  onClick={() => soumettreReponse(i)}
                  disabled={submitted}
                  className={cls}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* Feedback mode rattrapage : correction détaillée */}
          {submitted && (
            <div
              className={`rounded-xl p-4 space-y-1 ${
                isCorrect ? "bg-bepc-vert-clair" : "bg-bepc-ambre-clair"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isCorrect ? "text-bepc-vert" : "text-bepc-ambre"
                }`}
              >
                {isCorrect
                  ? "Bien joué ! Tu progresses sur ce point."
                  : `Pas tout à fait — bonne réponse : ${exerciceActuel.choix[exerciceActuel.bonne_reponse]}`}
              </p>
              {exerciceActuel.explication && (
                <p className="text-xs text-gray-700 leading-relaxed">
                  {exerciceActuel.explication}
                </p>
              )}
            </div>
          )}

          {submitted && (
            <button
              onClick={exerciceSuivant}
              className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
            >
              {indexActuel + 1 < Math.min(NB_EXERCICES, exercices.length)
                ? "Exercice suivant"
                : "Voir mes progrès"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
