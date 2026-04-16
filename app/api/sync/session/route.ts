/**
 * POST /api/sync/session
 * Envoie le temps de session hors-ligne pour une date donnée.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration_seconds: z.number().int().min(0).max(86400),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = SessionSchema.safeParse(body);

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

    const { date, duration_seconds } = parsed.data;

    // Upsert : additionner si une entrée existe déjà pour cette date
    const { data: existing } = await supabase
      .from("session_times")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .eq("date", date)
      .single();

    const newDuration = existing
      ? existing.duration_seconds + duration_seconds
      : duration_seconds;

    const { error } = await supabase.from("session_times").upsert(
      {
        user_id: user.id,
        date,
        duration_seconds: newDuration,
      },
      { onConflict: "user_id,date" }
    );

    if (error) throw error;

    return NextResponse.json({ synced: true }, { status: 200 });
  } catch (err) {
    console.error("[sync/session]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
