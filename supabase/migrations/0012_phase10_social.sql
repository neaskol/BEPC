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
