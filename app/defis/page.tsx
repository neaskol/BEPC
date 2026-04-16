import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { DefisClient } from "@/components/defis/DefisClient";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function DefisPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const [{ data: profile }, { data: defis }, { data: eleves }] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, xp_total, niveau")
      .eq("id", user.id)
      .single(),
    supabase
      .from("challenges")
      .select(`
        id, status, score_challenger, score_challenged, created_at, completed_at, winner_id,
        challenger:challenger_id(id, prenom),
        challenged:challenged_id(id, prenom),
        exercise_id
      `)
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("profiles")
      .select("id, prenom, ville")
      .eq("role", "eleve")
      .neq("id", user.id)
      .limit(50),
  ]);

  if (!profile) redirect("/auth/connexion");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <h1 className="text-titre-xl font-medium text-white">Défis</h1>
          <p className="text-white/70 text-sm mt-1">
            Lance un défi à un ami !
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-4">
        <DefisClient
          userId={user.id}
          prenom={profile.prenom ?? "Toi"}
          defis={(defis ?? []) as Parameters<typeof DefisClient>[0]["defis"]}
          eleves={(eleves ?? []).map((e) => ({
            id: e.id,
            prenom: e.prenom ?? "Élève",
            ville: e.ville ?? "",
          }))}
        />
      </main>

      <BottomNav />
    </div>
  );
}
