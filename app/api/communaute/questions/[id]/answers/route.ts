import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";
import { addXP, checkAndAwardBadges } from "@/lib/actions/xp";

// GET /api/communaute/questions/[id]/answers
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClient();

  const { data: answers, error } = await supabase
    .from("community_answers")
    .select(`
      id, corps, is_accepted, created_at,
      author:author_id(id, prenom)
    `)
    .eq("question_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ answers: answers ?? [] });
}

// POST /api/communaute/questions/[id]/answers — répondre à une question
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { corps } = body;

  if (!corps || corps.trim().length < 5) {
    return NextResponse.json({ error: "Réponse trop courte" }, { status: 400 });
  }

  const supabase = createClient();

  // Vérifier que la question existe
  const { data: question } = await supabase
    .from("community_questions")
    .select("id, author_id")
    .eq("id", params.id)
    .single();

  if (!question) {
    return NextResponse.json({ error: "Question introuvable" }, { status: 404 });
  }

  const { data: answer, error } = await supabase
    .from("community_answers")
    .insert({
      question_id: params.id,
      author_id: user.id,
      corps: corps.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 25 XP pour avoir aidé
  await addXP(user.id, 25, "Réponse dans la communauté");

  // Vérifier badge aide_communaute (5 réponses)
  const nouveauxBadges = await checkAndAwardBadges(user.id);

  return NextResponse.json({ answer, xpGagne: 25, nouveauxBadges }, { status: 201 });
}
