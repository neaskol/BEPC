import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { CommunauteClient } from "@/components/communaute/CommunauteClient";
import { BottomNav } from "@/components/ui/BottomNav";

export default async function CommunautePage({
  searchParams,
}: {
  searchParams: { matiere?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("prenom")
    .eq("id", user.id)
    .single();

  // Charger les questions
  let query = supabase
    .from("community_questions")
    .select(`
      id, matiere, titre, corps, is_resolved, created_at,
      author:author_id(id, prenom),
      community_answers(count)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  if (searchParams?.matiere) {
    query = query.eq("matiere", searchParams.matiere);
  }

  const { data: questions } = await query;

  const MATIERES = [
    "Mathématiques",
    "Français",
    "SVT",
    "Histoire-Géo",
    "Physique-Chimie",
    "Anglais",
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-bepc-vert px-4 pt-10 pb-6">
        <div className="max-w-sm mx-auto">
          <h1 className="text-titre-xl font-medium text-white">Communauté</h1>
          <p className="text-white/70 text-sm mt-1">
            Questions et entraide entre élèves
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-4">
        <CommunauteClient
          userId={user.id}
          prenom={profile?.prenom ?? "Élève"}
          questions={(questions ?? []) as Parameters<typeof CommunauteClient>[0]["questions"]}
          matieres={MATIERES}
          matiereActive={searchParams?.matiere ?? null}
        />
      </main>

      <BottomNav />
    </div>
  );
}
