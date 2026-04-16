// Page /flashcards — Répétition espacée Leitner 5 niveaux
// Server Component qui charge les flashcards à réviser aujourd'hui

import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Flashcards — BEPC Mada",
  description: "Révise avec les flashcards en répétition espacée. Mémorise le vocabulaire et les formules pour le BEPC.",
};
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { FlashcardsClient } from "./FlashcardsClient";
import { format } from "date-fns";

export default async function FlashcardsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  // Charger les flashcards de l'élève à réviser aujourd'hui (prochaine_revue <= today)
  const { data: flashcardsEleve } = await supabase
    .from("flashcards_eleve")
    .select(
      `
      flashcard_id,
      niveau_maitrise,
      prochaine_revue,
      nb_reussites,
      nb_echecs,
      flashcards (
        id,
        recto,
        verso,
        exemple,
        matiere_id,
        chapitre_id,
        matieres ( code, nom, couleur )
      )
    `
    )
    .eq("user_id", user.id)
    .lte("prochaine_revue", today)
    .order("prochaine_revue", { ascending: true })
    .limit(30);

  // Compte des flashcards à venir (pour info)
  const { count: prochainesCount } = await supabase
    .from("flashcards_eleve")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("prochaine_revue", today);

  type FlashcardItem = {
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
    };
  };

  const flashcards = (flashcardsEleve ?? [])
    .filter((fe) => fe.flashcards !== null)
    .map((fe) => {
      const fc = Array.isArray(fe.flashcards) ? fe.flashcards[0] : fe.flashcards;
      const mat = fc?.matieres
        ? Array.isArray(fc.matieres) ? (fc.matieres[0] ?? null) : fc.matieres
        : null;
      return {
        flashcard_id: fe.flashcard_id as string,
        niveau_maitrise: (fe.niveau_maitrise as number) ?? 0,
        prochaine_revue: fe.prochaine_revue as string,
        nb_reussites: (fe.nb_reussites as number) ?? 0,
        nb_echecs: (fe.nb_echecs as number) ?? 0,
        flashcards: fc
          ? {
              id: fc.id as string,
              recto: fc.recto as string,
              verso: fc.verso as string,
              exemple: (fc.exemple as string | null) ?? null,
              matieres: mat as { code: string; nom: string; couleur: string } | null,
            }
          : null,
      };
    })
    .filter((fe): fe is FlashcardItem => fe.flashcards !== null);

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <OfflineBanner />

      {/* Header */}
      <header className="bg-bepc-vert px-4 pt-10 pb-5">
        <div className="max-w-sm mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-3 min-h-touch"
          >
            <ArrowLeft size={18} />
            <span>Tableau de bord</span>
          </Link>
          <h1 className="text-titre-xl text-white font-medium">Flashcards</h1>
          <p className="text-white/80 text-sm mt-1">
            {flashcards.length > 0
              ? `${flashcards.length} carte${flashcards.length > 1 ? "s" : ""} à réviser aujourd'hui`
              : "Aucune carte à réviser pour l'instant"}
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 pb-8">
        {/* Info cartes à venir */}
        {prochainesCount !== null && prochainesCount > 0 && (
          <div className="bg-bepc-ambre-clair rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
            <p className="text-corps-sm text-bepc-ambre">
              {prochainesCount} carte{prochainesCount > 1 ? "s" : ""} programmée{prochainesCount > 1 ? "s" : ""} pour plus tard
            </p>
          </div>
        )}

        <FlashcardsClient flashcards={flashcards} />
      </main>

      <BottomNav />
    </div>
  );
}
