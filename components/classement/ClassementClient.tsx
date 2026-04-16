"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ElEveRang {
  id: string;
  prenom: string;
  ville: string;
  xp_semaine: number;
  niveau: number;
  niveau_nom?: string;
  rang: number;
}

interface Props {
  voisins: ElEveRang[];
  topDix: ElEveRang[];
  monUserId: string;
  monRang: number;
  scope: "local" | "national";
  totalEleves: number;
  monProfil: ElEveRang & { prenom: string };
}

const NIVEAUX_NOMS = ["", "Lycéen", "Étudiant", "Apprenti", "Chercheur", "Expert", "Lauréat", "Champion BEPC"];

export function ClassementClient({
  voisins,
  topDix,
  monUserId,
  monRang,
  scope: initialScope,
  totalEleves,
  monProfil,
}: Props) {
  const router = useRouter();
  const [vue, setVue] = useState<"voisins" | "top10">("voisins");

  const handleScopeChange = (newScope: "local" | "national") => {
    router.push(`/classement?scope=${newScope}`);
  };

  const liste = vue === "voisins" ? voisins : topDix;

  const medailles: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  return (
    <div className="space-y-4">
      {/* Toggle scope */}
      <div className="bg-white rounded-2xl p-1 shadow-sm flex">
        <button
          onClick={() => handleScopeChange("local")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            initialScope === "local"
              ? "bg-bepc-vert text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Ma ville
        </button>
        <button
          onClick={() => handleScopeChange("national")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            initialScope === "national"
              ? "bg-bepc-vert text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Madagascar
        </button>
      </div>

      {/* Mon rang */}
      <div className="bg-bepc-vert/10 border border-bepc-vert/20 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-bepc-vert font-bold text-lg">
              #{monRang}
            </p>
            <p className="text-gray-600 text-sm">Ton rang</p>
          </div>
          <div className="text-right">
            <p className="text-gray-800 font-semibold">{monProfil.xp_semaine} XP</p>
            <p className="text-gray-400 text-xs">cette semaine</p>
          </div>
        </div>
        <p className="text-gray-400 text-xs mt-2">
          {totalEleves} élève{totalEleves > 1 ? "s" : ""} au classement{" "}
          {initialScope === "local" ? `dans ta ville` : "national"}
        </p>
      </div>

      {/* Toggle vue */}
      <div className="flex gap-2">
        <button
          onClick={() => setVue("voisins")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
            vue === "voisins"
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          Autour de moi
        </button>
        <button
          onClick={() => setVue("top10")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
            vue === "top10"
              ? "bg-gray-800 text-white border-gray-800"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          Top 10
        </button>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* En-tête */}
        <div className="grid grid-cols-[40px_1fr_60px_50px] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-400">Rang</span>
          <span className="text-xs font-medium text-gray-400">Élève</span>
          <span className="text-xs font-medium text-gray-400 text-right">XP sem.</span>
          <span className="text-xs font-medium text-gray-400 text-right">Niv.</span>
        </div>

        {liste.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-400 text-sm">Pas encore de classement disponible.</p>
          </div>
        ) : (
          <div>
            {liste.map((eleve) => {
              const isMe = eleve.id === monUserId;
              return (
                <div
                  key={eleve.id}
                  className={`grid grid-cols-[40px_1fr_60px_50px] gap-2 px-4 py-3 border-b border-gray-50 last:border-0 ${
                    isMe ? "bg-blue-50 border-blue-100" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${isMe ? "text-blue-600" : "text-gray-400"}`}>
                      {medailles[eleve.rang] ?? `#${eleve.rang}`}
                    </span>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isMe ? "text-blue-700" : "text-gray-800"}`}>
                      {eleve.prenom}
                      {isMe && <span className="text-xs ml-1">(toi)</span>}
                    </p>
                    {eleve.ville && (
                      <p className="text-xs text-gray-400">{eleve.ville}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                    <span className={`text-sm font-semibold ${isMe ? "text-blue-600" : "text-gray-700"}`}>
                      {eleve.xp_semaine}
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs text-gray-500">
                      {eleve.niveau}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-gray-400 text-xs pb-2">
        Rafraîchi toutes les heures
      </p>
    </div>
  );
}
