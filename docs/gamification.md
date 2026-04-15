# Gamification — Badges, Modes, Classement & Scénarios émotionnels

## Badges catalogue

### Badges de démarrage
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `premier_pas` | Voninkazo (Première fleur) | Terminer le premier cours | Non |
| `premier_exercice` | Karatasy voalohany | Faire le premier exercice | Non |
| `diagnostic` | Mpitsabo | Compléter le diagnostic initial | Non |

### Badges de régularité
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `streak_7` | Hafanam-po | 7 jours de suite | Non |
| `streak_30` | Maharitra | 30 jours de suite | Non |
| `streak_100` | Tsy mety kivy | 100 jours de suite | Non |
| `matin_tot` | Vitsika maraina | S'entraîner avant 7h du matin | Oui |
| `nuit_tard` | Kintana | S'entraîner après 22h | Oui |

### Badges de maîtrise par matière
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `maths_60` | Ingona matematika | Maths > 60% | Non |
| `maths_90` | Manampahaizana | Maths > 90% | Non |
| `francais_60` | Mpanoratra | Français > 60% | Non |
| `toutes_matieres_50` | Mpikaroka | Toutes les matières > 50% | Non |
| `cours_complet` | Mpianatr'omby | Finir un cours complet | Non |
| `tous_cours_matiere` | Mahasolo tena | Finir tous les cours d'une matière | Non |

### Badges de performance
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `survie_parfait` | Mpiahy | Mode survie sans erreur | Non |
| `chrono_serie` | Mpifaninana | 5 bonnes réponses chrono d'affilée | Non |
| `examen_10` | Mivoaka tsara | Examen blanc > 10/20 | Non |
| `examen_15` | Manam-boninahitra | Examen blanc > 15/20 | Non |
| `perfect_qcm` | Tsy misy diso | 10 QCM parfaits d'affilée | Oui |
| `cent_exercices` | Ranomasina | 100 exercices complétés | Non |

### Badges sociaux
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `premier_defi` | Mpanao sahy | Lancer un premier défi | Non |
| `defi_gagne` | Mpandresy | Gagner un défi | Non |
| `aide_communaute` | Mpampianatra | Aider 5 élèves dans la communauté | Non |
| `partage` | Mpiara-belona | Partager un résultat sur WhatsApp | Non |

### Badges spéciaux
| Code | Nom | Condition | Secret |
|---|---|---|---|
| `pret_bepc` | Mivoaka amin'ny BEPC | Jauge BEPC > 80% | Non |
| `champion` | Champion BEPC | Atteindre le niveau 7 | Non |
| `come_back` | Tsy mety reraka | Revenir après 14 jours d'absence | Oui |
| `noel` | Noely | Réviser le 25 décembre | Oui |

---

## Modes de jeu — détail UX

### Mode Standard
- Barre de progression en haut : "Exercice 3 / 8"
- Affichage de la correction immédiatement après soumission
- Boutons : "Exercice suivant" / "Revoir le cours" / "Exercice similaire"
- En bas : score courant + XP accumulé dans la session

### Mode Chrono
- Minuterie centrale, grande, visible (60s → 0)
- Fond qui change de couleur progressivement : vert → ambre → rouge (dernières 10s)
- Si 0 → réponse automatiquement soumise comme "pas de réponse"
- Pas de correction détaillée entre les exercices — juste "Correct" ou "Raté" + bonne réponse
- Récapitulatif complet à la fin

### Mode Survie
- 3 cœurs affichés en haut (style jeu vidéo)
- Animation de cœur perdu quand erreur
- Vibration légère (si autorisée) à la perte de vie
- Game over → écran spécial avec score, message bienveillant, et "Réessayer"
- Victoire → animation confettis + badge si session parfaite

### Mode Rattrapage éclair
- Label "Tes points faibles" en sous-titre
- L'élève voit quelle compétence est ciblée par chaque exercice
- Chrono global : 15 min (pas par exercice)
- À la fin : "Tu as progressé sur ces 3 points. Continue demain !"

---

## Classement — règles d'affichage

- Vue locale par défaut (même ville) — plus motivant
- Toggle pour voir le national
- Rafraîchissement toutes les heures (pas temps-réel, évite la pression)
- Affichage : rang | prénom | ville | XP semaine | niveau
- L'élève voit toujours : ses 3 voisins au-dessus, ses 3 en dessous, et son propre rang
- Si < 5 élèves dans la ville → basculer automatiquement sur la vue régionale

---

## Scénarios émotionnels — réponses de l'app

### Premier accès (onboarding)
Question émotionnelle avec options :
- "Difficultés scolaires"
- "Problèmes familiaux ou financiers"
- "Perte de motivation"
- "Autre raison"

Réponse de l'app quelle que soit la réponse :
> "Merci de nous faire confiance. Tu as eu le courage de revenir — c'est déjà un grand pas. On est là pour t'aider à aller jusqu'au bout."

### Retour après longue absence (> 14 jours)
> "[Prénom] ! Tu es de retour, et c'est fantastique. L'absence, ça arrive — ce qui compte, c'est de revenir. On reprend ensemble ?"
+ Badge secret `come_back` déclenché
+ Session de révision ultra-courte proposée (5 min) pour réamorcer l'habitude

### Montée de niveau
Animation plein écran (2 secondes) + son (si autorisé) :
> "Tu viens de passer [Nouveau niveau] ! Tu avances vraiment vite, [prénom]."

### Examen blanc — score très bas (< 5/20 global)
Ne jamais afficher le mauvais score en rouge sans contexte. Toujours dans cet ordre :
1. Message humain d'abord (voir `docs/design.md`)
2. Analyse des points forts (il y en a toujours)
3. Plan de rebond concret sur 7 jours
4. Score détaillé par matière (pas le global en premier)

### Jauge BEPC à 100%
Écran spécial, une seule fois :
> "Tu es prêt(e), [prénom]. Ce n'est pas l'app qui le dit — c'est ton travail de ces dernières semaines. Va au BEPC avec confiance."
+ Badge `pret_bepc` + notification aux parents si lien configuré

### Veille du BEPC (J-1)
Mode "Veille du BEPC" activé automatiquement :
- Pas de nouveaux exercices difficiles
- Seulement révisions légères et flashcards
- Message du matin : "Demain c'est le grand jour. Ce soir : révise légèrement, dors bien, mange bien. Tu as fait le travail."
