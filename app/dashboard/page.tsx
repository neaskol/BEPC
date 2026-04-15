import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { seDeconnecter } from "@/app/auth/actions";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const [{ data: profile }, { data: progression }] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, xp_total, niveau, streak_actuel")
      .eq("id", user.id)
      .single(),
    supabase
      .from("progression_matiere")
      .select("matiere_id, niveau_pct, matieres(code, nom, couleur)")
      .eq("user_id", user.id)
      .order("niveau_pct", { ascending: true }),
  ]);

  if (!profile) redirect("/auth/connexion");

  const xpPourProchainNiveau = profile.niveau * 200;
  const xpActuel = profile.xp_total % xpPourProchainNiveau;
  const xpPct = Math.round((xpActuel / xpPourProchainNiveau) * 100);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-bepc-green px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-green-100 text-sm">Bonjour,</p>
              <h1 className="text-2xl font-bold text-white">
                {profile.prenom} 👋
              </h1>
            </div>
            <form action={seDeconnecter}>
              <button
                type="submit"
                className="text-green-200 text-xs hover:text-white transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>

          {/* XP Bar */}
          <div className="bg-green-900/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">
                Niveau {profile.niveau}
              </span>
              <span className="text-green-100 text-xs">
                {profile.xp_total} XP total
              </span>
            </div>
            <div className="h-2 bg-green-900/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-green-100 text-xs mt-1.5">
              {xpActuel} / {xpPourProchainNiveau} XP pour le niveau{" "}
              {profile.niveau + 1}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 space-y-6">
        {/* Streak */}
        {profile.streak_actuel > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-orange-800 text-sm">
                {profile.streak_actuel} jour
                {profile.streak_actuel > 1 ? "s" : ""} de suite !
              </p>
              <p className="text-orange-600 text-xs">Continue comme ça !</p>
            </div>
          </div>
        )}

        {/* Progression par matière */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Ta progression
          </h2>
          <div className="space-y-3">
            {progression?.map((p) => {
              const raw = p.matieres;
              const matiere =
                raw && !Array.isArray(raw)
                  ? (raw as { code: string; nom: string; couleur: string })
                  : null;
              if (!matiere) return null;

              return (
                <div key={p.matiere_id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {matiere.nom}
                    </span>
                    <span className="text-xs font-semibold text-gray-600">
                      {p.niveau_pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.niveau_pct}%`,
                        backgroundColor: matiere.couleur,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Actions rapides */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Que veux-tu faire ?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/entrainement"
              className="bg-bepc-green text-white rounded-xl p-4 flex flex-col gap-2
                         hover:bg-green-700 active:scale-95 transition-transform"
            >
              <span className="text-2xl">✏️</span>
              <span className="text-sm font-semibold">S&apos;entraîner</span>
            </a>
            <a
              href="/cours"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm hover:shadow-md active:scale-95 transition-transform border border-gray-100"
            >
              <span className="text-2xl">📖</span>
              <span className="text-sm font-semibold">Voir les cours</span>
            </a>
            <a
              href="/flashcards"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm hover:shadow-md active:scale-95 transition-transform border border-gray-100"
            >
              <span className="text-2xl">🃏</span>
              <span className="text-sm font-semibold">Flashcards</span>
            </a>
            <a
              href="/badges"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm hover:shadow-md active:scale-95 transition-transform border border-gray-100"
            >
              <span className="text-2xl">🏅</span>
              <span className="text-sm font-semibold">Mes badges</span>
            </a>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
