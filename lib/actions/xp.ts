"use server";

import { createClient } from "@/lib/supabase/server";
import { NIVEAUX, NIVEAU_BADGE_CODES } from "@/lib/constants/xp";

/** Fuseau Madagascar = UTC+3 */
const TZ_OFFSET_MS = 3 * 60 * 60 * 1000;

function nowMadagascar(): Date {
  return new Date(Date.now() + TZ_OFFSET_MS);
}

function toDateStringMadagascar(d: Date): string {
  const dMada = new Date(d.getTime() + TZ_OFFSET_MS);
  return dMada.toISOString().split("T")[0];
}

function calcNiveau(xpTotal: number): number {
  let niveau = 1;
  for (const n of NIVEAUX) {
    if (xpTotal >= n.xp_requis) niveau = n.niveau;
  }
  return niveau;
}

// ──────────────────────────────────────────────────────────────────────────────
// Résultat addXP
// ──────────────────────────────────────────────────────────────────────────────

export interface AddXPResult {
  xpAjoute: number;
  xpTotal: number;
  niveauAvant: number;
  niveauApres: number;
  niveauMonte: boolean;
  nouveauxNomNiveau?: string;
  streakActuel: number;
  streakBrisee: boolean;
  messageStreak?: string;
  xpBonusActif: boolean;
  nouveauxBadges: BadgeDebloque[];
}

export interface BadgeDebloque {
  code: string;
  nom: string;
  description: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// addXP — fonction principale
// ──────────────────────────────────────────────────────────────────────────────

export async function addXP(
  userId: string,
  amount: number,
  reason: string
): Promise<AddXPResult> {
  if (amount < 0) {
    throw new Error("RÈGLE ABSOLUE : On ne retire jamais des XP.");
  }

  const supabase = createClient();

  // 1. Lire le profil actuel
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "xp_total, niveau, streak_actuel, streak_max, derniere_activite, xp_bonus_until"
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Profil introuvable pour ${userId}`);
  }

  // 2. Appliquer le bonus XP ×2 si actif (récupération streak)
  const now = nowMadagascar();
  const bonusActif =
    profile.xp_bonus_until != null &&
    new Date(profile.xp_bonus_until) > now;
  const xpEffectif = bonusActif ? amount * 2 : amount;

  // 3. Calculer le streak
  const { streakActuel, streakBrisee, messageStreak, xpBonusUntil } =
    calculerStreak(
      profile.streak_actuel,
      profile.streak_max,
      profile.derniere_activite
    );

  // 4. Enregistrer la transaction XP
  const { error: txError } = await supabase.from("xp_transactions").insert({
    user_id: userId,
    amount: xpEffectif,
    reason,
  });
  if (txError) throw txError;

  // 5. Calculer le nouveau total et le niveau
  const xpAvant = profile.xp_total;
  const xpNouveau = xpAvant + xpEffectif;
  const niveauAvant = profile.niveau;
  const niveauApres = calcNiveau(xpNouveau);
  const niveauMonte = niveauApres > niveauAvant;

  // 6. Mettre à jour le profil
  const streakMax = Math.max(profile.streak_max ?? 0, streakActuel);
  const updateData: Record<string, unknown> = {
    xp_total: xpNouveau,
    niveau: niveauApres,
    streak_actuel: streakActuel,
    streak_max: streakMax,
    derniere_activite: toDateStringMadagascar(now),
  };
  if (xpBonusUntil !== undefined) {
    updateData.xp_bonus_until = xpBonusUntil;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", userId);
  if (updateError) throw updateError;

  // 7. Badge de niveau si montée
  if (niveauMonte) {
    const badgeCode = NIVEAU_BADGE_CODES[niveauApres];
    if (badgeCode) {
      await awarderBadge(userId, badgeCode);
    }
  }

  // 8. Badge streak_recovery si streak brisée puis retour
  if (streakBrisee) {
    await awarderBadge(userId, "streak_recovery");
  }

  // 9. Vérifier tous les badges
  const nouveauxBadges = await checkAndAwardBadges(userId);

  return {
    xpAjoute: xpEffectif,
    xpTotal: xpNouveau,
    niveauAvant,
    niveauApres,
    niveauMonte,
    nouveauxNomNiveau: niveauMonte
      ? NIVEAUX.find((n) => n.niveau === niveauApres)?.nom
      : undefined,
    streakActuel,
    streakBrisee,
    messageStreak,
    xpBonusActif: bonusActif,
    nouveauxBadges,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Calcul des streaks (UTC+3 Madagascar)
// ──────────────────────────────────────────────────────────────────────────────

function calculerStreak(
  streakActuel: number,
  streakMax: number,
  derniereActivite: string | null
): {
  streakActuel: number;
  streakBrisee: boolean;
  messageStreak?: string;
  xpBonusUntil?: string;
} {
  const now = nowMadagascar();
  const aujourdhui = toDateStringMadagascar(now);

  if (!derniereActivite) {
    // Première action
    return { streakActuel: 1, streakBrisee: false };
  }

  const hier = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const hierStr = toDateStringMadagascar(hier);

  if (derniereActivite === aujourdhui) {
    // Déjà une action aujourd'hui — streak inchangée
    return { streakActuel: streakActuel, streakBrisee: false };
  }

  if (derniereActivite === hierStr) {
    // Action hier → on incrémente
    return { streakActuel: streakActuel + 1, streakBrisee: false };
  }

  // Jour(s) manqué(s) → streak brisée
  const ancienStreak = streakActuel;
  // XP ×2 pendant 24h pour encourager le retour
  const bonusExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return {
    streakActuel: 1,
    streakBrisee: true,
    messageStreak:
      ancienStreak > 0
        ? `Ta série s'est arrêtée à ${ancienStreak} jour${ancienStreak > 1 ? "s" : ""} — c'est déjà fantastique ! On repart ensemble aujourd'hui ?`
        : undefined,
    xpBonusUntil: bonusExpiry.toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// awarderBadge — insère un badge si pas déjà obtenu
// ──────────────────────────────────────────────────────────────────────────────

async function awarderBadge(
  userId: string,
  badgeCode: string
): Promise<boolean> {
  const supabase = createClient();

  const { data: catalogue } = await supabase
    .from("badges_catalogue")
    .select("id")
    .eq("code", badgeCode)
    .single();

  if (!catalogue) return false;

  const { error } = await supabase
    .from("badges_eleve")
    .insert({ user_id: userId, badge_id: catalogue.id })
    .select();

  // Code 23505 = duplicate (déjà obtenu) — ignoré
  if (error && error.code !== "23505") {
    console.error(`Erreur attribution badge ${badgeCode}:`, error);
    return false;
  }

  return !error;
}

// ──────────────────────────────────────────────────────────────────────────────
// checkAndAwardBadges — vérifie toutes les conditions
// ──────────────────────────────────────────────────────────────────────────────

export async function checkAndAwardBadges(
  userId: string
): Promise<BadgeDebloque[]> {
  const supabase = createClient();
  const nouveauxBadges: BadgeDebloque[] = [];

  // Charger le profil, les badges déjà obtenus, et les stats
  const [
    { data: profile },
    { data: badgesExistants },
    { data: progression },
    { count: nbExercicesFaits },
    { count: nbExercicesReussis },
    { count: nbCoursFaits },
    { count: nbFlashcardsMaitrisees },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_total, niveau, streak_actuel, streak_max, xp_bonus_until")
      .eq("id", userId)
      .single(),
    supabase
      .from("badges_eleve")
      .select("badge_id")
      .eq("user_id", userId),
    supabase
      .from("progression_matiere")
      .select("matiere_id, niveau_pct, matieres(code)")
      .eq("user_id", userId),
    supabase
      .from("sessions_exercices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("sessions_exercices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("est_correct", true),
    supabase
      .from("sessions_cours")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("termine", true),
    supabase
      .from("sessions_flashcards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("niveau_leitner", 5),
  ]);

  if (!profile) return [];

  const badgesObtenuIds = new Set(
    (badgesExistants ?? []).map((b) => b.badge_id)
  );

  // Charger tout le catalogue
  const { data: catalogue } = await supabase
    .from("badges_catalogue")
    .select("id, code, nom, description, condition_json");

  if (!catalogue) return [];

  // Construire un index par code
  const catalogueParCode = Object.fromEntries(
    catalogue.map((b) => [b.code, b])
  );

  // Helper pour tenter d'attribuer un badge
  async function tryAward(code: string) {
    const badge = catalogueParCode[code];
    if (!badge || badgesObtenuIds.has(badge.id)) return;

    const awarded = await awarderBadge(userId, code);
    if (awarded) {
      nouveauxBadges.push({
        code: badge.code,
        nom: badge.nom,
        description: badge.description,
      });
      badgesObtenuIds.add(badge.id);
    }
  }

  // ── Badges démarrage ──
  if ((nbExercicesFaits ?? 0) >= 1) await tryAward("premier_exercice");
  if ((nbCoursFaits ?? 0) >= 1) {
    await tryAward("premier_pas");
    await tryAward("cours_complet");
  }

  // ── Badges régularité (streak) ──
  const streak = profile.streak_actuel ?? 0;
  const streakMax = profile.streak_max ?? 0;
  const streakRef = Math.max(streak, streakMax);
  if (streakRef >= 3) await tryAward("streak_3");
  if (streakRef >= 7) await tryAward("streak_7");
  if (streakRef >= 30) await tryAward("streak_30");
  if (streakRef >= 100) await tryAward("streak_100");

  // ── Badges maîtrise ──
  const exercicesReussis = nbExercicesReussis ?? 0;
  const exercicesFaits = nbExercicesFaits ?? 0;
  const flashcardsMaitrisees = nbFlashcardsMaitrisees ?? 0;
  const chapitresFaits = nbCoursFaits ?? 0;

  if (flashcardsMaitrisees >= 10) await tryAward("flashcards_10");
  if (exercicesReussis >= 50) await tryAward("exercices_50");
  if (exercicesFaits >= 100) await tryAward("cent_exercices");
  if (chapitresFaits >= 5) await tryAward("chapitres_5");

  // ── Badges maîtrise matières ──
  if (progression) {
    let toutesAuDessus50 = progression.length >= 4;
    for (const p of progression) {
      const rawMatiere = p.matieres;
      const matiere = (Array.isArray(rawMatiere) ? rawMatiere[0] : rawMatiere) as { code: string } | null;
      if (!matiere) continue;

      if (matiere.code === "maths") {
        if (p.niveau_pct >= 60) await tryAward("maths_60");
        if (p.niveau_pct >= 90) await tryAward("maths_90");
      }
      if (matiere.code === "francais" && p.niveau_pct >= 60) {
        await tryAward("francais_60");
      }
      if (p.niveau_pct < 50) toutesAuDessus50 = false;
    }
    if (toutesAuDessus50 && progression.length >= 4) {
      await tryAward("toutes_matieres_50");
    }
  }

  // ── Badges niveaux ──
  const niveau = profile.niveau ?? 1;
  for (let n = 2; n <= 7; n++) {
    if (niveau >= n) {
      await tryAward(`niveau_${n}`);
    }
  }
  if (niveau >= 7) await tryAward("champion");

  // ── Badge come_back (absence > 14 jours) ──
  const bonusActif =
    profile.xp_bonus_until != null &&
    new Date(profile.xp_bonus_until) > nowMadagascar();
  if (bonusActif) {
    // La streak a été brisée (bonus actif = retour après break)
    // On vérifie si l'absence était > 14 jours en regardant les transactions
    const { data: dernieresTx } = await supabase
      .from("xp_transactions")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(2);

    if (dernieresTx && dernieresTx.length >= 2) {
      const avant = new Date(dernieresTx[1].created_at);
      const apres = new Date(dernieresTx[0].created_at);
      const diffJours =
        (apres.getTime() - avant.getTime()) / (1000 * 60 * 60 * 24);
      if (diffJours >= 14) {
        await tryAward("come_back");
      }
    }
  }

  // ── Badge Noël ──
  const nowMada = nowMadagascar();
  if (nowMada.getMonth() === 11 && nowMada.getDate() === 25) {
    await tryAward("noel");
  }

  // ── Badges sociaux ──
  // premier_defi : au moins 1 défi lancé
  const { count: nbDefisLances } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("challenger_id", userId);
  if ((nbDefisLances ?? 0) >= 1) await tryAward("premier_defi");

  // defi_gagne : au moins 1 victoire
  const { count: nbVictoires } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("winner_id", userId);
  if ((nbVictoires ?? 0) >= 1) await tryAward("defi_gagne");

  // aide_communaute : 5 réponses dans la communauté
  const { count: nbRepCommunaute } = await supabase
    .from("community_answers")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);
  if ((nbRepCommunaute ?? 0) >= 5) await tryAward("aide_communaute");

  // ── Badge pret_bepc (jauge > 80%) ──
  if (progression && progression.length >= 4) {
    const COEFS: Record<string, number> = {
      maths: 4,
      francais: 4,
      hist_geo: 3,
      svt: 3,
      physique: 3,
      anglais: 2,
    };
    let sumPondere = 0;
    let sumCoefs = 0;
    for (const p of progression) {
      const rawMatiere2 = p.matieres;
      const matiere = (Array.isArray(rawMatiere2) ? rawMatiere2[0] : rawMatiere2) as { code: string } | null;
      if (!matiere) continue;
      const coef = COEFS[matiere.code] ?? 1;
      sumPondere += p.niveau_pct * coef;
      sumCoefs += coef;
    }
    const jauge = sumCoefs > 0 ? sumPondere / sumCoefs : 0;
    if (jauge >= 80) await tryAward("pret_bepc");
  }

  return nouveauxBadges;
}
