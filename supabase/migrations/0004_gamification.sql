-- Migration 0004 : Gamification (badges catalogue + badges élève)

-- Catalogue des badges
CREATE TABLE badges_catalogue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL UNIQUE,
  nom             text NOT NULL,
  description     text NOT NULL,
  condition_json  jsonb NOT NULL,
  est_secret      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges_catalogue ENABLE ROW LEVEL SECURITY;

-- Badges obtenus par les élèves
CREATE TABLE badges_eleve (
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  badge_id    uuid NOT NULL REFERENCES badges_catalogue ON DELETE CASCADE,
  obtenu_le   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

ALTER TABLE badges_eleve ENABLE ROW LEVEL SECURITY;
