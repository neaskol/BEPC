import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// Cache côté serveur (1 heure)
export const revalidate = 3600;

// GET /api/classement?scope=local|national&userId=xxx
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  let scope = searchParams.get("scope") ?? "local";

  // Récupérer le profil de l'utilisateur courant
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, prenom, ville, xp_total, niveau")
    .eq("id", user.id)
    .single();

  if (!myProfile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Calculer l'XP de la semaine pour l'utilisateur
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Si vue locale, vérifier qu'il y a au moins 5 élèves dans la même ville
  let classement: Array<{
    id: string;
    prenom: string;
    ville: string | null;
    xp_semaine: number;
    niveau: number;
    rang: number;
  }> = [];

  if (scope === "local" && myProfile.ville) {
    // Compter les élèves de la même ville
    const { count: nbVille } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("ville", myProfile.ville)
      .eq("role", "eleve");

    // Si < 5 élèves dans la ville, basculer vers national
    if (!nbVille || nbVille < 5) {
      scope = "national";
    }
  } else {
    scope = "national";
  }

  // Calculer l'XP hebdomadaire
  const { data: xpHebdo } = await supabase
    .from("xp_transactions")
    .select("user_id, amount")
    .gte("created_at", weekAgo.toISOString());

  // Agréger par utilisateur
  const xpParUser: Record<string, number> = {};
  for (const tx of xpHebdo ?? []) {
    xpParUser[tx.user_id] = (xpParUser[tx.user_id] ?? 0) + tx.amount;
  }

  // Récupérer tous les profils selon le scope
  let query = supabase
    .from("profiles")
    .select("id, prenom, ville, xp_total, niveau")
    .eq("role", "eleve");

  if (scope === "local" && myProfile.ville) {
    query = query.eq("ville", myProfile.ville);
  }

  const { data: profiles } = await query;

  if (!profiles) {
    return NextResponse.json({ classement: [], monRang: 0, scope });
  }

  // Trier par XP semaine
  const profilesAvecXp = profiles
    .map((p) => ({
      id: p.id,
      prenom: p.prenom ?? "Élève",
      ville: p.ville,
      xp_semaine: xpParUser[p.id] ?? 0,
      niveau: p.niveau ?? 1,
    }))
    .sort((a, b) => b.xp_semaine - a.xp_semaine);

  // Attribuer les rangs
  const classementAvecRang = profilesAvecXp.map((p, idx) => ({
    ...p,
    rang: idx + 1,
  }));

  // Trouver mon rang
  const monIndex = classementAvecRang.findIndex((p) => p.id === user.id);
  const monRang = monIndex >= 0 ? monIndex + 1 : classementAvecRang.length + 1;

  // Extraire mes voisins (3 au-dessus + 3 en dessous + moi)
  const start = Math.max(0, monIndex - 3);
  const end = Math.min(classementAvecRang.length, monIndex + 4);
  const voisins = classementAvecRang.slice(start, end);

  // Si voisins contient peu d'entrées, prendre le top 10
  const topDix = classementAvecRang.slice(0, 10);

  classement = voisins;

  return NextResponse.json({
    classement,
    topDix,
    monRang,
    scope,
    total: classementAvecRang.length,
    monProfil: {
      id: myProfile.id,
      prenom: myProfile.prenom,
      ville: myProfile.ville,
      xp_semaine: xpParUser[user.id] ?? 0,
      niveau: myProfile.niveau ?? 1,
      rang: monRang,
    },
  });
}
