"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showSync, setShowSync] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowSync(true);
      setTimeout(() => setShowSync(false), 3000);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showSync) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all ${
        showSync ? "bg-bepc-vert" : "bg-bepc-ambre"
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff size={16} />
          <span>Mode hors-ligne — tes révisions sont sauvegardées</span>
        </>
      ) : (
        <span>Synchronisation effectuée</span>
      )}
    </div>
  );
}
