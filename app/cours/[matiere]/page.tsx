import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getMatiereByCode, getChapitres } from "../actions";
import type { Chapitre } from "../actions";

const NIVEAU_STYLES: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  facile: {
    label: "Facile",
    bg: "bg-bepc-vert-clair",
    text: "text-bepc-vert",
  },
  moyen: {
    label: "Moyen",
    bg: "bg-bepc-ambre-clair",
    text: "text-bepc-ambre",
  },
  difficile: {
    label: "Difficile",
    bg: "bg-red-50",
    text: "text-bepc-rouge",
  },
};

function ChapitreCard({
  chapitre,
  matiereCode,
}: {
  chapitre: Chapitre;
  matiereCode: string;
}) {
  const niveau = NIVEAU_STYLES[chapitre.niveau] ?? NIVEAU_STYLES.moyen;

  return (
    <Link
      href={`/cours/${matiereCode}/${chapitre.id}`}
      className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform min-h-[68px]"
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-bepc-gris">{chapitre.ordre}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight truncate">
          {chapitre.titre}
        </p>
        <span
          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${niveau.bg} ${niveau.text}`}
        >
          {niveau.label}
        </span>
      </div>
      <ChevronRight size={18} className="text-bepc-gris flex-shrink-0" />
    </Link>
  );
}

type Props = {
  params: { matiere: string };
};

export default async function MatierePage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const [matiere, chapitres] = await Promise.all([
    getMatiereByCode(params.matiere),
    getChapitres(params.matiere),
  ]);

  if (!matiere) notFound();

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <OfflineBanner />

      {/* Header */}
      <header
        className="px-4 pt-10 pb-6"
        style={{ backgroundColor: matiere.couleur }}
      >
        <div className="max-w-sm mx-auto">
          <Link
            href="/cours"
            className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm mb-4 min-h-touch"
            aria-label="Retour aux matières"
          >
            <ArrowLeft size={18} />
            <span>Matières</span>
          </Link>
          <h1 className="text-titre-xl text-white font-medium">{matiere.nom}</h1>
          <p className="text-white/70 text-corps-sm mt-1">
            {chapitres.length} chapitre{chapitres.length > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6">
        {chapitres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-corps font-medium text-gray-800">
              Les chapitres arrivent bientôt !
            </p>
            <p className="text-corps-sm text-bepc-gris mt-1">
              Cette matière est en cours de préparation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapitres.map((chapitre) => (
              <ChapitreCard
                key={chapitre.id}
                chapitre={chapitre}
                matiereCode={params.matiere}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
