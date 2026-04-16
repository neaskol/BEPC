"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => {
      setIsOffline(true);
      setShowSynced(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
    };

    // Toast de sync émis par syncAll() dans lib/offline/sync.ts
    const handleSynced = () => {
      setShowSynced(true);
      setTimeout(() => setShowSynced(false), 2000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("bepc:synced", handleSynced);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("bepc:synced", handleSynced);
    };
  }, []);

  // Toast de sync réussie — 2 secondes, vert
  if (showSynced && !isOffline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-bepc-vert transition-all"
        style={{ minHeight: "36px" }}
      >
        <span>Synchronisation effectuée</span>
      </div>
    );
  }

  // Bannière hors-ligne — specs Phase 8 :
  // fond #FAEEDA, texte #633806, fixed top-0, full width, z-50
  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 transition-all"
      style={{
        backgroundColor: "#FAEEDA",
        color: "#633806",
        minHeight: "36px",
        fontWeight: 500,
        fontSize: "14px",
      }}
    >
      <WifiOff size={16} aria-hidden="true" />
      <span>Mode hors-ligne — Vos progrès sont sauvegardés localement</span>
    </div>
  );
}
