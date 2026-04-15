"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inscriptionSchema, connexionSchema } from "@/lib/schemas/auth";

type ActionState = { error: string } | null;

export async function inscrire(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    prenom: formData.get("prenom") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    ville: (formData.get("ville") as string) || undefined,
    bepc_date: (formData.get("bepc_date") as string) || undefined,
  };

  const result = inscriptionSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return {
        error:
          "Cette adresse email est déjà utilisée. Essaie de te connecter.",
      };
    }
    return { error: "Une erreur est survenue. Réessaie dans un moment." };
  }

  if (!data.user) {
    return {
      error:
        "Vérifie ta boîte email pour confirmer ton inscription, puis connecte-toi.",
    };
  }

  // Créer le profil (RLS : auth.uid() = id autorisé via migration 0007)
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    prenom: result.data.prenom,
    ville: result.data.ville ?? null,
    bepc_date: result.data.bepc_date ?? null,
  });

  if (profileError) {
    return {
      error:
        "Compte créé mais erreur de profil. Reconnecte-toi pour continuer.",
    };
  }

  redirect("/onboarding");
}

export async function seConnecter(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = connexionSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      error:
        "Email ou mot de passe incorrect. Vérifie tes informations et réessaie.",
    };
  }

  // Vérifier si l'onboarding est complété (présence de progression_matiere)
  const { data: progression } = await supabase
    .from("progression_matiere")
    .select("matiere_id")
    .limit(1);

  if (!progression || progression.length === 0) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function seDeconnecter(): Promise<never> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/auth/connexion");
}
