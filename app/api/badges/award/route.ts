import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { checkAndAwardBadges } from "@/lib/actions/xp";

// POST /api/badges/award — attribuer un badge social (ex: partage WhatsApp)
// Codes autorisés depuis le client : uniquement les badges sociaux non-sensibles
const BADGES_CLIENT_AUTORISES = ["partage"];

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { code } = body;

  if (!code || !BADGES_CLIENT_AUTORISES.includes(code)) {
    return NextResponse.json(
      { error: "Badge non autorisé depuis le client" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { data: catalogue } = await supabase
    .from("badges_catalogue")
    .select("id, code, nom")
    .eq("code", code)
    .single();

  if (!catalogue) {
    return NextResponse.json({ error: "Badge introuvable en base" }, { status: 404 });
  }

  const { error } = await supabase
    .from("badges_eleve")
    .insert({ user_id: user.id, badge_id: catalogue.id });

  // 23505 = duplicate (déjà obtenu)
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nouveauxBadges = await checkAndAwardBadges(user.id);

  return NextResponse.json({ ok: true, nouveauxBadges });
}
