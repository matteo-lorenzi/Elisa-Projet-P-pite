# Finition production & durcissement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clôturer la PR d'architecture, durcir le code restant (validation d'environnement, webhook Stripe testable), puis mettre la plateforme en production (Resend, confirmation email, déploiement, Stripe live) et faire le ménage.

**Architecture:** Deux phases code en TDD (modules purs à dépendances injectées, dans la lignée des deepenings déjà mergés), puis des phases « ops » sous forme de runbooks à commandes exactes. Les phases ops marquées **🔑 ACTION UTILISATEUR** exigent des accès/identifiants que l'agent n'a pas (comptes Resend/Stripe/hébergeur).

**Tech Stack:** Next.js 16 (App Router), Supabase (Auth/Postgres/RLS/Storage), Stripe (API dahlia), Resend, Vitest, TypeScript, déploiement Vercel (cible présumée).

---

## Ordre d'exécution

0. Merger la PR #4 (débloque tout le reste)
1. `lib/env.ts` — validation d'environnement bruyante (code, TDD)
2. Webhook Stripe testable — extraction `handleStripeEvent` (code, TDD)
3. Production — Resend → confirmation email → déploiement → Stripe live (ops)
4. Housekeeping — MCP Stripe en doublon, fichiers du seed (ops)

Les phases 1 et 2 sont mergeables avant la prod et réduisent le risque de mise en ligne. Elles peuvent partir dans une seule branche `refactor/durcissement` ou deux PRs séparées.

---

## Phase 0 — Merger la PR #4

**Pas de code.** Process.

- [ ] **Step 1: Relire la PR**

Run: `gh pr view 4 --web`
Vérifier le diff (21 fichiers, +572/−159), la description, l'absence de conflit.

- [ ] **Step 2: (option) revue automatisée**

Run: `gh pr checks 4` puis, si souhaité, lancer `/code-review` sur la branche.

- [ ] **Step 3: Merger**

Run: `gh pr merge 4 --squash --delete-branch`
Expected: PR passée à MERGED, branche distante supprimée.

- [ ] **Step 4: Resynchroniser le local**

```bash
git checkout main
git pull --ff-only
git branch -d refactor/admin-guard-seam
```
Expected: `main` contient les 4 deepenings, branche locale supprimée.

---

## Phase 1 — `lib/env.ts` : validation d'environnement (TDD)

**Problème ciblé** (candidat #5 du rapport d'archi) : chaque module lit ses variables avec `!` ou un défaut silencieux. `newsletter-email.ts` retombe sur `''` → lien de désinscription cassé sans erreur. Objectif : échec **bruyant au démarrage du serveur** si une variable manque, plus suppression du défaut silencieux.

**Variables runtime requises** (relevé exhaustif via `process.env.` dans `src/`, hors fichiers de test) :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID
RESEND_API_KEY
NEWSLETTER_FROM
NEWSLETTER_UNSUBSCRIBE_SECRET
NEXT_PUBLIC_SITE_URL
```

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/env.test.ts`
- Create: `instrumentation.ts` (racine projet — hook de démarrage Next.js)
- Modify: `src/lib/newsletter-email.ts` (supprimer le défaut silencieux)
- Modify: `src/lib/newsletter-email.test.ts` (cas variable manquante)

### Task 1.1 — `readEnv` (cœur pur, testable)

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/env.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import { readEnv, REQUIRED_ENV } from './env';

const complete = (): Record<string, string> =>
  Object.fromEntries(REQUIRED_ENV.map((k) => [k, `val-${k}`]));

describe('readEnv', () => {
  it('renvoie toutes les variables quand elles sont présentes', () => {
    const env = readEnv(complete());
    expect(env.STRIPE_PRICE_ID).toBe('val-STRIPE_PRICE_ID');
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('val-NEXT_PUBLIC_SITE_URL');
  });

  it('throw en listant toutes les variables manquantes', () => {
    const source = complete();
    delete source.RESEND_API_KEY;
    delete source.STRIPE_WEBHOOK_SECRET;
    expect(() => readEnv(source)).toThrow(/RESEND_API_KEY/);
    expect(() => readEnv(source)).toThrow(/STRIPE_WEBHOOK_SECRET/);
  });

  it('traite une chaîne vide comme manquante', () => {
    const source = complete();
    source.NEWSLETTER_FROM = '';
    expect(() => readEnv(source)).toThrow(/NEWSLETTER_FROM/);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `npx vitest run src/lib/env.test.ts`
Expected: FAIL — `Cannot find module './env'`.

- [ ] **Step 3: Implémenter `src/lib/env.ts`**

```typescript
export const REQUIRED_ENV = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'RESEND_API_KEY',
  'NEWSLETTER_FROM',
  'NEWSLETTER_UNSUBSCRIBE_SECRET',
  'NEXT_PUBLIC_SITE_URL',
] as const;

export type EnvKey = (typeof REQUIRED_ENV)[number];

/** Valide une source d'environnement et renvoie les variables typées, ou throw. */
export function readEnv(source: Record<string, string | undefined>): Record<EnvKey, string> {
  const missing = REQUIRED_ENV.filter((k) => !source[k]);
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
  }
  return Object.fromEntries(REQUIRED_ENV.map((k) => [k, source[k]!])) as Record<EnvKey, string>;
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `npx vitest run src/lib/env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts src/lib/env.test.ts
git commit -m "feat(env): readEnv valide les variables requises (throw si manquantes)"
```

### Task 1.2 — Validation au démarrage via `instrumentation.ts`

Next.js exécute `register()` de `instrumentation.ts` une fois au boot du serveur. On y valide l'environnement → échec immédiat et lisible en prod, sans impacter les tests unitaires (qui n'importent pas ce fichier).

- [ ] **Step 1: Créer `instrumentation.ts` à la racine**

```typescript
import { readEnv } from '@/lib/env';

export async function register() {
  // Échoue bruyamment au démarrage si une variable d'environnement manque.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    readEnv(process.env);
  }
}
```

- [ ] **Step 2: Vérifier le build**

Run: `npm run build`
Expected: build OK. (Si `.env.local` complet, aucun throw ; sinon le message liste les variables manquantes — c'est le comportement voulu.)

- [ ] **Step 3: Commit**

```bash
git add instrumentation.ts
git commit -m "feat(env): valide l'environnement au demarrage du serveur (instrumentation)"
```

### Task 1.3 — Supprimer le défaut silencieux de `newsletter-email.ts`

- [ ] **Step 1: Ajouter le cas manquant au test existant**

Modify `src/lib/newsletter-email.test.ts` — ajouter après le `describe` existant :

```typescript
import { afterEach } from 'vitest';

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';
});

describe('buildEmailHtml — garde-fou URL', () => {
  it('throw si NEXT_PUBLIC_SITE_URL est absent', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(() => buildEmailHtml('<p>x</p>', 'u1')).toThrow('NEXT_PUBLIC_SITE_URL');
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `npx vitest run src/lib/newsletter-email.test.ts`
Expected: FAIL — actuellement `buildEmailHtml` retombe sur `''` et ne throw pas.

- [ ] **Step 3: Corriger `src/lib/newsletter-email.ts`**

Remplacer la ligne `const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';` par :

```typescript
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error('NEXT_PUBLIC_SITE_URL manquant');
```

- [ ] **Step 4: Lancer toute la suite**

Run: `npx vitest run`
Expected: PASS (la suite + le nouveau cas). Vérifier qu'aucun test newsletter ne casse (ils posent `NEXT_PUBLIC_SITE_URL` en `beforeAll`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter-email.ts src/lib/newsletter-email.test.ts
git commit -m "fix(newsletter): throw explicite si NEXT_PUBLIC_SITE_URL absent (lien desinscription)"
```

---

## Phase 2 — Webhook Stripe testable (TDD)

**Problème ciblé** : `POST` du webhook (`src/app/api/stripe/webhook/route.ts`) contient le routage des events (paiement — point sensible) soudé au framework et **non testé**. On extrait un module pur `handleStripeEvent` à dépendances injectées (même pattern que `publishEdition`), et on le teste.

**Files:**
- Create: `src/lib/stripe/handle-event.ts`
- Create: `src/lib/stripe/handle-event.test.ts`
- Modify: `src/app/api/stripe/webhook/route.ts`

### Task 2.1 — Extraire `handleStripeEvent`

- [ ] **Step 1: Écrire le test qui échoue**

Create `src/lib/stripe/handle-event.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import type Stripe from 'stripe';
import { handleStripeEvent, type SubscriptionStore, type StripeGateway } from './handle-event';
import type { SubscriptionRow } from '../supabase/types';

const fakeStore = () => {
  const rows: SubscriptionRow[] = [];
  const store: SubscriptionStore = {
    async upsertSubscription(r) { rows.push(r); },
  };
  return { store, rows };
};

const subObject = (userId: string) =>
  ({
    id: 'sub_1',
    status: 'active',
    customer: 'cus_1',
    metadata: { user_id: userId },
    items: { data: [{ current_period_end: 1893456000 }] },
  }) as unknown as Stripe.Subscription;

const fakeGateway = (sub: Stripe.Subscription): StripeGateway => ({
  async retrieveSubscription() { return sub; },
});

describe('handleStripeEvent', () => {
  it('customer.subscription.updated → upsert de la ligne mappée', async () => {
    const { store, rows } = fakeStore();
    const event = {
      type: 'customer.subscription.updated',
      data: { object: subObject('user-42') },
    } as unknown as Stripe.Event;

    await handleStripeEvent(event, { store, stripe: fakeGateway(subObject('user-42')) });

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe('user-42');
    expect(rows[0].status).toBe('active');
  });

  it('checkout.session.completed → récupère l’abonnement puis upsert', async () => {
    const { store, rows } = fakeStore();
    const sub = subObject('user-99');
    const event = {
      type: 'checkout.session.completed',
      data: { object: { subscription: 'sub_1' } },
    } as unknown as Stripe.Event;

    await handleStripeEvent(event, { store, stripe: fakeGateway(sub) });

    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe('user-99');
  });

  it('event ignoré → aucun upsert', async () => {
    const { store, rows } = fakeStore();
    const event = { type: 'invoice.paid', data: { object: {} } } as unknown as Stripe.Event;
    await handleStripeEvent(event, { store, stripe: fakeGateway(subObject('x')) });
    expect(rows).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `npx vitest run src/lib/stripe/handle-event.test.ts`
Expected: FAIL — module absent.

- [ ] **Step 3: Implémenter `src/lib/stripe/handle-event.ts`**

```typescript
import type Stripe from 'stripe';
import { subscriptionRowFromStripe } from '../stripe-sync';
import type { SubscriptionRow } from '../supabase/types';

export interface SubscriptionStore {
  upsertSubscription(row: SubscriptionRow): Promise<void>;
}

export interface StripeGateway {
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
}

/** Route un event Stripe vérifié vers l'upsert d'abonnement. Pur, dépendances injectées. */
export async function handleStripeEvent(
  event: Stripe.Event,
  deps: { store: SubscriptionStore; stripe: StripeGateway },
): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const sub = await deps.stripe.retrieveSubscription(session.subscription as string);
        await deps.store.upsertSubscription(subscriptionRowFromStripe(sub as never));
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await deps.store.upsertSubscription(
        subscriptionRowFromStripe(event.data.object as never),
      );
      break;
    default:
      break;
  }
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `npx vitest run src/lib/stripe/handle-event.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe/handle-event.ts src/lib/stripe/handle-event.test.ts
git commit -m "refactor(stripe): extrait handleStripeEvent teste (routage events injectable)"
```

### Task 2.2 — Câbler le webhook sur le module

- [ ] **Step 1: Réécrire `src/app/api/stripe/webhook/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { handleStripeEvent } from '@/lib/stripe/handle-event';
import type Stripe from 'stripe';
import type { SubscriptionRow } from '@/lib/supabase/types';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'no signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid';
    return NextResponse.json({ error: `signature: ${msg}` }, { status: 400 });
  }

  try {
    await handleStripeEvent(event, {
      store: {
        async upsertSubscription(row: SubscriptionRow) {
          const { error } = await createServiceRoleClient()
            .from('subscriptions').upsert(row, { onConflict: 'user_id' });
          if (error) throw new Error(`upsert subscriptions: ${error.message}`);
        },
      },
      stripe: {
        retrieveSubscription: (id) => stripe.subscriptions.retrieve(id),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'handler error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Vérifier suite + lint + build**

Run: `npx vitest run && npm run lint && npm run build`
Expected: tous verts ; aucune route en moins.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "refactor(stripe): webhook delegue a handleStripeEvent (coquille fine)"
```

- [ ] **Step 4: (option) PR**

```bash
git push -u origin <branche>
gh pr create --base main --title "refactor: durcissement env + webhook Stripe testable" --body-file <fichier>
```
> ⚠️ Le hook git-guardrails bloque `git push` — demander l'autorisation explicite avant cette étape.

---

## Phase 3 — Production (ops)

> 🔑 **ACTION UTILISATEUR** : ces étapes exigent les comptes/identifiants Resend, Stripe, Supabase cloud et l'hébergeur. L'agent prépare les commandes/checklists ; l'utilisateur exécute ce qui touche aux secrets et aux consoles externes.

### Task 3A — Domaine vérifié Resend

Sans domaine vérifié, `onboarding@resend.dev` ne livre **qu'au propriétaire du compte Resend** → newsletter inutilisable en prod.

- [ ] **Step 1: 🔑 Ajouter le domaine dans Resend**
Console Resend → Domains → Add Domain (ex. `vulgarurale.fr`).

- [ ] **Step 2: 🔑 Publier les enregistrements DNS**
Ajouter chez le registrar les entrées SPF, DKIM (et DMARC recommandé) fournies par Resend. Attendre la vérification (statut « Verified »).

- [ ] **Step 3: Définir `NEWSLETTER_FROM` sur ce domaine**
Ex. `newsletter@vulgarurale.fr`. À poser dans les variables d'env de prod (Task 3C).

- [ ] **Step 4: Vérifier l'envoi**
Une fois déployé : envoyer une édition de test à `delivered@resend.dev` (sink Resend) → attendu `envoyé: 1, échecs: 0`. Ne **jamais** tester vers un vrai destinataire.

### Task 3B — Confirmation email à l'inscription

Désactivée en dev local ; à activer en prod (RGPD + anti-faux-comptes).

- [ ] **Step 1: 🔑 Activer la confirmation dans Supabase**
Dashboard Supabase (projet cloud) → Authentication → Providers → Email → activer « Confirm email ».

- [ ] **Step 2: 🔑 Configurer les URLs**
Authentication → URL Configuration : `Site URL` = domaine prod, et `Redirect URLs` autorisées. Personnaliser le template d'email de confirmation (FR).

- [ ] **Step 3: Vérifier le flux**
Inscription test → email de confirmation reçu → clic → compte confirmé → connexion OK.

### Task 3C — Déploiement (Vercel présumé)

- [ ] **Step 1: 🔑 Créer le projet d'hébergement**
Importer le repo GitHub dans Vercel (ou hébergeur choisi). Framework détecté : Next.js.

- [ ] **Step 2: 🔑 Renseigner les 10 variables d'environnement de prod**
Reprendre la liste de la Phase 1 (`REQUIRED_ENV`), valeurs **prod** :
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` (live), `STRIPE_WEBHOOK_SECRET` (prod, voir 3D), `STRIPE_PRICE_ID` (prix live), `RESEND_API_KEY`, `NEWSLETTER_FROM` (domaine vérifié), `NEWSLETTER_UNSUBSCRIBE_SECRET` (secret fort dédié prod), `NEXT_PUBLIC_SITE_URL` (domaine prod).

- [ ] **Step 3: Déclencher le déploiement**
Le build échoue immédiatement et lisiblement si une variable manque (grâce à Phase 1) — corriger puis redéployer.

- [ ] **Step 4: Vérifier l'accès cloud à la base**
S'assurer que la base Supabase **cloud** est migrée (migrations 0001-0004 appliquées) et que les buckets `documents-free` / `documents-premium` existent.

### Task 3D — Stripe live + webhook prod

- [ ] **Step 1: 🔑 Passer le compte Stripe en live + créer produit/prix live**
Récupérer le `price_id` live → `STRIPE_PRICE_ID` de prod.
> Mémoire `stripe-cli-account` : le CLI pointe par défaut sur le mauvais compte (NoNeed). Forcer `--api-key <clé VulgaRuRale>`.

- [ ] **Step 2: 🔑 Créer l'endpoint webhook prod**
Stripe Dashboard → Developers → Webhooks → Add endpoint : URL = `https://<domaine>/api/stripe/webhook`. Events : `checkout.session.completed`, `customer.subscription.created|updated|deleted`. Copier le **signing secret** → `STRIPE_WEBHOOK_SECRET` de prod.

- [ ] **Step 3: Clés live**
`STRIPE_SECRET_KEY` live dans l'env de prod.

- [ ] **Step 4: Vérifier un cycle complet**
Abonnement test (carte réelle ou mode test selon stratégie de lancement) → webhook reçu (200) → ligne `subscriptions` `active` → accès premium débloqué → portail « gérer mon abonnement » fonctionne.

---

## Phase 4 — Housekeeping (ops)

### Task 4A — MCP Stripe en doublon

Deux serveurs MCP Stripe coexistent (`stripe` manuel + `plugin:stripe:stripe`).

- [ ] **Step 1: Lister**
Run: `claude mcp list`

- [ ] **Step 2: En retirer un**
Run: `claude mcp remove stripe`
Expected: un seul serveur Stripe restant.

### Task 4B — Fichiers du seed de démo

Les docs du seed ne sont que des métadonnées sans fichier → `/api/documents/[id]/url` renvoie 404.

- [ ] **Step 1: Choisir**
Soit (a) uploader de vrais PDF/schémas dans les buckets pour les docs du seed, soit (b) retirer ces lignes du seed pour éviter des fiches cassées en démo.

- [ ] **Step 2: Appliquer & vérifier**
Ouvrir une fiche document premium en tant qu'abonné → le lecteur charge le fichier (plus de 404), ou la fiche n'apparaît plus si retirée.

---

## Self-Review (effectué)

- **Couverture** : merge PR (0), #5 env (1), webhook test (2), Resend/confirmation/deploy/Stripe-live (3), MCP+seed (4) — toutes les tâches listées à l'utilisateur sont couvertes.
- **Placeholders** : aucun « TODO/TBD » ; code complet pour `env.ts`, `handle-event.ts`, webhook réécrit, instrumentation, fix newsletter-email.
- **Cohérence des types** : `REQUIRED_ENV`/`EnvKey`/`readEnv` cohérents Task 1.1↔1.2 ; `SubscriptionStore.upsertSubscription`/`StripeGateway.retrieveSubscription`/`SubscriptionRow` cohérents Task 2.1↔2.2 ; `subscriptionRowFromStripe` réutilisé tel quel.
- **Limite connue** : les phases 3-4 sont des runbooks (pas de TDD possible — actions externes) ; clairement marquées 🔑 ACTION UTILISATEUR.
```
