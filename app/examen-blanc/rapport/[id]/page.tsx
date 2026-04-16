import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RapportClient from "./RapportClient";

interface PageProps {
  params: { id: string };
}

interface AnalyseMatiere {
  matiere: string;
  note: number;
  points_forts: string[];
  points_faibles: string[];
  conseil: string;
}

interface PlanJour {
  jour: string;
  matiere: string;
  objectif: string;
  duree_min: number;
}

interface RapportIA {
  note_globale_estimee: number;
  appreciation: string;
  analyse_par_matiere: AnalyseMatiere[];
  plan_semaine: PlanJour[];
  message_final: string;
}

export interface ExamReport {
  id: string;
  note_globale: number;
  statut: "pending" | "generated" | "error";
  erreur_message: string | null;
  rapport_json: RapportIA | null;
  created_at: string;
}

export default async function RapportPage({ params }: PageProps) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirige vers login — middleware gère normalement ce cas
    notFound();
  }

  const { data: rapport, error } = await supabase
    .from("exam_reports")
    .select("id, note_globale, statut, erreur_message, rapport_json, created_at")
    .eq("id", params.id)
    .eq("user_id", user.id) // RLS + sécurité explicite
    .single();

  if (error || !rapport) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom")
    .eq("id", user.id)
    .single();

  return (
    <RapportClient
      rapport={rapport as ExamReport}
      prenom={profile?.prenom ?? "Mpianatra"}
    />
  );
}
