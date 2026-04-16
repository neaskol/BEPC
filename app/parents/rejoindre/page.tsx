"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ParentsRejoindreInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const enfantId = searchParams.get("enfant");

  const [statut, setStatut] = useState<"idle" | "chargement" | "ok" | "erreur">("idle");
  const [message, setMessage] = useState("");
  const [enfantPrenom, setEnfantPrenom] = useState("");

  async function rejoindre() {
    if (!enfantId) return;
    setStatut("chargement");

    try {
      const res = await fetch("/api/parents/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enfant_id: enfantId }),
      });

      const data = await res.json();

      if (res.ok) {
        setEnfantPrenom(data.enfant?.prenom ?? "ton enfant");
        setStatut("ok");
      } else if (res.status === 403) {
        setMessage("Connecte-toi avec un compte parent pour accéder à cet espace.");
        setStatut("erreur");
      } else {
        setMessage(data.error ?? "Une erreur s'est produite.");
        setStatut("erreur");
      }
    } catch {
      setMessage("Connexion perdue. Réessaie !");
      setStatut("erreur");
    }
  }

  useEffect(() => {
    if (enfantId) {
      rejoindre();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enfantId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm p-8 text-center">
        {statut === "chargement" && (
          <>
            <div className="text-4xl mb-4 animate-pulse">👨‍👩‍👧</div>
            <p className="text-gray-600">Connexion en cours...</p>
          </>
        )}

        {statut === "ok" && (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              Lien établi !
            </h1>
            <p className="text-gray-600 mb-6">
              Tu peux maintenant suivre la progression de{" "}
              <span className="font-semibold text-bepc-vert">{enfantPrenom}</span>.
            </p>
            <button
              onClick={() => router.push("/parents")}
              className="w-full bg-bepc-vert text-white rounded-xl py-3 font-semibold"
            >
              Voir la progression →
            </button>
          </>
        )}

        {statut === "erreur" && (
          <>
            <div className="text-4xl mb-4">ℹ️</div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Attention</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push("/auth/connexion")}
              className="w-full bg-bepc-vert text-white rounded-xl py-3 font-semibold"
            >
              Se connecter
            </button>
          </>
        )}

        {statut === "idle" && !enfantId && (
          <>
            <div className="text-4xl mb-4">🔗</div>
            <p className="text-gray-600">
              Ce lien est incomplet. Demande à ton enfant de te renvoyer le lien depuis son application.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ParentsRejoindre() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#639922] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ParentsRejoindreInner />
    </Suspense>
  );
}
