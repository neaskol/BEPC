/**
 * POST /api/sync/xp
 * Crédite les XP gagnés hors-ligne sur le profil utilisateur.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const XPSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().int().min(1).max(500),
  reason: z.string().max(200),
  created_at: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = XPSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id, amount, reason, created_at } = parsed.data;

    // Vérifier si cette entrée XP a déjà été créditée (idempotent)
    const { data: existing } = await supabase
      .from("xp_transactions")
      .select("id")
      .eq("id", id)
      .single();

    if (existing) {
      return NextResponse.json({ synced: true, already_credited: true }, { status: 200 });
    }

    // Insérer la transaction XP
    const { error: txError } = await supabase.from("xp_transactions").insert({
      id,
      user_id: user.id,
      amount,
      reason,
      created_at,
    });

    if (txError && txError.code !== "23505") throw txError;

    // Incrémenter xp_total sur le profil
    const { error: profileError } = await supabase.rpc("increment_xp", {
      p_user_id: user.id,
      p_amount: amount,
    });

    if (profileError) throw profileError;

    return NextResponse.json({ synced: true }, { status: 200 });
  } catch (err) {
    console.error("[sync/xp]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
