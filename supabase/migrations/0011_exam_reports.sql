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
