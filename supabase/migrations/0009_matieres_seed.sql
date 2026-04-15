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
