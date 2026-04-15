-- Migration 0003 : Sessions élève, réponses, progression, flashcards élève

-- Sessions d'entraînement
CREATE TABLE sessions_eleve (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  matiere_id  uuid REFERENCES matieres ON DELETE SET NULL,
  mode        text NOT NULL CHECK (mode IN ('standard', 'chrono', 'survie', 'rattrapage', 'examen_blanc')),
  score       numeric,
  xp_gagne    integer NOT NULL DEFAULT 0,
  duree_sec   integer,
  completed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions_eleve ENABLE ROW LEVEL SECURITY;

-- Réponses par exercice dans une session
CREATE TABLE reponses_eleve (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES sessions_eleve ON DELETE CASCADE,
  exercice_id         uuid NOT NULL REFERENCES exercices ON DELETE CASCADE,
  contenu             text NOT NULL,
  est_correcte        boolean,
  score_obtenu        numeric NOT NULL DEFAULT 0,
  feedback_ia         text,
  temps_reponse_sec   integer,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reponses_eleve ENABLE ROW LEVEL SECURITY;

-- Progression par matière (clé composite)
CREATE TABLE progression_matiere (
  user_id       uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  matiere_id    uuid NOT NULL REFERENCES matieres ON DELETE CASCADE,
  niveau_pct    numeric NOT NULL DEFAULT 0 CHECK (niveau_pct BETWEEN 0 AND 100),
  nb_sessions   integer NOT NULL DEFAULT 0,
  nb_exercices  integer NOT NULL DEFAULT 0,
  nb_corrects   integer NOT NULL DEFAULT 0,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, matiere_id)
);

ALTER TABLE progression_matiere ENABLE ROW LEVEL SECURITY;

-- Flashcards élève (répétition espacée Leitner)
CREATE TABLE flashcards_eleve (
  user_id           uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  flashcard_id      uuid NOT NULL REFERENCES flashcards ON DELETE CASCADE,
  niveau_maitrise   integer NOT NULL DEFAULT 0 CHECK (niveau_maitrise BETWEEN 0 AND 5),
  prochaine_revue   date NOT NULL DEFAULT CURRENT_DATE,
  nb_reussites      integer NOT NULL DEFAULT 0,
  nb_echecs         integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, flashcard_id)
);

ALTER TABLE flashcards_eleve ENABLE ROW LEVEL SECURITY;
