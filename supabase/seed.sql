-- Seed BEPC Mada : Matières, Chapitres, Badges

-- ============================================================
-- MATIÈRES (6 matières avec coefficients BEPC Madagascar)
-- ============================================================
INSERT INTO matieres (id, code, nom, couleur, coefficient, ordre) VALUES
  ('11111111-0001-0001-0001-000000000001', 'maths',       'Mathématiques',         '#639922', 4, 1),
  ('11111111-0001-0001-0001-000000000002', 'francais',    'Français',              '#BA7517', 4, 2),
  ('11111111-0001-0001-0001-000000000003', 'svt',         'SVT',                   '#4a9e6a', 3, 3),
  ('11111111-0001-0001-0001-000000000004', 'histoire_geo','Histoire-Géographie',   '#8b6914', 3, 4),
  ('11111111-0001-0001-0001-000000000005', 'physique',    'Physique-Chimie',       '#1a6fa8', 3, 5),
  ('11111111-0001-0001-0001-000000000006', 'anglais',     'Anglais',               '#6b3fa0', 2, 6);

-- ============================================================
-- CHAPITRES (25 chapitres prioritaires selon docs/contenu.md)
-- ============================================================

-- Mathématiques
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000001', 'Calculs et fractions',                        1, 'facile'),
  ('11111111-0001-0001-0001-000000000001', 'Algèbre — équations du 1er degré',            2, 'moyen'),
  ('11111111-0001-0001-0001-000000000001', 'Géométrie plane — aires et périmètres',       3, 'moyen'),
  ('11111111-0001-0001-0001-000000000001', 'Proportionnalité et pourcentages',            4, 'moyen'),
  ('11111111-0001-0001-0001-000000000001', 'Statistiques — moyenne et fréquence',         5, 'moyen'),
  ('11111111-0001-0001-0001-000000000001', 'Géométrie dans l''espace',                    6, 'difficile');

-- Français
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000002', 'Grammaire — nature et fonction des mots',     1, 'moyen'),
  ('11111111-0001-0001-0001-000000000002', 'Conjugaison — temps principaux',              2, 'facile'),
  ('11111111-0001-0001-0001-000000000002', 'Orthographe lexicale et grammaticale',        3, 'moyen'),
  ('11111111-0001-0001-0001-000000000002', 'Compréhension de texte',                     4, 'moyen'),
  ('11111111-0001-0001-0001-000000000002', 'Expression écrite — lettre, récit, description', 5, 'difficile');

-- SVT
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000003', 'La cellule et les êtres vivants',             1, 'facile'),
  ('11111111-0001-0001-0001-000000000003', 'Nutrition et digestion',                     2, 'moyen'),
  ('11111111-0001-0001-0001-000000000003', 'Reproduction',                               3, 'moyen'),
  ('11111111-0001-0001-0001-000000000003', 'Écosystèmes et environnement malgache',      4, 'moyen'),
  ('11111111-0001-0001-0001-000000000003', 'Géologie — roches et séismes',               5, 'difficile');

-- Histoire-Géographie
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000004', 'Histoire de Madagascar — colonisation et indépendance', 1, 'moyen'),
  ('11111111-0001-0001-0001-000000000004', 'L''Afrique contemporaine',                   2, 'moyen'),
  ('11111111-0001-0001-0001-000000000004', 'Géographie physique de Madagascar',          3, 'facile'),
  ('11111111-0001-0001-0001-000000000004', 'Population et économie malgache',            4, 'moyen'),
  ('11111111-0001-0001-0001-000000000004', 'Mondialisation',                             5, 'difficile');

-- Physique-Chimie
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000005', 'États de la matière',                        1, 'facile'),
  ('11111111-0001-0001-0001-000000000005', 'Électricité — circuits simples',             2, 'moyen'),
  ('11111111-0001-0001-0001-000000000005', 'Optique — lumière et miroirs',               3, 'moyen'),
  ('11111111-0001-0001-0001-000000000005', 'Chimie — atomes, molécules, réactions',      4, 'difficile');

-- Anglais
INSERT INTO chapitres (matiere_id, titre, ordre, niveau) VALUES
  ('11111111-0001-0001-0001-000000000006', 'Grammaire de base — temps et auxiliaires',   1, 'facile'),
  ('11111111-0001-0001-0001-000000000006', 'Vocabulaire thématique',                     2, 'facile'),
  ('11111111-0001-0001-0001-000000000006', 'Compréhension écrite',                       3, 'moyen'),
  ('11111111-0001-0001-0001-000000000006', 'Expression écrite simple',                  4, 'moyen');

-- ============================================================
-- BADGES CATALOGUE (27 badges selon docs/gamification.md)
-- ============================================================

-- Badges de démarrage
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('premier_pas',      'Voninkazo',          'Terminer le premier cours',                     '{"type":"cours_complete","count":1}',         false),
  ('premier_exercice', 'Karatasy voalohany', 'Faire le premier exercice',                     '{"type":"exercice_complete","count":1}',      false),
  ('diagnostic',       'Mpitsabo',           'Compléter le diagnostic initial',               '{"type":"diagnostic_complete"}',             false);

-- Badges de régularité
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('streak_7',   'Hafanam-po',    '7 jours de suite',              '{"type":"streak","days":7}',   false),
  ('streak_30',  'Maharitra',     '30 jours de suite',             '{"type":"streak","days":30}',  false),
  ('streak_100', 'Tsy mety kivy', '100 jours de suite',            '{"type":"streak","days":100}', false),
  ('matin_tot',  'Vitsika maraina','S''entraîner avant 7h du matin','{"type":"heure","before":7}',  true),
  ('nuit_tard',  'Kintana',       'S''entraîner après 22h',        '{"type":"heure","after":22}',  true);

-- Badges de maîtrise par matière
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('maths_60',            'Ingona matematika', 'Mathématiques > 60%',              '{"type":"progression","matiere":"maths","pct":60}',    false),
  ('maths_90',            'Manampahaizana',    'Mathématiques > 90%',              '{"type":"progression","matiere":"maths","pct":90}',    false),
  ('francais_60',         'Mpanoratra',        'Français > 60%',                   '{"type":"progression","matiere":"francais","pct":60}', false),
  ('toutes_matieres_50',  'Mpikaroka',         'Toutes les matières > 50%',        '{"type":"toutes_matieres","pct":50}',                  false),
  ('cours_complet',       'Mpianatr''omby',    'Finir un cours complet',           '{"type":"cours_complete","count":1}',                  false),
  ('tous_cours_matiere',  'Mahasolo tena',     'Finir tous les cours d''une matière','{"type":"tous_cours_matiere"}',                      false);

-- Badges de performance
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('survie_parfait',  'Mpiahy',          'Mode survie sans erreur',                 '{"type":"survie_parfait"}',                    false),
  ('chrono_serie',    'Mpifaninana',     '5 bonnes réponses chrono d''affilée',     '{"type":"chrono_serie","count":5}',            false),
  ('examen_10',       'Mivoaka tsara',   'Examen blanc > 10/20',                    '{"type":"examen_blanc","note":10}',            false),
  ('examen_15',       'Manam-boninahitra','Examen blanc > 15/20',                   '{"type":"examen_blanc","note":15}',            false),
  ('perfect_qcm',     'Tsy misy diso',   '10 QCM parfaits d''affilée',             '{"type":"qcm_parfait","count":10}',            true),
  ('cent_exercices',  'Ranomasina',      '100 exercices complétés',                 '{"type":"exercice_complete","count":100}',     false);

-- Badges sociaux
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('premier_defi',    'Mpanao sahy',    'Lancer un premier défi',                  '{"type":"defi_lance","count":1}',             false),
  ('defi_gagne',      'Mpandresy',      'Gagner un défi',                          '{"type":"defi_gagne","count":1}',             false),
  ('aide_communaute', 'Mpampianatra',   'Aider 5 élèves dans la communauté',       '{"type":"aide_communaute","count":5}',        false),
  ('partage',         'Mpiara-belona',  'Partager un résultat sur WhatsApp',       '{"type":"partage"}',                          false);

-- Badges spéciaux
INSERT INTO badges_catalogue (code, nom, description, condition_json, est_secret) VALUES
  ('pret_bepc', 'Mivoaka amin''ny BEPC', 'Jauge BEPC > 80%',                       '{"type":"jauge_bepc","pct":80}',              false),
  ('champion',  'Champion BEPC',         'Atteindre le niveau 7',                  '{"type":"niveau","value":7}',                 false),
  ('come_back', 'Tsy mety reraka',       'Revenir après 14 jours d''absence',      '{"type":"absence","days":14}',                true),
  ('noel',      'Noely',                 'Réviser le 25 décembre',                 '{"type":"date","month":12,"day":25}',         true);
