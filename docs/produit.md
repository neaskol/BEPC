# Produit — Vision & Priorités

## Public cible
Jeunes malgaches de 14 à 18 ans en situation de décrochage scolaire, préparant le BEPC (Brevet d'Études du Premier Cycle). Accès majoritairement via smartphone Android bas de gamme, connexion instable (2G/3G), parfois partagé en famille.

## Problème résolu
Ces élèves ont décroché — souvent par manque de confiance, pas de manque d'intelligence. L'app doit reconstruire cette confiance autant qu'elle enseigne des matières.

## Matières couvertes
Mathématiques · Français · SVT · Histoire-Géographie · Physique-Chimie · Anglais

## Fonctionnalités principales
- Bibliothèque des vrais sujets BEPC officiels (importés en PDF)
- Génération de nouveaux sujets par l'IA dans le style officiel
- Cours interactifs par matière et par chapitre
- Flashcards avec répétition espacée
- 4 modes d'entraînement : Standard, Chrono, Survie, Rattrapage éclair
- Examen blanc complet avec rapport IA
- Gamification complète (XP, badges, streaks, classement local)
- Espace parents pour suivre la progression
- Partage de défis via WhatsApp
- Mode hors-ligne partiel (voir `docs/offline.md`)

## Ce qu'on ne sacrifie jamais
Ces 3 principes priment sur toute décision technique ou de design :

**1. Le ton bienveillant**
L'élève en décrochage a une blessure — il pense qu'il est "nul". Chaque message de l'app doit lui prouver le contraire. Aucune erreur n'est sanctionnée, tout progrès est célébré.

**2. L'ancrage malgache**
Les exemples dans les exercices utilisent le quotidien malgache : prix en Ariary, marchés, zébu, rizières, villes de Madagascar (Antananarivo, Toamasina, Mahajanga, Fianarantsoa...). L'élève doit se reconnaître dans le contenu.

**3. L'accessibilité réseau**
L'app doit rester utile même sans connexion. Tout contenu consulté une fois est mis en cache. Voir `docs/offline.md`.

## Personas

**Mihaja, 16 ans, Antananarivo**
A arrêté l'école en 3ème après avoir raté ses examens. Utilise WhatsApp tous les jours. A un Samsung Galaxy A05. Rêve de reprendre ses études mais a honte de son niveau.

**Nirina, 15 ans, Toamasina**
Encore scolarisée mais en grande difficulté. Ses parents veulent qu'elle ait son BEPC. Elle révise le soir après le travail domestique, souvent sans électricité (téléphone = lampe + outil de révision).

## Priorités de développement
1. Auth + Dashboard + Upload PDF admin
2. Bibliothèque sujets + Mode entraînement standard
3. Génération IA de nouveaux sujets + Correction bienveillante
4. Cours interactifs + Flashcards
5. Gamification complète
6. Espace parents + Partage WhatsApp
7. Examen blanc + Rapport IA
8. Optimisation hors-ligne + Performance 2G
