import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { seDeconnecter } from "@/app/auth/actions";
import { BottomNav } from "@/components/ui/BottomNav";
import { JaugeBEPC } from "@/components/dashboard/JaugeBEPC";
import { DashboardClient } from "./DashboardClient";
import { PenLine, BookOpen, CreditCard, Award, Flame, ChevronRight } from "lucide-react";

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
      {/* Header — gradient */}
      <header className="bg-bepc-header px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-[13px]">Bonjour,</p>
              <h1 className="font-display text-[24px] font-extrabold text-white leading-tight">
                {profile.prenom} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <DashboardClient />
              <form action={seDeconnecter}>
                <button
                  type="submit"
                  className="text-white/60 text-xs hover:text-white transition-colors
                             min-h-touch px-2 flex items-center"
                >
                  Déco.
                </button>
              </form>
            </div>
          </div>

          {/* XP Bar */}
          <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-yellow-300 text-yellow-900 text-[10px] font-bold
                                 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Niv. {niveau}
                </span>
                <span className="text-white font-semibold text-sm">
                  {profile.xp_total ?? 0} XP
                </span>
              </div>
              <span className="text-white/60 text-xs">
                {xpPct}% vers niv. {niveau + 1}
              </span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <p className="text-white/50 text-[11px] mt-1.5">
              {xpActuel} / {xpPalier} XP pour le prochain niveau
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-5 space-y-5">
        {/* Streak */}
        {(profile.streak_actuel ?? 0) > 0 && (
          <div className="bg-card-streak border border-orange-200 rounded-2xl p-4
                          flex items-center gap-3 shadow-card">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Flame size={20} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-orange-800 text-sm">
                {profile.streak_actuel} jour
                {(profile.streak_actuel ?? 0) > 1 ? "s" : ""} de suite !
              </p>
              <p className="text-orange-600 text-xs">Continue comme ça !</p>
            </div>
            <ChevronRight size={16} className="text-orange-400 flex-shrink-0" />
          </div>
        )}

        {/* Jauge BEPC */}
        <section>
          <JaugeBEPC progressions={progressions} joursAvantBepc={jours} />
        </section>

        {/* Actions rapides */}
        <section>
          <h2 className="font-display text-[15px] font-bold text-gray-500 uppercase tracking-wide mb-3">
            Que veux-tu faire ?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Primary CTA — full color */}
            <a
              href="/entrainement"
              className="bg-bepc-vert text-white rounded-2xl p-4 flex flex-col gap-2.5
                         active:scale-95 transition-transform shadow-green-glow"
            >
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <PenLine size={18} className="text-white" />
              </div>
              <span className="text-sm font-bold leading-tight">S&apos;entraîner</span>
            </a>

            <a
              href="/cours"
              className="card p-4 flex flex-col gap-2.5 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-blue-600" />
              </div>
              <span className="text-sm font-bold text-gray-800 leading-tight">Voir les cours</span>
            </a>

            <a
              href="/flashcards"
              className="card p-4 flex flex-col gap-2.5 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                <CreditCard size={18} className="text-purple-600" />
              </div>
              <span className="text-sm font-bold text-gray-800 leading-tight">Flashcards</span>
            </a>

            <a
              href="/badges"
              className="card p-4 flex flex-col gap-2.5 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Award size={18} className="text-yellow-600" />
              </div>
              <span className="text-sm font-bold text-gray-800 leading-tight">Mes badges</span>
            </a>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
