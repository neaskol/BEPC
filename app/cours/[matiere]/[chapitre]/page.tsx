import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getCours, getMatiereByCode } from "../../actions";
import { CourseReader } from "@/components/cours/CourseReader";
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-bepc-vert-clair rounded-full flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-bepc-vert" />
            </div>
            <p className="text-corps font-medium text-gray-800">
              Ce cours est en préparation
            </p>
            <p className="text-corps-sm text-bepc-gris mt-2 max-w-xs">
              Notre équipe prépare ce cours pour toi. Reviens bientôt — il sera
              bientôt disponible !
            </p>
            <Link
              href={`/cours/${params.matiere}`}
              className="mt-6 inline-flex items-center gap-2 bg-bepc-vert text-white rounded-xl px-5 py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform"
            >
              <ArrowLeft size={16} />
              Voir d&apos;autres chapitres
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
