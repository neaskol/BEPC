import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";

interface ProgressionMatiere {
  matiere_id: string;
  niveau_pct: number;
  code: string;
  nom: string;
  couleur: string;
}

interface BadgeObtenu {
  code: string;
  nom: string;
  emoji: string;
  obtenu_le: string;
}

export default async function EnfantProgressionPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  // Vérifier rôle parent
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role !== "parent") {
    redirect("/dashboard");
  }

  // Vérifier lien parent-enfant
  const { data: link } = await supabase
    .from("parent_child_links")
    .select("id")
    .eq("parent_id", user.id)
    .eq("child_id", params.id)
    .single();

  if (!link) redirect("/parents");

  // Charger les données de l'enfant
  const [
    { data: childProfile },
    { data: progression },
    { data: badges },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, xp_total, niveau, streak_actuel, derniere_activite, ville")
      .eq("id", params.id)
      .single(),
    supabase
      .from("progression_matiere")
      .select("matiere_id, niveau_pct, matieres(code, nom, couleur)")
      .eq("user_id", params.id),
    supabase
      .from("badges_eleve")
      .select("obtenu_le, badges_catalogue(code, nom, emoji)")
      .eq("user_id", params.id)
      .order("obtenu_le", { ascending: false })
      .limit(3),
  ]);

  if (!childProfile) redirect("/parents");

  // Calculer la jauge BEPC
  const COEFS: Record<string, number> = {
    maths: 4, francais: 4, hist_geo: 3, svt: 3, physique: 3, anglais: 2,
  };
  let sumPondere = 0;
  let sumCoefs = 0;
  const progressionTyped: ProgressionMatiere[] = [];

  for (const p of (progression ?? [])) {
    const rawMatiere = p.matieres;
    const matiere = (Array.isArray(rawMatiere) ? rawMatiere[0] : rawMatiere) as {
      code: string; nom: string; couleur: string;
    } | null;
    if (!matiere) continue;
    const coef = COEFS[matiere.code] ?? 1;
    sumPondere += (p.niveau_pct ?? 0) * coef;
    sumCoefs += coef;
    progressionTyped.push({
      matiere_id: p.matiere_id,
      niveau_pct: p.niveau_pct ?? 0,
      code: matiere.code,
      nom: matiere.nom,
      couleur: matiere.couleur,
    });
  }
  const jauge_bepc_pct = sumCoefs > 0 ? Math.round(sumPondere / sumCoefs) : 0;

  // Vérifier si streak brisée > 3 jours
  let streakBriseDepuis = 0;
  if (childProfile.derniere_activite) {
    const lastActivity = new Date(childProfile.derniere_activite);
    const now = new Date();
    streakBriseDepuis = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  }

  const dernieresBadges: BadgeObtenu[] = (badges ?? []).map((b) => {
    const rawBadge = b.badges_catalogue;
    const badge = (Array.isArray(rawBadge) ? rawBadge[0] : rawBadge) as {
      code: string; nom: string; emoji: string;
    } | null;
    return {
      code: badge?.code ?? "",
      nom: badge?.nom ?? "",
      emoji: badge?.emoji ?? "🏅",
      obtenu_le: b.obtenu_le,
    };
  });

  // Lien WhatsApp pour partager l'espace parent
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bepc-mada.vercel.app";
  const whatsappText = encodeURIComponent(
    `Suis ma progression BEPC sur l'appli BEPC Mada ! Tu peux voir mon espace parent ici : ${appUrl}/parents`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  const NIVEAUX_NOMS = ["", "Lycéen", "Étudiant", "Apprenti", "Chercheur", "Expert", "Lauréat", "Champion BEPC"];
  const niveau = Math.min(childProfile.niveau ?? 1, 7);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <a href="/parents" className="text-white/70 text-sm block mb-4">
            ← Retour
          </a>
          <h1 className="text-titre-xl font-medium text-white">
            {childProfile.prenom}
          </h1>
          <p className="text-white/70 text-sm">
            {childProfile.ville ? `${childProfile.ville} · ` : ""}
            {NIVEAUX_NOMS[niveau]} (Niveau {niveau})
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6 space-y-6">

        {/* Alerte streak brisée — bienveillante */}
        {streakBriseDepuis > 3 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-orange-700 text-sm font-medium">
              Un petit mot d&apos;encouragement ?
            </p>
            <p className="text-orange-600 text-sm mt-1">
              {childProfile.prenom} n&apos;a pas ouvert l&apos;app depuis {streakBriseDepuis} jours.
              C&apos;est tout à fait normal — un message d&apos;encouragement peut faire la différence !
            </p>
          </div>
        )}

        {/* XP et streak */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-bepc-vert">
                {childProfile.xp_total ?? 0}
              </p>
              <p className="text-gray-500 text-xs">XP total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {(childProfile.streak_actuel ?? 0) > 0 ? `🔥 ${childProfile.streak_actuel}` : "—"}
              </p>
              <p className="text-gray-500 text-xs">jours de suite</p>
            </div>
          </div>
        </div>

        {/* Jauge BEPC */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800">Préparation BEPC</h2>
            <span className="text-bepc-vert font-bold text-lg">
              {jauge_bepc_pct}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${jauge_bepc_pct}%`,
                backgroundColor: jauge_bepc_pct >= 80 ? "#16a34a" : jauge_bepc_pct >= 50 ? "#2563eb" : "#f59e0b",
              }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-2">
            {jauge_bepc_pct >= 80
              ? `${childProfile.prenom} est bien préparé(e) pour le BEPC !`
              : jauge_bepc_pct >= 50
              ? `${childProfile.prenom} progresse bien, continue comme ça !`
              : `${childProfile.prenom} est en train de construire ses bases.`}
          </p>
        </div>

        {/* Progression par matière — barres CSS */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">Par matière</h2>
          <div className="space-y-3">
            {progressionTyped.length === 0 ? (
              <p className="text-gray-400 text-sm">
                {childProfile.prenom} n&apos;a pas encore commencé les exercices.
              </p>
            ) : (
              progressionTyped.map((p) => (
                <div key={p.matiere_id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{p.nom}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {Math.round(p.niveau_pct)}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${p.niveau_pct}%`,
                        backgroundColor: p.couleur ?? "#6B7280",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Derniers badges */}
        {dernieresBadges.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">
              Derniers badges obtenus
            </h2>
            <div className="space-y-2">
              {dernieresBadges.map((b) => (
                <div key={b.code} className="flex items-center gap-3">
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{b.nom}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(b.obtenu_le).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partage WhatsApp */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 text-sm font-medium mb-2">
            Encourager {childProfile.prenom}
          </p>
          <p className="text-green-700 text-sm mb-3">
            Partage cet espace avec d&apos;autres membres de la famille.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-3 px-4 text-sm font-semibold active:scale-95 transition-transform"
          >
            <span>📱</span>
            Partager sur WhatsApp
          </a>
        </div>

        {/* Mention lecture seule */}
        <p className="text-center text-gray-400 text-xs pb-4">
          Espace lecture seule — tu ne peux pas modifier le compte de {childProfile.prenom}.
        </p>
      </main>
    </div>
  );
}
