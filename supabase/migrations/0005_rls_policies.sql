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
