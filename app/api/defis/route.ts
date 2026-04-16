import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { checkAndAwardBadges } from "@/lib/actions/xp";

// GET /api/defis — liste mes défis (envoyés + reçus)
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClient();

  const { data: defis } = await supabase
    .from("challenges")
    .select(`
      id, status, score_challenger, score_challenged, created_at, completed_at,
      challenger:challenger_id(id, prenom),
      challenged:challenged_id(id, prenom),
      exercise_id
    `)
    .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ defis: defis ?? [] });
}

// POST /api/defis — lancer un défi
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { challenged_id, exercise_id } = body;

  if (!challenged_id) {
    return NextResponse.json({ error: "challenged_id requis" }, { status: 400 });
  }

  const supabase = createClient();

  const { data: defi, error } = await supabase
    .from("challenges")
    .insert({
      challenger_id: user.id,
      challenged_id,
      exercise_id: exercise_id ?? null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Badge premier_defi
  const { count: nbDefisLances } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("challenger_id", user.id);

  if ((nbDefisLances ?? 0) === 1) {
    await checkAndAwardBadges(user.id);
  }

  return NextResponse.json({ defi }, { status: 201 });
}
