"use client";

// Bouton "Générer avec IA" — visible si aucun cours n'existe pour ce chapitre
// Appelle POST /api/cours/generate et recharge la page après génération

import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  chapitreId: string;
  matiereCode: string;
};

export function GenerateCours({ chapitreId, matiereCode }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setErreur(null);

    try {
      const res = await fetch("/api/cours/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matiere: matiereCode,
          chapitre: chapitreId,
          niveau: "moyen",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErreur(
          data.error ??
            "L'IA est lente, on réessaie... Vérifie ta connexion et retente."
        );
        setLoading(false);
        return;
      }

      // Rafraîchir la page pour afficher le cours généré
      router.refresh();
    } catch {
      setErreur(
        "La connexion est instable. Réessaie dans quelques instants."
      );
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
      <div className="w-16 h-16 bg-bepc-vert-clair rounded-full flex items-center justify-center">
        <Sparkles size={28} className="text-bepc-vert" />
      </div>

      <div className="space-y-2">
        <p className="text-corps font-semibold text-gray-800">
          Ce cours n&apos;est pas encore disponible
        </p>
        <p className="text-corps-sm text-bepc-gris max-w-xs mx-auto">
          Génère-le maintenant avec l&apos;IA — il sera sauvegardé pour toi et tes
          camarades.
        </p>
      </div>

      {erreur && (
        <div className="bg-bepc-ambre-clair rounded-xl px-4 py-3 text-corps-sm text-bepc-ambre max-w-xs text-left">
          {erreur}
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 bg-bepc-vert text-white rounded-xl px-6 py-3 text-sm font-semibold min-h-touch active:scale-95 transition-transform disabled:opacity-60"
      >
        {loading ? (
          <>
            <RefreshCw size={16} className="animate-spin" />
            L&apos;IA prépare ton cours...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Générer avec l&apos;IA
          </>
        )}
      </button>

      {loading && (
        <p className="text-corps-sm text-bepc-gris animate-pulse">
          Cela peut prendre 15 à 30 secondes...
        </p>
      )}
    </div>
  );
}
