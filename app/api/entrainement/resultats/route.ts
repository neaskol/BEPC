// API Route POST /api/entrainement/resultats
// Enregistre les résultats d'une session d'entraînement et attribue les XP + badges

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addXP, checkAndAwardBadges } from "@/lib/actions/xp";

const BodySchema = z.object({
  mode: z.enum(["chrono", "survie", "rattrapage"]),
  resultats: z.array(
    z.object({
      exercice_id: z.string(),
      matiere_id: z.string().optional(),
      est_correct: z.boolean(),
      temps_reponse: z.number().optional(), // secondes
    })
  ),
  session_parfaite: z.boolean().optional(), // Mode survie : 0 erreurs
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

  const { mode, resultats, session_parfaite } = parsed.data;

  // 1. Enregistrer chaque résultat dans sessions_exercices
  if (resultats.length > 0) {
    const rows = resultats.map((r) => ({
      user_id: user.id,
      exercice_id: r.exercice_id,
      matiere_id: r.matiere_id ?? null,
      est_correct: r.est_correct,
      temps_reponse: r.temps_reponse ?? null,
      mode_entrainement: mode,
    }));

    const { error: insertError } = await supabase
      .from("sessions_exercices")
      .insert(rows);

    if (insertError) {
      console.error("Erreur insertion sessions_exercices:", insertError);
    }
  }

  // 2. Calculer les XP selon le mode
  let xpTotal = 0;
  const xpDetails: string[] = [];

  if (mode === "chrono") {
    for (const r of resultats) {
      if (r.est_correct) {
        const xpBase = 15;
        const xpBonus = r.temps_reponse !== undefined && r.temps_reponse < 30 ? 5 : 0;
        xpTotal += xpBase + xpBonus;
        if (xpBonus > 0) xpDetails.push(`chrono_bonne_rapide`);
        else xpDetails.push(`chrono_bonne`);
      }
    }
  } else if (mode === "survie") {
    const nbCorrects = resultats.filter((r) => r.est_correct).length;
    if (nbCorrects === resultats.length && resultats.length > 0) {
      // Session complète sans erreur
      xpTotal = 75;
      xpDetails.push("survie_complete");
    } else if (nbCorrects > 0) {
      // Session incomplète : 10 XP par bonne réponse
      xpTotal = nbCorrects * 10;
    }
  } else if (mode === "rattrapage") {
    // Session de rattrapage : 30 XP si > 60% corrects
    const nbCorrects = resultats.filter((r) => r.est_correct).length;
    const pct = resultats.length > 0 ? (nbCorrects / resultats.length) * 100 : 0;
    if (pct >= 60) {
      xpTotal = 30;
      xpDetails.push("rattrapage_reussi");
    } else if (nbCorrects > 0) {
      xpTotal = nbCorrects * 5;
    }
  }

  // 3. Ajouter les XP via le moteur addXP
  let xpResult = null;
  if (xpTotal > 0) {
    try {
      xpResult = await addXP(
        user.id,
        xpTotal,
        `entrainement_${mode}${xpDetails.length > 0 ? `_${xpDetails[0]}` : ""}`
      );
    } catch (err) {
      console.error("Erreur addXP:", err);
    }
  }

  // 4. Badge survie_parfait
  let badgesSupplementaires: { code: string; nom: string }[] = [];
  if (mode === "survie" && session_parfaite) {
    try {
      const nouveauxBadges = await checkAndAwardBadges(user.id);
      badgesSupplementaires = nouveauxBadges.map((b) => ({
        code: b.code,
        nom: b.nom,
      }));
    } catch (err) {
      console.error("Erreur checkAndAwardBadges:", err);
    }
  }

  // 5. Badge chrono_serie : 5 bonnes réponses d'affilée
  if (mode === "chrono") {
    const toutesCorrectes = resultats.every((r) => r.est_correct);
    if (toutesCorrectes && resultats.length >= 5) {
      try {
        await checkAndAwardBadges(user.id);
      } catch {
        // silencieux
      }
    }
  }

  // 6. Mettre à jour progression_matiere pour chaque matière concernée
  const matiereIds = Array.from(
    new Set(resultats.map((r) => r.matiere_id).filter(Boolean))
  ) as string[];

  for (const matiereId of matiereIds) {
    const exercicesDeLaMatiere = resultats.filter(
      (r) => r.matiere_id === matiereId
    );
    const nbTotal = exercicesDeLaMatiere.length;
    const nbOk = exercicesDeLaMatiere.filter((r) => r.est_correct).length;
    const scoreSession = nbTotal > 0 ? (nbOk / nbTotal) * 100 : 0;

    // Appliquer le lissage : nouveau_pct = ancien_pct * 0.7 + score_session * 0.3
    const { data: prog } = await supabase
      .from("progression_matiere")
      .select("niveau_pct")
      .eq("user_id", user.id)
      .eq("matiere_id", matiereId)
      .single();

    const ancienPct = prog?.niveau_pct ?? 0;
    const nouveauPct = ancienPct * 0.7 + scoreSession * 0.3;

    await supabase
      .from("progression_matiere")
      .upsert(
        {
          user_id: user.id,
          matiere_id: matiereId,
          niveau_pct: Math.round(nouveauPct * 10) / 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,matiere_id" }
      );
  }

  return NextResponse.json({
    success: true,
    xp_gagne: xpTotal,
    xp_total: xpResult?.xpTotal,
    niveau_monte: xpResult?.niveauMonte ?? false,
    nouveaux_badges: [
      ...(xpResult?.nouveauxBadges ?? []).map((b) => ({
        code: b.code,
        nom: b.nom,
      })),
      ...badgesSupplementaires,
    ],
  });
}
