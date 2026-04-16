import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// GET /api/communaute/questions — liste des questions
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const matiere = searchParams.get("matiere");

  let query = supabase
    .from("community_questions")
    .select(`
      id, matiere, titre, corps, is_resolved, created_at,
      author:author_id(id, prenom),
      community_answers(count)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  if (matiere) {
    query = query.eq("matiere", matiere);
  }

  const { data: questions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: questions ?? [] });
}

// POST /api/communaute/questions — poster une question
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { matiere, titre, corps } = body;

  if (!matiere || !titre || !corps) {
    return NextResponse.json(
      { error: "matiere, titre et corps sont requis" },
      { status: 400 }
    );
  }

  if (titre.length > 200) {
    return NextResponse.json({ error: "Titre trop long (max 200 caractères)" }, { status: 400 });
  }

  const supabase = createClient();

  const { data: question, error } = await supabase
    .from("community_questions")
    .insert({
      author_id: user.id,
      matiere,
      titre: titre.trim(),
      corps: corps.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question }, { status: 201 });
}
