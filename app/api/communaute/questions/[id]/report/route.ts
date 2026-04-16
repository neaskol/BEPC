import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// POST /api/communaute/questions/[id]/report — signaler une question ou réponse
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { target_type, raison } = body;

  if (!target_type || !["question", "answer"].includes(target_type)) {
    return NextResponse.json(
      { error: "target_type doit être 'question' ou 'answer'" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const { error } = await supabase
    .from("community_reports")
    .insert({
      reporter_id: user.id,
      target_type,
      target_id: params.id,
      raison: raison ?? null,
    });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Signalement enregistré, merci !" });
}
