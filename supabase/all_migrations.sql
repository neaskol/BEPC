-- ============================================================
-- BEPC Mada — Migration complète (toutes phases P0-P11)
-- Généré le 2026-04-16
-- Coller dans : Supabase > SQL Editor > New query > Run
-- ============================================================


-- ============================================================
-- 0001_init_profiles.sql
-- ============================================================

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


-- ============================================================
-- 0002_content_tables.sql
-- ============================================================

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


-- ============================================================
-- 0003_session_progress.sql
-- ============================================================

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


-- ============================================================
-- 0004_gamification.sql
-- ============================================================

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


-- ============================================================
-- 0005_rls_policies.sql
-- ============================================================

-- Migration 0005 : RLS Policies pour toutes les tables

-- Helper : vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper : vérifier si l'utilisateur est parent de l'enfant cible
CREATE OR REPLACE FUNCTION is_parent_of(enfant uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM relations_parent_enfant
    WHERE parent_id = auth.uid() AND enfant_id = enfant
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_parent" ON profiles
  FOR SELECT USING (is_parent_of(id));

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- ============================================================
-- relations_parent_enfant
-- ============================================================
CREATE POLICY "relations_select_own" ON relations_parent_enfant
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = enfant_id);

CREATE POLICY "relations_insert_parent" ON relations_parent_enfant
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "relations_delete_parent" ON relations_parent_enfant
  FOR DELETE USING (auth.uid() = parent_id);

-- ============================================================
-- matieres (lecture publique)
-- ============================================================
CREATE POLICY "matieres_select_all" ON matieres
  FOR SELECT USING (true);

CREATE POLICY "matieres_write_admin" ON matieres
  FOR ALL USING (is_admin());

-- ============================================================
-- chapitres (lecture publique)
-- ============================================================
CREATE POLICY "chapitres_select_all" ON chapitres
  FOR SELECT USING (true);

CREATE POLICY "chapitres_write_admin" ON chapitres
  FOR ALL USING (is_admin());

-- ============================================================
-- cours (lecture des cours validés seulement)
-- ============================================================
CREATE POLICY "cours_select_valid" ON cours
  FOR SELECT USING (valide = true);

CREATE POLICY "cours_select_admin" ON cours
  FOR SELECT USING (is_admin());

CREATE POLICY "cours_write_admin" ON cours
  FOR ALL USING (is_admin());

-- ============================================================
-- sujets (lecture des sujets validés seulement)
-- ============================================================
CREATE POLICY "sujets_select_valid" ON sujets
  FOR SELECT USING (valide = true);

CREATE POLICY "sujets_select_admin" ON sujets
  FOR SELECT USING (is_admin());

CREATE POLICY "sujets_write_admin" ON sujets
  FOR ALL USING (is_admin());

-- ============================================================
-- exercices (liés à sujets validés ou chapitres)
-- ============================================================
CREATE POLICY "exercices_select_all" ON exercices
  FOR SELECT USING (
    sujet_id IS NULL
    OR EXISTS (SELECT 1 FROM sujets WHERE id = sujet_id AND valide = true)
  );

CREATE POLICY "exercices_select_admin" ON exercices
  FOR SELECT USING (is_admin());

CREATE POLICY "exercices_write_admin" ON exercices
  FOR ALL USING (is_admin());

-- ============================================================
-- flashcards (lecture publique)
-- ============================================================
CREATE POLICY "flashcards_select_all" ON flashcards
  FOR SELECT USING (true);

CREATE POLICY "flashcards_write_admin" ON flashcards
  FOR ALL USING (is_admin());

-- ============================================================
-- sessions_eleve (élève voit ses sessions, parent voit celles de ses enfants)
-- ============================================================
CREATE POLICY "sessions_select_own" ON sessions_eleve
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "sessions_select_parent" ON sessions_eleve
  FOR SELECT USING (is_parent_of(user_id));

CREATE POLICY "sessions_insert_own" ON sessions_eleve
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions_update_own" ON sessions_eleve
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "sessions_select_admin" ON sessions_eleve
  FOR SELECT USING (is_admin());

-- ============================================================
-- reponses_eleve
-- ============================================================
CREATE POLICY "reponses_select_own" ON reponses_eleve
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM sessions_eleve WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "reponses_insert_own" ON reponses_eleve
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM sessions_eleve WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "reponses_select_admin" ON reponses_eleve
  FOR SELECT USING (is_admin());

-- ============================================================
-- progression_matiere
-- ============================================================
CREATE POLICY "progression_select_own" ON progression_matiere
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progression_select_parent" ON progression_matiere
  FOR SELECT USING (is_parent_of(user_id));

CREATE POLICY "progression_upsert_own" ON progression_matiere
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "progression_select_admin" ON progression_matiere
  FOR SELECT USING (is_admin());

-- ============================================================
-- flashcards_eleve
-- ============================================================
CREATE POLICY "flashcards_eleve_own" ON flashcards_eleve
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- badges_catalogue (lecture publique)
-- ============================================================
CREATE POLICY "badges_catalogue_select_non_secret" ON badges_catalogue
  FOR SELECT USING (est_secret = false OR is_admin());

CREATE POLICY "badges_catalogue_write_admin" ON badges_catalogue
  FOR ALL USING (is_admin());

-- ============================================================
-- badges_eleve
-- ============================================================
CREATE POLICY "badges_eleve_select_own" ON badges_eleve
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "badges_eleve_select_parent" ON badges_eleve
  FOR SELECT USING (is_parent_of(user_id));

CREATE POLICY "badges_eleve_insert_own" ON badges_eleve
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "badges_eleve_select_admin" ON badges_eleve
  FOR SELECT USING (is_admin());


-- ============================================================
-- 0006_indexes.sql
-- ============================================================

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


-- ============================================================
-- 0007_profiles_insert_rls.sql
-- ============================================================

-- Migration 0007 : Politique RLS INSERT sur profiles (nécessaire pour l'inscription)
-- Un utilisateur authentifié peut créer son propre profil (auth.uid() = id)

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ============================================================
-- 0008_storage_buckets.sql
-- ============================================================

-- Migration 0008 : Buckets Storage Supabase + RLS

-- Bucket sujets-pdf (privé, PDF seulement, max 50 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sujets-pdf',
  'sujets-pdf',
  false,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket avatars (public, images, max 5 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS : sujets-pdf
-- ============================================================

-- Admin peut uploader
CREATE POLICY "sujets_pdf_insert_admin" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'sujets-pdf'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Utilisateurs authentifiés peuvent lire
CREATE POLICY "sujets_pdf_select_authenticated" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'sujets-pdf'
    AND auth.role() = 'authenticated'
  );

-- Admin peut supprimer
CREATE POLICY "sujets_pdf_delete_admin" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'sujets-pdf'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- RLS : avatars
-- ============================================================

-- Lecture publique
CREATE POLICY "avatars_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Chaque utilisateur peut uploader dans son dossier (avatars/<user_id>/...)
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- 0009_matieres_seed.sql
-- ============================================================

-- Migration 0009 : Seed des 6 matières BEPC + chapitres prioritaires
-- Idempotent : INSERT ... ON CONFLICT DO NOTHING

-- ============================================================
-- Matières
-- ============================================================
INSERT INTO matieres (id, code, nom, couleur, coefficient, ordre) VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'maths',       'Mathématiques',        '#639922', 4, 1),
  ('a1b2c3d4-0001-0000-0000-000000000002', 'francais',     'Français',             '#BA7517', 4, 2),
  ('a1b2c3d4-0001-0000-0000-000000000003', 'svt',          'SVT',                  '#2D7D46', 2, 3),
  ('a1b2c3d4-0001-0000-0000-000000000004', 'histoire_geo', 'Histoire-Géographie',  '#8B5CF6', 2, 4),
  ('a1b2c3d4-0001-0000-0000-000000000005', 'physique',     'Physique-Chimie',      '#0EA5E9', 2, 5),
  ('a1b2c3d4-0001-0000-0000-000000000006', 'anglais',      'Anglais',              '#D85A30', 2, 6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — Mathématiques
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0001-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000001', 'Calculs et fractions',                  1, 'facile'),
  ('b2c3d4e5-0002-0001-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000001', 'Algèbre (équations du 1er degré)',      2, 'moyen'),
  ('b2c3d4e5-0002-0001-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000001', 'Géométrie plane (aires, périmètres)',   3, 'moyen'),
  ('b2c3d4e5-0002-0001-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000001', 'Proportionnalité et pourcentages',     4, 'moyen'),
  ('b2c3d4e5-0002-0001-0000-000000000005', 'a1b2c3d4-0001-0000-0000-000000000001', 'Statistiques (moyenne, fréquence)',    5, 'moyen'),
  ('b2c3d4e5-0002-0001-0000-000000000006', 'a1b2c3d4-0001-0000-0000-000000000001', 'Géométrie dans l''espace',              6, 'difficile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — Français
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0002-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000002', 'Grammaire (nature et fonction des mots)',                1, 'facile'),
  ('b2c3d4e5-0002-0002-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000002', 'Conjugaison (temps principaux)',                          2, 'moyen'),
  ('b2c3d4e5-0002-0002-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000002', 'Orthographe lexicale et grammaticale',                   3, 'moyen'),
  ('b2c3d4e5-0002-0002-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000002', 'Compréhension de texte',                                 4, 'moyen'),
  ('b2c3d4e5-0002-0002-0000-000000000005', 'a1b2c3d4-0001-0000-0000-000000000002', 'Expression écrite (lettre, récit, description)',          5, 'difficile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — SVT
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0003-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000003', 'La cellule et les êtres vivants',           1, 'facile'),
  ('b2c3d4e5-0002-0003-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000003', 'Nutrition et digestion',                    2, 'moyen'),
  ('b2c3d4e5-0002-0003-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000003', 'Reproduction',                              3, 'moyen'),
  ('b2c3d4e5-0002-0003-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000003', 'Écosystèmes et environnement malgache',    4, 'moyen'),
  ('b2c3d4e5-0002-0003-0000-000000000005', 'a1b2c3d4-0001-0000-0000-000000000003', 'Géologie (roches, séismes)',                5, 'difficile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — Histoire-Géographie
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0004-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000004', 'Histoire de Madagascar (colonisation, indépendance)', 1, 'facile'),
  ('b2c3d4e5-0002-0004-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000004', 'L''Afrique contemporaine',                             2, 'moyen'),
  ('b2c3d4e5-0002-0004-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000004', 'Géographie physique de Madagascar',                   3, 'moyen'),
  ('b2c3d4e5-0002-0004-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000004', 'Population et économie malgache',                     4, 'moyen'),
  ('b2c3d4e5-0002-0004-0000-000000000005', 'a1b2c3d4-0001-0000-0000-000000000004', 'Mondialisation',                                      5, 'difficile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — Physique-Chimie
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0005-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000005', 'États de la matière',                    1, 'facile'),
  ('b2c3d4e5-0002-0005-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000005', 'Électricité (circuits simples)',          2, 'moyen'),
  ('b2c3d4e5-0002-0005-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000005', 'Optique (lumière, miroirs)',              3, 'moyen'),
  ('b2c3d4e5-0002-0005-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000005', 'Chimie (atomes, molécules, réactions)',   4, 'difficile')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Chapitres — Anglais
-- ============================================================
INSERT INTO chapitres (id, matiere_id, titre, ordre, niveau) VALUES
  ('b2c3d4e5-0002-0006-0000-000000000001', 'a1b2c3d4-0001-0000-0000-000000000006', 'Grammaire de base (temps, auxiliaires)', 1, 'facile'),
  ('b2c3d4e5-0002-0006-0000-000000000002', 'a1b2c3d4-0001-0000-0000-000000000006', 'Vocabulaire thématique',                 2, 'moyen'),
  ('b2c3d4e5-0002-0006-0000-000000000003', 'a1b2c3d4-0001-0000-0000-000000000006', 'Compréhension écrite',                   3, 'moyen'),
  ('b2c3d4e5-0002-0006-0000-000000000004', 'a1b2c3d4-0001-0000-0000-000000000006', 'Expression écrite simple',               4, 'difficile')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 0010_phase5_flashcards_jauge.sql
-- ============================================================

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


-- ============================================================
-- 0010_xp_gamification.sql
-- ============================================================

-- Migration 0010 : XP transactions + colonnes profiles + badges catalogue

-- Table xp_transactions
CREATE TABLE IF NOT EXISTS xp_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  amount      integer NOT NULL CHECK (amount >= 0),
  reason      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Élève voit ses propres transactions XP"
  ON xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Élève insère ses transactions XP"
  ON xp_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ajouter colonnes manquantes dans profiles si absentes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS xp_bonus_until timestamptz;

-- Renommer badges_eleve en badges_utilisateurs si nécessaire (alias)
-- On crée une vue pour compatibilité
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'badges_utilisateurs'
  ) THEN
    -- La table badges_eleve existe (migration 0004), on crée un alias
    CREATE VIEW badges_utilisateurs AS
      SELECT
        id::text AS id,
        user_id,
        badge_id,
        obtenu_le AS obtained_at
      FROM (
        SELECT
          (user_id::text || '-' || badge_id::text) AS id,
          user_id,
          badge_id,
          obtenu_le
        FROM badges_eleve
      ) sub;
  END IF;
END $$;

-- Index performances
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created_at ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_eleve_user_id ON badges_eleve(user_id);

-- Seed badges catalogue (upsert)
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  -- Démarrage
  ('premier_pas', 'Voninkazo', 'Terminer ton premier cours complet', '{"type":"cours_termine","count":1}', false),
  ('premier_exercice', 'Karatasy voalohany', 'Faire ton premier exercice', '{"type":"exercice_fait","count":1}', false),
  ('diagnostic', 'Mpitsabo', 'Compléter le diagnostic initial', '{"type":"diagnostic_complete"}', false),

  -- Régularité
  ('streak_3', 'Voatobia', '3 jours de suite', '{"type":"streak","days":3}', false),
  ('streak_7', 'Hafanam-po', '7 jours de suite', '{"type":"streak","days":7}', false),
  ('streak_30', 'Maharitra', '30 jours de suite', '{"type":"streak","days":30}', false),
  ('streak_100', 'Tsy mety kivy', '100 jours de suite', '{"type":"streak","days":100}', false),
  ('matin_tot', 'Vitsika maraina', 'S''entraîner avant 7h du matin', '{"type":"heure","before":7}', true),
  ('nuit_tard', 'Kintana', 'S''entraîner après 22h', '{"type":"heure","after":22}', true),

  -- Maîtrise
  ('maths_60', 'Ingona matematika', 'Maths > 60%', '{"type":"niveau_matiere","code":"maths","pct":60}', false),
  ('maths_90', 'Manampahaizana', 'Maths > 90%', '{"type":"niveau_matiere","code":"maths","pct":90}', false),
  ('francais_60', 'Mpanoratra', 'Français > 60%', '{"type":"niveau_matiere","code":"francais","pct":60}', false),
  ('toutes_matieres_50', 'Mpikaroka', 'Toutes les matières > 50%', '{"type":"toutes_matieres","pct":50}', false),
  ('cours_complet', 'Mpianatr''omby', 'Finir un cours complet', '{"type":"cours_termine","count":1}', false),
  ('tous_cours_matiere', 'Mahasolo tena', 'Finir tous les cours d''une matière', '{"type":"tous_cours_matiere"}', false),
  ('flashcards_10', 'Tsara saina', '10 flashcards maîtrisées', '{"type":"flashcards_maitrisees","count":10}', false),
  ('exercices_50', 'Mpiasa mafy', '50 exercices réussis', '{"type":"exercices_reussis","count":50}', false),
  ('cent_exercices', 'Ranomasina', '100 exercices complétés', '{"type":"exercices_faits","count":100}', false),

  -- Performance
  ('survie_parfait', 'Mpiahy', 'Mode survie sans erreur', '{"type":"survie_parfait"}', false),
  ('chrono_serie', 'Mpifaninana', '5 bonnes réponses chrono d''affilée', '{"type":"chrono_serie","count":5}', false),
  ('examen_10', 'Mivoaka tsara', 'Examen blanc > 10/20', '{"type":"examen_blanc","score":10}', false),
  ('examen_15', 'Manam-boninahitra', 'Examen blanc > 15/20', '{"type":"examen_blanc","score":15}', false),
  ('perfect_qcm', 'Tsy misy diso', '10 QCM parfaits d''affilée', '{"type":"qcm_serie","count":10}', true),
  ('chapitres_5', 'Mpianatra be', '5 chapitres terminés', '{"type":"chapitres_termines","count":5}', false),
  ('score_parfait', 'Tena mahasolo tena', 'Score parfait sur un exercice', '{"type":"score_parfait"}', false),

  -- Sociaux
  ('premier_defi', 'Mpanao sahy', 'Lancer un premier défi', '{"type":"defi_lance","count":1}', false),
  ('defi_gagne', 'Mpandresy', 'Gagner un défi', '{"type":"defi_gagne","count":1}', false),
  ('aide_communaute', 'Mpampianatra', 'Aider 5 élèves dans la communauté', '{"type":"aide_communaute","count":5}', false),

  -- Spéciaux
  ('pret_bepc', 'Mivoaka amin''ny BEPC', 'Jauge BEPC > 80%', '{"type":"jauge_bepc","pct":80}', false),
  ('champion', 'Champion BEPC', 'Atteindre le niveau 7', '{"type":"niveau","value":7}', false),
  ('come_back', 'Tsy mety reraka', 'Revenir après 14 jours d''absence', '{"type":"absence","days":14}', true),
  ('noel', 'Noely', 'Réviser le 25 décembre', '{"type":"date","month":12,"day":25}', true),
  ('streak_recovery', 'Toky vaovao', 'Revenir après une streak brisée', '{"type":"streak_recovery"}', false),

  -- Niveaux
  ('niveau_2', 'Étudiant', 'Atteindre le niveau 2', '{"type":"niveau","value":2}', false),
  ('niveau_3', 'Apprenti', 'Atteindre le niveau 3', '{"type":"niveau","value":3}', false),
  ('niveau_4', 'Chercheur', 'Atteindre le niveau 4', '{"type":"niveau","value":4}', false),
  ('niveau_5', 'Expert', 'Atteindre le niveau 5', '{"type":"niveau","value":5}', false),
  ('niveau_6', 'Lauréat', 'Atteindre le niveau 6', '{"type":"niveau","value":6}', false),
  ('niveau_7', 'Champion BEPC', 'Atteindre le niveau 7', '{"type":"niveau","value":7}', false)
ON CONFLICT (code) DO NOTHING;


-- ============================================================
-- 0011_exam_reports.sql
-- ============================================================

-- Migration 0011 : Table exam_reports pour les rapports d'examen blanc IA

CREATE TABLE IF NOT EXISTS exam_reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  session_id      uuid REFERENCES sessions_eleve ON DELETE SET NULL,
  -- Scores par matière (notes sur 20, stockées en JSON)
  resultats_json  jsonb NOT NULL,  -- [{matiere, note, coeff, reponses:[]}]
  -- Rapport IA généré (Function 5 docs/ia.md)
  rapport_json    jsonb,           -- null si génération en cours ou échouée
  note_globale    numeric(4,2),    -- note pondérée finale /20
  statut          text NOT NULL DEFAULT 'pending'
                  CHECK (statut IN ('pending', 'generated', 'error')),
  erreur_message  text,
  xp_attribue     boolean DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exam_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Élève voit ses propres rapports"
  ON exam_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Élève insère ses rapports"
  ON exam_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Élève met à jour ses rapports"
  ON exam_reports FOR UPDATE
  USING (auth.uid() = user_id);

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_exam_reports_user_id ON exam_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_reports_created_at ON exam_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_reports_user_created ON exam_reports(user_id, created_at DESC);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_exam_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_reports_updated_at
  BEFORE UPDATE ON exam_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_reports_updated_at();


-- ============================================================
-- 0012_phase10_social.sql
-- ============================================================

-- Phase 10 : Fonctionnalités sociales
-- 1. Rôle parent + liens parent-enfant
-- 2. Défis entre élèves
-- 3. Communauté (questions/réponses/signalements)

-- ─── 1. PARENT ROLE ───────────────────────────────────────────────────────────
-- Le champ role existe déjà dans profiles (voir migration init)
-- On s'assure que la contrainte permet 'parent'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('eleve', 'parent', 'admin'));
  END IF;
END $$;

-- Liens parent → enfant
CREATE TABLE IF NOT EXISTS parent_child_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

-- ─── 2. DÉFIS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenged_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id     UUID REFERENCES exercices(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'completed', 'declined')),
  score_challenger INTEGER,
  score_challenged INTEGER,
  winner_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

-- ─── 3. COMMUNAUTÉ ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matiere     TEXT NOT NULL,
  titre       TEXT NOT NULL,
  corps       TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  corps       TEXT NOT NULL,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('question', 'answer')),
  target_id   UUID NOT NULL,
  raison      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEX ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parent_child_parent   ON parent_child_links(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_child_child    ON parent_child_links(child_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenger ON challenges(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenges_challenged ON challenges(challenged_id);
CREATE INDEX IF NOT EXISTS idx_community_q_author    ON community_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_community_q_matiere   ON community_questions(matiere);
CREATE INDEX IF NOT EXISTS idx_community_a_question  ON community_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_community_a_author    ON community_answers(author_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE parent_child_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reports     ENABLE ROW LEVEL SECURITY;

-- parent_child_links : parent peut lire/créer ses propres liens
CREATE POLICY "parent_child_links_select" ON parent_child_links
  FOR SELECT USING (auth.uid() = parent_id OR auth.uid() = child_id);
CREATE POLICY "parent_child_links_insert" ON parent_child_links
  FOR INSERT WITH CHECK (auth.uid() = child_id);

-- challenges : les deux parties peuvent lire, seul le challenger crée
CREATE POLICY "challenges_select" ON challenges
  FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
CREATE POLICY "challenges_insert" ON challenges
  FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "challenges_update" ON challenges
  FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- community_questions : lecture publique (élèves connectés), écriture authentifiée
CREATE POLICY "community_q_select" ON community_questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "community_q_insert" ON community_questions
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "community_q_update" ON community_questions
  FOR UPDATE USING (auth.uid() = author_id);

-- community_answers
CREATE POLICY "community_a_select" ON community_answers
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "community_a_insert" ON community_answers
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "community_a_update" ON community_answers
  FOR UPDATE USING (auth.uid() = author_id);

-- community_reports : lecture admin, écriture authentifiée
CREATE POLICY "community_reports_insert" ON community_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "community_reports_select" ON community_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
