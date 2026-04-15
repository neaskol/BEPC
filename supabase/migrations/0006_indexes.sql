-- Migration 0006 : Index pour les colonnes fréquemment filtrées

-- Réponses élève
CREATE INDEX idx_reponses_session_id ON reponses_eleve (session_id);
CREATE INDEX idx_reponses_user_exercice ON reponses_eleve (session_id, exercice_id);

-- Sessions élève
CREATE INDEX idx_sessions_user_created ON sessions_eleve (user_id, created_at DESC);
CREATE INDEX idx_sessions_user_mode ON sessions_eleve (user_id, mode);

-- Progression matière
CREATE INDEX idx_progression_user ON progression_matiere (user_id);

-- Flashcards élève (répétition espacée)
CREATE INDEX idx_flashcards_eleve_revue ON flashcards_eleve (user_id, prochaine_revue);

-- Contenu
CREATE INDEX idx_cours_chapitre ON cours (chapitre_id);
CREATE INDEX idx_cours_valide ON cours (valide) WHERE valide = true;
CREATE INDEX idx_exercices_chapitre ON exercices (chapitre_id);
CREATE INDEX idx_exercices_sujet ON exercices (sujet_id);
CREATE INDEX idx_chapitres_matiere ON chapitres (matiere_id, ordre);

-- Badges élève
CREATE INDEX idx_badges_eleve_user ON badges_eleve (user_id);

-- Profils
CREATE INDEX idx_profiles_ville ON profiles (ville);
CREATE INDEX idx_profiles_role ON profiles (role);
