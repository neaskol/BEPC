"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { Coeurs } from "@/components/entrainement/Coeur";
import { GameOver } from "@/components/entrainement/GameOver";
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

const TOTAL_COEURS = 3;
const NB_EXERCICES = 5;

export default function PageSurvie() {
  const [etat, setEtat] = useState<"chargement" | "jeu" | "feedback" | "game_over" | "recapitulatif">("chargement");
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [indexActuel, setIndexActuel] = useState(0);
  const [coeurs, setCoeurs] = useState(TOTAL_COEURS);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultats, setResultats] = useState<ResultatExercice[]>([]);
  const [xpGagne, setXpGagne] = useState(0);
  const [nouveauxBadges, setNouveauxBadges] = useState<{ code: string; nom: string }[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [coeursAnimation, setCoeursAnimation] = useState(false);
  const [confettis, setConfettis] = useState(false);

  useEffect(() => {
    chargerExercices();
  }, []);

  async function chargerExercices() {
    setEtat("chargement");
    try {
      const res = await fetch("/api/entrainement/exercices?mode=survie");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExercices(data.exercices ?? []);
      setEtat("jeu");
    } catch {
      setErreur("Impossible de charger les exercices. Vérifie ta connexion.");
    }
  }

  const exerciceActuel = exercices[indexActuel];

  function vibrer() {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Ignoré si non autorisé
      }
    }
  }

  const soumettreReponse = useCallback(
    (indexChoix: number) => {
      if (submitted || !exerciceActuel) return;
      setSubmitted(true);
      setSelected(indexChoix);

      const estCorrect = indexChoix === exerciceActuel.bonne_reponse;
      const bonneReponse = exerciceActuel.choix[exerciceActuel.bonne_reponse] ?? "";
      const reponseDonnee = exerciceActuel.choix[indexChoix] ?? "";

      const nouveauResultat: ResultatExercice = {
        question: exerciceActuel.question,
        reponseDonnee,
        bonneReponse,
        estCorrect,
        matiere: exerciceActuel.matiere,
      };

      setResultats((prev) => {
        const updated = [...prev, nouveauResultat];

        if (!estCorrect) {
          vibrer();
          setCoeursAnimation(true);
          setCoeurs((c) => {
            const nouveauxCoeurs = c - 1;
            setTimeout(() => setCoeursAnimation(false), 600);
            if (nouveauxCoeurs <= 0) {
              setTimeout(() => {
                terminerSession(updated, false);
                setEtat("game_over");
              }, 1200);
            }
            return nouveauxCoeurs;
          });
        } else {
          setEtat("feedback");
        }

        return updated;
      });

      if (estCorrect) {
        setEtat("feedback");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [submitted, exerciceActuel]
  );

  async function exerciceSuivant() {
    const suivant = indexActuel + 1;
    if (suivant >= NB_EXERCICES || suivant >= exercices.length) {
      // Session terminée
      const sessionParfaite = resultats.every((r) => r.estCorrect) && coeurs === TOTAL_COEURS;
      if (sessionParfaite) setConfettis(true);
      await terminerSession(resultats, sessionParfaite);
      setEtat("recapitulatif");
    } else {
      setIndexActuel(suivant);
      setSelected(null);
      setSubmitted(false);
      setEtat("jeu");
    }
  }

  async function terminerSession(res: ResultatExercice[], sessionParfaite: boolean) {
    const resultatsApi = res.map((r, i) => ({
      exercice_id: exercices[i]?.id ?? "",
      est_correct: r.estCorrect,
    }));

    try {
      const response = await fetch("/api/entrainement/resultats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "survie",
          resultats: resultatsApi,
          session_parfaite: sessionParfaite,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setXpGagne(data.xp_gagne ?? 0);
        setNouveauxBadges(data.nouveaux_badges ?? []);
      }
    } catch {
      // Silencieux
    }
  }

  function recommencer() {
    setIndexActuel(0);
    setCoeurs(TOTAL_COEURS);
    setSelected(null);
    setSubmitted(false);
    setResultats([]);
    setXpGagne(0);
    setNouveauxBadges([]);
    setConfettis(false);
    chargerExercices();
  }

  // ── Game Over ──
  if (etat === "game_over") {
    return (
      <GameOver
        score={resultats.filter((r) => r.estCorrect).length}
        total={resultats.length}
        onReessayer={recommencer}
      />
    );
  }

  // ── Récapitulatif ──
  if (etat === "recapitulatif") {
    return (
      <>
        {confettis && <Confettis />}
        <Recapitulatif
          mode="survie"
          resultats={resultats}
          xpGagne={xpGagne}
          nouveauxBadges={nouveauxBadges}
          onReessayer={recommencer}
        />
      </>
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
            <p className="text-sm text-gray-500">Chargement...</p>
          </>
        )}
      </div>
    );
  }

  const isCorrect = submitted && selected === exerciceActuel.bonne_reponse;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-1 -ml-1 text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <Shield size={18} className="text-bepc-rouge" />
            <span className="text-sm font-semibold text-gray-900">Mode Survie</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {indexActuel + 1}/{NB_EXERCICES}
          </span>
        </div>
        {/* Cœurs */}
        <div className={`mt-3 flex justify-center transition-all duration-300 ${coeursAnimation ? "scale-110" : "scale-100"}`}>
          <Coeurs total={TOTAL_COEURS} restants={coeurs} />
        </div>
      </header>

      {/* Barre de progression */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-bepc-vert transition-all duration-300"
          style={{ width: `${(indexActuel / NB_EXERCICES) * 100}%` }}
        />
      </div>

      <div className="flex-1 px-4 py-6 space-y-4">
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

          {/* Feedback mode survie : correction + explication */}
          {submitted && etat === "feedback" && (
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
                  ? "Excellent ! Tu maîtrises ça !"
                  : `Pas tout à fait — bonne réponse : ${exerciceActuel.choix[exerciceActuel.bonne_reponse]}`}
              </p>
              {exerciceActuel.explication && (
                <p className="text-xs text-gray-700 leading-relaxed">
                  {exerciceActuel.explication}
                </p>
              )}
            </div>
          )}

          {submitted && etat === "feedback" && (
            <button
              onClick={exerciceSuivant}
              className="w-full bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-[44px] active:scale-95 transition-transform"
            >
              {indexActuel + 1 < Math.min(NB_EXERCICES, exercices.length)
                ? "Exercice suivant"
                : "Voir le récapitulatif"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Confettis CSS simple
function Confettis() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            width: "8px",
            height: "8px",
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
            backgroundColor: ["#639922", "#BA7517", "#D85A30", "#3b82f6", "#8b5cf6"][
              Math.floor(Math.random() * 5)
            ],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}
