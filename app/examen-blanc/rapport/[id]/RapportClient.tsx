"use client";

import { useRouter } from "next/navigation";
import {
  Heart,
  Star,
  TrendingUp,
  Calendar,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { ExamReport } from "./page";

interface Props {
  rapport: ExamReport;
  prenom: string;
}

function NoteCircle({ note, size = "lg" }: { note: number; size?: "sm" | "lg" }) {
  const couleur =
    note >= 15 ? "#639922" : note >= 10 ? "#BA7517" : "#D85A30";
  const dim = size === "lg" ? "w-20 h-20" : "w-12 h-12";
  const textSize = size === "lg" ? "text-2xl" : "text-base";

  return (
    <div
      className={`${dim} rounded-full flex flex-col items-center justify-center border-4`}
      style={{ borderColor: couleur, color: couleur }}
    >
      <span className={`${textSize} font-bold leading-none`}>{note.toFixed(1)}</span>
      <span className="text-xs opacity-70">/20</span>
    </div>
  );
}

export default function RapportClient({ rapport, prenom }: Props) {
  const router = useRouter();
  const score = rapport.note_globale ?? 0;
  const rapportIA = rapport.rapport_json;
  const estMauvaisScore = score < 10;

  // ── Erreur IA ou rapport en attente ──────────────────────────────────────
  if (rapport.statut === "error" || rapport.statut === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-sm">
          {rapport.statut === "pending" ? (
            <>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <RefreshCw size={28} className="text-[#639922] animate-spin" />
              </div>
              <h1 className="text-lg font-semibold text-gray-800 mb-2">
                L'IA prépare ton rapport...
              </h1>
              <p className="text-sm text-gray-500">
                L'IA est lente, on réessaie... Rafraîchis la page dans quelques instants.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-amber-600" />
              </div>
              <h1 className="text-lg font-semibold text-gray-800 mb-2">
                Rapport partiellement disponible
              </h1>
              <p className="text-sm text-gray-500 mb-4">
                La connexion est instable, le rapport IA complet n'a pas pu être généré. Tes résultats sont bien sauvegardés.
              </p>
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-sm text-gray-600">
                  Ta note globale estimée
                </p>
                <div className="flex justify-center mt-2">
                  <NoteCircle note={score} />
                </div>
              </div>
            </>
          )}
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#639922] text-white rounded-xl py-3 text-sm font-medium mt-2"
          >
            Rafraîchir
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full text-gray-500 text-sm py-2 mt-1"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  // ── Rapport généré ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-[#639922] text-white px-4 pt-12 pb-8">
        <h1 className="text-xl font-semibold mb-1">Ton rapport d'examen</h1>
        <p className="text-green-100 text-sm">
          {new Date(rapport.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* === SI MAUVAIS SCORE : message bienveillant EN PREMIER, jamais le score brut === */}
        {estMauvaisScore && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart size={20} className="text-[#639922]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  Un message pour toi, {prenom}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {prenom}, ce score ne te définit pas. Tu as eu le courage de faire cet examen — c'est déjà une victoire.
                  On a analysé tes réponses et on a un plan pour toi. Ensemble, on va progresser. Tu es capable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === POINTS FORTS === */}
        {rapportIA && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Star size={18} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-800">
                Tes points forts
              </h2>
            </div>
            <ul className="space-y-2">
              {rapportIA.analyse_par_matiere
                .filter((a) => a.points_forts && a.points_forts.length > 0)
                .flatMap((a) =>
                  a.points_forts.map((pf, i) => (
                    <li key={`${a.matiere}-${i}`} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-[#639922] rounded-full mt-1.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{pf}</span>
                    </li>
                  ))
                )}
            </ul>
            {rapportIA.appreciation && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-sm text-gray-600 italic leading-relaxed">
                  "{rapportIA.appreciation}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* === PLAN 7 JOURS (si mauvais score, affiché avant le détail des notes) === */}
        {rapportIA && estMauvaisScore && rapportIA.plan_semaine && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-[#639922]" />
              <h2 className="text-sm font-semibold text-gray-800">
                Ton plan de rebond — 7 jours
              </h2>
            </div>
            <div className="space-y-3">
              {rapportIA.plan_semaine.map((jour, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#639922]">{jour.jour}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">{jour.matiere}</p>
                    <p className="text-xs text-gray-500">{jour.objectif}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{jour.duree_min} min</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === SCORE GLOBAL + DÉTAIL PAR MATIÈRE === */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">
              Score détaillé par matière
            </h2>
            <NoteCircle note={score} />
          </div>

          {rapportIA?.analyse_par_matiere ? (
            <div className="space-y-4">
              {rapportIA.analyse_par_matiere.map((matiere) => {
                const noteColor =
                  matiere.note >= 10 ? "#639922" : "#D85A30";
                return (
                  <div key={matiere.matiere} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {matiere.matiere}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: noteColor }}
                        >
                          {matiere.note.toFixed(1)}/20
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="h-1.5 bg-gray-100 rounded-full mb-2">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(matiere.note / 20) * 100}%`,
                          backgroundColor: noteColor,
                        }}
                      />
                    </div>

                    {matiere.conseil && (
                      <p className="text-xs text-gray-500 leading-relaxed mt-1">
                        {matiere.conseil}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Détail non disponible</p>
          )}
        </div>

        {/* === PLAN 7 JOURS (bon score — affiché après les notes) === */}
        {rapportIA && !estMauvaisScore && rapportIA.plan_semaine && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={18} className="text-[#639922]" />
              <h2 className="text-sm font-semibold text-gray-800">
                Plan de révision — 7 jours
              </h2>
            </div>
            <div className="space-y-3">
              {rapportIA.plan_semaine.map((jour, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-semibold text-[#639922]">{jour.jour}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-800">{jour.matiere}</p>
                    <p className="text-xs text-gray-500">{jour.objectif}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{jour.duree_min} min</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === MESSAGE FINAL === */}
        {rapportIA?.message_final && (
          <div className="bg-green-50 rounded-2xl p-5">
            <p className="text-sm text-[#639922] leading-relaxed font-medium">
              {rapportIA.message_final}
            </p>
          </div>
        )}

        {/* === XP gagné === */}
        <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Tu as gagné</p>
          <p className="text-2xl font-bold text-[#639922]">+100 XP</p>
          <p className="text-xs text-gray-400 mt-1">pour avoir terminé l'examen blanc</p>
        </div>

        {/* === Actions === */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full flex items-center justify-center gap-2 bg-[#639922] text-white rounded-2xl py-4 text-sm font-semibold"
          >
            Retour au tableau de bord
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
