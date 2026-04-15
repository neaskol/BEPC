# Design — Système d'agents spécialisés BEPC Mada

**Date :** 2026-04-15  
**Statut :** Approuvé

---

## Contexte

Pour accélérer le développement de BEPC Mada, nous mettons en place un système d'agents Claude Code spécialisés. Chaque phase du plan (P0–P11) sera exécutée par des agents aux rôles précis plutôt que par un unique assistant généraliste.

---

## Architecture

**Approche retenue : Hybride (Skills + Agent tool)**

- Les skills `.md` définissent le profil permanent de chaque spécialiste
- Le `Agent` tool les invoque avec le contexte de la phase courante
- Le chef d'orchestre lit le plan, identifie les tâches parallélisables, dispatche
- Pipeline principal : Codeurs (parallèle) → Testeur → Reviewer → Git

```
bepc:orchestrate  (chef de projet)
       │
       ├─── [en parallèle] ──────────────────┐
       │                                      │
  bepc:coder-backend              bepc:coder-frontend
  (SQL, API routes, lib/)         (composants, pages, UI)
       │                                      │
       └──────────── [merge] ─────────────────┘
                         │
                   bepc:tester
              (Vitest + Playwright + SQL)
                         │
                   bepc:reviewer
              (vérifie contre plan + CLAUDE.md)
                         │
               ┌─────────┴──────────┐
         bepc:supabase          bepc:ai-expert
      (RLS, migrations)     (prompts Anthropic, JSON)
      [appelé à la demande]  [appelé à la demande]
                         │
                bepc:git-milestone
            (commit + push + tag git)
```

---

## Skills à créer

### 1. `bepc:orchestrate` — Chef de projet
- Lit la phase courante dans le plan
- Identifie les tâches parallélisables vs séquentielles
- Dispatche les agents appropriés via `Agent` tool
- Agrège les résultats et produit un rapport final
- **N'écrit pas de code lui-même**

### 2. `bepc:coder-backend` — Codeur Backend
- Migrations SQL, API routes Next.js (App Router), Server Actions, helpers `lib/`
- Respecte : offline-first, persistance de toute sortie IA, schémas Zod
- Consulte `docs/database.md`, `docs/ia.md`, `docs/regles-metier.md`
- Appelle `bepc:supabase` si besoin de RLS ou migrations complexes

### 3. `bepc:coder-frontend` — Codeur Frontend
- Composants React, pages App Router, UI mobile-first 375px
- Respecte : palette BEPC, min-h-touch 44px, BottomNav, ton bienveillant
- Consulte `docs/design.md`, `docs/pages.md`
- Jamais de "Mauvaise réponse", "Incorrect" ou "Erreur" dans le JSX

### 4. `bepc:tester` — Testeur
- Vitest pour les helpers `lib/`, Playwright pour les flows E2E et offline
- Assertions SQL via `supabase db reset` + requêtes directes
- Exécute exactement les vérifications listées dans le plan
- Rapport : ✅ passé / ❌ échoué / ⚠️ à vérifier manuellement

### 5. `bepc:reviewer` — Reviewer
- Vérifie chaque fichier créé contre le plan ET les 5 règles de CLAUDE.md
- Checklist : ton bienveillant ✓, exemples malgaches ✓, offline-first ✓, mobile-first ✓, légèreté ✓
- Signale les violations bloquantes (empêche le commit) vs warnings
- Ne modifie pas le code — remonte les problèmes à l'orchestrateur

### 6. `bepc:supabase` — Expert Supabase
- RLS policies complètes (élève/parent/admin/anon), migrations propres
- `supabase gen types typescript` après chaque migration
- Seeds cohérents avec `docs/database.md` et `docs/gamification.md`
- Vérifie : indexes, triggers `updated_at`, enums Postgres

### 7. `bepc:ai-expert` — Expert IA Anthropic
- Prompts Claude structurés (system + user), sortie JSON stricte
- Validation Zod + helper `persistAiJson()` (règle : toujours persister)
- Retry ×2, timeout 30s, fallback statique si IA indisponible
- Modèle verrouillé : `claude-sonnet-4-20250514`

### 8. `bepc:git-milestone` — Git Milestone
- Déclenché uniquement si le reviewer approuve (0 violation bloquante)
- `git add` des fichiers de la phase uniquement (pas de `git add -A`)
- Commit conventionnel : `feat(phase-N): description courte`
- Tag : `phase-N-done`
- `git push origin main` — jamais `--force`
- En cas d'échec : alerte et arrêt complet

---

## Emplacement des skills

```
~/.claude/skills/
  bepc-orchestrate/SKILL.md
  bepc-coder-backend/SKILL.md
  bepc-coder-frontend/SKILL.md
  bepc-tester/SKILL.md
  bepc-reviewer/SKILL.md
  bepc-supabase/SKILL.md
  bepc-ai-expert/SKILL.md
  bepc-git-milestone/SKILL.md
```

---

## Règles communes à tous les agents

1. **Ton bienveillant partout** — jamais "Mauvaise réponse", "Incorrect", "Erreur", "0 point"
2. **Exemples malgaches** — riz, zébu, Ariary, villes de Madagascar dans les exercices
3. **Offline-first** — tout contenu IA persisté en DB, jamais affiché sans sauvegarde
4. **Mobile-first** — chaque composant conçu pour 375px, boutons min 44px
5. **Légèreté** — pas de vidéos, images compressées, compatible 2G

---

## Déclenchement du pipeline

```
Phase N prête → bepc:orchestrate
  → analyse le plan → identifie parallelisme
  → lance [bepc:coder-backend + bepc:coder-frontend] en parallèle
  → [si DB complexe] → appelle bepc:supabase
  → [si IA/prompts] → appelle bepc:ai-expert
  → bepc:tester exécute les vérifications du plan
  → bepc:reviewer valide contre CLAUDE.md
  → [si approuvé] → bepc:git-milestone commit + push + tag
  → rapport final → utilisateur
```
