import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { addXP, checkAndAwardBadges } from "@/lib/actions/xp";

// POST /api/defis/[id]/complete — soumettre un score pour un défi
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { score } = body;

  if (typeof score !== "number") {
    return NextResponse.json({ error: "score (number) requis" }, { status: 400 });
  }

  const supabase = createClient();

  // Charger le défi
  const { data: defi } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!defi) {
    return NextResponse.json({ error: "Défi introuvable" }, { status: 404 });
  }

  // Vérifier que l'utilisateur fait partie du défi
  const isChallenger = defi.challenger_id === user.id;
  const isChallenged = defi.challenged_id === user.id;

  if (!isChallenger && !isChallenged) {
    return NextResponse.json({ error: "Non participant" }, { status: 403 });
  }

  // Mettre à jour le score
  const updateData: Record<string, unknown> = {};
  if (isChallenger) {
    updateData.score_challenger = score;
  } else {
    updateData.score_challenged = score;
    updateData.status = "accepted";
  }

  // Si les deux scores sont disponibles, déterminer le gagnant
  const scoreChallenger = isChallenger ? score : defi.score_challenger;
  const scoreChallenged = isChallenged ? score : defi.score_challenged;

  let gagnant: string | null = null;
  if (scoreChallenger !== null && scoreChallenged !== null) {
    updateData.status = "completed";
    updateData.completed_at = new Date().toISOString();
    gagnant = scoreChallenger >= scoreChallenged
      ? defi.challenger_id
      : defi.challenged_id;
    updateData.winner_id = gagnant;
  }

  const { error: updateError } = await supabase
    .from("challenges")
    .update(updateData)
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // XP et badges si le défi est terminé
  let xpResult = null;
  if (updateData.status === "completed") {
    const estGagnant = gagnant === user.id;
    const xpGagne = estGagnant ? 40 : 15;
    const reason = estGagnant ? "Défi gagné" : "Participation à un défi";

    xpResult = await addXP(user.id, xpGagne, reason);

    // Badges sociaux
    await checkAndAwardBadges(user.id);

    // Badge defi_gagne si victoire et premier gain
    if (estGagnant) {
      const { count: nbVictoires } = await supabase
        .from("challenges")
        .select("id", { count: "exact", head: true })
        .eq("winner_id", user.id);

      if ((nbVictoires ?? 0) === 1) {
        // Premier gain — checkAndAwardBadges gère ça
        await checkAndAwardBadges(user.id);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    gagnant,
    xpResult,
  });
}
