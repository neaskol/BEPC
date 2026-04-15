# Règles métier — XP, Niveaux, Streaks, Progression

## Système XP

### Gains d'XP par action
| Action | XP gagné |
|---|---|
| Exercice correct (QCM/calcul) | 10 |
| Exercice partiellement correct | 5 |
| Section de cours terminée | 15 |
| Quiz section réussi | 20 |
| Cours complet terminé | 50 |
| Flashcard "Je savais" | 5 |
| Session d'entraînement complète | 30 |
| Mode Chrono — bonne réponse | 15 (+5 bonus vitesse si < 30s) |
| Mode Survie — session complète | 75 |
| Examen blanc complet | 100 |
| Aider un élève dans la communauté | 25 |
| Connexion quotidienne | 5 |
| Maintenir sa streak | streak_actuel × 2 (max 50) |
| Défi ami — gagné | 40 |
| Défi ami — participé | 15 |
| Premier exercice du jour | 10 (bonus matinal) |

### Malus XP
Pas de malus. On ne retire jamais d'XP. Une mauvaise réponse = 0 XP, pas négatif.

## Niveaux

| Niveau | Nom | XP requis |
|---|---|---|
| 1 | Lycéen | 0 |
| 2 | Étudiant | 200 |
| 3 | Apprenti | 500 |
| 4 | Chercheur | 1 000 |
| 5 | Expert | 2 000 |
| 6 | Lauréat | 4 000 |
| 7 | Champion BEPC | 7 000 |

Montée de niveau → notification + animation + badge de niveau.

## Streaks

- Une streak = au moins UNE action significative par jour (exercice, cours, flashcards)
- Se calcule sur les jours calendaires (minuit à minuit, heure de Madagascar UTC+3)
- Brisée si aucune action le jour J
- Le streak actuel et le streak max sont tous les deux sauvegardés
- Streak brisée → message bienveillant (voir `docs/design.md`) + XP de départ doublé pendant 24h pour encourager le retour

## Jauge de préparation BEPC (0-100%)

Calcul : moyenne pondérée des `niveau_pct` de chaque matière selon les coefficients officiels du BEPC malgache.

### Coefficients BEPC Madagascar
| Matière | Coefficient |
|---|---|
| Mathématiques | 4 |
| Français | 4 |
| Histoire-Géographie | 3 |
| SVT | 3 |
| Physique-Chimie | 3 |
| Anglais | 2 |

**Formule :**
```
jauge = (maths×4 + francais×4 + hist_geo×3 + svt×3 + physique×3 + anglais×2) / 19
```

### Mise à jour de `niveau_pct` par matière
Après chaque session :
```
niveau_pct = (nb_corrects / nb_exercices_total) × 100
```
Avec lissage : le nouveau score est pondéré à 30% (une mauvaise session ne fait pas tout s'effondrer) :
```
nouveau_pct = ancien_pct × 0.7 + score_session × 0.3
```

## Recommandation quotidienne

Priorité de recommandation (dans l'ordre) :
1. Matière avec `niveau_pct` le plus bas non révisée depuis > 3 jours
2. Matière avec le plus de mauvaises réponses récentes (7 derniers jours)
3. Chapitre avec flashcards à revoir aujourd'hui (répétition espacée)
4. Si tout va bien → suggérer un nouveau cours non commencé

## Algorithme de répétition espacée (Flashcards)

Basé sur Leitner simplifié — 5 niveaux :

| Niveau | Intervalle avant prochaine révision |
|---|---|
| 0 (nouveau) | Aujourd'hui |
| 1 | Demain |
| 2 | Dans 3 jours |
| 3 | Dans 7 jours |
| 4 | Dans 14 jours |
| 5 (maîtrisé) | Dans 30 jours |

- "Je savais" → niveau + 1
- "Je ne savais pas" → retour au niveau 0

`prochaine_revue` est mis à jour immédiatement après chaque réponse.

## Modes d'entraînement — règles

### Mode Standard
- Exercices dans l'ordre, pas de limite de temps
- Correction IA immédiate après chaque réponse
- Hors-ligne possible si exercices pré-chargés

### Mode Chrono
- 1 exercice à la fois, 60 secondes
- Timer visible, compte à rebours
- Pas de réponse en 60s = compté comme faux
- Bonus vitesse : réponse correcte en < 30s = +5 XP

### Mode Survie
- 5 exercices consécutifs
- 3 vies (coeurs) au départ
- Réponse fausse = 1 vie perdue
- 0 vies = session terminée, score affiché
- Session complète sans erreur = badge "Survivant"

### Mode Rattrapage éclair
- Durée cible : 15 minutes
- L'algorithme choisit 5 exercices sur les erreurs récurrentes
- Toujours des exercices sur les 3 matières les plus faibles
- Pas de nouveau contenu — que de la révision ciblée

### Examen blanc
- Toutes les matières, durée réelle (variable selon le BEPC officiel)
- Pas d'aide IA pendant la session
- Rapport complet généré après (voir `docs/ia.md`)
- Disponible une fois par semaine maximum

## Classement

- **Local** : élèves de la même ville (champ `ville` du profil)
- **National** : tous les élèves
- Classé par XP total (hebdomadaire pour le local, cumulatif pour le national)
- Rafraîchissement : toutes les heures
- L'élève voit toujours : son rang, les 3 au-dessus, les 3 en-dessous
