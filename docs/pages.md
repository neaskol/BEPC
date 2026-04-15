# Pages — Structure & Navigation

## Arborescence des routes

```
/                          Landing page (public)
/auth/inscription          Inscription
/auth/connexion            Connexion
/onboarding                Questionnaire initial + diagnostic (élève nouveau)

/dashboard                 Tableau de bord principal (élève)
/profil                    Profil, XP, badges, historique

/cours                     Grille des matières (bibliothèque)
/cours/[matiere]           Chapitres d'une matière
/cours/[matiere]/[chapitre] Cours interactif

/entrainement              Choix matière + mode
/entrainement/[matiere]    Session d'entraînement active
/flashcards                Sélection matière pour les flashcards
/flashcards/[matiere]      Session de flashcards

/examen-blanc              Lancement de l'examen blanc
/examen-blanc/session      Session d'examen en cours (minuté)
/examen-blanc/rapport/[id] Rapport de résultats IA

/classement                Classement local + national
/defis                     Défis en cours + inviter un ami
/communaute                Questions/réponses entre élèves
/badges                    Collection complète de badges

/parents                   Espace parent (accès séparé)
/parents/enfant/[id]       Progression d'un enfant spécifique

/admin                     Dashboard admin (protégé)
/admin/upload              Import de sujets PDF
/admin/contenu             Gestion des cours et exercices
/admin/utilisateurs        Gestion des élèves
```

## Accès par rôle

| Route | Public | Élève | Parent | Admin |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | — | ✅ | — | — |
| `/cours/**` | — | ✅ | — | ✅ |
| `/entrainement/**` | — | ✅ | — | — |
| `/parents/**` | — | — | ✅ | ✅ |
| `/admin/**` | — | — | — | ✅ |

## Parcours élève — étape par étape

### 1. Première visite
Landing → Inscription (prénom, email ou tel, ville) → Onboarding

### 2. Onboarding (une seule fois)
- Question émotionnelle : "Qu'est-ce qui t'a fait décrocher ?" (choix multiples)
- Diagnostic : 10 questions rapides sur toutes les matières (2 par matière)
- L'IA analyse et génère un plan de révision initial
- Redirection vers le Dashboard avec le plan affiché

### 3. Session quotidienne type
Dashboard → voir recommandation du jour → choisir un mode → faire les exercices → voir la correction → retour dashboard avec XP gagné + progression mise à jour

### 4. Parcours cours
Dashboard → Cours → Choisir matière → Choisir chapitre → Lire section par section → Mini-quiz après chaque section → Quiz final → Badge si réussi → XP

### 5. Examen blanc (hebdomadaire)
Dashboard → Examen blanc → Choisir les matières → Session minutée (conditions réelles) → Rapport IA détaillé → Plan de révision généré pour la semaine suivante

## Navigation principale (mobile — barre du bas)

```
🏠 Accueil  |  📚 Cours  |  ✏️ S'entraîner  |  🏆 Classement  |  👤 Profil
```

## États des pages à gérer

### Page d'entraînement
- **Chargement IA** : "L'IA prépare ton exercice..." (animation)
- **Hors-ligne** : bannière "Mode hors-ligne — exercices pré-chargés uniquement"
- **Fin de session** : récapitulatif score + XP gagnés + boutons suite
- **Erreur réseau** : "Connexion perdue — tes réponses sont sauvegardées"

### Dashboard
- **Nouveau** (0 sessions) : afficher le plan de démarrage, pas de stats vides
- **Streak brisée** : message bienveillant + bouton "Recommencer maintenant"
- **BEPC dans moins de 7 jours** : mode "Semaine J" activé, interface simplifiée
- **Objectif atteint 100%** : animation de célébration + message "Tu es prêt(e)"

### Examen blanc — rapport
- **Score < 5/20 dans une matière** : message spécial (voir `docs/design.md`)
- **Score global > 12/20** : message de félicitations fort
- Toujours terminer par : plan de révision de la semaine suivante
