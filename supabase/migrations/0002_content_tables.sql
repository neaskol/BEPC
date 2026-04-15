-- Migration 0002 : Tables de contenu (matieres, chapitres, cours, sujets, exercices, flashcards)

-- Matières (seeded, pas de updated_at nécessaire)
CREATE TABLE matieres (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  nom         text NOT NULL,
  couleur     text NOT NULL,
  coefficient integer NOT NULL DEFAULT 1,
  ordre       integer NOT NULL
);

ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;

-- Chapitres
CREATE TABLE chapitres (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matiere_id  uuid NOT NULL REFERENCES matieres ON DELETE CASCADE,
  titre       text NOT NULL,
  ordre       integer NOT NULL DEFAULT 0,
  niveau      text NOT NULL DEFAULT 'moyen'
                CHECK (niveau IN ('facile', 'moyen', 'difficile')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chapitres ENABLE ROW LEVEL SECURITY;

-- Cours (contenu généré par IA, validé par admin)
CREATE TABLE cours (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapitre_id     uuid NOT NULL REFERENCES chapitres ON DELETE CASCADE,
  titre           text NOT NULL,
  contenu_json    jsonb NOT NULL,
  genere_par_ia   boolean NOT NULL DEFAULT true,
  valide          boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_cours_updated_at
  BEFORE UPDATE ON cours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cours ENABLE ROW LEVEL SECURITY;

-- Sujets d'examen (officiels PDF ou générés)
CREATE TABLE sujets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matiere_id    uuid NOT NULL REFERENCES matieres ON DELETE CASCADE,
  annee         integer,
  titre         text NOT NULL,
  type          text NOT NULL CHECK (type IN ('officiel', 'genere')),
  pdf_url       text,
  contenu_json  jsonb,
  valide        boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_sujets_updated_at
  BEFORE UPDATE ON sujets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE sujets ENABLE ROW LEVEL SECURITY;

-- Exercices
CREATE TABLE exercices (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet_id      uuid REFERENCES sujets ON DELETE SET NULL,
  chapitre_id   uuid REFERENCES chapitres ON DELETE SET NULL,
  enonce        text NOT NULL,
  type          text NOT NULL CHECK (type IN ('qcm', 'calcul', 'redaction', 'vrai_faux')),
  choix_json    jsonb,
  corrige       text NOT NULL,
  points        numeric NOT NULL DEFAULT 1,
  ordre         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exercices ENABLE ROW LEVEL SECURITY;

-- Flashcards
CREATE TABLE flashcards (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matiere_id    uuid NOT NULL REFERENCES matieres ON DELETE CASCADE,
  chapitre_id   uuid REFERENCES chapitres ON DELETE SET NULL,
  recto         text NOT NULL,
  verso         text NOT NULL,
  exemple       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
