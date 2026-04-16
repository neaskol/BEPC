# BEPC Mada — Guide de déploiement

## Prérequis

- **Node.js** : v20 ou supérieur (`node --version`)
- **npm** : v10+ (`npm --version`)
- **Supabase CLI** : `npm install -g supabase` puis `supabase --version`
- **Vercel CLI** (optionnel) : `npm install -g vercel`
- Compte Vercel connecté au dépôt GitHub
- Projet Supabase créé sur [supabase.com](https://supabase.com)

---

## Variables d'environnement à configurer sur Vercel

Dans **Vercel Dashboard → Project → Settings → Environment Variables**, ajouter :

| Variable | Valeur | Visibilité |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | Serveur uniquement |
| `ANTHROPIC_API_KEY` | Clé API Anthropic | Serveur uniquement |
| `NEXT_PUBLIC_APP_URL` | URL de production Vercel | Public |
| `NEXT_PUBLIC_BEPC_TZ` | `Africa/Antananarivo` | Public |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` | Serveur uniquement |

> **Important** : Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` ou `ANTHROPIC_API_KEY` avec le préfixe `NEXT_PUBLIC_`.

---

## Déploiement initial

### 1. Appliquer les migrations Supabase

```bash
# Lier le projet Supabase local
npx supabase link --project-ref <VOTRE_PROJECT_REF>

# Appliquer toutes les migrations
npx supabase db push
```

### 2. Vérifier la build localement

```bash
cp .env.example .env.local
# Remplir .env.local avec les vraies valeurs

npm install
npm run build
```

### 3. Déployer sur Vercel

**Via GitHub (recommandé) :**
1. Connecter le dépôt GitHub sur vercel.com
2. Configurer les variables d'environnement (voir tableau ci-dessus)
3. Vercel détecte automatiquement Next.js et déploie

**Via CLI :**
```bash
vercel --prod
```

### 4. Configurer le domaine personnalisé (optionnel)

Dans Vercel Dashboard → Project → Settings → Domains, ajouter votre domaine.

---

## Mises à jour futures

```bash
# 1. Développer et tester localement
npm run dev

# 2. Si nouvelle migration Supabase
npx supabase db push

# 3. Committer et pousser sur main
git add .
git commit -m "feat: description de la mise à jour"
git push origin main
# → Vercel déploie automatiquement
```

---

## Rollback

### Rollback Vercel (code)

```bash
# Via CLI — lister les déploiements récents
vercel ls

# Promouvoir un déploiement précédent en production
vercel promote <deployment-url>
```

Ou dans Vercel Dashboard → Deployments → cliquer sur un déploiement précédent → **Promote to Production**.

### Rollback Supabase (base de données)

Les migrations Supabase sont cumulatives. En cas de problème :

```bash
# Voir l'historique des migrations appliquées
npx supabase migration list

# Créer une migration de rollback manuelle
npx supabase migration new rollback_<nom>
# Écrire le SQL inverse dans le fichier créé
npx supabase db push
```

> Pour les données critiques, utiliser les snapshots automatiques de Supabase (disponibles dans le dashboard Supabase → Database → Backups).

---

## Commandes utiles

```bash
npm run dev          # Serveur de développement (port 3000)
npm run build        # Build production (vérifie TS + ESLint)
npm run lint         # Vérification ESLint uniquement
npx supabase start   # Démarrer Supabase en local (Docker requis)
npx supabase db push # Appliquer les migrations en production
npx supabase gen types typescript --local > lib/supabase/types.ts  # Regénérer les types TS
```

---

## Checklist avant déploiement

- [ ] `npm run build` passe sans erreur
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Migrations Supabase appliquées (`npx supabase db push`)
- [ ] Service Worker PWA testé (Lighthouse PWA score > 90)
- [ ] Fonctionnement hors-ligne vérifié dans DevTools → Network → Offline
