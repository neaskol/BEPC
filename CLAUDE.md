# BEPC Mada — Guide Claude Code

## Vision
Application web PWA pour aider les jeunes malgaches en décrochage scolaire à préparer et réussir le BEPC. L'IA génère du contenu (cours, exercices, corrections), le tout accessible partiellement hors-ligne.

## Stack technique
- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend** : API Routes Next.js
- **Base de données** : Supabase (PostgreSQL + Auth + Storage)
- **IA** : API Anthropic Claude (claude-sonnet-4-20250514)
- **PWA** : next-pwa pour le cache hors-ligne
- **Déploiement** : Vercel

## Fichiers de référence — lire avant de coder

| Fichier | Lire quand... |
|---|---|
| `docs/produit.md` | Comprendre le public, les priorités, ce qu'on ne sacrifie jamais |
| `docs/design.md` | Créer un composant, une page, un message utilisateur |
| `docs/pages.md` | Naviguer dans la structure de l'app, gérer les routes |
| `docs/database.md` | Toucher à la base de données, créer des migrations |
| `docs/contenu.md` | Structurer cours, exercices, flashcards |
| `docs/regles-metier.md` | Calculer XP, niveaux, streaks, progression, recommandations |
| `docs/ia.md` | Appeler l'API Anthropic, écrire des prompts |
| `docs/offline.md` | Gérer le cache, la synchronisation, le mode dégradé |
| `docs/gamification.md` | Badges, modes de jeu, classement, scénarios émotionnels |

## Règles globales à ne jamais violer

1. **Ton bienveillant partout** — jamais "Mauvaise réponse", toujours encourager. Voir `docs/design.md`.
2. **Exemples malgaches** — les exercices parlent du quotidien malgache (riz, zébu, Ariary, villes de Madagascar).
3. **Hors-ligne d'abord** — tout contenu généré par l'IA est sauvegardé en base, jamais affiché et perdu. Voir `docs/offline.md`.
4. **Mobile first** — chaque composant est conçu pour un écran de 375px en priorité.
5. **Légèreté** — pas de vidéos, images compressées, chargement progressif. L'app doit fonctionner sur 2G.

## Agents spécialisés — pipeline automatique

Pour toute tâche de développement sur ce projet, utiliser le pipeline d'agents suivant :

| Situation | Skill à invoquer |
|---|---|
| Démarrer une phase du plan | `bepc:orchestrate` |
| Coder backend (migrations, API routes, Server Actions) | `bepc:coder-backend` |
| Coder frontend (composants, pages, logique client) | `bepc:coder-frontend` |
| Migrations Supabase, RLS, seeds, types TS | `bepc:supabase` |
| Appels Anthropic, prompts, Zod, persistance IA | `bepc:ai-expert` |
| Après le code : lancer les vérifications | `bepc:tester` |
| Après les tests : valider contre les règles | `bepc:reviewer` |
| Après approbation reviewer : committer et pousser | `bepc:git-milestone` |

**Pipeline complet par phase :**
```
bepc:orchestrate
    ├── [parallèle] bepc:coder-backend + bepc:coder-frontend
    │                + bepc:supabase (si migrations) + bepc:ai-expert (si IA)
    ├── [séquentiel] bepc:tester
    ├── [séquentiel] bepc:reviewer
    └── [si ✅ APPROUVÉ] bepc:git-milestone
```

> Ces skills sont dans `~/.claude/skills/bepc-*.md`. Ils encodent toutes les règles du projet — les invoquer garantit la conformité automatique.

## Commandes utiles
```bash
npm run dev          # Développement local
npm run build        # Build production
npx supabase db push # Appliquer les migrations
```
