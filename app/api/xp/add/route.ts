// API Route POST /api/xp/add — Ajouter des XP à l'utilisateur connecté
// Utilisé par MiniQuizXP (+20 XP quiz section), flashcards (+5 XP), etc.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  xp: z.number().int().min(1).max(200),
  raison: z.string().optional(),
});

// Niveaux XP requis (docs/regles-metier.md)
const NIVEAUX_XP = [0, 200, 500, 1000, 2000, 4000, 7000];

function calculerNiveau(xp_total: number): number {
  let niveau = 1;
  for (let i = NIVEAUX_XP.length - 1; i >= 0; i--) {
    if (xp_total >= NIVEAUX_XP[i]) {
      niveau = i + 1;
      break;
    }
  }
  return Math.min(niveau, 7);
}

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

  const { xp } = parsed.data;

  // Récupérer XP actuel
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp_total, niveau")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  const nouveau_xp = (profile.xp_total ?? 0) + xp;
  const nouveau_niveau = calculerNiveau(nouveau_xp);

  // Mettre à jour le profil
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      xp_total: nouveau_xp,
      niveau: nouveau_niveau,
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const niveau_monte = nouveau_niveau > (profile.niveau ?? 1);

  return NextResponse.json({
    success: true,
    xp_ajoute: xp,
    xp_total: nouveau_xp,
    niveau: nouveau_niveau,
    niveau_monte,
    message: niveau_monte
      ? `Félicitations ! Tu es maintenant au niveau ${nouveau_niveau} !`
      : `+${xp} XP — continue !`,
  });
}
