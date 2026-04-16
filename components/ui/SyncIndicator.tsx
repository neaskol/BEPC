"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { subscribeSyncState, SyncState } from "@/lib/offline/sync";

export function SyncIndicator() {
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncState((s) => setState(s));
    return unsubscribe;
  }, []);

  // Ne rien afficher s'il n'y a rien en attente et qu'on ne sync pas
  if (!state.isSyncing && state.pendingCount === 0) return null;

  return (
    <div
      className="flex items-center gap-1 relative"
      title={
        state.isSyncing
          ? "Synchronisation en cours..."
          : `${state.pendingCount} élément(s) en attente de synchronisation`
      }
      aria-label={
        state.isSyncing
          ? "Synchronisation en cours"
          : `${state.pendingCount} éléments en attente`
      }
    >
      <RefreshCw
        size={18}
        className={`text-bepc-ambre ${state.isSyncing ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
      {!state.isSyncing && state.pendingCount > 0 && (
        <span
          className="absolute -top-1.5 -right-1.5 bg-bepc-ambre text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
          aria-hidden="true"
        >
          {state.pendingCount > 9 ? "9+" : state.pendingCount}
        </span>
      )}
    </div>
  );
}
