"use client";

/**
 * SyncProvider — initialise le listener online/sync au montage.
 * À placer dans le RootLayout (côté client).
 * Ne rend rien dans le DOM.
 */

import { useEffect } from "react";
import { initSyncListener } from "@/lib/offline/sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = initSyncListener();
    return cleanup;
  }, []);

  return <>{children}</>;
}
