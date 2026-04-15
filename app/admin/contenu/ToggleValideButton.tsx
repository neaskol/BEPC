"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleValide } from "@/app/admin/upload/actions";

export function ToggleValideButton({
  sujetId,
  valide,
}: {
  sujetId: string;
  valide: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      await toggleValide(sujetId, !valide);
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50
        ${
          valide
            ? "bg-green-100 text-green-800 hover:bg-green-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
    >
      {isPending ? "…" : valide ? "✓ Publié" : "Brouillon"}
    </button>
  );
}
