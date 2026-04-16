import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getCours, getMatiereByCode } from "../../actions";
import { CourseReader } from "@/components/cours/CourseReader";
import { GenerateCours } from "./GenerateCours";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: { matiere: string; chapitre: string };
};

export default async function ChapitreCoursPage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const supabase = createClient();

  const [matiere, cours, { data: chapitreData }] = await Promise.all([
    getMatiereByCode(params.matiere),
    getCours(params.chapitre),
    supabase
      .from("chapitres")
      .select("titre, ordre, niveau")
      .eq("id", params.chapitre)
      .single(),
  ]);

  if (!matiere || !chapitreData) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <OfflineBanner />

      {/* Header */}
      <header
        className="px-4 pt-10 pb-5"
        style={{ backgroundColor: matiere.couleur }}
      >
        <div className="max-w-sm mx-auto">
          <Link
            href={`/cours/${params.matiere}`}
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-3 min-h-touch"
            aria-label={`Retour à ${matiere.nom}`}
          >
            <ArrowLeft size={18} />
            <span>{matiere.nom}</span>
          </Link>
          <h1 className="text-titre-xl text-white font-medium leading-snug">
            {chapitreData.titre}
          </h1>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6">
        {cours ? (
          <CourseReader cours={cours} />
        ) : (
          <GenerateCours
            chapitreId={params.chapitre}
            matiereCode={params.matiere}
          />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
