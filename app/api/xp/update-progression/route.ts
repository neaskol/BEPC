// API Route POST /api/xp/update-progression
// Met à jour le score d'une matière avec lissage et recalcule la jauge BEPC

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Coefficients BEPC Madagascar (docs/regles-metier.md)
const COEFFICIENTS: Record<string, number> = {
  maths: 4,
  francais: 4,
  hist_geo: 3,
  svt: 3,
  physique: 3,
  anglais: 2,
};
const TOTAL_COEFFICIENTS = 19;

const BodySchema = z.object({
  matiere_code: z.string().min(1),
  nb_corrects: z.number().int().min(0),
  nb_exercices: z.number().int().min(1),
});

export async function POST(req: NextRequest) {
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

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { matiere_code, nb_corrects, nb_exercices } = parsed.data;

  // Récupérer la matière
  const { data: matiere } = await supabase
    .from("matieres")
    .select("id")
    .eq("code", matiere_code)
    .single();

  if (!matiere) {
    return NextResponse.json({ error: "Matière introuvable." }, { status: 404 });
  }

  // Récupérer la progression actuelle
  const { data: current } = await supabase
    .from("progression_matiere")
    .select("niveau_pct, nb_sessions, nb_exercices, nb_corrects, score_moyen")
    .eq("user_id", user.id)
    .eq("matiere_id", matiere.id)
    .maybeSingle();

  // Calcul du score de session
  const score_session = (nb_corrects / nb_exercices) * 100;

  // Lissage : nouveau = 0.7 × ancien + 0.3 × session (docs/regles-metier.md)
  const ancien_pct = current?.niveau_pct ?? 0;
  const nouveau_pct = Math.round(ancien_pct * 0.7 + score_session * 0.3);

  // Upsert progression_matiere
  const { error: upsertError } = await supabase
    .from("progression_matiere")
    .upsert(
      {
        user_id: user.id,
        matiere_id: matiere.id,
        niveau_pct: nouveau_pct,
        score_moyen: nouveau_pct,
        nb_sessions: (current?.nb_sessions ?? 0) + 1,
        nb_exercices: (current?.nb_exercices ?? 0) + nb_exercices,
        nb_corrects: (current?.nb_corrects ?? 0) + nb_corrects,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,matiere_id" }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Recalculer la jauge BEPC globale
  const { data: allProgressions } = await supabase
    .from("progression_matiere")
    .select("niveau_pct, matieres(code)")
    .eq("user_id", user.id);

  let jauge = 0;
  if (allProgressions && allProgressions.length > 0) {
    let somme = 0;
    let coeff_total = 0;
    for (const p of allProgressions) {
      const mat = p.matieres;
      if (!mat || Array.isArray(mat)) continue;
      const code = (mat as { code: string }).code;
      const coeff = COEFFICIENTS[code] ?? 1;
      somme += p.niveau_pct * coeff;
      coeff_total += coeff;
    }
    jauge = coeff_total > 0 ? Math.round(somme / TOTAL_COEFFICIENTS) : 0;
  }

  return NextResponse.json({
    success: true,
    nouveau_pct,
    jauge_bepc: jauge,
    message: "Progression mise à jour.",
  });
}
