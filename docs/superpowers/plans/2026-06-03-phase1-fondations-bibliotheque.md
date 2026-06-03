# Phase 1 — Fondations & Bibliothèque — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un site debout : inscription/connexion, bibliothèque de documents (PDF/schémas) avec lecture en ligne, drapeau premium (gratuits voient les premium verrouillés), et un admin minimal pour uploader/flagger les documents.

**Architecture:** Next.js (App Router, TypeScript) sur le front et les routes serveur. Supabase fournit Auth (email + mot de passe), Postgres avec RLS, et Storage. Le contrôle d'accès vit dans la base (RLS) ; les fichiers premium ne sont servis que via une URL signée générée côté serveur après vérification du rôle. La logique « cet utilisateur peut-il voir ce fichier ? » est isolée dans un module pur, testé en TDD.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, `@supabase/ssr` + `@supabase/supabase-js`, Supabase CLI (migrations + dev local), Vitest (tests unitaires).

**Hors périmètre (phases ultérieures) :** Stripe/abonnement (Phase 2), newsletter (Phase 3). En Phase 1, le rôle `paid` existe dans l'enum mais n'est attribuable que manuellement en base — aucune route de paiement.

---

## Pré-requis environnement

L'ingénieur doit avoir : Node.js ≥ 20, npm, Docker Desktop (requis par `supabase start`), et la Supabase CLI (`npm i -g supabase` ou via scoop). Vérifier : `node -v`, `docker --version`, `supabase --version`.

## File Structure

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts   # scaffold
.env.local                                                        # secrets locaux (non commité)
supabase/
  config.toml                                                     # config CLI
  migrations/
    0001_init.sql                                                 # enums + tables
    0002_rls.sql                                                  # policies RLS
    0003_storage.sql                                              # buckets + policies storage
  seed.sql                                                        # données de dev (admin + docs démo)
src/
  lib/
    access.ts            # logique pure : canViewDocument / deriveRole — TDD
    access.test.ts       # tests unitaires Vitest
    supabase/
      server.ts          # client Supabase côté serveur (cookies)
      client.ts          # client Supabase côté navigateur
      types.ts           # types DB (Profile, Document, Role)
  app/
    layout.tsx           # layout racine + Tailwind
    page.tsx             # accueil public
    login/page.tsx       # connexion
    signup/page.tsx      # inscription
    auth/actions.ts      # server actions: signUp, signIn, signOut
    bibliotheque/
      page.tsx           # liste documents + filtres
      [id]/page.tsx      # fiche document + lecteur ou cadenas
    api/
      documents/[id]/url/route.ts   # génère URL signée si autorisé
    admin/
      layout.tsx         # garde admin
      documents/
        page.tsx         # liste docs admin
        new/page.tsx     # formulaire upload
        actions.ts       # server action: createDocument (upload + insert)
  components/
    DocumentCard.tsx     # carte doc (avec cadenas si premium verrouillé)
    PdfViewer.tsx        # lecteur PDF/schéma depuis URL signée
middleware.ts            # rafraîchit la session Supabase
```

---

## Task 1: Scaffold du projet Next.js + Tailwind

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Créer l'app Next.js dans le dossier courant**

Run (depuis la racine du repo, qui contient déjà `.git`, `docs/`, `.agents/`) :
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*" --no-turbopack
```
Répondre « Yes » pour écraser/fusionner si demandé (les fichiers existants `docs/`, `.agents/`, `CLAUDE.md` ne sont pas touchés par le générateur).

- [ ] **Step 2: Vérifier que le dev server démarre**

Run: `npm run dev`
Expected: serveur sur `http://localhost:3000`, page Next.js par défaut s'affiche. Arrêter avec Ctrl+C.

- [ ] **Step 3: Remplacer la page d'accueil par un placeholder du projet**

`src/app/page.tsx` :
```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-3xl font-bold">Vulgarisation du droit rural</h1>
      <p className="mt-4 text-gray-600">
        Documents pédagogiques, schémas et newsletter pour comprendre le droit rural.
      </p>
      <a href="/bibliotheque" className="mt-6 inline-block underline">
        Accéder à la bibliothèque
      </a>
    </main>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js + Tailwind"
```

---

## Task 2: Installer Supabase et initialiser le projet local

**Files:**
- Create: `supabase/config.toml` (généré), `.env.local`, `.gitignore` (modifié)

- [ ] **Step 1: Installer les dépendances Supabase**

```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Initialiser Supabase**

Run: `supabase init`
Expected: crée `supabase/config.toml`. Répondre « No » à la génération de settings VS Code si demandé.

- [ ] **Step 3: Démarrer Supabase en local**

Run: `supabase start`
Expected: après téléchargement Docker, affiche `API URL`, `anon key`, `service_role key`, `DB URL`. Copier ces valeurs.

- [ ] **Step 4: Créer `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key depuis supabase start>
SUPABASE_SERVICE_ROLE_KEY=<service_role key depuis supabase start>
```

- [ ] **Step 5: S'assurer que les secrets ne sont pas commités**

Vérifier que `.gitignore` contient `.env*` (create-next-app l'ajoute). Sinon, ajouter la ligne `.env*.local`.

- [ ] **Step 6: Commit**

```bash
git add supabase/config.toml .gitignore
git commit -m "chore: init Supabase local dev"
```

---

## Task 3: Migration initiale — enums et tables

**Files:**
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Écrire la migration des enums et tables**

`supabase/migrations/0001_init.sql` :
```sql
-- Enums
create type user_role as enum ('free', 'paid', 'admin');
create type document_type as enum ('pdf', 'schema');

-- Profils (1 ligne par utilisateur auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  display_name text,
  role user_role not null default 'free',
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);

-- Abonnements (rempli par Stripe en Phase 2 ; présent pour la dérivation du rôle)
create table public.subscriptions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  current_period_end timestamptz
);

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  author text,
  type document_type not null,
  storage_path text not null,
  is_premium boolean not null default false,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Newsletter (utilisée en Phase 3 ; table créée tôt pour stabilité du schéma)
create table public.newsletter_editions (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  sent_at timestamptz
);

-- Crée automatiquement un profil à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Appliquer la migration**

Run: `supabase migration up`
Expected: `Applying migration 0001_init.sql...` sans erreur.

- [ ] **Step 3: Vérifier les tables**

Run: `supabase db diff` (doit ne rien retourner d'inattendu) puis ouvrir Studio sur `http://127.0.0.1:54323` → tables `profiles`, `subscriptions`, `documents`, `newsletter_editions` présentes.
Expected: les 4 tables existent.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init.sql
git commit -m "feat: schema initial (profiles, documents, subscriptions, newsletter)"
```

---

## Task 4: Migration RLS — policies d'accès

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Écrire les policies RLS**

`supabase/migrations/0002_rls.sql` :
```sql
-- Helper : l'utilisateur courant est-il admin ?
create function public.is_admin()
returns boolean
language sql
stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.documents enable row level security;
alter table public.newsletter_editions enable row level security;

-- profiles : chacun lit/écrit sa ligne ; admin lit tout
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid() and role = 'free' or public.is_admin());

-- subscriptions : chacun lit sa ligne ; admin lit tout
create policy "subscriptions_select_own" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

-- documents : tout utilisateur authentifié lit les METADONNEES ;
-- seul l'admin insère/modifie/supprime
create policy "documents_select_all_auth" on public.documents
  for select using (auth.role() = 'authenticated');
create policy "documents_admin_write" on public.documents
  for all using (public.is_admin()) with check (public.is_admin());

-- newsletter_editions : admin uniquement (Phase 3)
create policy "newsletter_admin_all" on public.newsletter_editions
  for all using (public.is_admin()) with check (public.is_admin());
```

Note : la policy `profiles_update_own` empêche un utilisateur de s'auto-promouvoir — un non-admin ne peut écrire que s'il reste `role = 'free'` ; seul l'admin peut changer un rôle.

- [ ] **Step 2: Appliquer**

Run: `supabase migration up`
Expected: applique `0002_rls.sql` sans erreur.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_rls.sql
git commit -m "feat: policies RLS (profiles, documents, subscriptions)"
```

---

## Task 5: Migration Storage — buckets et policies

**Files:**
- Create: `supabase/migrations/0003_storage.sql`

- [ ] **Step 1: Écrire la migration storage**

`supabase/migrations/0003_storage.sql` :
```sql
-- Deux buckets privés : on sert tout via URL signée côté serveur
insert into storage.buckets (id, name, public)
values ('documents-free', 'documents-free', false),
       ('documents-premium', 'documents-premium', false)
on conflict (id) do nothing;

-- Seul l'admin peut uploader/supprimer des objets dans ces buckets.
-- La LECTURE des objets passe par des URLs signées générées côté serveur
-- (service role), donc aucune policy de select public n'est nécessaire.
create policy "storage_admin_write_free" on storage.objects
  for all
  using (bucket_id = 'documents-free' and public.is_admin())
  with check (bucket_id = 'documents-free' and public.is_admin());

create policy "storage_admin_write_premium" on storage.objects
  for all
  using (bucket_id = 'documents-premium' and public.is_admin())
  with check (bucket_id = 'documents-premium' and public.is_admin());
```

- [ ] **Step 2: Appliquer**

Run: `supabase migration up`
Expected: applique `0003_storage.sql`. Dans Studio → Storage, les buckets `documents-free` et `documents-premium` existent et sont privés.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0003_storage.sql
git commit -m "feat: buckets storage prives + policies admin"
```

---

## Task 6: Types DB partagés

**Files:**
- Create: `src/lib/supabase/types.ts`

- [ ] **Step 1: Écrire les types**

`src/lib/supabase/types.ts` :
```ts
export type Role = 'free' | 'paid' | 'admin';
export type DocumentType = 'pdf' | 'schema';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  role: Role;
  newsletter_opt_in: boolean;
  created_at: string;
}

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  current_period_end: string | null;
}

export interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: DocumentType;
  storage_path: string;
  is_premium: boolean;
  category: string | null;
  tags: string[];
  created_at: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "feat: types DB partages"
```

---

## Task 7: Logique d'accès (TDD — cœur sécurité)

**Files:**
- Create: `src/lib/access.ts`
- Test: `src/lib/access.test.ts`

Cette unité répond à : « cet utilisateur a-t-il un accès premium ? » et « peut-il voir le fichier de ce document ? ». Logique pure, sans I/O, donc testable directement.

- [ ] **Step 1: Installer Vitest**

```bash
npm install -D vitest
```
Ajouter à `package.json` dans `"scripts"` : `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Écrire les tests qui échouent**

`src/lib/access.test.ts` :
```ts
import { describe, it, expect } from 'vitest';
import { hasPremiumAccess, canViewDocumentFile } from './access';
import type { Profile, SubscriptionRow, DocumentRow } from './supabase/types';

const baseProfile = (role: Profile['role']): Profile => ({
  id: 'u1', email: 'a@b.fr', full_name: null, display_name: null,
  role, newsletter_opt_in: false, created_at: '2026-01-01T00:00:00Z',
});

const sub = (status: string | null): SubscriptionRow => ({
  user_id: 'u1', stripe_customer_id: null, stripe_subscription_id: null,
  status, current_period_end: null,
});

const doc = (is_premium: boolean): DocumentRow => ({
  id: 'd1', title: 'T', description: null, author: null, type: 'pdf',
  storage_path: 'documents-free/d1.pdf', is_premium, category: null,
  tags: [], created_at: '2026-01-01T00:00:00Z',
});

describe('hasPremiumAccess', () => {
  it('admin a toujours accès premium', () => {
    expect(hasPremiumAccess(baseProfile('admin'), null)).toBe(true);
  });
  it('abonnement actif donne accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), sub('active'))).toBe(true);
  });
  it('abonnement past_due ne donne pas accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), sub('past_due'))).toBe(false);
  });
  it('aucun abonnement ne donne pas accès premium', () => {
    expect(hasPremiumAccess(baseProfile('free'), null)).toBe(false);
  });
});

describe('canViewDocumentFile', () => {
  it('document gratuit visible par un compte free', () => {
    expect(canViewDocumentFile(baseProfile('free'), null, doc(false))).toBe(true);
  });
  it('document premium NON visible par un compte free sans abonnement', () => {
    expect(canViewDocumentFile(baseProfile('free'), null, doc(true))).toBe(false);
  });
  it('document premium visible par un compte free avec abonnement actif', () => {
    expect(canViewDocumentFile(baseProfile('free'), sub('active'), doc(true))).toBe(true);
  });
  it('document premium visible par un admin', () => {
    expect(canViewDocumentFile(baseProfile('admin'), null, doc(true))).toBe(true);
  });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier l'échec**

Run: `npm test`
Expected: FAIL — `access.ts` n'exporte pas encore `hasPremiumAccess` / `canViewDocumentFile`.

- [ ] **Step 4: Écrire l'implémentation minimale**

`src/lib/access.ts` :
```ts
import type { Profile, SubscriptionRow, DocumentRow } from './supabase/types';

export function hasPremiumAccess(
  profile: Profile,
  subscription: SubscriptionRow | null,
): boolean {
  if (profile.role === 'admin') return true;
  return subscription?.status === 'active';
}

export function canViewDocumentFile(
  profile: Profile,
  subscription: SubscriptionRow | null,
  doc: DocumentRow,
): boolean {
  if (!doc.is_premium) return true;
  return hasPremiumAccess(profile, subscription);
}
```

- [ ] **Step 5: Lancer les tests pour vérifier le succès**

Run: `npm test`
Expected: PASS — 8 tests verts.

- [ ] **Step 6: Commit**

```bash
git add src/lib/access.ts src/lib/access.test.ts package.json package-lock.json
git commit -m "feat: logique d'acces premium (TDD)"
```

---

## Task 8: Clients Supabase (serveur, navigateur) + middleware session

**Files:**
- Create: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `middleware.ts`

- [ ] **Step 1: Client navigateur**

`src/lib/supabase/client.ts` :
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Client serveur (cookies)**

`src/lib/supabase/server.ts` :
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // appelé depuis un Server Component : ignoré, le middleware rafraîchit
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Middleware de rafraîchissement de session**

`middleware.ts` (racine du repo) :
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 4: Vérifier que l'app compile encore**

Run: `npm run build`
Expected: build réussit sans erreur TypeScript.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/server.ts src/lib/supabase/client.ts middleware.ts
git commit -m "feat: clients Supabase + middleware session"
```

---

## Task 9: Inscription / connexion / déconnexion

**Files:**
- Create: `src/app/auth/actions.ts`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`

- [ ] **Step 1: Server actions auth**

`src/app/auth/actions.ts` :
```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  redirect('/bibliotheque');
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/bibliotheque');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

Note : en dev local, `supabase start` désactive la confirmation email par défaut, donc `signUp` connecte directement. En production il faudra gérer l'email de confirmation.

- [ ] **Step 2: Page de connexion**

`src/app/login/page.tsx` :
```tsx
import { signIn } from '@/app/auth/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Connexion</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form action={signIn} className="mt-4 flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Email"
          className="border p-2 rounded" />
        <input name="password" type="password" required placeholder="Mot de passe"
          className="border p-2 rounded" />
        <button className="bg-black text-white p-2 rounded">Se connecter</button>
      </form>
      <p className="mt-4 text-sm">
        Pas de compte ? <a href="/signup" className="underline">S'inscrire</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Page d'inscription**

`src/app/signup/page.tsx` :
```tsx
import { signUp } from '@/app/auth/actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Inscription</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form action={signUp} className="mt-4 flex flex-col gap-3">
        <input name="email" type="email" required placeholder="Email"
          className="border p-2 rounded" />
        <input name="password" type="password" required minLength={6}
          placeholder="Mot de passe" className="border p-2 rounded" />
        <button className="bg-black text-white p-2 rounded">Créer mon compte</button>
      </form>
      <p className="mt-4 text-sm">
        Déjà un compte ? <a href="/login" className="underline">Se connecter</a>
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Vérification manuelle**

Run: `npm run dev`, ouvrir `/signup`, créer un compte `test@local.fr` / `password`.
Expected: redirection vers `/bibliotheque` (404 ou erreur de page tant que Task 10 pas faite, mais l'URL change → l'inscription a réussi). Vérifier dans Studio → table `profiles` qu'une ligne `role = free` a été créée par le trigger.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/actions.ts src/app/login/page.tsx src/app/signup/page.tsx
git commit -m "feat: inscription/connexion/deconnexion email+mot de passe"
```

---

## Task 10: Bibliothèque — liste des documents + filtres

**Files:**
- Create: `src/app/bibliotheque/page.tsx`, `src/components/DocumentCard.tsx`

- [ ] **Step 1: Carte document**

`src/components/DocumentCard.tsx` :
```tsx
import Link from 'next/link';
import type { DocumentRow } from '@/lib/supabase/types';

export function DocumentCard({ doc, locked }: { doc: DocumentRow; locked: boolean }) {
  return (
    <Link
      href={`/bibliotheque/${doc.id}`}
      className="block rounded border p-4 hover:shadow"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{doc.title}</h2>
        {doc.is_premium && (
          <span className="text-sm">{locked ? '🔒 Premium' : '✓ Premium'}</span>
        )}
      </div>
      {doc.description && <p className="mt-1 text-sm text-gray-600">{doc.description}</p>}
      {doc.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {doc.tags.map((t) => (
            <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">{t}</span>
          ))}
        </div>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Page bibliothèque (liste + filtre catégorie/tag)**

`src/app/bibliotheque/page.tsx` :
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasPremiumAccess } from '@/lib/access';
import { DocumentCard } from '@/components/DocumentCard';
import type { DocumentRow, Profile, SubscriptionRow } from '@/lib/supabase/types';

export default async function BibliothequePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (q) query = query.ilike('title', `%${q}%`);
  const { data: documents } = await query;

  const premium = hasPremiumAccess(profile as Profile, subscription as SubscriptionRow | null);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-bold">Bibliothèque</h1>
      <form className="mt-4 flex gap-2">
        <input name="q" placeholder="Rechercher un titre" className="border p-2 rounded flex-1" />
        <input name="category" placeholder="Catégorie" className="border p-2 rounded" />
        <button className="bg-black text-white px-4 rounded">Filtrer</button>
      </form>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(documents as DocumentRow[] ?? []).map((doc) => (
          <DocumentCard key={doc.id} doc={doc} locked={doc.is_premium && !premium} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Vérification manuelle**

Dans Studio → table `documents`, insérer manuellement 2 lignes (un `is_premium = false`, un `is_premium = true`, `type = 'pdf'`, `storage_path` quelconque). Ouvrir `/bibliotheque` connecté.
Expected: les 2 cartes s'affichent ; la premium montre 🔒 (compte free).

- [ ] **Step 4: Commit**

```bash
git add src/app/bibliotheque/page.tsx src/components/DocumentCard.tsx
git commit -m "feat: bibliotheque liste + filtres + cadenas premium"
```

---

## Task 11: Route URL signée (vérification d'accès serveur)

**Files:**
- Create: `src/app/api/documents/[id]/url/route.ts`

- [ ] **Step 1: Écrire la route**

`src/app/api/documents/[id]/url/route.ts` :
```ts
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { canViewDocumentFile } from '@/lib/access';
import type { Profile, SubscriptionRow, DocumentRow } from '@/lib/supabase/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const { data: doc } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const allowed = canViewDocumentFile(
    profile as Profile,
    subscription as SubscriptionRow | null,
    doc as DocumentRow,
  );
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // service role : génère l'URL signée sur le bucket privé
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const bucket = (doc as DocumentRow).is_premium ? 'documents-premium' : 'documents-free';
  const path = (doc as DocumentRow).storage_path;
  const { data: signed, error } = await admin.storage.from(bucket).createSignedUrl(path, 60);
  if (error || !signed) {
    return NextResponse.json({ error: 'signing failed' }, { status: 500 });
  }
  return NextResponse.json({ url: signed.signedUrl });
}
```

Note : `storage_path` stocke le chemin **dans** le bucket (ex. `2026/guide.pdf`), pas le nom du bucket. Le bucket est déduit de `is_premium`.

- [ ] **Step 2: Vérification manuelle (sécurité)**

Connecté en compte free, appeler `http://localhost:3000/api/documents/<id-du-doc-premium>/url`.
Expected: `403 forbidden`. Pour un doc gratuit : `{ "url": "..." }`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/documents/[id]/url/route.ts
git commit -m "feat: route URL signee avec verif d'acces serveur"
```

---

## Task 12: Fiche document — lecteur ou cadenas

**Files:**
- Create: `src/app/bibliotheque/[id]/page.tsx`, `src/components/PdfViewer.tsx`

- [ ] **Step 1: Composant lecteur (client)**

`src/components/PdfViewer.tsx` :
```tsx
'use client';

import { useEffect, useState } from 'react';
import type { DocumentType } from '@/lib/supabase/types';

export function PdfViewer({ docId, type }: { docId: string; type: DocumentType }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${docId}/url`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => setUrl(d.url))
      .catch((e) => setError(String(e)));
  }, [docId]);

  if (error) return <p className="text-red-600">Impossible de charger le document.</p>;
  if (!url) return <p>Chargement…</p>;
  if (type === 'schema') {
    return <img src={url} alt="Schéma" className="max-w-full rounded border" />;
  }
  return <object data={url} type="application/pdf" className="h-[80vh] w-full rounded border" />;
}
```

- [ ] **Step 2: Page fiche document**

`src/app/bibliotheque/[id]/page.tsx` :
```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { canViewDocumentFile } from '@/lib/access';
import { PdfViewer } from '@/components/PdfViewer';
import type { Profile, SubscriptionRow, DocumentRow } from '@/lib/supabase/types';

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const { data: doc } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!doc) redirect('/bibliotheque');

  const allowed = canViewDocumentFile(
    profile as Profile,
    subscription as SubscriptionRow | null,
    doc as DocumentRow,
  );

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/bibliotheque" className="text-sm underline">← Bibliothèque</Link>
      <h1 className="mt-2 text-2xl font-bold">{(doc as DocumentRow).title}</h1>
      {(doc as DocumentRow).author && (
        <p className="text-sm text-gray-600">Par {(doc as DocumentRow).author}</p>
      )}
      {(doc as DocumentRow).description && (
        <p className="mt-2">{(doc as DocumentRow).description}</p>
      )}
      <div className="mt-6">
        {allowed ? (
          <PdfViewer docId={(doc as DocumentRow).id} type={(doc as DocumentRow).type} />
        ) : (
          <div className="rounded border bg-gray-50 p-8 text-center">
            <p className="text-lg">🔒 Ce document est réservé aux abonnés.</p>
            <p className="mt-2 text-sm text-gray-600">
              L'abonnement sera disponible prochainement.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
```

Note : le CTA « S'abonner » mènera au checkout en Phase 2 ; ici, message d'attente. C'est volontaire (hors périmètre Phase 1).

- [ ] **Step 3: Vérification manuelle**

Uploader un PDF dans le bucket `documents-free` via Studio → Storage, noter son chemin, et faire pointer un document gratuit dessus (`storage_path`). Ouvrir sa fiche connecté en free.
Expected: le PDF s'affiche dans le lecteur. Pour un doc premium : bloc cadenas, pas de lecteur.

- [ ] **Step 4: Commit**

```bash
git add src/app/bibliotheque/[id]/page.tsx src/components/PdfViewer.tsx
git commit -m "feat: fiche document avec lecteur ou cadenas"
```

---

## Task 13: Garde admin + layout admin

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Layout admin avec garde de rôle**

`src/app/admin/layout.tsx` :
```tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/bibliotheque');

  return (
    <div className="mx-auto max-w-4xl p-8">
      <nav className="mb-6 flex gap-4 border-b pb-2 text-sm">
        <Link href="/admin/documents" className="underline">Documents</Link>
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Promouvoir un compte admin en base**

Dans Studio → SQL editor, exécuter (remplacer l'email) :
```sql
update public.profiles set role = 'admin' where email = 'test@local.fr';
```

- [ ] **Step 3: Vérification manuelle**

Connecté avec ce compte, ouvrir `/admin/documents`.
Expected: pas de redirection (page 404 tant que Task 14 pas faite, mais l'accès est autorisé). Avec un compte free → redirigé vers `/bibliotheque`.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: garde admin par role"
```

---

## Task 14: Admin — upload de document

**Files:**
- Create: `src/app/admin/documents/page.tsx`, `src/app/admin/documents/new/page.tsx`, `src/app/admin/documents/actions.ts`

- [ ] **Step 1: Server action de création**

`src/app/admin/documents/actions.ts` :
```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function createDocument(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/bibliotheque');

  const title = String(formData.get('title'));
  const description = String(formData.get('description') || '') || null;
  const author = String(formData.get('author') || '') || null;
  const category = String(formData.get('category') || '') || null;
  const type = String(formData.get('type')) as 'pdf' | 'schema';
  const isPremium = formData.get('is_premium') === 'on';
  const tags = String(formData.get('tags') || '')
    .split(',').map((t) => t.trim()).filter(Boolean);
  const file = formData.get('file') as File;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const bucket = isPremium ? 'documents-premium' : 'documents-free';
  const path = `${Date.now()}-${file.name}`;
  const { error: upErr } = await admin.storage.from(bucket)
    .upload(path, file, { upsert: false });
  if (upErr) redirect(`/admin/documents/new?error=${encodeURIComponent(upErr.message)}`);

  const { error: insErr } = await admin.from('documents').insert({
    title, description, author, category, type,
    is_premium: isPremium, tags, storage_path: path,
  });
  if (insErr) redirect(`/admin/documents/new?error=${encodeURIComponent(insErr.message)}`);

  redirect('/admin/documents');
}
```

- [ ] **Step 2: Formulaire d'upload**

`src/app/admin/documents/new/page.tsx` :
```tsx
import { createDocument } from '../actions';

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-xl font-bold">Nouveau document</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form action={createDocument} className="mt-4 flex flex-col gap-3">
        <input name="title" required placeholder="Titre" className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" className="border p-2 rounded" />
        <input name="author" placeholder="Auteur" className="border p-2 rounded" />
        <input name="category" placeholder="Catégorie" className="border p-2 rounded" />
        <input name="tags" placeholder="Tags (séparés par des virgules)" className="border p-2 rounded" />
        <select name="type" className="border p-2 rounded">
          <option value="pdf">PDF</option>
          <option value="schema">Schéma (image)</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_premium" /> Premium
        </label>
        <input type="file" name="file" required className="border p-2 rounded" />
        <button className="bg-black text-white p-2 rounded">Publier</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Liste admin des documents**

`src/app/admin/documents/page.tsx` :
```tsx
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { DocumentRow } from '@/lib/supabase/types';

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from('documents').select('*').order('created_at', { ascending: false });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Documents</h1>
        <Link href="/admin/documents/new" className="bg-black text-white px-3 py-1 rounded text-sm">
          + Nouveau
        </Link>
      </div>
      <ul className="mt-4 divide-y">
        {(documents as DocumentRow[] ?? []).map((d) => (
          <li key={d.id} className="py-2 flex justify-between">
            <span>{d.title}</span>
            <span className="text-sm text-gray-500">
              {d.is_premium ? 'Premium' : 'Gratuit'} · {d.type}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Vérification manuelle (parcours complet)**

Connecté admin : `/admin/documents/new`, remplir, choisir un PDF, cocher Premium, publier.
Expected: redirection vers `/admin/documents`, le doc apparaît. Le fichier est dans le bucket `documents-premium` (Studio → Storage). Sur `/bibliotheque` en compte free, ce doc montre 🔒 et sa fiche affiche le cadenas, pas le PDF.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/documents/
git commit -m "feat: admin upload et liste des documents"
```

---

## Task 15: Navigation & déconnexion dans le layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Barre de navigation avec état de session**

Remplacer le contenu de `src/app/layout.tsx` :
```tsx
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin';
  }
  return (
    <html lang="fr">
      <body>
        <header className="border-b">
          <nav className="mx-auto flex max-w-4xl items-center justify-between p-4 text-sm">
            <Link href="/" className="font-bold">Droit rural</Link>
            <div className="flex items-center gap-4">
              <Link href="/bibliotheque" className="underline">Bibliothèque</Link>
              {isAdmin && <Link href="/admin/documents" className="underline">Admin</Link>}
              {user ? (
                <form action={signOut}><button className="underline">Déconnexion</button></form>
              ) : (
                <Link href="/login" className="underline">Connexion</Link>
              )}
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Vérification manuelle**

Recharger n'importe quelle page.
Expected: barre de nav visible ; « Admin » seulement pour l'admin ; « Déconnexion » fonctionne et renvoie vers `/login`.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: navigation + deconnexion dans le layout"
```

---

## Task 16: Seed de développement

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Écrire le seed (documents de démo)**

`supabase/seed.sql` :
```sql
-- Documents de démonstration (les fichiers storage doivent être uploadés à la main
-- via Studio, ou par l'admin via l'UI ; ce seed ne crée que les métadonnées).
insert into public.documents (title, description, author, type, storage_path, is_premium, category, tags)
values
  ('Introduction au bail rural', 'Les bases du bail rural expliquées simplement.',
   'Élisa', 'pdf', 'demo/intro-bail-rural.pdf', false, 'Baux', array['bail','débutant']),
  ('Schéma : cycle du fermage', 'Schéma explicatif du cycle du fermage.',
   'Élisa', 'schema', 'demo/cycle-fermage.png', true, 'Baux', array['fermage','schéma'])
on conflict do nothing;
```

- [ ] **Step 2: Appliquer le seed**

Run: `supabase db reset`
Expected: réapplique toutes les migrations + le seed. ⚠️ Cela efface les données locales — refaire l'inscription du compte de test et le `update ... set role='admin'` après. Vérifier que 2 documents existent dans la table.

Note : `db reset` est destructif **uniquement** pour la base de dev locale. Aucun impact production.

- [ ] **Step 3: Commit**

```bash
git add supabase/seed.sql
git commit -m "chore: seed documents de demo"
```

---

## Task 17: Vérification finale Phase 1

- [ ] **Step 1: Tous les tests unitaires passent**

Run: `npm test`
Expected: PASS (logique d'accès).

- [ ] **Step 2: Build de production réussit**

Run: `npm run build`
Expected: build sans erreur TypeScript ni ESLint bloquant.

- [ ] **Step 3: Parcours E2E manuel complet**

1. Inscription d'un nouveau compte → arrive sur `/bibliotheque`.
2. Le doc premium montre 🔒 ; sa fiche affiche le cadenas (pas de PDF).
3. Le doc gratuit s'ouvre dans le lecteur.
4. Promotion du compte en `admin` via SQL → le lien « Admin » apparaît.
5. Upload d'un nouveau document premium via l'admin → visible verrouillé côté free.
6. En base, passer manuellement le compte test en `role = 'paid'` ET insérer une ligne `subscriptions` avec `status = 'active'` pour ce `user_id` → le doc premium devient lisible.
Expected: chaque étape se comporte comme décrit.

- [ ] **Step 4: Commit final / tag**

```bash
git add -A
git commit -m "chore: phase 1 verifiee" --allow-empty
```

---

## Self-Review (couverture du spec)

- **Auth email + mot de passe** → Tasks 9, 8 (clients/session). ✅
- **Table `profiles` + nom/surnom/rôle/opt-in** → Task 3. ✅ (champ opt-in présent, utilisé en Phase 3.)
- **Bibliothèque liste + filtres (catégorie/tags)** → Task 10. ✅
- **Lecteur PDF/schéma en ligne** → Task 12. ✅
- **Drapeau premium + premium visibles verrouillés (cadenas + CTA d'attente)** → Tasks 10, 12. ✅
- **Buckets storage + URLs signées + RLS** → Tasks 4, 5, 11. ✅
- **Logique d'accès testée (TDD)** → Task 7. ✅
- **Admin minimal : upload + flag premium + auteur/tags** → Tasks 13, 14. ✅
- **Documents : author + tags** → Task 3 (schéma), Task 14 (formulaire). ✅

Hors périmètre Phase 1 (conforme au spec) : Stripe (Phase 2), newsletter (Phase 3). Le rôle `paid` et la table `subscriptions` existent mais ne sont alimentés que manuellement.

**Cohérence des types :** `hasPremiumAccess(profile, subscription)` et `canViewDocumentFile(profile, subscription, doc)` utilisés à l'identique dans Tasks 7, 10, 11, 12. Buckets nommés `documents-free` / `documents-premium` partout (Tasks 5, 11, 14). `storage_path` = chemin interne au bucket, bucket déduit de `is_premium` (Tasks 11, 14, cohérent).
