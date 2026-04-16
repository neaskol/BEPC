"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Zap } from "lucide-react";
import Link from "next/link";
import { Timer, couleurFondChrono } from "@/components/entrainement/Timer";
import { Recapitulatif, ResultatExercice } from "@/components/entrainement/Recapitulatif";

type Exercice = {
  id: string;
  question: string;
  type: string;
  choix: string[];
  bonne_reponse: number;
  explication: string;
  matiere: string;
};

const DUREE_CHRONO = 60; // secondes par exercice

export default function PageChrono() {
  const [etat, setEtat] = useState<"chargement" | "jeu" | "feedback" | "recapitulatif">("chargement");
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [indexActuel, setIndexActuel] = useState(0);
  const [tempsRestant, setTempsRestant] = useState(DUREE_CHRONO);
  const [timerActif, setTimerActif] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [feedbackExercice, setFeedbackExercice] = useState<{
    estCorrect: boolean;
    tempsReponse: number;
    bonneReponse: string;
    reponseDonnee: string;
  } | null>(null);
  const [resultats, setResultats] = useState<ResultatExercice[]>([]);
  const [xpGagne, setXpGagne] = useState(0);
  const [nouveauxBadges, setNouveauxBadges] = useState<{ code: string; nom: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const tempsDebutRef = useRef<number>(Date.now());

  // Charger les exercices
  useEffect(() => {
    chargerExercices();
  }, []);

  async function chargerExercices() {
    setEtat("chargement");
    try {
      const res = await fetch("/api/entrainement/exercices?mode=chrono");
      if (!res.ok) throw new Error("Impossible de charger les exercices.");
      const data = await res.json();
      setExercices(data.exercices ?? []);
      setEtat("jeu");
      setTimerActif(true);
      tempsDebutRef.current = Date.now();
    } catch {
      setErreur("Impossible de charger les exercices. Vérifie ta connexion.");
      setEtat("chargement");
    }
  }

  const exerciceActuel = exercices[indexActuel];

  function handleTick(t: number) {
    setTempsRestant(t);
  }

  const soumettreReponse = useCallback(
    (indexChoix: number) => {
      if (!exerciceActuel) return;
      setTimerActif(false);

      const tempsReponse = Math.round((Date.now() - tempsDebutRef.current) / 1000);
      const estCorrect = indexChoix === exerciceActuel.bonne_reponse;
      const bonneReponse = exerciceActuel.choix[exerciceActuel.bonne_reponse] ?? "";
      const reponseDonnee = indexChoix === -1 ? "Pas de réponse" : (exerciceActuel.choix[indexChoix] ?? "");

      setFeedbackExercice({ estCorrect, tempsReponse, bonneReponse, reponseDonnee });

      setResultats((prev) => [
        ...prev,
        {
          question: exerciceActuel.question,
          reponseDonnee,
          bonneReponse,
          estCorrect,
          tempsReponse,
          matiere: exerciceActuel.matiere,
        },
      ]);

      setEtat("feedback");
    },
    [exerciceActuel]
  );

  function handleExpire() {
    soumettreReponse(-1);
  }

  async function exerciceSuivant() {
    const suivant = indexActuel + 1;
    if (suivant >= exercices.length) {
      // Fin de session — envoyer les résultats
      await terminerSession();
    } else {
      setIndexActuel(suivant);
      setSelected(null);
      setFeedbackExercice(null);
      setTempsRestant(DUREE_CHRONO);
      setEtat("jeu");
      setTimerActif(true);
      tempsDebutRef.current = Date.now();
    }
  }

  async function terminerSession() {
    const resultatsApi = resultats.map((r, i) => ({
      exercice_id: exercices[i]?.id ?? "",
      est_correct: r.estCorrect,
      temps_reponse: r.tempsReponse,
    }));

    try {
      const res = await fetch("/api/entrainement/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chrono", resultats: resultatsApi }),
      });
      if (res.ok) {
        const data = await res.json();
        setXpGagne(data.xp_gagne ?? 0);
        setNouveauxBadges(data.nouveaux_badges ?? []);
      }
    } catch {
      // Silencieux — on affiche quand même le récapitulatif
    }
    setEtat("recapitulatif");
  }

  function recommencer() {
    setIndexActuel(0);
    setSelected(null);
    setFeedbackExercice(null);
    setResultats([]);
    setTempsRestant(DUREE_CHRONO);
    setXpGagne(0);
    setNouveauxBadges([]);
    chargerExercices();
  }

  // ── Écran récapitulatif ──
  if (etat === "recapitulatif") {
    return (
      <Recapitulatif
        mode="chrono"
        resultats={resultats}
        xpGagne={xpGagne}
        nouveauxBadges={nouveauxBadges}
        onReessayer={recommencer}
      />
    );
  }

  // ── Écran chargement ──
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
            <p className="text-sm text-gray-500">Chargement des exercices...</p>
          </>
        )}
      </div>
    );
  }

  // Couleur fond selon temps
  const fondClass = couleurFondChrono(tempsRestant, DUREE_CHRONO);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <Zap size={18} className="text-bepc-ambre" />
          <span className="text-sm font-semibold text-gray-900">Mode Chrono</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {indexActuel + 1}/{exercices.length}
        </span>
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-bepc-vert transition-all duration-300"
          style={{ width: `${((indexActuel) / exercices.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Timer */}
        <div className={`rounded-2xl p-4 border-2 transition-colors duration-700 ${fondClass} flex justify-center`}>
          <Timer
            duree={DUREE_CHRONO}
            tempsRestant={tempsRestant}
            actif={timerActif && etat === "jeu"}
            onTick={handleTick}
            onExpire={handleExpire}
          />
        </div>

        {/* Question */}
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
          {etat === "jeu" && (
            <div className="space-y-2">
              {exerciceActuel.choix.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelected(i);
                    soumettreReponse(i);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-colors min-h-[44px] ${
                    selected === i
                      ? "bg-bepc-vert-clair border-bepc-vert text-bepc-vert"
                      : "bg-gray-50 border-gray-200 text-gray-800 active:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Feedback rapide (pas de correction détaillée en mode chrono) */}
          {etat === "feedback" && feedbackExercice && (
            <div className="space-y-3">
              <div
                className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                  feedbackExercice.estCorrect
                    ? "bg-bepc-vert-clair text-bepc-vert"
                    : "bg-bepc-ambre-clair text-bepc-ambre"
                }`}
              >
                {feedbackExercice.estCorrect
                  ? `Correct ! +${feedbackExercice.tempsReponse < 30 ? "20" : "15"} XP`
                  : `Presque ! Bonne réponse : ${feedbackExercice.bonneReponse}`}
              </div>
              <button
                onClick={exerciceSuivant}
                className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
              >
                {indexActuel + 1 < exercices.length ? "Exercice suivant" : "Voir le récapitulatif"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
