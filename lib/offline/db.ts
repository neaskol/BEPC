/**
 * IndexedDB — BEPC Mada offline storage
 * Utilise la librairie `idb` pour une API Promise-based propre.
 * Stores : pending_answers, flashcard_progress, xp_pending, session_time
 */

import { openDB, DBSchema, IDBPDatabase } from "idb";

// ─── Schéma TypeScript ────────────────────────────────────────────────────────

export interface PendingAnswer {
  id: string;
  exercice_id: string;
  user_answer: string;
  correct: boolean;
  xp_earned: number;
  created_at: Date;
  synced: boolean;
}

export interface FlashcardProgress {
  flashcard_id: string;
  niveau: number;
  prochaine_revue: Date;
  last_updated: Date;
  synced: boolean;
}

export interface XPPending {
  id: string;
  amount: number;
  reason: string;
  created_at: Date;
  synced: boolean;
}

export interface SessionTime {
  date: string; // YYYY-MM-DD
  duration_seconds: number;
  synced: boolean;
}

// ─── DBSchema idb ─────────────────────────────────────────────────────────────

interface BepcDB extends DBSchema {
  pending_answers: {
    key: string;
    value: PendingAnswer;
    indexes: { "by-synced": IDBValidKey };
  };
  flashcard_progress: {
    key: string;
    value: FlashcardProgress;
    indexes: {
      "by-synced": IDBValidKey;
      "by-prochaine-revue": IDBValidKey;
    };
  };
  xp_pending: {
    key: string;
    value: XPPending;
    indexes: { "by-synced": IDBValidKey };
  };
  session_time: {
    key: string; // date YYYY-MM-DD
    value: SessionTime;
    indexes: { "by-synced": IDBValidKey };
  };
}

// ─── Singleton DB ─────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<BepcDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<BepcDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BepcDB>("bepc-offline", 1, {
      upgrade(db) {
        // pending_answers
        if (!db.objectStoreNames.contains("pending_answers")) {
          const answersStore = db.createObjectStore("pending_answers", {
            keyPath: "id",
          });
          answersStore.createIndex("by-synced", "synced");
        }

        // flashcard_progress
        if (!db.objectStoreNames.contains("flashcard_progress")) {
          const flashcardStore = db.createObjectStore("flashcard_progress", {
            keyPath: "flashcard_id",
          });
          flashcardStore.createIndex("by-synced", "synced");
          flashcardStore.createIndex("by-prochaine-revue", "prochaine_revue");
        }

        // xp_pending
        if (!db.objectStoreNames.contains("xp_pending")) {
          const xpStore = db.createObjectStore("xp_pending", {
            keyPath: "id",
          });
          xpStore.createIndex("by-synced", "synced");
        }

        // session_time
        if (!db.objectStoreNames.contains("session_time")) {
          const sessionStore = db.createObjectStore("session_time", {
            keyPath: "date",
          });
          sessionStore.createIndex("by-synced", "synced");
        }
      },
    });
  }
  return dbPromise;
}

// ─── Helpers : pending_answers ────────────────────────────────────────────────

export async function addPendingAnswer(answer: PendingAnswer): Promise<void> {
  const db = await getDB();
  await db.put("pending_answers", answer);
}

export async function getPendingAnswers(): Promise<PendingAnswer[]> {
  const db = await getDB();
  return db.getAll("pending_answers");
}

export async function getUnsyncedAnswers(): Promise<PendingAnswer[]> {
  const db = await getDB();
  const all = await db.getAll("pending_answers");
  return all.filter((a) => !a.synced);
}

export async function markAnswerSynced(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("pending_answers", "readwrite");
  const store = tx.objectStore("pending_answers");
  const record = await store.get(id);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
}

// ─── Helpers : flashcard_progress ────────────────────────────────────────────

export async function upsertFlashcardProgress(
  progress: FlashcardProgress
): Promise<void> {
  const db = await getDB();
  await db.put("flashcard_progress", progress);
}

export async function getUnsyncedFlashcardProgress(): Promise<
  FlashcardProgress[]
> {
  const db = await getDB();
  const all = await db.getAll("flashcard_progress");
  return all.filter((f) => !f.synced);
}

export async function getFlashcardsDueToday(): Promise<FlashcardProgress[]> {
  const db = await getDB();
  const all = await db.getAll("flashcard_progress");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  return all.filter((f) => new Date(f.prochaine_revue) <= tomorrow);
}

export async function markFlashcardSynced(
  flashcard_id: string
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("flashcard_progress", "readwrite");
  const store = tx.objectStore("flashcard_progress");
  const record = await store.get(flashcard_id);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
}

// ─── Helpers : xp_pending ────────────────────────────────────────────────────

export async function addXPPending(entry: XPPending): Promise<void> {
  const db = await getDB();
  await db.put("xp_pending", entry);
}

export async function getUnsyncedXP(): Promise<XPPending[]> {
  const db = await getDB();
  const all = await db.getAll("xp_pending");
  return all.filter((x) => !x.synced);
}

export async function markXPSynced(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("xp_pending", "readwrite");
  const store = tx.objectStore("xp_pending");
  const record = await store.get(id);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
}

// ─── Helpers : session_time ───────────────────────────────────────────────────

export async function upsertSessionTime(
  date: string,
  additionalSeconds: number
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("session_time", "readwrite");
  const store = tx.objectStore("session_time");
  const existing = await store.get(date);
  if (existing) {
    existing.duration_seconds += additionalSeconds;
    existing.synced = false;
    await store.put(existing);
  } else {
    await store.put({
      date,
      duration_seconds: additionalSeconds,
      synced: false,
    });
  }
  await tx.done;
}

export async function getUnsyncedSessionTimes(): Promise<SessionTime[]> {
  const db = await getDB();
  const all = await db.getAll("session_time");
  return all.filter((s) => !s.synced);
}

export async function markSessionTimeSynced(date: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("session_time", "readwrite");
  const store = tx.objectStore("session_time");
  const record = await store.get(date);
  if (record) {
    record.synced = true;
    await store.put(record);
  }
  await tx.done;
}

// ─── Helpers : comptage pour SyncIndicator ───────────────────────────────────

export async function countPendingItems(): Promise<number> {
  const [answers, flashcards, xp, sessions] = await Promise.all([
    getUnsyncedAnswers(),
    getUnsyncedFlashcardProgress(),
    getUnsyncedXP(),
    getUnsyncedSessionTimes(),
  ]);
  return answers.length + flashcards.length + xp.length + sessions.length;
}

// ─── Helpers : preload cache size guard ──────────────────────────────────────

/** Estime la taille totale du store en octets (approximation JSON) */
export async function estimateCacheSizeBytes(): Promise<number> {
  const db = await getDB();
  let total = 0;
  const storeNames = [
    "pending_answers",
    "flashcard_progress",
    "xp_pending",
    "session_time",
  ] as const;
  for (const storeName of storeNames) {
    const items = await db.getAll(storeName);
    total += new Blob([JSON.stringify(items)]).size;
  }
  return total;
}

export const MAX_CACHE_BYTES = 50 * 1024 * 1024; // 50 Mo
