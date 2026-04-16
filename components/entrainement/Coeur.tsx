"use client";

import { Heart } from "lucide-react";

type Props = {
  total: number;
  restants: number;
};

export function Coeurs({ total, restants }: Props) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`${restants} cœur(s) restant(s) sur ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <Heart
          key={i}
          size={22}
          className={`transition-all duration-300 ${
            i < restants
              ? "fill-bepc-rouge text-bepc-rouge"
              : "fill-gray-200 text-gray-300"
          } ${i === restants && restants < total ? "animate-heart-lost" : ""}`}
        />
      ))}
    </div>
  );
}
