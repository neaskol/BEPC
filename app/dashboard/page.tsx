import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { seDeconnecter } from "@/app/auth/actions";
import { BottomNav } from "@/components/ui/BottomNav";
import { JaugeBEPC } from "@/components/dashboard/JaugeBEPC";
import { DashboardClient } from "./DashboardClient";

// Date BEPC malgache approximative : dernier jeudi de juin (J-juin de l'année courante)
function joursAvantBepc(): number {
  const now = new Date();
  const annee = now.getFullYear();
  // BEPC Madagascar : environ 26 juin
  const dateBepc = new Date(annee, 5, 26); // mois 5 = juin (0-indexed)
  if (dateBepc < now) {
    dateBepc.setFullYear(annee + 1);
  }
  const diff = Math.ceil(
    (dateBepc.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff;
}

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

  // Calcul XP pour barre de niveau
  const NIVEAUX_XP = [0, 200, 500, 1000, 2000, 4000, 7000];
  const niveau = Math.min(profile.niveau ?? 1, 7);
  const xpPourNiveauActuel = NIVEAUX_XP[niveau - 1] ?? 0;
  const xpPourProchainNiveau = NIVEAUX_XP[niveau] ?? NIVEAUX_XP[6];
  const xpActuel = (profile.xp_total ?? 0) - xpPourNiveauActuel;
  const xpPalier = xpPourProchainNiveau - xpPourNiveauActuel;
  const xpPct = xpPalier > 0 ? Math.min(100, Math.round((xpActuel / xpPalier) * 100)) : 100;

  // Progressions pour JaugeBEPC
  const progressions = (progression ?? [])
    .filter((p) => p.matieres && !Array.isArray(p.matieres))
    .map((p) => ({
      matiere_id: p.matiere_id,
      niveau_pct: p.niveau_pct ?? 0,
      matieres: (!Array.isArray(p.matieres) && p.matieres)
        ? (p.matieres as unknown as { code: string; nom: string; couleur: string })
        : null,
    }));

  const jours = joursAvantBepc();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Bonjour,</p>
              <h1 className="text-titre-xl font-medium text-white">
                {profile.prenom}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {/* SyncIndicator + usePreload (côté client) */}
              <DashboardClient />
              <form action={seDeconnecter}>
                <button
                  type="submit"
                  className="text-white/70 text-xs hover:text-white transition-colors min-h-touch px-2 flex items-center"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>

          {/* XP Bar */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">
                Niveau {niveau}
              </span>
              <span className="text-white/70 text-xs">
                {profile.xp_total ?? 0} XP total
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-white/70 text-xs mt-1.5">
              {xpActuel} / {xpPalier} XP pour le niveau {niveau + 1}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 space-y-6">
        {/* Streak */}
        {(profile.streak_actuel ?? 0) > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-orange-800 text-sm">
                {profile.streak_actuel} jour
                {(profile.streak_actuel ?? 0) > 1 ? "s" : ""} de suite !
              </p>
              <p className="text-orange-600 text-xs">Continue comme ça !</p>
            </div>
          </div>
        )}

        {/* Jauge BEPC — composant Phase 5 */}
        <section>
          <JaugeBEPC progressions={progressions} joursAvantBepc={jours} />
        </section>

        {/* Actions rapides */}
        <section>
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            Que veux-tu faire ?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/entrainement"
              className="bg-bepc-vert text-white rounded-xl p-4 flex flex-col gap-2
                         active:scale-95 transition-transform"
            >
              <span className="text-2xl">✏️</span>
              <span className="text-sm font-semibold">S&apos;entraîner</span>
            </a>
            <a
              href="/cours"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm active:scale-95 transition-transform border border-gray-100"
            >
              <span className="text-2xl">📖</span>
              <span className="text-sm font-semibold">Voir les cours</span>
            </a>
            <a
              href="/flashcards"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm active:scale-95 transition-transform border border-gray-100"
            >
              <span className="text-2xl">🃏</span>
              <span className="text-sm font-semibold">Flashcards</span>
            </a>
            <a
              href="/badges"
              className="bg-white text-gray-800 rounded-xl p-4 flex flex-col gap-2
                         shadow-sm active:scale-95 transition-transform border border-gray-100"
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
