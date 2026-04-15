# Design — Identité visuelle & UX

## Identité visuelle

**Palette principale**
- Vert BEPC `#639922` — couleur dominante, succès, progression (évoque l'espoir, la nature malgache)
- Ambre `#BA7517` — recommandations, alertes douces, points d'attention
- Rouge doux `#D85A30` — erreurs (jamais agressif, toujours accompagné d'un message positif)
- Gris neutre `#5F5E5A` — textes secondaires, éléments inactifs

**Principe** : jamais de rouge seul. Une erreur = rouge + message bienveillant + suggestion.

**Typographie**
- Titres : 500 weight, jamais plus de 22px sur mobile
- Corps : 14-16px, line-height 1.6 minimum (les élèves lisent lentement)
- Toujours en minuscules avec majuscule initiale — jamais TOUT EN MAJUSCULES

**Icônes**
Utiliser Lucide React. Taille standard : 20px. Pas d'émojis dans le code, uniquement dans les contenus textuels générés.

## Principes UX

**Mobile first absolu**
- Tout est conçu pour 375px de large
- Boutons : hauteur minimum 44px (doigts de toutes tailles)
- Pas de hover-only interactions
- Navigation principale en bas de l'écran (thumb zone)

**Légèreté cognitive**
- Une seule action principale par écran
- Pas plus de 3 choix simultanés
- Progression toujours visible (barre, étape X/Y, pourcentage)

**Feedback immédiat**
- Toute action donne un retour visuel en moins de 200ms
- Les chargements IA affichent une animation et un message ("L'IA prépare ton exercice...")
- Jamais d'écran blanc sans explication

## Ton des messages

### Corrections et feedback
```
❌ JAMAIS : "Mauvaise réponse", "Incorrect", "Erreur", "0 point"
✅ TOUJOURS : "Pas tout à fait — mais tu avais la bonne idée ici..."
✅ TOUJOURS : "Presque ! Regarde ce détail que tu as manqué..."
✅ TOUJOURS : "Ce n'est pas ça, mais voici comment y arriver..."
```

### Encouragements après un bon score
```
✅ "Excellent travail !", "Tu maîtrises ça !", "Le BEPC n'a qu'à bien se tenir !"
```

### Quand l'élève n'a pas révisé depuis plusieurs jours
```
✅ "Hei [prénom] ! Ça fait 3 jours — on t'attend. Juste 10 minutes ?"
❌ JAMAIS de culpabilisation ou de ton accusateur
```

### Quand l'élève rate un examen blanc avec une très mauvaise note
C'est le moment le plus critique. Message spécial obligatoire :
```
"[Prénom], ce score ne te définit pas. Tu as eu le courage de faire cet examen — c'est déjà une victoire. 
On a analysé tes réponses et on a un plan pour toi. Ensemble, on va progresser. Tu es capable."
Suivi immédiatement d'un plan de révision concret sur 7 jours.
```

### Quand une streak est brisée
```
✅ "Ta série s'est arrêtée à [N] jours — c'est déjà fantastique ! On repart ensemble aujourd'hui ?"
❌ JAMAIS de message culpabilisant
```

## États émotionnels à gérer

| Situation | Déclencheur | Réponse de l'app |
|---|---|---|
| Premier accès | Inscription | Onboarding chaleureux, question "Qu'est-ce qui t'a fait décrocher ?" |
| Grande victoire | Badge rare, niveau monté | Animation + message personnalisé |
| Progression lente | Moins de 20% en 2 semaines | Message d'encouragement + plan simplifié |
| Abandon | Inactif 7 jours | Notification douce + recommandation ultra-courte (5 min) |
| Échec sévère | Examen blanc < 5/20 | Message spécial + plan de rebond immédiat |
| Veille du BEPC | J-1 | Mode "Jour J" : révisions légères + message de confiance |

## Composants récurrents

**Jauge de préparation BEPC**
Visuelle et narrative — pas juste un pourcentage :
- 0-25% : crayon posé sur un bureau vide
- 25-50% : main qui commence à écrire
- 50-75% : élève concentré sur sa copie
- 75-100% : élève souriant avec son diplôme
Toujours accompagnée du nombre de jours restants avant le BEPC.

**Streak flame**
- 1-6 jours : flamme simple orange
- 7-29 jours : flamme dorée avec animation subtile
- 30+ jours : flamme légendaire rouge-or

**Badges**
Toujours avec un nom en malgache ou inspiré de Madagascar, une illustration simple, et une description de comment il a été obtenu.
