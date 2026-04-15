-- Migration 0001 : Trigger updated_at partagé + profiles + relations_parent_enfant

-- Trigger updated_at réutilisable pour toutes les tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table profiles (lie auth.users)
CREATE TABLE profiles (
  id                  uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  prenom              text NOT NULL,
  ville               text,
  role                text NOT NULL DEFAULT 'eleve'
                        CHECK (role IN ('eleve', 'parent', 'admin')),
  bepc_date           date,
  raison_decrochage   text,
  xp_total            integer NOT NULL DEFAULT 0,
  niveau              integer NOT NULL DEFAULT 1,
  streak_actuel       integer NOT NULL DEFAULT 0,
  streak_max          integer NOT NULL DEFAULT 0,
  derniere_activite   date,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Table relations_parent_enfant
CREATE TABLE relations_parent_enfant (
  parent_id   uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  enfant_id   uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, enfant_id)
);

ALTER TABLE relations_parent_enfant ENABLE ROW LEVEL SECURITY;
