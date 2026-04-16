// POST /api/examen-blanc/soumettre
// Soumet les réponses de l'examen blanc, calcule les notes, crée le rapport,
// déclenche la génération IA (Function 5 docs/ia.md), attribue XP + badges.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { anthropic, MODEL } from "@/lib/anthropic";
import { addXP, checkAndAwardBadges } from "@/lib/actions/xp";

// ── Coefficients officiels BEPC Madagascar ───────────────────────────────────
export const MATIERES_BEPC = [
  { code: "maths", nom: "Mathématiques", coeff: 4, duree_min: 180 },
  { code: "francais", nom: "Français", coeff: 4, duree_min: 120 },
  { code: "hist_geo", nom: "Histoire-Géographie", coeff: 3, duree_min: 120 },
  { code: "svt", nom: "SVT", coeff: 3, duree_min: 120 },
  { code: "physique", nom: "Physique-Chimie", coeff: 3, duree_min: 120 },
  { code: "anglais", nom: "Anglais", coeff: 2, duree_min: 90 },
] as const;

const ReponseMatiere = z.object({
  matiere_code: z.string(),
  note: z.number().min(0).max(20),
  reponses: z
    .array(
      z.object({
        enonce: z.string(),
        reponse_eleve: z.string(),
        est_correcte: z.boolean().optional(),
        score_obtenu: z.number().optional(),
      })
    )
    .optional()
    .default([]),
});

const BodySchema = z.object({
  resultats: z.array(ReponseMatiere).min(1),
  duree_sec: z.number().optional(),
});

// ── Calcul note globale pondérée /20 ─────────────────────────────────────────
function calculerNoteGlobale(
  resultats: z.infer<typeof ReponseMatiere>[]
): number {
  let sumPondere = 0;
  let sumCoeffs = 0;

  for (const r of resultats) {
    const matiere = MATIERES_BEPC.find((m) => m.code === r.matiere_code);
    const coeff = matiere?.coeff ?? 1;
    sumPondere += r.note * coeff;
    sumCoeffs += coeff;
  }

  return sumCoeffs > 0
    ? Math.round((sumPondere / sumCoeffs) * 100) / 100
    : 0;
}

// ── Génération rapport IA avec retry x2 (Function 5 — docs/ia.md) ───────────
async function genererRapportIA(
  prenom: string,
  resultats: z.infer<typeof ReponseMatiere>[]
): Promise<Record<string, unknown>> {
  const resultatsFormates = resultats.map((r) => {
    const matiere = MATIERES_BEPC.find((m) => m.code === r.matiere_code);
    return {
      matiere: matiere?.nom ?? r.matiere_code,
      note: r.note,
      coeff: matiere?.coeff ?? 1,
      nb_reponses: r.reponses?.length ?? 0,
    };
  });

  const systemPrompt = `Tu es un conseiller pédagogique bienveillant. Tu analyses les résultats \nd'un élève malgache à un examen blanc BEPC et tu crées un plan de progression \npersonnalisé et encourageant.`;

  const userPrompt = `Voici les résultats de l'examen blanc de ${prenom} :
${JSON.stringify(resultatsFormates, null, 2)}

Génère un rapport JSON :
{
  "note_globale_estimee": 0.0,
  "appreciation": "Message encourageant personnalisé...",
  "analyse_par_matiere": [
    {
      "matiere": "...",
      "note": 0.0,
      "points_forts": ["..."],
      "points_faibles": ["..."],
      "conseil": "..."
    }
  ],
  "plan_semaine": [
    {"jour": "Lundi", "matiere": "...", "objectif": "...", "duree_min": 30}
  ],
  "message_final": "Message de motivation personnalisé..."
}`;

  // Retry x2 comme docs/ia.md — timeout 30s géré par le client anthropic
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON non trouvé dans la réponse IA");

      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch (err) {
      if (attempt === 2) throw err;
      // Pause avant retry
      await new Promise((r) => setTimeout(r, (attempt + 1) * 3000));
    }
  }

  throw new Error("Impossible de générer le rapport IA");
}

// ── Handler principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // 1. Vérifier disponibilité hebdomadaire
  const uneSemaine = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: dernierExamen } = await supabase
    .from("exam_reports")
    .select("id, created_at")
    .eq("user_id", user.id)
    .gte("created_at", uneSemaine)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (dernierExamen) {
    const prochaineDispo = new Date(
      new Date(dernierExamen.created_at).getTime() + 7 * 24 * 60 * 60 * 1000
    );
    return NextResponse.json(
      {
        error: "Examen blanc déjà passé cette semaine.",
        prochaineDispo: prochaineDispo.toISOString(),
      },
      { status: 429 }
    );
  }

  // 2. Valider le body
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

  const { resultats, duree_sec } = parsed.data;
  const noteGlobale = calculerNoteGlobale(resultats);

  // 3. Récupérer le prénom
  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom")
    .eq("id", user.id)
    .single();

  const prenom = profile?.prenom ?? "Mpianatra";

  // 4. Créer la session
  const { data: session } = await supabase
    .from("sessions_eleve")
    .insert({
      user_id: user.id,
      mode: "examen_blanc",
      score: noteGlobale,
      xp_gagne: 100,
      duree_sec: duree_sec ?? null,
      completed: true,
    })
    .select("id")
    .single();

  // 5. PERSISTANCE IMMÉDIATE du rapport (statut pending) — règle absolue docs/ia.md
  const { data: rapport, error: insertError } = await supabase
    .from("exam_reports")
    .insert({
      user_id: user.id,
      session_id: session?.id ?? null,
      resultats_json: resultats,
      note_globale: noteGlobale,
      statut: "pending",
    })
    .select("id")
    .single();

  if (insertError || !rapport) {
    return NextResponse.json(
      { error: "Erreur lors de la création du rapport en base." },
      { status: 500 }
    );
  }

  // 6. Générer rapport IA (Function 5 — docs/ia.md)
  let rapportJson: Record<string, unknown> | null = null;
  let erreurIA: string | null = null;

  try {
    rapportJson = await genererRapportIA(prenom, resultats);

    // PERSISTER le rapport IA AVANT tout retour client
    await supabase
      .from("exam_reports")
      .update({ rapport_json: rapportJson, statut: "generated" })
      .eq("id", rapport.id);
  } catch (err) {
    erreurIA =
      err instanceof Error
        ? err.message
        : "La connexion est instable, réessaie dans quelques minutes.";

    await supabase
      .from("exam_reports")
      .update({ statut: "error", erreur_message: erreurIA })
      .eq("id", rapport.id);
  }

  // 7. Attribuer 100 XP — via addXP (règle docs/regles-metier.md)
  try {
    await addXP(user.id, 100, "examen_blanc_complete");
    await supabase
      .from("exam_reports")
      .update({ xp_attribue: true })
      .eq("id", rapport.id);
  } catch (xpErr) {
    console.error("[ExamenBlanc] Erreur addXP:", xpErr);
  }

  // 8. Badges examen blanc (examen_10 si > 10, examen_15 si > 15)
  try {
    if (noteGlobale > 10) {
      const codesToAward = noteGlobale > 15
        ? ["examen_10", "examen_15"]
        : ["examen_10"];

      const { data: badgeCatalogue } = await supabase
        .from("badges_catalogue")
        .select("id, code")
        .in("code", codesToAward);

      if (badgeCatalogue && badgeCatalogue.length > 0) {
        for (const badge of badgeCatalogue) {
          await supabase
            .from("badges_eleve")
            .insert({ user_id: user.id, badge_id: badge.id })
            .select();
          // Erreur 23505 (doublon) ignorée silencieusement
        }
      }
    }

    // Vérification globale des badges
    await checkAndAwardBadges(user.id);
  } catch (badgeErr) {
    console.error("[ExamenBlanc] Erreur badges:", badgeErr);
  }

  return NextResponse.json({
    success: true,
    rapport_id: rapport.id,
    note_globale: noteGlobale,
    rapport: rapportJson,
    erreur_ia: erreurIA,
    xp_gagne: 100,
  });
}
