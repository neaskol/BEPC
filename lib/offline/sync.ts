/**
 * Synchronisation automatique — BEPC Mada
 *
 * Déclenché sur l'événement `window.online`.
 * Ordre strict : réponses → flashcards → XP → temps de session
 * Conflit : server wins (dernière réponse serveur garde la priorité)
 */

import {
  getUnsyncedAnswers,
  getUnsyncedFlashcardProgress,
  getUnsyncedXP,
  getUnsyncedSessionTimes,
  markAnswerSynced,
  markFlashcardSynced,
  markXPSynced,
  markSessionTimeSynced,
} from "./db";

// ─── État global de sync ──────────────────────────────────────────────────────

let isSyncing = false;
let syncListenerAttached = false;

// Callbacks pour notifier les composants (SyncIndicator, toast)
type SyncListener = (state: SyncState) => void;
const listeners: Set<SyncListener> = new Set();

export interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  error: string | null;
}

let currentState: SyncState = {
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  error: null,
};

function notifyListeners(partial: Partial<SyncState>) {
  currentState = { ...currentState, ...partial };
  listeners.forEach((fn) => fn(currentState));
}

export function subscribeSyncState(fn: SyncListener): () => void {
  listeners.add(fn);
  fn(currentState); // émet l'état actuel immédiatement
  return () => listeners.delete(fn);
}

export function getSyncState(): SyncState {
  return currentState;
}

// ─── Comptage des items en attente ────────────────────────────────────────────

export async function countPendingItems(): Promise<number> {
  const [answers, flashcards, xp, sessions] = await Promise.all([
    getUnsyncedAnswers(),
    getUnsyncedFlashcardProgress(),
    getUnsyncedXP(),
    getUnsyncedSessionTimes(),
  ]);
  return answers.length + flashcards.length + xp.length + sessions.length;
}

export async function refreshPendingCount(): Promise<void> {
  const pendingCount = await countPendingItems();
  notifyListeners({ pendingCount });
}

// ─── Sync individuelle : réponses ────────────────────────────────────────────

async function syncPendingAnswers(): Promise<void> {
  const answers = await getUnsyncedAnswers();
  if (answers.length === 0) return;

  for (const answer of answers) {
    try {
      const res = await fetch("/api/sync/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });

      if (res.ok || res.status === 409) {
        // 409 = conflit → server wins, on marque quand même comme synced
        await markAnswerSynced(answer.id);
      }
    } catch {
      // réseau toujours instable — on réessaiera au prochain online
    }
  }
}

// ─── Sync individuelle : flashcard progress ───────────────────────────────────

async function syncFlashcardProgress(): Promise<void> {
  const progresses = await getUnsyncedFlashcardProgress();
  if (progresses.length === 0) return;

  for (const progress of progresses) {
    try {
      const res = await fetch("/api/sync/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });

      if (res.ok || res.status === 409) {
        await markFlashcardSynced(progress.flashcard_id);
      }
    } catch {
      // réessai au prochain online
    }
  }
}

// ─── Sync individuelle : XP ──────────────────────────────────────────────────

async function syncXPPending(): Promise<void> {
  const xpItems = await getUnsyncedXP();
  if (xpItems.length === 0) return;

  for (const xpEntry of xpItems) {
    try {
      const res = await fetch("/api/sync/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(xpEntry),
      });

      if (res.ok) {
        await markXPSynced(xpEntry.id);
      }
    } catch {
      // réessai au prochain online
    }
  }
}

// ─── Sync individuelle : session time ────────────────────────────────────────

async function syncSessionTime(): Promise<void> {
  const sessions = await getUnsyncedSessionTimes();
  if (sessions.length === 0) return;

  for (const session of sessions) {
    try {
      const res = await fetch("/api/sync/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
      });

      if (res.ok) {
        await markSessionTimeSynced(session.date);
      }
    } catch {
      // réessai au prochain online
    }
  }
}

// ─── Fonction principale syncAll ──────────────────────────────────────────────

export async function syncAll(): Promise<void> {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const pending = await countPendingItems();
  if (pending === 0) return;

  isSyncing = true;
  notifyListeners({ isSyncing: true, error: null });

  try {
    // Ordre strict : réponses → flashcards → XP → temps de session
    await syncPendingAnswers();
    await syncFlashcardProgress();
    await syncXPPending();
    await syncSessionTime();

    const remaining = await countPendingItems();
    notifyListeners({
      isSyncing: false,
      pendingCount: remaining,
      lastSyncedAt: new Date(),
      error: null,
    });

    // Toast discret (2 secondes) via CustomEvent pour découplage
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bepc:synced"));
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur de synchronisation";
    notifyListeners({ isSyncing: false, error: message });
  } finally {
    isSyncing = false;
  }
}

// ─── Initialisation du listener online ───────────────────────────────────────

export function initSyncListener(): () => void {
  if (typeof window === "undefined") return () => {};
  if (syncListenerAttached) return () => {};

  const handleOnline = () => {
    // Lancer en arrière-plan, ne pas bloquer l'UI
    syncAll().catch(console.error);
  };

  window.addEventListener("online", handleOnline);
  syncListenerAttached = true;

  // Comptage initial
  refreshPendingCount().catch(console.error);

  // Si déjà online au montage, tenter une sync initiale discrète
  if (navigator.onLine) {
    // Différer légèrement pour ne pas bloquer le rendu initial
    setTimeout(() => syncAll().catch(console.error), 3000);
  }

  return () => {
    window.removeEventListener("online", handleOnline);
    syncListenerAttached = false;
  };
}
