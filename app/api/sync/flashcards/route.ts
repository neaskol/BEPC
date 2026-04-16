/**
 * POST /api/sync/flashcards
 * Synchronise la progression Leitner d'une flashcard.
 * Server wins en cas de conflit (on garde le serveur si plus récent).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const FlashcardProgressSchema = z.object({
  flashcard_id: z.string().uuid(),
  niveau: z.number().int().min(1).max(7),
  prochaine_revue: z.string().datetime(),
  last_updated: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = FlashcardProgressSchema.safeParse(body);

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

    const { flashcard_id, niveau, prochaine_revue, last_updated } = parsed.data;

    // Vérifier la version serveur (server wins si plus récent)
    const { data: existing } = await supabase
      .from("flashcard_progress")
      .select("last_updated")
      .eq("user_id", user.id)
      .eq("flashcard_id", flashcard_id)
      .single();

    if (existing) {
      const serverUpdatedAt = new Date(existing.last_updated).getTime();
      const clientUpdatedAt = new Date(last_updated).getTime();

      if (serverUpdatedAt >= clientUpdatedAt) {
        // Server wins — déjà à jour
        return NextResponse.json({ synced: true, conflict: true }, { status: 409 });
      }
    }

    // Upsert avec la donnée client (plus récente)
    const { error } = await supabase.from("flashcard_progress").upsert(
      {
        user_id: user.id,
        flashcard_id,
        niveau,
        prochaine_revue,
        last_updated,
      },
      { onConflict: "user_id,flashcard_id" }
    );

    if (error) throw error;

    return NextResponse.json({ synced: true }, { status: 200 });
  } catch (err) {
    console.error("[sync/flashcards]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
