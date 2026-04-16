import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// GET /api/parents/children/[id]
// Retourne les données agrégées d'un enfant pour le parent
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = createClient();

  // Vérifier que l'utilisateur est parent ET a un lien vers cet enfant
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const { data: link } = await supabase
    .from("parent_child_links")
    .select("id")
    .eq("parent_id", user.id)
    .eq("child_id", params.id)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Lien parent-enfant introuvable" }, { status: 403 });
  }

  // Récupérer les données de l'enfant
  const [
    { data: childProfile },
    { data: progression },
    { data: badges },
    { data: recentActivity },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("prenom, xp_total, niveau, streak_actuel, streak_max, derniere_activite, ville")
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
    supabase
      .from("xp_transactions")
      .select("amount, reason, created_at")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (!childProfile) {
    return NextResponse.json({ error: "Enfant introuvable" }, { status: 404 });
  }

  // Calculer la jauge BEPC
  const COEFS: Record<string, number> = {
    maths: 4, francais: 4, hist_geo: 3, svt: 3, physique: 3, anglais: 2,
  };
  let sumPondere = 0;
  let sumCoefs = 0;
  for (const p of (progression ?? [])) {
    const rawMatiere = p.matieres;
    const matiere = (Array.isArray(rawMatiere) ? rawMatiere[0] : rawMatiere) as { code: string; nom: string; couleur: string } | null;
    if (!matiere) continue;
    const coef = COEFS[matiere.code] ?? 1;
    sumPondere += (p.niveau_pct ?? 0) * coef;
    sumCoefs += coef;
  }
  const jauge_bepc_pct = sumCoefs > 0 ? Math.round(sumPondere / sumCoefs) : 0;

  // Vérifier si la streak est brisée depuis > 3 jours
  let streakBriseDepuis = 0;
  if (childProfile.derniere_activite) {
    const lastActivity = new Date(childProfile.derniere_activite);
    const now = new Date();
    streakBriseDepuis = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Construire les données de progression par matière (30 derniers jours)
  const progressionParMatiere = (progression ?? []).map((p) => {
    const rawMatiere = p.matieres;
    const matiere = (Array.isArray(rawMatiere) ? rawMatiere[0] : rawMatiere) as { code: string; nom: string; couleur: string } | null;
    return {
      matiere_id: p.matiere_id,
      niveau_pct: p.niveau_pct ?? 0,
      code: matiere?.code ?? "",
      nom: matiere?.nom ?? "",
      couleur: matiere?.couleur ?? "#6B7280",
    };
  });

  return NextResponse.json({
    enfant: {
      id: params.id,
      prenom: childProfile.prenom,
      ville: childProfile.ville,
      xp_total: childProfile.xp_total ?? 0,
      niveau: childProfile.niveau ?? 1,
      streak_actuel: childProfile.streak_actuel ?? 0,
      derniere_activite: childProfile.derniere_activite,
      streak_brise_depuis: streakBriseDepuis,
    },
    jauge_bepc_pct,
    progression: progressionParMatiere,
    derniers_badges: (badges ?? []).map((b) => {
      const rawBadge = b.badges_catalogue;
      const badge = (Array.isArray(rawBadge) ? rawBadge[0] : rawBadge) as { code: string; nom: string; emoji: string } | null;
      return {
        code: badge?.code ?? "",
        nom: badge?.nom ?? "",
        emoji: badge?.emoji ?? "🏅",
        obtenu_le: b.obtenu_le,
      };
    }),
    activite_recente: (recentActivity ?? []).map((tx) => ({
      amount: tx.amount,
      reason: tx.reason,
      created_at: tx.created_at,
    })),
  });
}
