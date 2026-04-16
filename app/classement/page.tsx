import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { ClassementClient } from "@/components/classement/ClassementClient";
import { BottomNav } from "@/components/ui/BottomNav";

// Cache 1 heure côté serveur
export const revalidate = 3600;

const NIVEAUX_NOMS = ["", "Lycéen", "Étudiant", "Apprenti", "Chercheur", "Expert", "Lauréat", "Champion BEPC"];

export default async function ClassementPage({
  searchParams,
}: {
  searchParams: { scope?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("id, prenom, ville, xp_total, niveau")
    .eq("id", user.id)
    .single();

  if (!myProfile) redirect("/auth/connexion");

  const scopeParam = searchParams?.scope ?? "local";
  let scope = scopeParam === "national" ? "national" : "local";

  // Calculer XP semaine
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: xpHebdo } = await supabase
    .from("xp_transactions")
    .select("user_id, amount")
    .gte("created_at", weekAgo.toISOString());

  const xpParUser: Record<string, number> = {};
  for (const tx of xpHebdo ?? []) {
    xpParUser[tx.user_id] = (xpParUser[tx.user_id] ?? 0) + tx.amount;
  }

  // Si local, vérifier qu'il y a >= 5 élèves en ville
  if (scope === "local" && myProfile.ville) {
    const { count: nbVille } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("ville", myProfile.ville)
      .eq("role", "eleve");

    if (!nbVille || nbVille < 5) {
      scope = "national";
    }
  } else if (!myProfile.ville) {
    scope = "national";
  }

  // Charger les profils
  let query = supabase
    .from("profiles")
    .select("id, prenom, ville, niveau")
    .eq("role", "eleve");

  if (scope === "local" && myProfile.ville) {
    query = query.eq("ville", myProfile.ville);
  }

  const { data: profiles } = await query;

  // Trier par XP semaine
  const profilesAvecXp = (profiles ?? [])
    .map((p) => ({
      id: p.id,
      prenom: p.prenom ?? "Élève",
      ville: p.ville ?? "",
      xp_semaine: xpParUser[p.id] ?? 0,
      niveau: p.niveau ?? 1,
      niveau_nom: NIVEAUX_NOMS[Math.min(p.niveau ?? 1, 7)],
    }))
    .sort((a, b) => b.xp_semaine - a.xp_semaine)
    .map((p, idx) => ({ ...p, rang: idx + 1 }));

  const monIndex = profilesAvecXp.findIndex((p) => p.id === user.id);
  const monRang = monIndex >= 0 ? monIndex + 1 : profilesAvecXp.length + 1;

  // Voisins : 3 au-dessus + moi + 3 en-dessous
  const start = Math.max(0, monIndex - 3);
  const end = Math.min(profilesAvecXp.length, monIndex + 4);
  const voisins = profilesAvecXp.slice(start, end);

  // Top 10
  const topDix = profilesAvecXp.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <h1 className="text-titre-xl font-medium text-white">Classement</h1>
          <p className="text-white/70 text-sm mt-1">XP de la semaine</p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-4">
        <ClassementClient
          voisins={voisins}
          topDix={topDix}
          monUserId={user.id}
          monRang={monRang}
          scope={scope as "local" | "national"}
          totalEleves={profilesAvecXp.length}
          monProfil={{
            id: myProfile.id,
            prenom: myProfile.prenom ?? "Moi",
            ville: myProfile.ville ?? "",
            xp_semaine: xpParUser[user.id] ?? 0,
            niveau: myProfile.niveau ?? 1,
            rang: monRang,
          }}
        />
      </main>

      <BottomNav />
    </div>
  );
}
