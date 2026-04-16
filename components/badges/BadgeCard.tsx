"use client";

import { BadgeMeta } from "@/lib/badges";

interface BadgeCardProps {
  badge: BadgeMeta;
  obtenuLe?: string | null;
  nouveau?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-MG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function BadgeCard({ badge, obtenuLe, nouveau = false }: BadgeCardProps) {
  const obtenu = !!obtenuLe;

  return (
    <div
      className={[
        "relative rounded-2xl p-4 flex flex-col items-center gap-2 text-center transition-all duration-300",
        obtenu
          ? "bg-white border-2 border-bepc-green shadow-md"
          : "bg-gray-50 border-2 border-gray-100 opacity-60",
        nouveau ? "animate-badge-unlock" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Emoji / icône */}
      <div
        className={[
          "w-14 h-14 rounded-full flex items-center justify-center text-2xl",
          obtenu ? "bg-green-100" : "bg-gray-100",
          nouveau ? "ring-4 ring-bepc-green ring-offset-2" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {badge.estSecret && !obtenu ? "🔒" : badge.emoji}
      </div>

      {/* Nom */}
      <p className={`text-xs font-semibold leading-tight ${obtenu ? "text-gray-800" : "text-gray-400"}`}>
        {badge.estSecret && !obtenu ? "Badge secret" : badge.nom}
      </p>

      {/* Description */}
      <p className={`text-xs leading-snug ${obtenu ? "text-gray-500" : "text-gray-300"}`}>
        {badge.estSecret && !obtenu ? "Continue à explorer..." : badge.description}
      </p>

      {/* Date d'obtention */}
      {obtenu && obtenuLe && (
        <span className="text-xs text-bepc-green font-medium mt-1">
          {formatDate(obtenuLe)}
        </span>
      )}

      {/* Badge "NOUVEAU" */}
      {nouveau && (
        <span className="absolute -top-2 -right-2 bg-bepc-green text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
          NOUVEAU
        </span>
      )}
    </div>
  );
}
