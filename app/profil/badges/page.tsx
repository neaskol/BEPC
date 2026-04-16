import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { BADGES_CATALOGUE } from "@/lib/badges";
import { BadgeCard } from "@/components/badges/BadgeCard";
import { BottomNav } from "@/components/ui/BottomNav";

export const metadata = {
  title: "Mes badges — BEPC Mada",
};

export default async function BadgesPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  // Récupérer les badges obtenus avec les dates
  const { data: badgesObtenus } = await supabase
    .from("badges_eleve")
    .select("badge_id, obtenu_le, badges_catalogue(code)")
    .eq("user_id", user.id);

  // Construire un map code → date d'obtention
  const obtentionParCode: Record<string, string> = {};
  for (const be of badgesObtenus ?? []) {
    const raw = be.badges_catalogue;
    const catalogue = (Array.isArray(raw) ? raw[0] : raw) as { code: string } | null;
    if (catalogue?.code) {
      obtentionParCode[catalogue.code] = be.obtenu_le;
    }
  }

  const nbObtenu = Object.keys(obtentionParCode).length;
  const nbTotal = BADGES_CATALOGUE.filter((b) => !b.estSecret).length;

  // Séparer : obtenus puis non obtenus (secrets cachés)
  const badgesVisibles = BADGES_CATALOGUE.filter(
    (b) => !b.estSecret || obtentionParCode[b.code]
  );

  const badgesObtenusList = badgesVisibles.filter(
    (b) => !!obtentionParCode[b.code]
  );
  const badgesNonObtenusList = badgesVisibles.filter(
    (b) => !obtentionParCode[b.code]
  );

  // Regrouper par catégorie pour les obtenus
  const categories = [
    { id: "demarrage", label: "Pour commencer" },
    { id: "regularite", label: "Régularité" },
    { id: "maitrise", label: "Maîtrise" },
    { id: "performance", label: "Performance" },
    { id: "niveau", label: "Niveaux" },
    { id: "special", label: "Badges spéciaux" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-bepc-green px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <a href="/dashboard" className="text-green-200 text-sm mb-3 block">
            ← Retour
          </a>
          <h1 className="text-2xl font-bold text-white">Mes badges</h1>
          <p className="text-green-100 text-sm mt-1">
            {nbObtenu} badge{nbObtenu > 1 ? "s" : ""} sur {nbTotal} obtenus
          </p>

          {/* Barre de progression badges */}
          <div className="mt-3">
            <div className="h-2 bg-green-900/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.round((nbObtenu / nbTotal) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 space-y-8">
        {/* Section badges obtenus par catégorie */}
        {badgesObtenusList.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Tes badges ({badgesObtenusList.length})
            </h2>
            {categories.map((cat) => {
              const badges = badgesObtenusList.filter(
                (b) => b.categorie === cat.id
              );
              if (badges.length === 0) return null;

              return (
                <div key={cat.id} className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    {cat.label}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {badges.map((badge) => (
                      <BadgeCard
                        key={badge.code}
                        badge={badge}
                        obtenuLe={obtentionParCode[badge.code]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Section badges à débloquer */}
        {badgesNonObtenusList.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-500 mb-4">
              À débloquer ({badgesNonObtenusList.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badgesNonObtenusList.map((badge) => (
                <BadgeCard
                  key={badge.code}
                  badge={badge}
                  obtenuLe={null}
                />
              ))}
            </div>
          </section>
        )}

        {nbObtenu === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🏅</p>
            <p className="text-gray-600 font-medium">
              Ton premier badge t&apos;attend !
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Commence un cours ou fais ton premier exercice pour gagner un badge.
            </p>
            <a
              href="/cours"
              className="mt-4 inline-block bg-bepc-green text-white px-6 py-3 rounded-xl text-sm font-semibold"
            >
              Commencer un cours
            </a>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
