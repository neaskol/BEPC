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
