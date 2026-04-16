/**
 * GET /api/preload/matieres-faibles?limit=3
 * Retourne les IDs des matières les plus faibles (niveau_pct le plus bas).
 * Utilisé par usePreload() pour pré-charger les cours et exercices correspondants.
 */
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "3", 10),
      10
    );

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("progression_matiere")
      .select("matiere_id")
      .eq("user_id", user.id)
      .order("niveau_pct", { ascending: true })
      .limit(limit);

    if (error) throw error;

    const result = (data ?? []).map((row) => ({ id: row.matiere_id }));

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[preload/matieres-faibles]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
