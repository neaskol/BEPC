"use client";

import { useEffect } from "react";
import {
  upsertFlashcardProgress,
  estimateCacheSizeBytes,
  MAX_CACHE_BYTES,
} from "./db";

// Clé localStorage pour éviter les pré-chargements trop fréquents (<24h)
const PRELOAD_KEY = "bepc:preload:last";
const PRELOAD_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function isPreloadFresh(): boolean {
  try {
    const raw = localStorage.getItem(PRELOAD_KEY);
    if (!raw) return false;
    const last = new Date(raw).getTime();
    return Date.now() - last < PRELOAD_TTL_MS;
  } catch {
    return false;
  }
}

function markPreloadDone(): void {
  try {
    localStorage.setItem(PRELOAD_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

async function isCacheFull(): Promise<boolean> {
  try {
    const size = await estimateCacheSizeBytes();
    return size >= MAX_CACHE_BYTES;
  } catch {
    return false;
  }
}

/**
 * Pré-charge en arrière-plan :
 * - 3 matières les plus faibles (cours + exercices)
 * - 30 exercices récents (ou non tentés)
 * - Flashcards dont prochaine_revue <= aujourd'hui + 1 jour
 *
 * Limites :
 * - Ne se déclenche que si online
 * - Ne jamais bloquer le rendu (tout est asynchrone, basse priorité)
 * - Limite stricte 50Mo
 * - Skip si déjà frais (<24h)
 */
async function runPreload(): Promise<void> {
  if (!navigator.onLine) return;
  if (isPreloadFresh()) return;
  if (await isCacheFull()) return;

  try {
    // ── 1. Flashcards dues aujourd'hui + demain ──────────────────────────────
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowISO = tomorrow.toISOString();

    const flashRes = await fetch(
      `/api/preload/flashcards?due_before=${encodeURIComponent(tomorrowISO)}`,
      { priority: "low" } as RequestInit
    );

    if (flashRes.ok) {
      const flashcards: Array<{
        flashcard_id: string;
        niveau: number;
        prochaine_revue: string;
      }> = await flashRes.json();

      for (const fc of flashcards) {
        await upsertFlashcardProgress({
          flashcard_id: fc.flashcard_id,
          niveau: fc.niveau,
          prochaine_revue: new Date(fc.prochaine_revue),
          last_updated: new Date(),
          synced: true,
        });
      }
    }

    // ── 2. 3 matières les plus faibles ──────────────────────────────────────
    // On déclenche juste le fetch pour peupler le cache SW (Stale-While-Revalidate)
    const weakRes = await fetch("/api/preload/matieres-faibles?limit=3", {
      priority: "low",
    } as RequestInit);

    if (weakRes.ok) {
      const matieres: Array<{ id: string }> = await weakRes.json();
      for (const m of matieres) {
        // Pré-charger les pages de cours et exercices correspondantes
        // Le Service Worker mettra en cache automatiquement via StaleWhileRevalidate
        fetch(`/cours/${m.id}`, { priority: "low" } as RequestInit).catch(
          () => {}
        );
        fetch(`/exercices?matiere=${m.id}&limit=10`, {
          priority: "low",
        } as RequestInit).catch(() => {});
      }
    }

    // ── 3. 30 exercices récents ──────────────────────────────────────────────
    fetch("/api/preload/exercices?limit=30", {
      priority: "low",
    } as RequestInit).catch(() => {});

    markPreloadDone();
  } catch {
    // Pré-chargement silencieux — ne jamais afficher d'erreur à l'utilisateur
  }
}

/**
 * Hook à appeler au montage du dashboard.
 * Lance le pré-chargement en arrière-plan sans bloquer l'UI.
 */
export function usePreload(): void {
  useEffect(() => {
    // requestIdleCallback pour une priorité basse si disponible
    if (typeof window === "undefined") return;

    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(
        () => {
          runPreload().catch(console.error);
        },
        { timeout: 5000 }
      );
      return () => cancelIdleCallback(id);
    } else {
      // Fallback : setTimeout 3s pour laisser le rendu se stabiliser
      const timeout = setTimeout(() => {
        runPreload().catch(console.error);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, []);
}
