-- Migration 0010 : Phase 5 — colonnes manquantes flashcards_eleve + score_moyen progression_matiere

-- Ajouter score_moyen à progression_matiere si absent (alias de niveau_pct pour la jauge BEPC)
ALTER TABLE progression_matiere
  ADD COLUMN IF NOT EXISTS score_moyen numeric NOT NULL DEFAULT 0 CHECK (score_moyen BETWEEN 0 AND 100);

-- Synchroniser score_moyen = niveau_pct pour les lignes existantes
UPDATE progression_matiere SET score_moyen = niveau_pct WHERE score_moyen = 0 AND niveau_pct > 0;

-- Index pour les flashcards_eleve (prochaine_revue = aujourd'hui)
CREATE INDEX IF NOT EXISTS idx_flashcards_eleve_revue
  ON flashcards_eleve (user_id, prochaine_revue);

-- Index sur flashcards par matiere_id
CREATE INDEX IF NOT EXISTS idx_flashcards_matiere
  ON flashcards (matiere_id);

-- Index sur cours par chapitre_id
CREATE INDEX IF NOT EXISTS idx_cours_chapitre
  ON cours (chapitre_id);
