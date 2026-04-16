"use client";

// Client component de la page /flashcards
// Algorithme Leitner 5 niveaux (docs/regles-metier.md)
// Mobile first 375px, ton bienveillant

import { useState, useCallback } from "react";
import { CheckCircle, XCircle, RotateCcw, BookOpen } from "lucide-react";
import Link from "next/link";

type FlashcardEleve = {
  flashcard_id: string;
  niveau_maitrise: number;
  prochaine_revue: string;
  nb_reussites: number;
  nb_echecs: number;
  flashcards: {
    id: string;
    recto: string;
    verso: string;
    exemple: string | null;
    matieres: { code: string; nom: string; couleur: string } | null;
  } | null;
};

type Props = {
  flashcards: FlashcardEleve[];
};

type EtatCarte = "recto" | "verso" | "repondu";

const LEITNER_LABELS: Record<number, string> = {
  0: "À réviser",
  1: "Demain",
  2: "Dans 3 jours",
  3: "Dans 7 jours",
  4: "Dans 14 jours",
  5: "Maîtrisé",
};

export function FlashcardsClient({ flashcards: initial }: Props) {
  const [cartes, setCartes] = useState<FlashcardEleve[]>(initial);
  const [index, setIndex] = useState(0);
  const [etat, setEtat] = useState<EtatCarte>("recto");
  const [score, setScore] = useState({ savais: 0, savaisPas: 0 });
  const [loading, setLoading] = useState(false);
  const [termine, setTermine] = useState(false);
  const [xpTotal, setXpTotal] = useState(0);

  const carteActuelle = cartes[index];

  const retourner = useCallback(() => {
    if (etat === "recto") setEtat("verso");
  }, [etat]);

  const repondre = useCallback(
    async (savais: boolean) => {
      if (!carteActuelle || loading) return;
      setLoading(true);

      try {
        const res = await fetch("/api/flashcards", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            flashcard_id: carteActuelle.flashcard_id,
            savais,
          }),
        });

        const data = await res.json();

        if (data.xp_gagne) {
          setXpTotal((prev) => prev + data.xp_gagne);
        }

        // Mettre à jour la carte localement
        setCartes((prev) =>
          prev.map((c, i) =>
            i === index
              ? {
                  ...c,
                  niveau_maitrise: data.nouveau_niveau ?? c.niveau_maitrise,
                  prochaine_revue: data.prochaine_revue ?? c.prochaine_revue,
                }
              : c
          )
        );

        setScore((prev) => ({
          savais: prev.savais + (savais ? 1 : 0),
          savaisPas: prev.savaisPas + (savais ? 0 : 1),
        }));

        // Passer à la carte suivante ou terminer
        const suivant = index + 1;
        if (suivant >= cartes.length) {
          setTermine(true);
        } else {
          setIndex(suivant);
          setEtat("recto");
        }
      } catch {
        // Silencieux — l'élève continue quand même
      } finally {
        setLoading(false);
      }
    },
    [carteActuelle, index, loading, cartes.length]
  );

  const recommencer = () => {
    setIndex(0);
    setEtat("recto");
    setScore({ savais: 0, savaisPas: 0 });
    setTermine(false);
    setXpTotal(0);
  };

  // Écran terminé
  if (termine) {
    const total = score.savais + score.savaisPas;
    const pct = total > 0 ? Math.round((score.savais / total) * 100) : 0;
    return (
      <div className="space-y-5">
        <div className="bg-bepc-vert rounded-2xl p-6 text-center text-white space-y-3">
          <div className="text-4xl">🎉</div>
          <p className="text-titre-md font-semibold">Session terminée !</p>
          <p className="text-sm text-white/80">
            {pct >= 70
              ? "Excellent travail ! Tu maîtrises bien ces cartes."
              : pct >= 40
              ? "Bien joué ! Quelques cartes à retravailler."
              : "Un bon début — les cartes difficiles reviendront bientôt."}
          </p>
        </div>

        {/* Résultat */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Résultats</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-bepc-vert-clair rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-bepc-vert">{score.savais}</p>
              <p className="text-xs text-gray-600 mt-0.5">Je savais</p>
            </div>
            <div className="flex-1 bg-bepc-ambre-clair rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-bepc-ambre">{score.savaisPas}</p>
              <p className="text-xs text-gray-600 mt-0.5">À revoir</p>
            </div>
          </div>
          {xpTotal > 0 && (
            <div className="bg-bepc-vert-clair rounded-xl px-4 py-2.5 text-center">
              <p className="text-sm font-semibold text-bepc-vert">
                +{xpTotal} XP gagnés
              </p>
            </div>
          )}
        </div>

        <button
          onClick={recommencer}
          className="w-full flex items-center justify-center gap-2 bg-bepc-vert text-white rounded-xl py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
        >
          <RotateCcw size={16} />
          Recommencer
        </button>

        <Link
          href="/cours"
          className="w-full flex items-center justify-center gap-2 bg-white text-gray-800 rounded-xl py-3 text-sm font-semibold min-h-touch border border-gray-200 active:scale-95 transition-transform"
        >
          <BookOpen size={16} />
          Voir les cours
        </Link>
      </div>
    );
  }

  if (!carteActuelle || !carteActuelle.flashcards) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 bg-bepc-vert-clair rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={28} className="text-bepc-vert" />
        </div>
        <p className="text-corps font-semibold text-gray-800">
          Aucune carte à réviser aujourd&apos;hui !
        </p>
        <p className="text-corps-sm text-bepc-gris max-w-xs mx-auto">
          Tu es à jour. Reviens demain pour continuer tes révisions.
        </p>
        <Link
          href="/cours"
          className="inline-flex items-center gap-2 bg-bepc-vert text-white rounded-xl px-5 py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
        >
          <BookOpen size={16} />
          Parcourir les cours
        </Link>
      </div>
    );
  }

  const fc = carteActuelle.flashcards;
  const matCouleur = fc.matieres?.couleur ?? "#639922";
  const progression = index + 1;
  const progressPct = Math.round((index / cartes.length) * 100);

  return (
    <div className="space-y-5">
      {/* Progression */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-bepc-gris">
          <span>Carte {progression} / {cartes.length}</span>
          <span>
            Niveau {carteActuelle.niveau_maitrise} —{" "}
            {LEITNER_LABELS[carteActuelle.niveau_maitrise]}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, backgroundColor: matCouleur }}
          />
        </div>
      </div>

      {/* Badge matière */}
      {fc.matieres && (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-medium"
          style={{ backgroundColor: matCouleur }}
        >
          {fc.matieres.nom}
        </div>
      )}

      {/* Carte flip */}
      <button
        onClick={retourner}
        disabled={etat !== "recto"}
        className="w-full text-left"
        aria-label={etat === "recto" ? "Retourner la carte" : "Carte retournée"}
      >
        <div
          className={`rounded-2xl p-6 min-h-[200px] flex flex-col justify-between transition-all duration-300 shadow-sm border ${
            etat === "recto"
              ? "bg-white border-gray-100 active:scale-[0.98]"
              : "border-gray-100"
          }`}
          style={etat === "verso" ? { backgroundColor: matCouleur + "15", borderColor: matCouleur + "40" } : {}}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-bepc-gris">
              {etat === "recto" ? "Question" : "Réponse"}
            </p>
            <p className="text-corps font-medium text-gray-900 leading-relaxed">
              {etat === "recto" ? fc.recto : fc.verso}
            </p>
          </div>

          {etat === "verso" && fc.exemple && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs font-semibold text-bepc-ambre uppercase tracking-wide mb-1">
                Exemple
              </p>
              <p className="text-corps-sm text-gray-600">{fc.exemple}</p>
            </div>
          )}

          {etat === "recto" && (
            <p className="text-xs text-bepc-gris mt-4 text-center">
              Appuie pour retourner la carte
            </p>
          )}
        </div>
      </button>

      {/* Boutons de réponse — visibles uniquement après avoir retourné */}
      {etat === "verso" && (
        <div className="flex gap-3">
          <button
            onClick={() => repondre(false)}
            disabled={loading}
            className="flex-1 flex flex-col items-center gap-1.5 bg-bepc-ambre-clair border border-bepc-ambre text-bepc-ambre rounded-xl py-4 text-sm font-semibold min-h-touch active:scale-95 transition-transform disabled:opacity-50"
          >
            <XCircle size={20} />
            Je ne savais pas
          </button>
          <button
            onClick={() => repondre(true)}
            disabled={loading}
            className="flex-1 flex flex-col items-center gap-1.5 bg-bepc-vert-clair border border-bepc-vert text-bepc-vert rounded-xl py-4 text-sm font-semibold min-h-touch active:scale-95 transition-transform disabled:opacity-50"
          >
            <CheckCircle size={20} />
            Je savais
            <span className="text-xs font-normal">+5 XP</span>
          </button>
        </div>
      )}

      {loading && (
        <p className="text-center text-corps-sm text-bepc-gris animate-pulse">
          Enregistrement...
        </p>
      )}
    </div>
  );
}
