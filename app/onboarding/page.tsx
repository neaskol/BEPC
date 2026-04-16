import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import OnboardingClient from "@/components/onboarding/OnboardingClient";

export const metadata: Metadata = {
  title: "Bienvenue — BEPC Mada",
  description: "Configure ton profil et commence ta préparation au BEPC.",
};

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  // Vérifier si l'onboarding est déjà complété
  const { data: progression } = await supabase
    .from("progression_matiere")
    .select("matiere_id")
    .eq("user_id", user.id)
    .limit(1);

  if (progression && progression.length > 0) {
    redirect("/dashboard");
  }

  // Récupérer le prénom
  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom")
    .eq("id", user.id)
    .single();

  return <OnboardingClient prenom={profile?.prenom ?? "toi"} />;
}
