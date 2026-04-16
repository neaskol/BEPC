// API Route GET /api/flashcards — récupérer les flashcards à réviser aujourd'hui
// et PATCH /api/flashcards — mettre à jour niveau Leitner + prochaine_revue

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addDays, format } from "date-fns";

// Intervalles Leitner 5 niveaux (docs/regles-metier.md)
const LEITNER_INTERVALS: Record<number, number> = {
  0: 0,   // aujourd'hui
  1: 1,   // +1 jour
  2: 3,   // +3 jours
  3: 7,   // +7 jours
  4: 14,  // +14 jours
  5: 30,  // +30 jours
};

// ── GET : flashcards à réviser aujourd'hui ───────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const matiereCode = searchParams.get("matiere");
  const today = format(new Date(), "yyyy-MM-dd");

  // Récupérer les flashcards_eleve à réviser aujourd'hui (prochaine_revue <= today)
  const query = supabase
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

  if (matiereCode) {
    // Filtrer par matière via les flashcards liées
    const { data: matiereData } = await supabase
      .from("matieres")
      .select("id")
      .eq("code", matiereCode)
      .single();

    if (matiereData) {
      // On ne peut pas filtrer directement, on récupère tout et filtre côté serveur
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filtrer par matière si demandé
  let flashcards = data ?? [];
  if (matiereCode) {
    flashcards = flashcards.filter((fe) => {
      const fc = fe.flashcards;
      if (!fc || Array.isArray(fc)) return false;
      const mat = (fc as { matieres?: { code: string } }).matieres;
      return mat && mat.code === matiereCode;
    });
  }

  return NextResponse.json({
    flashcards,
    total: flashcards.length,
    date: today,
  });
}

// ── PATCH : mettre à jour le niveau Leitner ──────────────────────────────────
const PatchSchema = z.object({
  flashcard_id: z.string().uuid(),
  savais: z.boolean(), // true = "Je savais", false = "Je ne savais pas"
});

export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { flashcard_id, savais } = parsed.data;
  const today = new Date();

  // Récupérer l'état actuel
  const { data: current } = await supabase
    .from("flashcards_eleve")
    .select("niveau_maitrise, nb_reussites, nb_echecs")
    .eq("user_id", user.id)
    .eq("flashcard_id", flashcard_id)
    .maybeSingle();

  // Calculer le nouveau niveau
  const niveau_actuel = current?.niveau_maitrise ?? 0;
  let nouveau_niveau: number;
  if (savais) {
    nouveau_niveau = Math.min(5, niveau_actuel + 1);
  } else {
    nouveau_niveau = 0;
  }

  // Calculer la prochaine date de révision
  const intervalJours = LEITNER_INTERVALS[nouveau_niveau] ?? 0;
  const prochaine_revue = format(addDays(today, intervalJours), "yyyy-MM-dd");

  // Upsert flashcards_eleve
  const { error: upsertError } = await supabase
    .from("flashcards_eleve")
    .upsert(
      {
        user_id: user.id,
        flashcard_id,
        niveau_maitrise: nouveau_niveau,
        prochaine_revue,
        nb_reussites: (current?.nb_reussites ?? 0) + (savais ? 1 : 0),
        nb_echecs: (current?.nb_echecs ?? 0) + (savais ? 0 : 1),
      },
      { onConflict: "user_id,flashcard_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Attribuer +5 XP si "Je savais" (docs/regles-metier.md)
  let xp_gagne = 0;
  if (savais) {
    xp_gagne = 5;
    await supabase.rpc("increment_xp", { user_id: user.id, xp: 5 }).maybeSingle();
    // Fallback manuel si la RPC n'existe pas encore
    const { data: prof } = await supabase
      .from("profiles")
      .select("xp_total")
      .eq("id", user.id)
      .single();
    if (prof) {
      await supabase
        .from("profiles")
        .update({ xp_total: (prof.xp_total ?? 0) + 5 })
        .eq("id", user.id);
    }
  }

  return NextResponse.json({
    success: true,
    nouveau_niveau,
    prochaine_revue,
    xp_gagne,
    message: savais
      ? "Super ! Continue comme ça !"
      : "Pas de souci — on la reverra bientôt.",
  });
}
