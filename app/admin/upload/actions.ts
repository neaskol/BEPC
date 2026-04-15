"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { extractTextFromPdf } from "@/lib/pdf/extract";
import {
  extractSujetFromText,
  persistAiJson,
} from "@/lib/ai/extractSujet";
import { SujetExtractSchema, MATIERE_ID_BY_CODE } from "@/lib/schemas/sujet";

type UploadResult =
  | {
      success: true;
      sujetId: string;
      titre: string;
      nbExercices: number;
    }
  | { success: false; error: string };

export async function uploadAndExtractPdf(
  formData: FormData
): Promise<UploadResult> {
  const user = await getUser();
  if (!user) return { success: false, error: "Session expirée." };

  // Vérifier le rôle admin
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { success: false, error: "Accès réservé aux administrateurs." };
  }

  const file = formData.get("pdf") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Aucun fichier reçu." };
  }
  if (file.type !== "application/pdf") {
    return { success: false, error: "Seuls les fichiers PDF sont acceptés." };
  }
  if (file.size > 52_428_800) {
    return { success: false, error: "Le fichier dépasse la limite de 50 MB." };
  }

  // 1. Convertir en Buffer et extraire le texte
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let pdfText: string;
  try {
    pdfText = await extractTextFromPdf(buffer);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur PDF inconnue.";
    return { success: false, error: `Extraction PDF : ${msg}` };
  }

  // 2. Appeler Claude (Function 1) + valider avec Zod via persistAiJson
  let sujetData: ReturnType<typeof SujetExtractSchema.parse>;
  try {
    const raw = await extractSujetFromText(pdfText);
    sujetData = await persistAiJson(raw, SujetExtractSchema, async () => {
      // La persistance réelle est faite juste après (étape 4)
      // persistAiJson garantit juste la validation ici
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur IA inconnue.";
    return { success: false, error: `Extraction IA : ${msg}` };
  }

  // 3. Upload du PDF dans le bucket sujets-pdf
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  let pdfUrl: string | null = null;

  const { error: storageError } = await supabase.storage
    .from("sujets-pdf")
    .upload(fileName, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (!storageError) {
    const { data: urlData } = supabase.storage
      .from("sujets-pdf")
      .getPublicUrl(fileName);
    pdfUrl = urlData?.publicUrl ?? null;
  }
  // L'upload Storage est best-effort : on continue même si ça échoue

  // 4. Insérer le sujet en base
  const matiereId = MATIERE_ID_BY_CODE[sujetData.matiere_code];

  const { data: sujet, error: sujetError } = await supabase
    .from("sujets")
    .insert({
      matiere_id: matiereId,
      titre: sujetData.titre,
      annee: sujetData.annee ?? null,
      type: "officiel",
      pdf_url: pdfUrl,
      contenu_json: { texte_brut: pdfText.slice(0, 5000) },
      valide: false,
    })
    .select("id")
    .single();

  if (sujetError || !sujet) {
    return {
      success: false,
      error: `Insertion sujet : ${sujetError?.message ?? "Erreur inconnue"}`,
    };
  }

  // 5. Insérer les exercices
  const exercicesRows = sujetData.exercices.map((ex) => ({
    sujet_id: sujet.id,
    enonce: ex.enonce,
    type: ex.type,
    choix_json: ex.choix_json ?? null,
    corrige: ex.corrige,
    points: ex.points,
    ordre: ex.ordre,
  }));

  const { error: exError } = await supabase
    .from("exercices")
    .insert(exercicesRows);

  if (exError) {
    // Rollback manuel du sujet si les exercices échouent
    await supabase.from("sujets").delete().eq("id", sujet.id);
    return {
      success: false,
      error: `Insertion exercices : ${exError.message}`,
    };
  }

  return {
    success: true,
    sujetId: sujet.id,
    titre: sujetData.titre,
    nbExercices: sujetData.exercices.length,
  };
}

export async function toggleValide(sujetId: string, valide: boolean) {
  const user = await getUser();
  if (!user) return { error: "Session expirée." };

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Accès refusé." };
  }

  const { error } = await supabase
    .from("sujets")
    .update({ valide })
    .eq("id", sujetId);

  return error ? { error: error.message } : { success: true };
}
