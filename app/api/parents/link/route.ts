import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/getUser";

// POST /api/parents/link — un parent crée le lien avec un enfant via un code
// GET  /api/parents/link — un élève obtient son lien WhatsApp de partage

export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "eleve") {
    return NextResponse.json({ error: "Réservé aux élèves" }, { status: 403 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://bepc-mada.vercel.app";
  const text = encodeURIComponent(
    `Salut ! Je suis ${profile.prenom}, j'utilise l'app BEPC Mada pour réviser. Tu peux suivre ma progression en tant que parent ici : ${appUrl}/parents/rejoindre?enfant=${user.id}`
  );
  const whatsappUrl = `https://wa.me/?text=${text}`;

  return NextResponse.json({ whatsappUrl, enfantId: user.id });
}

// POST /api/parents/link — le parent soumet son user.id + enfantId pour créer le lien
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "parent") {
    return NextResponse.json({ error: "Réservé aux parents" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { enfant_id } = body;

  if (!enfant_id) {
    return NextResponse.json({ error: "enfant_id requis" }, { status: 400 });
  }

  // Vérifier que l'enfant existe et est un élève
  const { data: enfant } = await supabase
    .from("profiles")
    .select("id, prenom, role")
    .eq("id", enfant_id)
    .eq("role", "eleve")
    .single();

  if (!enfant) {
    return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });
  }

  const { error } = await supabase
    .from("parent_child_links")
    .insert({ parent_id: user.id, child_id: enfant_id });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    enfant: { id: enfant.id, prenom: enfant.prenom },
  });
}
