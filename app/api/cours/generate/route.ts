// API Route POST /api/cours/generate
// Règle docs/ia.md : persistance AVANT tout retour client

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  generateCours as generateCoursAI,
} from "@/lib/ai/generateCours";

// ── Validation Zod du body ────────────────────────────────────────────────────
const BodySchema = z.object({
  matiere: z.string().min(1, "La matière est requise"),
  chapitre: z.string().uuid("L'identifiant chapitre doit être un UUID valide"),
  niveau: z.enum(["facile", "moyen", "difficile"]).optional().default("moyen"),
});

export async function POST(req: NextRequest) {
  // 1. Authentification
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Session expirée. Reconnecte-toi." },
      { status: 401 }
    );
  }

  // 2. Validation du body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Corps de requête invalide." },
      { status: 400 }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Paramètres invalides.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const { chapitre: chapitreId } = parsed.data;

  // 3. Vérifier si un cours existe déjà (évite les doublons et appels IA inutiles)
  const { data: existing } = await supabase
    .from("cours")
    .select("id, titre, contenu_json, valide")
    .eq("chapitre_id", chapitreId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      success: true,
      cours: existing,
      generated: false,
      message: "Le cours existait déjà.",
    });
  }

  // 4. Récupérer titre chapitre + nom matière
  const { data: chapitreData, error: chapitreError } = await supabase
    .from("chapitres")
    .select("titre, matieres(nom)")
    .eq("id", chapitreId)
    .single();

  if (chapitreError || !chapitreData) {
    return NextResponse.json(
      { success: false, error: "Chapitre introuvable." },
      { status: 404 }
    );
  }

  const matiereRaw = chapitreData.matieres;
  const nomMatiere =
    matiereRaw && !Array.isArray(matiereRaw)
      ? (matiereRaw as { nom: string }).nom
      : parsed.data.matiere;

  // 5. Génération IA (Function 4 — docs/ia.md)
  let contenu_json;
  try {
    contenu_json = await generateCoursAI({
      titresChapitre: chapitreData.titre,
      nomMatiere,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur IA inconnue.";
    return NextResponse.json(
      {
        success: false,
        error: `L'IA est indisponible pour le moment. ${msg}`,
      },
      { status: 503 }
    );
  }

  // 6. PERSISTANCE EN BASE — règle absolue : jamais afficher sans sauvegarder
  const { data: inserted, error: insertError } = await supabase
    .from("cours")
    .insert({
      chapitre_id: chapitreId,
      titre: chapitreData.titre,
      contenu_json,
      genere_par_ia: true,
      valide: true, // généré à la demande de l'élève = directement visible
    })
    .select("id, titre, contenu_json, valide")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la sauvegarde du cours.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    cours: inserted,
    generated: true,
    message: "Cours généré et sauvegardé.",
  });
}
