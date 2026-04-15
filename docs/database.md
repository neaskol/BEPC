# Base de données — Schéma & Règles

## Principes
- Supabase (PostgreSQL)
- Row Level Security (RLS) activé sur toutes les tables
- Timestamps `created_at` et `updated_at` sur toutes les tables
- UUIDs comme clés primaires (gen_random_uuid())
- Tout contenu généré par l'IA est persisté — jamais affiché et perdu

## Schéma complet

### users (géré par Supabase Auth + extension)
```sql
profiles (
  id          uuid PRIMARY KEY references auth.users,
  prenom      text NOT NULL,
  ville       text,
  role        text DEFAULT 'eleve' CHECK (role IN ('eleve', 'parent', 'admin')),
  bepc_date   date,               -- date prévue du BEPC
  raison_decrochage text,         -- réponse onboarding émotionnel
  xp_total    integer DEFAULT 0,
  niveau      integer DEFAULT 1,  -- voir docs/regles-metier.md
  streak_actuel integer DEFAULT 0,
  streak_max  integer DEFAULT 0,
  derniere_activite date,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
)
```

### relations_parent_enfant
```sql
(
  parent_id   uuid references profiles,
  enfant_id   uuid references profiles,
  PRIMARY KEY (parent_id, enfant_id)
)
```

### matieres
```sql
(
  id          uuid PRIMARY KEY,
  code        text UNIQUE,  -- 'maths', 'francais', 'svt', 'histoire_geo', 'physique', 'anglais'
  nom         text,
  couleur     text,         -- hex color pour l'UI
  ordre       integer       -- ordre d'affichage
)
```

### chapitres
```sql
(
  id          uuid PRIMARY KEY,
  matiere_id  uuid references matieres,
  titre       text NOT NULL,
  ordre       integer,
  niveau      text CHECK (niveau IN ('facile', 'moyen', 'difficile'))
)
```

### cours
```sql
(
  id          uuid PRIMARY KEY,
  chapitre_id uuid references chapitres,
  titre       text NOT NULL,
  contenu_json jsonb NOT NULL,   -- structure voir docs/contenu.md
  genere_par_ia boolean DEFAULT true,
  valide      boolean DEFAULT false,  -- admin doit valider avant publication
  created_at  timestamptz DEFAULT now()
)
```

### sujets
```sql
(
  id          uuid PRIMARY KEY,
  matiere_id  uuid references matieres,
  annee       integer,
  titre       text,
  type        text CHECK (type IN ('officiel', 'genere')),
  pdf_url     text,              -- Supabase Storage (officiels seulement)
  contenu_json jsonb,            -- exercices structurés
  created_at  timestamptz DEFAULT now()
)
```

### exercices
```sql
(
  id          uuid PRIMARY KEY,
  sujet_id    uuid references sujets,
  chapitre_id uuid references chapitres,  -- null si pas lié à un cours
  enonce      text NOT NULL,
  type        text CHECK (type IN ('qcm', 'calcul', 'redaction', 'vrai_faux')),
  choix_json  jsonb,             -- pour QCM : [{label, valeur, correct}]
  corrige     text NOT NULL,     -- corrigé type en texte
  points      numeric,
  ordre       integer
)
```

### flashcards
```sql
(
  id          uuid PRIMARY KEY,
  matiere_id  uuid references matieres,
  chapitre_id uuid references chapitres,
  recto       text NOT NULL,     -- question / formule
  verso       text NOT NULL,     -- réponse / définition
  exemple     text               -- exemple concret malgache
)
```

### sessions_eleve
```sql
(
  id          uuid PRIMARY KEY,
  user_id     uuid references profiles,
  matiere_id  uuid references matieres,
  mode        text CHECK (mode IN ('standard', 'chrono', 'survie', 'rattrapage', 'examen_blanc')),
  score       numeric,
  xp_gagne    integer,
  duree_sec   integer,
  completed   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)
```

### reponses_eleve
```sql
(
  id              uuid PRIMARY KEY,
  session_id      uuid references sessions_eleve,
  exercice_id     uuid references exercices,
  contenu         text NOT NULL,
  est_correcte    boolean,
  score_obtenu    numeric,
  feedback_ia     text,           -- feedback IA persisté
  temps_reponse_sec integer,
  created_at      timestamptz DEFAULT now()
)
```

### progression_matiere
```sql
(
  user_id     uuid references profiles,
  matiere_id  uuid references matieres,
  niveau_pct  numeric DEFAULT 0 CHECK (niveau_pct BETWEEN 0 AND 100),
  nb_sessions integer DEFAULT 0,
  nb_exercices integer DEFAULT 0,
  nb_corrects  integer DEFAULT 0,
  PRIMARY KEY (user_id, matiere_id),
  updated_at  timestamptz DEFAULT now()
)
```

### flashcards_eleve (répétition espacée)
```sql
(
  user_id       uuid references profiles,
  flashcard_id  uuid references flashcards,
  niveau_maitrise integer DEFAULT 0,  -- 0=nouveau, 1-5=niveaux Leitner
  prochaine_revue date DEFAULT CURRENT_DATE,
  nb_reussites  integer DEFAULT 0,
  nb_echecs     integer DEFAULT 0,
  PRIMARY KEY (user_id, flashcard_id)
)
```

### badges_catalogue
```sql
(
  id          uuid PRIMARY KEY,
  code        text UNIQUE,
  nom         text,              -- nom en malgache
  description text,
  condition_json jsonb,          -- règle de déclenchement
  est_secret  boolean DEFAULT false
)
```

### badges_eleve
```sql
(
  user_id     uuid references profiles,
  badge_id    uuid references badges_catalogue,
  obtenu_le   timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
)
```

## Règles RLS importantes

- Un élève ne voit que ses propres données (sessions, réponses, progression)
- Un parent ne voit que les données de ses enfants liés
- Les cours et exercices validés sont lisibles par tous les élèves
- Seul l'admin peut écrire dans `cours`, `sujets`, `exercices`, `flashcards`, `badges_catalogue`
- Les données non validées (`valide = false`) ne sont pas visibles des élèves

## Index à créer
```sql
CREATE INDEX ON reponses_eleve (session_id);
CREATE INDEX ON reponses_eleve (user_id, exercice_id);
CREATE INDEX ON sessions_eleve (user_id, created_at DESC);
CREATE INDEX ON progression_matiere (user_id);
CREATE INDEX ON flashcards_eleve (user_id, prochaine_revue);
```
