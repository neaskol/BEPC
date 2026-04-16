import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function ParentsPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, prenom")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    redirect("/dashboard");
  }

  // Récupérer les enfants liés
  const { data: links } = await supabase
    .from("parent_child_links")
    .select("child_id, profiles:child_id(id, prenom, niveau, xp_total, streak_actuel, ville)")
    .eq("parent_id", user.id);

  const enfants = (links ?? []).map((l) => {
    const rawProfile = l.profiles;
    const childProfile = (Array.isArray(rawProfile) ? rawProfile[0] : rawProfile) as {
      id: string; prenom: string; niveau: number; xp_total: number; streak_actuel: number; ville: string;
    } | null;
    return childProfile;
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <h1 className="text-titre-xl font-medium text-white">
            Espace Parents
          </h1>
          <p className="text-white/70 text-sm mt-1">
            Bienvenue, {profile.prenom}
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 space-y-6">
        {enfants.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-4">👨‍👩‍👧</div>
            <h2 className="font-semibold text-gray-800 mb-2">
              Aucun enfant lié pour le moment
            </h2>
            <p className="text-gray-500 text-sm">
              Demande à ton enfant de t&apos;envoyer un lien de connexion depuis son application.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-800">
              {enfants.length === 1 ? "Ton enfant" : "Tes enfants"}
            </h2>
            <div className="space-y-3">
              {enfants.map((enfant) => (
                enfant && (
                  <Link
                    key={enfant.id}
                    href={`/parents/enfant/${enfant.id}`}
                    className="block bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {enfant.prenom}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {enfant.ville ? `${enfant.ville} · ` : ""}Niveau {enfant.niveau ?? 1}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-bepc-vert font-semibold text-sm">
                          {enfant.xp_total ?? 0} XP
                        </p>
                        {(enfant.streak_actuel ?? 0) > 0 && (
                          <p className="text-orange-500 text-xs">
                            🔥 {enfant.streak_actuel} jours
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Voir la progression →
                      </span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          </>
        )}

        {/* Info lecture seule */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-blue-700 text-sm">
            Cet espace est en lecture seule. Tu peux suivre la progression de ton enfant, mais tu ne peux pas modifier son compte.
          </p>
        </div>
      </main>
    </div>
  );
}
