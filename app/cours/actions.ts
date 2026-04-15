"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  generateCours as generateCoursAI,
  type CoursContent,
} from "@/lib/ai/generateCours";

export type Matiere = {
  id: string;
  code: string;
  nom: string;
  couleur: string;
  coefficient: number;
  ordre: number;
  nb_chapitres?: number;
};

export type ChapitreProgression = {
  niveau_pct: number;
  nb_sessions: number;
  nb_exercices: number;
  nb_corrects: number;
} | null;

export type Chapitre = {
  id: string;
  matiere_id: string;
  titre: string;
  ordre: number;
  niveau: "facile" | "moyen" | "difficile";
  created_at: string;
  progression?: ChapitreProgression;
};

export type Cours = {
  id: string;
  chapitre_id: string;
  titre: string;
  contenu_json: CoursContent;
  genere_par_ia: boolean;
  valide: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMatieres(): Promise<Matiere[]> {
  const supabase = createClient();

  const { data: matieres, error } = await supabase
    .from("matieres")
    .select("*")
    .order("ordre");

  if (error || !matieres) return [];

  // Get chapter counts for each matiere
  const { data: chapitresCounts } = await supabase
    .from("chapitres")
    .select("matiere_id");

  const countMap: Record<string, number> = {};
  chapitresCounts?.forEach((c) => {
    countMap[c.matiere_id] = (countMap[c.matiere_id] || 0) + 1;
  });

  return matieres.map((m) => ({
    ...m,
    nb_chapitres: countMap[m.id] || 0,
  }));
}

export async function getMatiereByCode(code: string): Promise<Matiere | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("matieres")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getChapitres(matiereCode: string): Promise<Chapitre[]> {
  const supabase = createClient();

  const { data: matiere } = await supabase
    .from("matieres")
    .select("id")
    .eq("code", matiereCode)
    .single();

  if (!matiere) return [];

  const { data, error } = await supabase
    .from("chapitres")
    .select("*")
    .eq("matiere_id", matiere.id)
    .order("ordre");

  if (error || !data) return [];

  // Progression élève si connecté
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return data.map((c) => ({ ...c, progression: null }));
  }

  const { data: prog } = await supabase
    .from("progression_matiere")
    .select("niveau_pct, nb_sessions, nb_exercices, nb_corrects")
    .eq("user_id", user.id)
    .eq("matiere_id", matiere.id)
    .maybeSingle();

  return data.map((c) => ({
    ...c,
    progression: prog
      ? {
          niveau_pct: prog.niveau_pct,
          nb_sessions: prog.nb_sessions,
          nb_exercices: prog.nb_exercices,
          nb_corrects: prog.nb_corrects,
        }
      : null,
  }));
}

export async function getCours(chapitreId: string): Promise<Cours | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cours")
    .select("*")
    .eq("chapitre_id", chapitreId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as Cours;
}

export async function generateCours(
  chapitreId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  // Vérifier que l'utilisateur est admin (RLS cours_write_admin)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Session expirée." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Accès réservé aux administrateurs." };
  }

  // Vérifier qu'aucun cours n'existe déjà pour ce chapitre
  const { data: existing } = await supabase
    .from("cours")
    .select("id")
    .eq("chapitre_id", chapitreId)
    .limit(1)
    .maybeSingle();

  if (existing) return { success: true }; // déjà généré

  // Récupérer titre chapitre + nom matière
  const { data: chapitre } = await supabase
    .from("chapitres")
    .select("titre, matieres(nom)")
    .eq("id", chapitreId)
    .single();

  if (!chapitre) return { success: false, error: "Chapitre introuvable." };

  const matiereRaw = chapitre.matieres;
  const nomMatiere =
    matiereRaw && !Array.isArray(matiereRaw)
      ? (matiereRaw as { nom: string }).nom
      : "Matière";

  try {
    // Appel IA (Fonction 4 — docs/ia.md) + validation Zod dans generateCoursAI
    const contenu_json = await generateCoursAI({
      titresChapitre: chapitre.titre,
      nomMatiere,
    });

    // Persistance en DB — règle offline-first : persist avant retour
    const { error: insertError } = await supabase.from("cours").insert({
      chapitre_id: chapitreId,
      titre: chapitre.titre,
      contenu_json,
      genere_par_ia: true,
      valide: false, // admin valide via /admin/contenu
    });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    revalidatePath(`/cours`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue.";
    return { success: false, error: msg };
  }
}
