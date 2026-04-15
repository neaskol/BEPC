# Hors-ligne — Stratégie Cache & Synchronisation

## Principe fondamental
L'app fonctionne sur 2G à Madagascar. Le hors-ligne n'est pas une feature bonus — c'est une contrainte de base. On distingue deux niveaux : **toujours disponible** et **disponible si pré-chargé**.

---

## Ce qui est toujours disponible (cache statique)

Mis en cache au premier lancement, mis à jour silencieusement en arrière-plan :
- Shell de l'app (HTML, CSS, JS)
- Navigation, dashboard (structure vide)
- Icônes, assets UI

---

## Ce qui est disponible si pré-chargé

Téléchargé automatiquement quand l'élève est connecté en Wi-Fi ou 3G :

### Contenu pré-chargé automatiquement
- Les **3 matières les plus faibles** de l'élève : cours + exercices complets
- Les **30 exercices** les plus récents consultés
- Les **flashcards du jour** (celles dont `prochaine_revue <= aujourd'hui`)
- Le **dernier examen blanc** et son rapport
- Les **badges et profil** complets

### Déclenchement du pré-chargement
- À chaque connexion au dashboard si réseau disponible
- En arrière-plan via Service Worker (tâche différée, basse priorité)
- Taille maximale du cache : **50 Mo** (largement suffisant)
- Ne jamais bloquer l'UI pour télécharger — silencieux et progressif

---

## Ce qui n'est jamais disponible hors-ligne

- Génération de nouveaux sujets par l'IA
- Correction de rédaction par l'IA
- Rapport d'examen blanc
- Classement (données temps-réel)
- Défis entre amis
- Communauté
- Glossaire interactif

---

## Comportement dégradé par fonctionnalité

| Fonctionnalité | Comportement hors-ligne |
|---|---|
| Dashboard | Affiche les données en cache. Bannière discrète "Mode hors-ligne". |
| Cours | Cours pré-chargés lisibles normalement. Cours non-chargés → message "Connectez-vous pour charger ce cours". |
| Exercices QCM/calcul | Exercices pré-chargés jouables. Correction avec corrigé type (pas IA). XP calculé localement. |
| Exercices rédaction | Afficher l'énoncé, permettre la rédaction, mais : "La correction IA sera disponible dès que tu seras connecté." |
| Flashcards | Flashcards pré-chargées fonctionnelles à 100%. Algorithme de répétition tourne localement. |
| Mode Chrono/Survie | Fonctionnel avec exercices pré-chargés. |
| Examen blanc | Non disponible hors-ligne. Message : "L'examen blanc nécessite une connexion." |
| Classement/Défis | Non disponible. Message : "Disponible en ligne." |

---

## Synchronisation

### Données sauvegardées localement en attente de sync
Stockées dans IndexedDB côté client :
- Réponses à des exercices (si soumises hors-ligne)
- Progression des flashcards
- XP gagné en hors-ligne
- Temps de session

### Déclenchement de la sync
- Automatique dès que le réseau est détecté (événement `online`)
- Ordre de priorité : réponses d'abord, puis progression, puis XP
- En cas de conflit (même exercice répondu deux fois) : garder la dernière réponse côté serveur

### Indicateur de sync dans l'UI
- Petite icône de sync dans le header quand des données attendent d'être synchronisées
- Toast discret "Synchronisation effectuée" quand ça se passe
- Jamais bloquer l'UI pour synchroniser

---

## Service Worker — règles d'implémentation

Utiliser `next-pwa` avec stratégie **Stale-While-Revalidate** pour :
- Pages et assets statiques
- Données de cours et exercices

Stratégie **Network-First** pour :
- API calls (toujours essayer le réseau d'abord)
- Données de progression (fraîcheur prioritaire)

Stratégie **Cache-Only** pour :
- Assets critiques (app shell)

### Ne JAMAIS mettre en cache
- Appels à l'API Anthropic (contenu dynamique, sensible)
- Endpoints d'authentification
- Données de classement

---

## Bannière hors-ligne

Affichée discrètement en haut de chaque page quand `navigator.onLine === false` :

```
[icône wifi barré]  Mode hors-ligne — Certaines fonctions IA indisponibles
```

- Fond ambre clair `#FAEEDA`, texte `#633806`
- Hauteur 36px, pas intrusif
- Disparaît automatiquement quand la connexion revient (avec animation subtile)
