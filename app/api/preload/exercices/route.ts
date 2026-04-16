/**
 * GET /api/preload/exercices?limit=30
 * Retourne les 30 exercices les plus récents (ou non tentés).
 * Utilisé par usePreload() pour les avoir disponibles hors-ligne.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "30", 10),
      50
    );

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les exercices non encore tentés en priorité, sinon les plus récents
    const { data: attempted } = await supabase
      .from("reponses_exercices")
      .select("exercice_id")
      .eq("user_id", user.id);

    const attemptedIds = (attempted ?? []).map((r) => r.exercice_id);

    let query = supabase
      .from("exercices")
      .select(
        "id, matiere_id, type, enonce, options, correction, difficulte, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // Préférer les non-tentés si possible
    if (attemptedIds.length > 0) {
      query = query.not("id", "in", `(${attemptedIds.slice(0, 100).join(",")})`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data ?? [], {
      status: 200,
      headers: {
        // Cache court côté SW (StaleWhileRevalidate) — pas les données de progression
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[preload/exercices]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
