"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// IDs fixes des matières (définis dans seed.sql)
const MATIERE_IDS: Record<string, string> = {
  maths: "11111111-0001-0001-0001-000000000001",
  francais: "11111111-0001-0001-0001-000000000002",
  svt: "11111111-0001-0001-0001-000000000003",
  histoire_geo: "11111111-0001-0001-0001-000000000004",
  physique: "11111111-0001-0001-0001-000000000005",
  anglais: "11111111-0001-0001-0001-000000000006",
};

// Mapping question → matière
const QUESTION_MATIERES: Record<number, string> = {
  1: "maths",
  2: "maths",
  3: "francais",
  4: "francais",
  5: "svt",
  6: "svt",
  7: "physique",
  8: "physique",
  9: "histoire_geo",
  10: "anglais",
};

type OnboardingInput = {
  raison_decrochage: string;
  // answers: objet { "1": 0|1|2|3, "2": ... } (index de l'option choisie)
  answers: Record<string, number>;
  // correct: objet { "1": 0|1|2|3, "2": ... } (index correct)
  corrects: Record<string, number>;
};

export async function completerOnboarding(
  data: OnboardingInput
): Promise<{ error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Session expirée. Reconnecte-toi." };

  const supabase = createClient();

  // 1. Mettre à jour le profil avec la raison de décrochage
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ raison_decrochage: data.raison_decrochage })
    .eq("id", user.id);

  if (profileError) {
    return { error: "Erreur lors de la mise à jour du profil." };
  }

  // 2. Calculer niveau_pct par matière
  const matiereStats: Record<string, { total: number; correct: number }> = {};

  for (const [qIdStr, chosenIndex] of Object.entries(data.answers)) {
    const qId = parseInt(qIdStr, 10);
    const matiere = QUESTION_MATIERES[qId];
    if (!matiere) continue;

    if (!matiereStats[matiere]) {
      matiereStats[matiere] = { total: 0, correct: 0 };
    }
    matiereStats[matiere].total += 1;
    if (chosenIndex === data.corrects[qIdStr]) {
      matiereStats[matiere].correct += 1;
    }
  }

  // 3. Préparer l'upsert de progression_matiere (toutes les 6 matières)
  const progressionRows = Object.entries(MATIERE_IDS).map(
    ([code, matiereId]) => {
      const stats = matiereStats[code];
      const niveau_pct =
        stats && stats.total > 0
          ? Math.round((stats.correct / stats.total) * 100)
          : 0;

      return {
        user_id: user.id,
        matiere_id: matiereId,
        niveau_pct,
        nb_sessions: 0,
        nb_exercices: stats?.total ?? 0,
        nb_corrects: stats?.correct ?? 0,
      };
    }
  );

  const { error: progressionError } = await supabase
    .from("progression_matiere")
    .upsert(progressionRows, { onConflict: "user_id,matiere_id" });

  if (progressionError) {
    return { error: "Erreur lors de l'enregistrement de la progression." };
  }

  // 4. Décerner le badge "diagnostic" (Mpitsabo)
  const { data: badge } = await supabase
    .from("badges_catalogue")
    .select("id")
    .eq("code", "diagnostic")
    .single();

  if (badge) {
    await supabase
      .from("badges_eleve")
      .upsert(
        { user_id: user.id, badge_id: badge.id },
        { onConflict: "user_id,badge_id" }
      );
  }

  redirect("/dashboard");
}
