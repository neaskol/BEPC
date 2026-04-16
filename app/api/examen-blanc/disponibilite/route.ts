// GET /api/examen-blanc/disponibilite
// Vérifie si l'élève peut passer un examen blanc (1 fois par semaine max)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // Chercher le dernier examen blanc de la semaine
  const uneSemaine = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: dernierExamen } = await supabase
    .from("exam_reports")
    .select("id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", uneSemaine)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dernierExamen) {
    const dernierDate = new Date(dernierExamen.created_at);
    const prochaineDispo = new Date(
      dernierDate.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    return NextResponse.json({
      disponible: false,
      prochaineDispo: prochaineDispo.toISOString(),
      dernierExamenId: dernierExamen.id,
    });
  }

  return NextResponse.json({ disponible: true });
}
