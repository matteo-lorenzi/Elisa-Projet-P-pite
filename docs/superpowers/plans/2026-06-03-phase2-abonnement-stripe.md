# Phase 2 — Abonnement Stripe — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un utilisateur `free` de s'abonner via Stripe (checkout mensuel récurrent), débloquer l'accès premium dès que l'abonnement est `active`, gérer son abonnement via le portail Stripe, et permettre à l'admin de changer un rôle manuellement.

**Architecture:** Le navigateur appelle des **server actions** qui créent une session Stripe Checkout / Billing Portal (clé secrète, jamais exposée) et redirigent vers Stripe. Stripe notifie un **route handler webhook** (`/api/stripe/webhook`) qui vérifie la signature et **upsert** la table `subscriptions` via le **service role** (bypass RLS). La logique d'accès (`hasPremiumAccess`) reste la source unique : `admin` OU `role = paid` (override admin) OU `subscription.status = active`. Stripe reste la source de vérité de l'abonnement.

**Tech Stack:** Next.js 16 (App Router, server actions, route handlers), Stripe Node SDK, Supabase (Postgres + RLS + service role), Vitest, Stripe CLI (`stripe listen`) pour le webhook en dev.

**Décisions cadrées (utilisateur) :** clés test Stripe déjà dispo · **palier mensuel unique** · webhook dev via **Stripe CLI listen**.

---

## Pré-requis d'environnement (à faire AVANT la Task 1, une seule fois)

1. **Docker + Supabase** tournent (voir HANDOFF.md §Resume). `supabase status -o env` doit répondre.
2. **Compte admin de test** présent (`lorenzi.matteo30@gmail.com`, role `admin`).
3. **Installer le SDK Stripe :**
   ```bash
   npm install stripe
   ```
4. **Créer le produit + prix mensuel** dans le dashboard Stripe (mode test) :
   - Produit « Abonnement droit rural », prix récurrent mensuel (ex. 9,90 €/mois).
   - Récupérer l'ID de prix `price_...`.
5. **Compléter `.env.local`** (NON commité) :
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...        # fourni par `stripe listen` (étape suivante)
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
6. **Lancer le forward webhook** (terminal séparé, laissé ouvert pendant les tests E2E) :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`.

> Ces secrets ne vont jamais en git. `.env.local` est déjà gitignored.
> **Sécu (reco Stripe) :** préférer une **clé restreinte** `rk_test_...` (permissions Checkout + Billing + Customer Portal en écriture) plutôt que `sk_test_...`. Le code la consomme via `STRIPE_SECRET_KEY` de façon identique.

---

## File Structure

| Fichier | Création/Modif | Responsabilité |
|---|---|---|
| `supabase/migrations/0004_phase2_rls.sql` | Create | Policy admin update profiles ; index `subscriptions.stripe_customer_id` |
| `src/lib/stripe.ts` | Create | Singleton client Stripe (serveur uniquement) |
| `src/lib/stripe-sync.ts` | Create | **Fonction pure** : mappe un objet `Stripe.Subscription` → ligne `subscriptions`. Testable sans réseau |
| `src/lib/stripe-sync.test.ts` | Create | Tests unitaires du mapping |
| `src/lib/access.ts` | Modify | `hasPremiumAccess` : ajouter override `role === 'paid'` |
| `src/lib/access.test.ts` | Modify | Cas `role = paid` |
| `src/app/abonnement/actions.ts` | Create | Server actions `createCheckoutSession`, `createPortalSession` |
| `src/app/abonnement/page.tsx` | Create | Page tarif : CTA s'abonner / statut + gérer l'abonnement |
| `src/app/api/stripe/webhook/route.ts` | Create | Route handler webhook : vérif signature + upsert `subscriptions` |
| `src/components/DocumentCard.tsx` | Modify | (aucune logique Stripe ; lien cadenas inchangé, CTA vit sur la fiche) |
| `src/app/bibliotheque/[id]/page.tsx` | Modify | Remplacer « disponible prochainement » par CTA → `/abonnement` |
| `src/app/admin/users/page.tsx` | Create | Liste users + formulaire changer rôle |
| `src/app/admin/users/actions.ts` | Create | Server action `setUserRole` (admin only) |
| `src/app/admin/layout.tsx` | Modify | Ajouter lien nav « Utilisateurs » |

---

## Task 1: RLS — admin peut modifier les profils + index webhook

**Files:**
- Create: `supabase/migrations/0004_phase2_rls.sql`

**Contexte :** La policy `profiles_update_own` (0002) a `using (id = auth.uid())`. La clause USING échoue sur les lignes d'AUTRES users, donc l'admin ne peut pas changer leur rôle. On ajoute une policy d'update dédiée admin. On indexe aussi `stripe_customer_id` (le webhook retrouve la ligne par ce champ).

- [ ] **Step 1: Écrire la migration**

```sql
-- 0004_phase2_rls.sql — Phase 2 : admin gère les rôles, index webhook Stripe

-- L'admin peut mettre à jour n'importe quel profil (changement de rôle manuel).
-- (La policy 0002 profiles_update_own ne couvre que sa propre ligne.)
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Le webhook retrouve la ligne d'abonnement via le customer Stripe.
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);
```

- [ ] **Step 2: Appliquer la migration**

Run: `supabase migration up`
Expected: `Applying migration 0004_phase2_rls.sql...` sans erreur. (Si erreur de connexion, vérifier `supabase status`.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0004_phase2_rls.sql
git commit -m "feat(db): policy admin update profiles + index stripe_customer_id"
```

---

## Task 2: Override rôle `paid` dans la logique d'accès (TDD)

**Files:**
- Modify: `src/lib/access.ts`
- Test: `src/lib/access.test.ts`

**Contexte :** L'admin doit pouvoir débloquer un user manuellement (cas limite : geste commercial, litige paiement). On rend le rôle `paid` signifiant : il accorde l'accès premium indépendamment de Stripe. Stripe reste la source de vérité pour les abonnements automatiques via `subscription.status`.

- [ ] **Step 1: Écrire le test qui échoue**

Ajouter dans `src/lib/access.test.ts` (adapter les noms de helpers/fixtures à ceux déjà présents dans le fichier) :

```typescript
import { describe, it, expect } from 'vitest';
import { hasPremiumAccess } from './access';
import type { Profile, SubscriptionRow } from './supabase/types';

const baseProfile = (role: Profile['role']): Profile => ({
  id: 'u1', email: 'u@x.fr', full_name: null, display_name: null,
  role, newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z',
});

describe('hasPremiumAccess — override rôle paid', () => {
  it('rôle paid sans abonnement → accès premium', () => {
    expect(hasPremiumAccess(baseProfile('paid'), null)).toBe(true);
  });
  it('rôle free sans abonnement → pas d’accès', () => {
    expect(hasPremiumAccess(baseProfile('free'), null)).toBe(false);
  });
  it('rôle free + abonnement active → accès', () => {
    const sub: SubscriptionRow = {
      user_id: 'u1', stripe_customer_id: 'cus', stripe_subscription_id: 'sub',
      status: 'active', current_period_end: null,
    };
    expect(hasPremiumAccess(baseProfile('free'), sub)).toBe(true);
  });
});
```

> Si le fichier définit déjà un helper `baseProfile`/fixtures, réutilise-les au lieu de redéclarer (DRY) — n'ajoute que le `describe` ci-dessus.

- [ ] **Step 2: Lancer les tests → échec attendu**

Run: `npm test`
Expected: FAIL sur « rôle paid sans abonnement → accès premium » (retourne `false`).

- [ ] **Step 3: Implémenter le minimum**

Dans `src/lib/access.ts`, modifier `hasPremiumAccess` :

```typescript
export function hasPremiumAccess(
  profile: Profile,
  subscription: SubscriptionRow | null,
): boolean {
  if (profile.role === 'admin' || profile.role === 'paid') return true;
  return subscription?.status === 'active';
}
```

- [ ] **Step 4: Lancer les tests → vert**

Run: `npm test`
Expected: PASS, total ≥ 11 tests (8 existants + 3 nouveaux).

- [ ] **Step 5: Commit**

```bash
git add src/lib/access.ts src/lib/access.test.ts
git commit -m "feat(access): le role paid debloque l'acces premium (override admin)"
```

---

## Task 3: Mapping Stripe → ligne `subscriptions` (fonction pure, TDD)

**Files:**
- Create: `src/lib/stripe-sync.ts`
- Test: `src/lib/stripe-sync.test.ts`

**Contexte :** Le webhook reçoit des objets `Stripe.Subscription`. On isole la transformation en fonction pure pour la tester sans réseau ni vrai event. Le webhook (Task 5) ne fera qu'appeler cette fonction + upsert.

> ⚠️ **Breaking change API Stripe (`2026-05-27.dahlia`)** : `current_period_end` n'est **plus** sur l'objet `Subscription` ; il vit désormais sur chaque **subscription item** (`subscription.items.data[].current_period_end`, epoch seconds). Pour un abonnement mono-prix, on lit `items.data[0].current_period_end`. La fonction est défensive : top-level d'abord (compat), sinon premier item.

- [ ] **Step 1: Écrire le test qui échoue**

```typescript
// src/lib/stripe-sync.test.ts
import { describe, it, expect } from 'vitest';
import { subscriptionRowFromStripe } from './stripe-sync';

describe('subscriptionRowFromStripe', () => {
  it('mappe un abonnement actif (period_end depuis items.data[0])', () => {
    const row = subscriptionRowFromStripe({
      id: 'sub_123',
      status: 'active',
      customer: 'cus_123',
      items: { data: [{ current_period_end: 1764547200 }] }, // epoch seconds
      metadata: { user_id: 'u1' },
    });
    expect(row).toEqual({
      user_id: 'u1',
      stripe_customer_id: 'cus_123',
      stripe_subscription_id: 'sub_123',
      status: 'active',
      current_period_end: new Date(1764547200 * 1000).toISOString(),
    });
  });

  it('customer peut être un objet (expand) → on prend son id ; pas de period → null', () => {
    const row = subscriptionRowFromStripe({
      id: 'sub_9', status: 'past_due',
      customer: { id: 'cus_9' },
      items: { data: [] },
      metadata: { user_id: 'u9' },
    });
    expect(row.stripe_customer_id).toBe('cus_9');
    expect(row.status).toBe('past_due');
    expect(row.current_period_end).toBeNull();
  });

  it('lève si user_id absent des metadata', () => {
    expect(() =>
      subscriptionRowFromStripe({
        id: 's', status: 'active', customer: 'c',
        items: { data: [{ current_period_end: 1 }] }, metadata: {},
      }),
    ).toThrow(/user_id/);
  });
});
```

- [ ] **Step 2: Lancer → échec attendu**

Run: `npm test src/lib/stripe-sync.test.ts`
Expected: FAIL « Cannot find module './stripe-sync' ».

- [ ] **Step 3: Implémenter**

```typescript
// src/lib/stripe-sync.ts
import type { SubscriptionRow } from './supabase/types';

// Forme minimale d'un Stripe.Subscription dont on a besoin (évite de dépendre
// du type complet du SDK ici ; le webhook passe le vrai objet, compatible).
// Depuis l'API dahlia, current_period_end vit sur les items, pas au top-level.
export interface StripeSubscriptionLike {
  id: string;
  status: string;
  customer: string | { id: string };
  current_period_end?: number | null; // legacy top-level (anciennes versions API)
  items?: { data: Array<{ current_period_end?: number | null }> };
  metadata: Record<string, string>;
}

export function subscriptionRowFromStripe(
  sub: StripeSubscriptionLike,
): SubscriptionRow {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    throw new Error('subscriptionRowFromStripe: user_id manquant dans metadata');
  }
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  // dahlia : items.data[0].current_period_end ; fallback top-level pour compat.
  const periodEnd = sub.items?.data?.[0]?.current_period_end ?? sub.current_period_end ?? null;
  return {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  };
}
```

- [ ] **Step 4: Lancer → vert**

Run: `npm test src/lib/stripe-sync.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe-sync.ts src/lib/stripe-sync.test.ts
git commit -m "feat(stripe): mapping pur Stripe.Subscription -> ligne subscriptions"
```

---

## Task 4: Client Stripe + server actions checkout/portail

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/app/abonnement/actions.ts`

**Contexte :** Server actions appelées depuis la page abonnement. Le `user_id` Supabase est mis en `subscription_data.metadata.user_id` à la création du checkout, pour que le webhook (Task 5) sache à quel profil rattacher l'abonnement. On stocke aussi le `customer` pour réutilisation au portail.

- [ ] **Step 1: Créer le client Stripe**

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquant');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
```

> Ne PAS épingler d'`apiVersion` : laisser la valeur par défaut du SDK installé (évite un mismatch de type). Si TS se plaint, suivre exactement la version suggérée dans l'erreur.

- [ ] **Step 2: Créer les server actions**

```typescript
// src/app/abonnement/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function createCheckoutSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Réutilise le customer Stripe existant s'il y en a un.
  const { data: sub } = await supabase
    .from('subscriptions').select('stripe_customer_id')
    .eq('user_id', user.id).maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : (user.email ?? undefined),
    subscription_data: { metadata: { user_id: user.id } },
    success_url: `${SITE}/abonnement?success=1`,
    cancel_url: `${SITE}/abonnement?canceled=1`,
  });

  if (!session.url) throw new Error('Stripe: pas d’URL de checkout');
  redirect(session.url);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: sub } = await supabase
    .from('subscriptions').select('stripe_customer_id')
    .eq('user_id', user.id).maybeSingle();
  if (!sub?.stripe_customer_id) redirect('/abonnement');

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${SITE}/abonnement`,
  });
  redirect(session.url);
}
```

> `redirect()` lève une exception interne Next — ne l'enveloppe PAS dans un try/catch qui avale tout. Les appels Stripe sont au-dessus du `redirect`, donc OK.

- [ ] **Step 3: Vérifier que le build typecheck passe**

Run: `npm run build`
Expected: build OK. (Le portail Stripe en mode test peut exiger d'activer le « Customer portal » dans le dashboard ; sinon erreur au runtime seulement, pas au build.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/stripe.ts src/app/abonnement/actions.ts
git commit -m "feat(stripe): client + server actions checkout & billing portal"
```

---

## Task 5: Route handler webhook Stripe

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

**Contexte :** Stripe POST les events. On vérifie la signature avec le raw body (`await req.text()`), puis on upsert `subscriptions` via le **service role** (les policies n'autorisent aucun write client sur `subscriptions` — c'est voulu). Events gérés : `checkout.session.completed` (récupère l'abonnement créé), `customer.subscription.created|updated|deleted`, `invoice.payment_failed` (Stripe passe le statut à `past_due`, capté par `subscription.updated`). On répond toujours 200 vite ; Stripe réessaie si non-2xx.

Rappel doc Next 16 (`node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`) : les handlers `POST` ne sont pas cachés ; `Request` standard ; `await request.text()` donne le corps brut.

- [ ] **Step 1: Implémenter le handler**

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { subscriptionRowFromStripe } from '@/lib/stripe-sync';
import type Stripe from 'stripe';

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  // metadata.user_id est posé à la création du checkout (Task 4).
  const row = subscriptionRowFromStripe(sub as never);
  const { error } = await admin().from('subscriptions').upsert(row, { onConflict: 'user_id' });
  if (error) throw new Error(`upsert subscriptions: ${error.message}`);
}

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
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          await upsertFromSubscription(sub);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await upsertFromSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break; // events ignorés : 200 quand même
    }
  } catch (err) {
    // Erreur de traitement → 500 pour que Stripe réessaie (idempotent via upsert).
    const msg = err instanceof Error ? err.message : 'handler error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

> Note : un abonnement `deleted`/`canceled` met `status` à sa valeur Stripe (`canceled`) → `hasPremiumAccess` repasse à `false`. On garde la ligne (historique customer), on ne la supprime pas.

- [ ] **Step 2: Build typecheck**

Run: `npm run build`
Expected: build OK (10 routes attendues : 9 + `/abonnement` ajouté en Task 6 ; ici au moins le webhook compile).

- [ ] **Step 3: Test signature invalide (sanity, sans Stripe CLI)**

Avec `npm run dev` lancé :
```bash
curl -s -X POST localhost:3000/api/stripe/webhook -H "content-type: application/json" -d '{}' -w "\n%{http_code}\n"
```
Expected: `{"error":"no signature"}` puis `400`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat(stripe): webhook verifie signature + upsert subscriptions (service role)"
```

---

## Task 6: Page `/abonnement` (CTA + statut + portail)

**Files:**
- Create: `src/app/abonnement/page.tsx`

**Contexte :** Page membre. Si déjà premium → affiche le statut + bouton « Gérer mon abonnement » (portail). Sinon → argumentaire + bouton « S'abonner ». Bandeau `past_due` si paiement en souffrance. Les boutons sont des `<form action={serverAction}>`.

- [ ] **Step 1: Implémenter la page**

```tsx
// src/app/abonnement/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasPremiumAccess } from '@/lib/access';
import { createCheckoutSession, createPortalSession } from './actions';
import type { Profile, SubscriptionRow } from '@/lib/supabase/types';

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const { success, canceled } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  const sub = subscription as SubscriptionRow | null;
  const premium = hasPremiumAccess(profile as Profile, sub);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link href="/bibliotheque" className="text-sm underline">← Bibliothèque</Link>
      <h1 className="mt-2 text-2xl font-bold">Abonnement</h1>

      {success && (
        <p className="mt-4 rounded bg-green-50 p-3 text-green-800">
          Paiement confirmé. Votre accès premium peut prendre quelques secondes à s’activer.
        </p>
      )}
      {canceled && (
        <p className="mt-4 rounded bg-gray-50 p-3 text-gray-700">Paiement annulé.</p>
      )}
      {sub?.status === 'past_due' && (
        <p className="mt-4 rounded bg-amber-50 p-3 text-amber-800">
          Votre dernier paiement a échoué. Régularisez-le pour conserver l’accès premium.
        </p>
      )}

      {premium ? (
        <section className="mt-6">
          <p className="text-lg">✓ Vous avez accès à l’ensemble des documents.</p>
          {sub?.stripe_customer_id && (
            <form action={createPortalSession} className="mt-4">
              <button className="rounded bg-black px-4 py-2 text-white">
                Gérer mon abonnement
              </button>
            </form>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <p>Débloquez tous les documents premium pour 9,90 €/mois.</p>
          <form action={createCheckoutSession} className="mt-4">
            <button className="rounded bg-black px-4 py-2 text-white">S’abonner</button>
          </form>
        </section>
      )}
    </main>
  );
}
```

> Adapter le prix affiché (« 9,90 €/mois ») à celui réellement créé dans Stripe.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build OK, route `/abonnement` listée.

- [ ] **Step 3: Commit**

```bash
git add src/app/abonnement/page.tsx
git commit -m "feat(abonnement): page tarif, CTA s'abonner, statut & portail"
```

---

## Task 7: Brancher le CTA depuis la fiche document verrouillée

**Files:**
- Modify: `src/app/bibliotheque/[id]/page.tsx`

**Contexte :** Le bloc verrouillé dit « L'abonnement sera disponible prochainement. » → le remplacer par un vrai CTA vers `/abonnement`.

- [ ] **Step 1: Remplacer le bloc verrouillé**

Dans `src/app/bibliotheque/[id]/page.tsx`, remplacer le `<div>` du cas `!allowed` par :

```tsx
          <div className="rounded border bg-gray-50 p-8 text-center">
            <p className="text-lg">🔒 Ce document est réservé aux abonnés.</p>
            <Link
              href="/abonnement"
              className="mt-4 inline-block rounded bg-black px-4 py-2 text-white"
            >
              S’abonner
            </Link>
          </div>
```

(`Link` est déjà importé en haut du fichier.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/app/bibliotheque/[id]/page.tsx
git commit -m "feat(bibliotheque): CTA s'abonner sur les documents verrouilles"
```

---

## Task 8: Admin — gestion des rôles utilisateurs

**Files:**
- Create: `src/app/admin/users/actions.ts`
- Create: `src/app/admin/users/page.tsx`
- Modify: `src/app/admin/layout.tsx`

**Contexte :** L'admin liste les profils et change un rôle (`free`/`paid`/`admin`). L'écriture passe par le **service role** côté action après vérif que l'appelant est admin (défense en profondeur ; la policy `profiles_update_admin` de Task 1 couvre aussi le client SSR, mais le service role évite toute ambiguïté RLS sur les enums). La garde de rôle réutilise le pattern existant dans `src/app/admin/layout.tsx`.

- [ ] **Step 1: Server action `setUserRole`**

```typescript
// src/app/admin/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

export async function setUserRole(formData: FormData) {
  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as Role;
  if (!ROLES.includes(role)) throw new Error('rôle invalide');

  // Garde : l'appelant doit être admin.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') throw new Error('accès refusé');

  // Écriture via service role.
  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await adminDb.from('profiles').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/users');
}
```

- [ ] **Step 2: Page liste users**

```tsx
// src/app/admin/users/page.tsx
import { createClient } from '@/lib/supabase/server';
import { setUserRole } from './actions';
import type { Profile, Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

export default async function AdminUsersPage() {
  const supabase = await createClient();
  // La garde admin est dans src/app/admin/layout.tsx ; RLS laisse l'admin tout lire.
  const { data: profiles } = await supabase
    .from('profiles').select('*').order('created_at', { ascending: true });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-bold">Utilisateurs</h1>
      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Email</th><th>Rôle</th><th></th>
          </tr>
        </thead>
        <tbody>
          {(profiles as Profile[] ?? []).map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-2">{p.email}</td>
              <td>{p.role}</td>
              <td>
                <form action={setUserRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={p.id} />
                  <select name="role" defaultValue={p.role} className="border p-1 rounded">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button className="rounded bg-black px-3 text-white">OK</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 3: Lien nav admin**

Dans `src/app/admin/layout.tsx`, ajouter un lien « Utilisateurs » → `/admin/users` à côté des liens existants (suivre le markup de nav déjà présent dans ce layout ; ne pas réécrire la garde de rôle).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build OK, routes `/admin/users` listée.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/users src/app/admin/layout.tsx
git commit -m "feat(admin): gestion des roles utilisateurs"
```

---

## Task 9: Vérification E2E manuelle (Stripe CLI + carte test)

**Pré-requis :** `npm run dev` lancé ; `stripe listen --forward-to localhost:3000/api/stripe/webhook` lancé ; `.env.local` complet (dont `STRIPE_WEBHOOK_SECRET` du listen).

- [ ] **Step 1: Suite de tests verte**

Run: `npm test`
Expected: PASS, tous les tests (≥ 14 : 8 + 3 access + 3 stripe-sync).

- [ ] **Step 2: Build complet**

Run: `npm run build`
Expected: build OK, ~12 routes (9 Phase 1 + `/abonnement`, `/api/stripe/webhook`, `/admin/users`).

- [ ] **Step 3: Parcours abonnement**

1. Se connecter avec un compte **non-admin** (créer un compte de test si besoin ; sinon démsettre temporairement l'admin via Studio).
2. Ouvrir un document **premium** → bloc verrouillé + bouton « S'abonner » → `/abonnement`.
3. Cliquer « S'abonner » → redirection Stripe Checkout.
4. Payer avec la carte test `4242 4242 4242 4242`, date future, CVC quelconque.
5. Retour `/abonnement?success=1`.
6. Vérifier dans le terminal `stripe listen` : events `checkout.session.completed` + `customer.subscription.created` → `200`.
7. Recharger la fiche du document premium → **le lecteur s'affiche** (accès débloqué).
8. Studio SQL : `select * from public.subscriptions;` → ligne avec `status = 'active'`.

Expected: tout vert. Si l'accès ne se débloque pas : vérifier que `metadata.user_id` est bien sur l'abonnement Stripe (dashboard → abonnement → metadata) et que le webhook a renvoyé 200.

- [ ] **Step 4: Portail**

Sur `/abonnement` (désormais premium) → « Gérer mon abonnement » → portail Stripe s'ouvre. Annuler l'abonnement → event `customer.subscription.updated/deleted` → `subscriptions.status` change → l'accès premium se coupe au rechargement.

> Si le portail renvoie une erreur : activer « Customer portal » dans le dashboard Stripe (Settings → Billing → Customer portal → Activer).

- [ ] **Step 5: Admin rôle**

Connecté en admin → `/admin/users` → passer un user en `paid` → ce user voit le premium sans abonnement Stripe ; le repasser en `free` → premium re-verrouillé.

- [ ] **Step 6: Commit final + mise à jour env d'exemple**

Si un `.env.example` existe, y ajouter (sans valeurs) `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`. Puis :

```bash
git add -A
git commit -m "docs(phase2): variables d'environnement Stripe d'exemple"
```

---

## Self-Review (couverture spec Phase 2)

| Exigence spec / handoff | Task |
|---|---|
| Checkout Stripe abonnement récurrent (mensuel) | Task 4 + 6 |
| Webhook → table `subscriptions` → déblocage premium | Task 3 + 5 |
| Page « gérer mon abonnement » (portail Stripe) | Task 4 + 6 |
| Admin : voir / changer le rôle manuellement | Task 1 (RLS) + 8 |
| Paiement `past_due` → accès coupé + bandeau | Task 2 (logique) + 5 (statut) + 6 (bandeau) |
| Webhook raté → Stripe réessaie, jamais débloqué sans `active` | Task 5 (500 → retry, upsert idempotent) |
| Accès vérifié serveur + RLS (filet) | inchangé (route `/url` existante) + Task 1 |
| URL signée 60s régénérée | inchangé (Phase 1) |

**Notes de cohérence :** `SubscriptionRow` (types.ts) ↔ `subscriptionRowFromStripe` retournent la même forme. `hasPremiumAccess` modifié en Task 2 est ré-utilisé par la page abonnement (Task 6) et la route `/url` (inchangée). La colonne de conflit upsert est `user_id` (PK de `subscriptions`).
