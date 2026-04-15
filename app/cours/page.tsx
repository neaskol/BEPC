import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Calculator,
  BookOpen,
  Leaf,
  Globe,
  Zap,
  MessageCircle,
} from "lucide-react";
import { getUser } from "@/lib/auth/getUser";
import { BottomNav } from "@/components/ui/BottomNav";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { getMatieres } from "./actions";
import type { Matiere } from "./actions";

const ICONS: Record<string, React.ElementType> = {
  maths: Calculator,
  francais: BookOpen,
  svt: Leaf,
  histoire_geo: Globe,
  physique: Zap,
  anglais: MessageCircle,
};

const COLORS: Record<string, { bg: string; text: string; border: string }> = {
  maths: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  francais: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  svt: {
    bg: "bg-bepc-vert-clair",
    text: "text-bepc-vert",
    border: "border-green-200",
  },
  histoire_geo: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  physique: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  anglais: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
  },
};

function MatiereCard({ matiere }: { matiere: Matiere }) {
  const Icon = ICONS[matiere.code] ?? BookOpen;
  const colors = COLORS[matiere.code] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  };

  return (
    <Link
      href={`/cours/${matiere.code}`}
      className={`flex flex-col items-start justify-between min-h-[120px] rounded-2xl p-4 border ${colors.bg} ${colors.border} active:scale-95 transition-transform`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.text} bg-white/70`}
      >
        <Icon size={22} />
      </div>
      <div className="mt-2">
        <p className={`font-semibold text-sm leading-tight ${colors.text}`}>
          {matiere.nom}
        </p>
        <p className="text-xs text-bepc-gris mt-0.5">
          {matiere.nb_chapitres ?? 0} chapitre
          {(matiere.nb_chapitres ?? 0) > 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}

export default async function CoursPage() {
  const user = await getUser();
  if (!user) redirect("/auth/connexion");

  const matieres = await getMatieres();

  return (
    <div className="min-h-screen bg-gray-50 pb-nav">
      <OfflineBanner />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-10 pb-4 sticky top-0 z-40">
        <div className="max-w-sm mx-auto">
          <h1 className="text-titre-xl text-gray-900 font-medium">Mes cours</h1>
          <p className="text-corps-sm text-bepc-gris mt-0.5">
            Choisis une matière pour commencer
          </p>
        </div>
      </header>

      <main className="max-w-sm mx-auto px-4 pt-6">
        {matieres.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-bepc-vert-clair rounded-full flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-bepc-vert" />
            </div>
            <p className="text-corps font-medium text-gray-800">
              Les cours arrivent bientôt !
            </p>
            <p className="text-corps-sm text-bepc-gris mt-1">
              Les matières sont en cours de préparation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matieres.map((matiere) => (
              <MatiereCard key={matiere.id} matiere={matiere} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
