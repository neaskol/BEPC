// API Route GET /api/entrainement/exercices
// Retourne des exercices selon le mode : chrono | survie | rattrapage
// Pour "rattrapage" : algorithme ciblé sur erreurs 7 derniers jours + matières faibles

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NB_EXERCICES = 5;

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get("mode") ?? "chrono";
  const matiereId = req.nextUrl.searchParams.get("matiere_id");

  try {
    let exercices: ExerciceRow[];

    if (mode === "rattrapage") {
      exercices = await selectionnerExercicesRattrapage(supabase, user.id);
    } else {
      // Mode chrono / survie : exercices aléatoires (filtre optionnel par matière)
      exercices = await selectionnerExercicesAleatoires(supabase, matiereId);
    }

    return NextResponse.json({ exercices });
  } catch (err) {
    console.error("Erreur sélection exercices:", err);
    return NextResponse.json(
      { error: "Impossible de charger les exercices." },
      { status: 500 }
    );
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ExerciceRow = {
  id: string;
  question: string;
  type: "qcm" | "vrai_faux" | "calcul";
  choix: string[];
  bonne_reponse: number;
  explication: string;
  matiere: string;
  competence?: string;
};

// ─── Sélection aléatoire (chrono / survie) ───────────────────────────────────

async function selectionnerExercicesAleatoires(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  matiereId: string | null
): Promise<ExerciceRow[]> {
  let query = supabase
    .from("exercices")
    .select(`
      id,
      question,
      type,
      choix,
      bonne_reponse,
      explication,
      matieres!inner(nom)
    `)
    .eq("est_valide", true)
    .limit(50);

  if (matiereId) {
    query = query.eq("matiere_id", matiereId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, NB_EXERCICES).map(mapExercice);
}

// ─── Algorithme rattrapage ────────────────────────────────────────────────────

async function selectionnerExercicesRattrapage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<ExerciceRow[]> {
  const il_y_a_7j = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Erreurs récentes (7 derniers jours) — IDs exercices ratés
  const { data: erreursRecentes } = await supabase
    .from("sessions_exercices")
    .select("exercice_id, matiere_id")
    .eq("user_id", userId)
    .eq("est_correct", false)
    .gte("created_at", il_y_a_7j)
    .limit(100);

  // 2. Matières avec niveau_pct le plus bas (3 matières les plus faibles)
  const { data: progression } = await supabase
    .from("progression_matiere")
    .select("matiere_id, niveau_pct, matieres(nom, code)")
    .eq("user_id", userId)
    .order("niveau_pct", { ascending: true })
    .limit(3);

  const matieresFaiblesIds = (progression ?? []).map(
    (p: { matiere_id: string }) => p.matiere_id
  );

  // IDs exercices ratés récemment
  const exercicesRatesIds = Array.from(
    new Set(
      (erreursRecentes ?? []).map((e: { exercice_id: string }) => e.exercice_id)
    )
  ) as string[];

  // 3. Chercher des exercices sur les matières faibles ET/OU ratés récemment
  // Priorité : exercices déjà ratés sur matières faibles
  let exercicesFinaux: ExerciceRow[] = [];

  if (exercicesRatesIds.length > 0 && matieresFaiblesIds.length > 0) {
    // Exercices ratés ET sur matière faible
    const { data: cibles } = await supabase
      .from("exercices")
      .select(`
        id, question, type, choix, bonne_reponse, explication,
        matieres!inner(nom, code),
        competences(nom)
      `)
      .eq("est_valide", true)
      .in("id", exercicesRatesIds.slice(0, 20))
      .in("matiere_id", matieresFaiblesIds)
      .limit(NB_EXERCICES);

    exercicesFinaux = (cibles ?? []).map(mapExerciceAvecCompetence);
  }

  // Compléter si pas assez avec des exercices sur matières faibles
  if (exercicesFinaux.length < NB_EXERCICES && matieresFaiblesIds.length > 0) {
    const idsDejaChoisis = exercicesFinaux.map((e) => e.id);
    const manquants = NB_EXERCICES - exercicesFinaux.length;

    const { data: complement } = await supabase
      .from("exercices")
      .select(`
        id, question, type, choix, bonne_reponse, explication,
        matieres!inner(nom, code),
        competences(nom)
      `)
      .eq("est_valide", true)
      .in("matiere_id", matieresFaiblesIds)
      .not("id", "in", `(${idsDejaChoisis.join(",") || "'''"})`)
      .limit(manquants * 5);

    const complementShuffled = (complement ?? [])
      .sort(() => Math.random() - 0.5)
      .slice(0, manquants);

    exercicesFinaux = [...exercicesFinaux, ...complementShuffled.map(mapExerciceAvecCompetence)];
  }

  // Fallback si toujours vide : exercices aléatoires
  if (exercicesFinaux.length === 0) {
    return selectionnerExercicesAleatoires(supabase, null);
  }

  return exercicesFinaux.slice(0, NB_EXERCICES);
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExercice(row: any): ExerciceRow {
  return {
    id: row.id,
    question: row.question,
    type: row.type,
    choix: row.choix ?? [],
    bonne_reponse: row.bonne_reponse,
    explication: row.explication ?? "",
    matiere: row.matieres?.nom ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExerciceAvecCompetence(row: any): ExerciceRow {
  const competence = Array.isArray(row.competences)
    ? row.competences[0]?.nom
    : row.competences?.nom;

  return {
    ...mapExercice(row),
    competence: competence ?? undefined,
  };
}
