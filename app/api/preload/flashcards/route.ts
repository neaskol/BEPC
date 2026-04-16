/**
 * GET /api/preload/flashcards?due_before=<ISO>
 * Retourne les flashcards dont prochaine_revue <= due_before pour l'utilisateur.
 * Utilisé par usePreload() pour pré-charger les flashcards du jour+demain.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const dueBefore =
      request.nextUrl.searchParams.get("due_before") ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("flashcard_progress")
      .select("flashcard_id, niveau, prochaine_revue, last_updated")
      .eq("user_id", user.id)
      .lte("prochaine_revue", dueBefore)
      .order("prochaine_revue", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      status: 200,
      headers: {
        "Cache-Control": "no-store", // Ne pas cacher les données de progression
      },
    });
  } catch (err) {
    console.error("[preload/flashcards]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
