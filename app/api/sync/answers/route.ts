/**
 * POST /api/sync/answers
 * Synchronise une réponse d'exercice soumise hors-ligne.
 * Conflit : server wins (409 si déjà existant, on ignore côté client)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AnswerSchema = z.object({
  id: z.string().uuid(),
  exercice_id: z.string().uuid(),
  user_answer: z.string(),
  correct: z.boolean(),
  xp_earned: z.number().int().min(0),
  created_at: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AnswerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, exercice_id, user_answer, correct, xp_earned, created_at } =
      parsed.data;

    // Vérifier si déjà existant (server wins = 409)
    const { data: existing } = await supabase
      .from("reponses_exercices")
      .select("id")
      .eq("id", id)
      .single();

    if (existing) {
      // Déjà présent côté serveur → on retourne 409 pour que le client marque comme synced
      return NextResponse.json({ synced: true, conflict: true }, { status: 409 });
    }

    // Insérer la réponse
    const { error: insertError } = await supabase
      .from("reponses_exercices")
      .insert({
        id,
        user_id: user.id,
        exercice_id,
        user_answer,
        correct,
        xp_earned,
        created_at,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Duplicate key — server wins
        return NextResponse.json({ synced: true, conflict: true }, { status: 409 });
      }
      throw insertError;
    }

    return NextResponse.json({ synced: true }, { status: 200 });
  } catch (err) {
    console.error("[sync/answers]", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
