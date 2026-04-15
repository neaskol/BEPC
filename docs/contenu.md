# Contenu — Structure des Cours, Exercices & Flashcards

## Structure d'un cours (contenu_json)

```json
{
  "objectifs": ["Savoir calculer l'aire d'un triangle", "Appliquer la formule dans un problème concret"],
  "sections": [
    {
      "titre": "La formule de base",
      "contenu": "Texte explicatif en français simple...",
      "exemples": [
        {
          "enonce": "Un terrain triangulaire à Antsirabe mesure 8m de base et 5m de hauteur. Quelle est son aire ?",
          "solution": "A = (8 × 5) / 2 = 20 m²"
        }
      ],
      "quiz_section": {
        "question": "Quelle est l'aire d'un triangle de base 6 cm et hauteur 4 cm ?",
        "type": "qcm",
        "choix": ["10 cm²", "12 cm²", "24 cm²", "8 cm²"],
        "bonne_reponse": 1,
        "explication": "A = (6 × 4) / 2 = 12 cm²"
      }
    }
  ],
  "resume": "Points clés à retenir en 3 phrases maximum.",
  "quiz_final": [
    {
      "question": "...",
      "type": "qcm",
      "choix": ["...", "...", "...", "..."],
      "bonne_reponse": 0,
      "explication": "..."
    }
  ],
  "mots_cles": [
    {"terme": "Aire", "definition": "Surface occupée par une figure géométrique", "exemple": "L'aire d'un terrain de foot..."}
  ]
}
```

## Structure d'un exercice selon son type

### QCM
```json
{
  "enonce": "Un commerçant de Toamasina vend 50 kg de vanille à 45 000 Ar le kg. Quel est son chiffre d'affaires ?",
  "type": "qcm",
  "choix_json": [
    {"label": "2 000 000 Ar", "correct": false},
    {"label": "2 250 000 Ar", "correct": true},
    {"label": "2 500 000 Ar", "correct": false},
    {"label": "900 000 Ar", "correct": false}
  ],
  "corrige": "CA = 50 × 45 000 = 2 250 000 Ar",
  "points": 2
}
```

### Calcul (réponse numérique)
```json
{
  "enonce": "Calculer l'aire d'un rectangle de longueur 12 cm et largeur 7 cm.",
  "type": "calcul",
  "corrige": "A = 12 × 7 = 84 cm²",
  "tolerance": 0,
  "unite": "cm²",
  "points": 3
}
```

### Rédaction (correction IA obligatoire en ligne)
```json
{
  "enonce": "Décrivez en 5 lignes les conséquences de la déforestation à Madagascar.",
  "type": "redaction",
  "corrige": "Points attendus : érosion des sols, perte de biodiversité, impact sur le climat local, désertification, perte de ressources pour les populations rurales.",
  "criteres": ["Pertinence des arguments", "Richesse des exemples", "Qualité de la rédaction"],
  "points": 5
}
```

### Vrai/Faux
```json
{
  "enonce": "La photosynthèse produit du dioxyde de carbone.",
  "type": "vrai_faux",
  "corrige": "FAUX — La photosynthèse consomme du CO₂ et produit de l'O₂.",
  "points": 1
}
```

## Chapitres prioritaires par matière

### Mathématiques
1. Calculs et fractions
2. Algèbre (équations du 1er degré)
3. Géométrie plane (aires, périmètres)
4. Proportionnalité et pourcentages
5. Statistiques (moyenne, fréquence)
6. Géométrie dans l'espace

### Français
1. Grammaire (nature et fonction des mots)
2. Conjugaison (temps principaux)
3. Orthographe lexicale et grammaticale
4. Compréhension de texte
5. Expression écrite (lettre, récit, description)

### SVT
1. La cellule et les êtres vivants
2. Nutrition et digestion
3. Reproduction
4. Écosystèmes et environnement malgache
5. Géologie (roches, séismes)

### Histoire-Géographie
1. Histoire de Madagascar (colonisation, indépendance)
2. L'Afrique contemporaine
3. Géographie physique de Madagascar
4. Population et économie malgache
5. Mondialisation

### Physique-Chimie
1. États de la matière
2. Électricité (circuits simples)
3. Optique (lumière, miroirs)
4. Chimie (atomes, molécules, réactions simples)

### Anglais
1. Grammaire de base (temps, auxiliaires)
2. Vocabulaire thématique
3. Compréhension écrite
4. Expression écrite simple

## Flashcards — règles de création

- Recto : formule, terme, question courte (max 15 mots)
- Verso : réponse claire et complète (max 40 mots)
- Exemple obligatoire avec contexte malgache
- Une seule notion par carte
- Environ 20 flashcards par chapitre

**Exemple :**
```
Recto : "Formule du volume d'un cube"
Verso : "V = côté³ (côté × côté × côté)"
Exemple : "Un jerrycan cubique de 30 cm de côté a un volume de 27 000 cm³ = 27 litres"
```
