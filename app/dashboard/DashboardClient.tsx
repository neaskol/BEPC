"use client";

/**
 * DashboardClient — partie cliente du dashboard.
 * - Lance usePreload() en arrière-plan au montage
 * - Affiche le SyncIndicator dans le header
 */

import { SyncIndicator } from "@/components/ui/SyncIndicator";
import { usePreload } from "@/lib/offline/usePreload";

export function DashboardClient() {
  // Pré-chargement silencieux en arrière-plan — ne bloque jamais le rendu
  usePreload();

  return <SyncIndicator />;
}
