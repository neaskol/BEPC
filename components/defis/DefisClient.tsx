"use client";

import { useState } from "react";

interface Personne {
  id: string;
  prenom: string;
}

interface Defi {
  id: string;
  status: string;
  score_challenger: number | null;
  score_challenged: number | null;
  created_at: string;
  completed_at: string | null;
  winner_id: string | null;
  challenger: Personne | Personne[] | null;
  challenged: Personne | Personne[] | null;
  exercise_id: string | null;
}

interface Eleve {
  id: string;
  prenom: string;
  ville: string;
}

interface Props {
  userId: string;
  prenom: string;
  defis: Defi[];
  eleves: Eleve[];
}

function getPersonne(p: Personne | Personne[] | null): Personne | null {
  if (!p) return null;
  return Array.isArray(p) ? (p[0] ?? null) : p;
}

async function partagerViaWhatsApp(prenom: string, _adversairePrenom: string) {
  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : "https://bepc-mada.vercel.app";
  const text = `${prenom} te défie sur l'app BEPC Mada ! Lance-toi : ${appUrl}/defis`;

  // Badge partage
  try {
    await fetch("/api/badges/award", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "partage" }),
    });
  } catch { /* silencieux */ }

  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({
      title: "Défi BEPC Mada",
      text,
      url: `${appUrl}/defis`,
    }).catch(() => {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    });
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }
}

export function DefisClient({ userId, prenom, defis, eleves }: Props) {
  const [showLancer, setShowLancer] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");

  const elevesFiltres = eleves.filter((e) =>
    e.prenom.toLowerCase().includes(recherche.toLowerCase())
  );

  async function lancerDefi(challengedId: string, challengedPrenom: string) {
    setChargement(true);
    setMessage("");
    try {
      const res = await fetch("/api/defis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenged_id: challengedId }),
      });
      if (res.ok) {
        setMessage(`Défi lancé à ${challengedPrenom} ! Partage sur WhatsApp pour qu'il(elle) le voit.`);
        setShowLancer(false);
        // Partager automatiquement
        partagerViaWhatsApp(prenom, challengedPrenom);
      } else {
        setMessage("Une erreur s'est produite. Réessaie !");
      }
    } catch {
      setMessage("Connexion perdue. Réessaie !");
    } finally {
      setChargement(false);
    }
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "En attente", color: "text-orange-500" },
    accepted: { label: "En cours", color: "text-blue-500" },
    completed: { label: "Terminé", color: "text-green-500" },
    declined: { label: "Refusé", color: "text-gray-400" },
  };

  return (
    <div className="space-y-4">
      {/* XP info */}
      <div className="bg-bepc-vert/10 border border-bepc-vert/20 rounded-2xl p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-bepc-vert">40 XP</p>
            <p className="text-xs text-gray-600">si tu gagnes</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-600">15 XP</p>
            <p className="text-xs text-gray-600">pour avoir joué</p>
          </div>
        </div>
      </div>

      {/* Message retour */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-green-700 text-sm">{message}</p>
        </div>
      )}

      {/* Bouton lancer */}
      <button
        onClick={() => setShowLancer(!showLancer)}
        className="w-full bg-bepc-vert text-white rounded-2xl py-4 font-semibold active:scale-95 transition-transform"
      >
        {showLancer ? "Annuler" : "⚔️ Lancer un défi"}
      </button>

      {/* Panel choix adversaire */}
      {showLancer && (
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <h2 className="font-semibold text-gray-800">Choisir un adversaire</h2>
          <input
            type="text"
            placeholder="Rechercher un élève..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-bepc-vert"
          />
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {elevesFiltres.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">
                Aucun élève trouvé
              </p>
            ) : (
              elevesFiltres.map((e) => (
                <button
                  key={e.id}
                  onClick={() => lancerDefi(e.id, e.prenom)}
                  disabled={chargement}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{e.prenom}</p>
                    {e.ville && <p className="text-xs text-gray-400">{e.ville}</p>}
                  </div>
                  <span className="text-bepc-vert text-sm">Défier →</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mes défis */}
      <h2 className="font-semibold text-gray-800 pt-2">Mes défis</h2>

      {defis.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-gray-500 text-sm">
            Aucun défi pour l&apos;instant. Lance le premier !
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {defis.map((defi) => {
            const challenger = getPersonne(defi.challenger);
            const challenged = getPersonne(defi.challenged);
            const isChallenger = challenger?.id === userId;
            const adversaire = isChallenger ? challenged : challenger;
            const monScore = isChallenger ? defi.score_challenger : defi.score_challenged;
            const sonScore = isChallenger ? defi.score_challenged : defi.score_challenger;
            const gagne = defi.winner_id === userId;
            const statusInfo = statusLabels[defi.status] ?? { label: defi.status, color: "text-gray-500" };

            return (
              <div key={defi.id} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">
                    {isChallenger ? "Tu as défié" : "Défi reçu de"}{" "}
                    <span className="text-bepc-vert">{adversaire?.prenom ?? "?"}</span>
                  </p>
                  <span className={`text-xs font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {defi.status === "completed" && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold text-gray-800">{monScore ?? "—"}</p>
                      <p className="text-xs text-gray-400">Ton score</p>
                    </div>
                    <span className="text-gray-300 font-bold">vs</span>
                    <div className="text-center flex-1">
                      <p className="text-lg font-bold text-gray-800">{sonScore ?? "—"}</p>
                      <p className="text-xs text-gray-400">Son score</p>
                    </div>
                    <div className="text-center flex-1">
                      <p className={`text-sm font-bold ${gagne ? "text-green-600" : "text-gray-400"}`}>
                        {gagne ? "Gagné !" : "Perdu"}
                      </p>
                      <p className={`text-xs ${gagne ? "text-green-500" : "text-gray-400"}`}>
                        {gagne ? "+40 XP" : "+15 XP"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-400">
                    {new Date(defi.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  {defi.status === "pending" && (
                    <button
                      onClick={() => {
                        const adversairePrenom = adversaire?.prenom ?? "ton ami";
                        partagerViaWhatsApp(prenom, adversairePrenom);
                      }}
                      className="flex items-center gap-1 text-xs text-green-600 font-medium"
                    >
                      📱 Partager sur WhatsApp
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
