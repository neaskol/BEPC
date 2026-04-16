"use client";

import { useEffect, useState } from "react";
import type { BadgeDebloque } from "@/lib/actions/xp";
import { BADGES_PAR_CODE } from "@/lib/badges";

interface BadgeToastProps {
  badges: BadgeDebloque[];
  onClose?: () => void;
}

export function BadgeToast({ badges, onClose }: BadgeToastProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(badges.length > 0);

  const badge = badges[index];
  const meta = badge ? BADGES_PAR_CODE[badge.code] : null;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (index < badges.length - 1) {
        setIndex((i) => i + 1);
      } else {
        setVisible(false);
        onClose?.();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [index, visible, badges.length, onClose]);

  if (!visible || !badge) return null;

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="bg-white border-2 border-bepc-green rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 max-w-xs w-full animate-badge-unlock pointer-events-auto">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-2xl shrink-0">
          {meta?.emoji ?? "🏅"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-bepc-green font-semibold uppercase tracking-wide">
            Badge débloqué !
          </p>
          <p className="text-sm font-bold text-gray-800 truncate">{badge.nom}</p>
          <p className="text-xs text-gray-500 leading-snug">{badge.description}</p>
        </div>
      </div>
    </div>
  );
}
