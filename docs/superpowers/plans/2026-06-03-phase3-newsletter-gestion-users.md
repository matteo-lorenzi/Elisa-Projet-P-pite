# Phase 3 — Newsletter & gestion utilisateurs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'opt-in newsletter RGPD, la rédaction/envoi d'éditions par l'admin via Resend, la désinscription tokenisée sans login, et un tableau de gestion utilisateurs enrichi.

**Architecture:** Fonctions pures testées (token HMAC, markdown→HTML) isolées dans `src/lib`. Envoi synchrone par batch Resend depuis une server action gardée admin. Désinscription stateless via token HMAC vérifié côté serveur (service-role). Toutes écritures hors « propre ligne » via service-role après re-check admin (pattern Phase 2).

**Tech Stack:** Next.js 16 (App Router, server actions, server components), Supabase (Auth + RLS + service-role), Resend (email), `marked` (markdown), Node `crypto` (HMAC), Vitest (tests).

**Spec:** `docs/superpowers/specs/2026-06-03-phase3-newsletter-gestion-users-design.md`

---

## File Structure

| Fichier | Responsabilité |
|---------|----------------|
| `src/lib/newsletter-token.ts` (+ `.test.ts`) | `sign(userId)` / `verify(token)` HMAC stateless |
| `src/lib/markdown.ts` (+ `.test.ts`) | markdown → HTML sûr (raw HTML échappé) |
| `src/lib/resend.ts` | client Resend + helper d'envoi batch |
| `src/lib/newsletter-email.ts` (+ `.test.ts`) | construction du HTML d'email (corps + pied désinscription) |
| `src/app/auth/actions.ts` | `signUp` écrit `newsletter_opt_in` |
| `src/app/signup/page.tsx` | checkbox opt-in |
| `src/app/profil/page.tsx` + `actions.ts` | page profil + toggle opt-in |
| `src/app/api/newsletter/unsubscribe/route.ts` | désinscription tokenisée |
| `src/app/admin/newsletter/page.tsx` + `actions.ts` | rédaction / preview / envoi / historique |
| `src/app/admin/users/page.tsx` + `actions.ts` | tableau enrichi + recherche + compteurs (action `setUserRole` conservée) |
| `src/app/api/admin/users/export/route.ts` | export CSV |
| `src/app/admin/layout.tsx` | lien nav « Newsletter » |
| `src/lib/supabase/types.ts` | type `NewsletterEdition` |

Pas de migration : `profiles.newsletter_opt_in` et `newsletter_editions` existent (0001), RLS admin-only posée (0002).

---

## Task 1: Dépendances & variables d'environnement

**Files:**
- Modify: `package.json` (via npm)
- Modify: `.env.local` (gitignored, non commité)

- [ ] **Step 1: Installer les dépendances**

Run:
```bash
npm install resend marked
```
Expected: `resend` et `marked` ajoutés à `dependencies`, aucune erreur.

- [ ] **Step 2: Ajouter les variables d'environnement**

Ajouter à `.env.local` (ne PAS committer) :
```
RESEND_API_KEY=re_xxx
NEWSLETTER_FROM=onboarding@resend.dev
NEWSLETTER_UNSUBSCRIBE_SECRET=<chaîne aléatoire forte, ex. openssl rand -hex 32>
```
Note : en dev local, `onboarding@resend.dev` permet d'envoyer sans domaine vérifié (uniquement vers l'email du compte Resend). Mailpit local ne reçoit PAS les emails Resend (Resend est un service externe) — tester l'envoi réel avec l'adresse du compte Resend, ou inspecter le payload en loggant.

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: build OK (aucune utilisation des deps encore, juste installées).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(phase3): dependances resend + marked"
```

---

## Task 2: Token de désinscription HMAC (TDD)

**Files:**
- Create: `src/lib/newsletter-token.ts`
- Test: `src/lib/newsletter-token.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/newsletter-token.test.ts` :
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { sign, verify } from './newsletter-token';

beforeAll(() => {
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'secret-de-test';
});

describe('newsletter-token', () => {
  it('aller-retour sign/verify rend le userId', () => {
    const token = sign('user-123');
    expect(verify(token)).toBe('user-123');
  });

  it('rejette un token falsifié (mauvaise signature)', () => {
    const token = sign('user-123');
    const falsifie = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verify(falsifie)).toBeNull();
  });

  it('rejette un token sans point / tronqué', () => {
    expect(verify('pasdepoint')).toBeNull();
    expect(verify('user-123.')).toBeNull();
    expect(verify('')).toBeNull();
  });

  it('rejette un userId substitué (signature ne matche plus)', () => {
    const token = sign('user-123');
    const sig = token.split('.')[1];
    expect(verify(`autre-user.${sig}`)).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test → échoue**

Run: `npm test -- newsletter-token`
Expected: FAIL (`sign`/`verify` introuvables).

- [ ] **Step 3: Implémenter**

`src/lib/newsletter-token.ts` :
```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const s = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!s) throw new Error('NEWSLETTER_UNSUBSCRIBE_SECRET manquant');
  return s;
}

function hmac(userId: string): string {
  return createHmac('sha256', secret()).update(userId).digest('hex');
}

/** Construit un token de désinscription "<userId>.<hmac>". */
export function sign(userId: string): string {
  return `${userId}.${hmac(userId)}`;
}

/** Vérifie un token ; renvoie le userId si valide, sinon null. */
export function verify(token: string): string | null {
  const idx = token.lastIndexOf('.');
  if (idx <= 0 || idx === token.length - 1) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = hmac(userId);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}
```

- [ ] **Step 4: Lancer le test → passe**

Run: `npm test -- newsletter-token`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter-token.ts src/lib/newsletter-token.test.ts
git commit -m "feat(newsletter): token de desinscription HMAC stateless"
```

---

## Task 3: Rendu markdown sûr (TDD)

**Files:**
- Create: `src/lib/markdown.ts`
- Test: `src/lib/markdown.test.ts`

Approche : échapper `& < >` dans la source AVANT `marked` (la syntaxe markdown — `# * [] () -` — n'utilise pas ces caractères), ce qui neutralise tout HTML brut tout en laissant le markdown fonctionner. Pas de sanitizer externe.

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/markdown.test.ts` :
```ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('rend un titre et un paragraphe', () => {
    const html = renderMarkdown('# Titre\n\nUn paragraphe.');
    expect(html).toContain('<h1>Titre</h1>');
    expect(html).toContain('<p>Un paragraphe.</p>');
  });

  it('rend une liste et un lien', () => {
    const html = renderMarkdown('- a\n- b\n\n[lien](https://ex.fr)');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('href="https://ex.fr"');
  });

  it('échappe le HTML brut injecté', () => {
    const html = renderMarkdown('Bonjour <script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});
```

- [ ] **Step 2: Lancer le test → échoue**

Run: `npm test -- markdown`
Expected: FAIL (`renderMarkdown` introuvable).

- [ ] **Step 3: Implémenter**

`src/lib/markdown.ts` :
```ts
import { marked } from 'marked';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Markdown -> HTML. Le HTML brut de la source est échappé (anti-injection). */
export function renderMarkdown(md: string): string {
  // marked.parse est synchrone quand async:false (défaut).
  return marked.parse(escapeHtml(md), { async: false }) as string;
}
```

- [ ] **Step 4: Lancer le test → passe**

Run: `npm test -- markdown`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts
git commit -m "feat(newsletter): rendu markdown sur (HTML brut echappe)"
```

---

## Task 4: Construction du HTML d'email (TDD)

**Files:**
- Create: `src/lib/newsletter-email.ts`
- Test: `src/lib/newsletter-email.test.ts`

Le corps HTML est rendu une fois ; le pied de désinscription est personnalisé par destinataire (lien avec token signé).

- [ ] **Step 1: Écrire le test qui échoue**

`src/lib/newsletter-email.test.ts` :
```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { buildEmailHtml } from './newsletter-email';

beforeAll(() => {
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'secret-de-test';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';
});

describe('buildEmailHtml', () => {
  it('insère le corps et un lien de désinscription tokenisé', () => {
    const html = buildEmailHtml('<p>Bonjour</p>', 'user-123');
    expect(html).toContain('<p>Bonjour</p>');
    expect(html).toContain('/api/newsletter/unsubscribe?token=user-123.');
    expect(html).toContain('https://site.test');
  });
});
```

- [ ] **Step 2: Lancer le test → échoue**

Run: `npm test -- newsletter-email`
Expected: FAIL (`buildEmailHtml` introuvable).

- [ ] **Step 3: Implémenter**

`src/lib/newsletter-email.ts` :
```ts
import { sign } from './newsletter-token';

/** Compose le HTML final d'un email pour un destinataire (corps + pied désinscription). */
export function buildEmailHtml(bodyHtml: string, userId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const url = `${base}/api/newsletter/unsubscribe?token=${encodeURIComponent(sign(userId))}`;
  return `${bodyHtml}
<hr style="margin-top:32px;border:none;border-top:1px solid #ddd" />
<p style="font-size:12px;color:#888">
  Vous recevez cet email car vous êtes inscrit à la newsletter.
  <a href="${url}">Se désinscrire</a>.
</p>`;
}
```

- [ ] **Step 4: Lancer le test → passe**

Run: `npm test -- newsletter-email`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter-email.ts src/lib/newsletter-email.test.ts
git commit -m "feat(newsletter): construction HTML email avec pied desinscription"
```

---

## Task 5: Client Resend + envoi batch

**Files:**
- Create: `src/lib/resend.ts`

Pas de test unitaire (wrapper d'un service externe). Vérif par build.

- [ ] **Step 1: Implémenter le client + helper**

`src/lib/resend.ts` :
```ts
import { Resend } from 'resend';

export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY manquant');
  return new Resend(key);
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  sent: number;
  failed: number;
}

/** Envoie une liste d'emails par lots de 100 (batch Resend). Un échec n'interrompt pas. */
export async function sendBatch(emails: OutgoingEmail[]): Promise<SendResult> {
  const from = process.env.NEWSLETTER_FROM;
  if (!from) throw new Error('NEWSLETTER_FROM manquant');
  const resend = getResend();
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(
        chunk.map((e) => ({ from, to: e.to, subject: e.subject, html: e.html })),
      );
      if (error) {
        failed += chunk.length;
        console.error('Resend batch error:', error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      console.error('Resend batch exception:', err);
    }
  }
  return { sent, failed };
}
```

- [ ] **Step 2: Vérifier le build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat(newsletter): client resend + envoi par batch"
```

---

## Task 6: Opt-in à l'inscription

**Files:**
- Modify: `src/app/auth/actions.ts`
- Modify: `src/app/signup/page.tsx`

- [ ] **Step 1: Ajouter la checkbox au formulaire**

Dans `src/app/signup/page.tsx`, ajouter avant le bouton submit :
```tsx
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="newsletter" value="on" />
          Recevoir la newsletter (vous pourrez vous désinscrire à tout moment)
        </label>
```

- [ ] **Step 2: Écrire l'opt-in dans `signUp`**

Dans `src/app/auth/actions.ts`, remplacer la fonction `signUp` par :
```ts
export async function signUp(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const optIn = formData.get('newsletter') === 'on';
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  // Session active en dev (confirmation désactivée) : on écrit l'opt-in sur sa propre ligne.
  if (optIn && data.user) {
    await supabase.from('profiles').update({ newsletter_opt_in: true }).eq('id', data.user.id);
  }
  redirect('/bibliotheque');
}
```

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 4: Vérification manuelle**

Démarrer `npm run dev`, créer un compte avec la case cochée, puis dans Studio SQL :
`select email, newsletter_opt_in from public.profiles order by created_at desc limit 1;`
Expected: `newsletter_opt_in = true`.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/actions.ts src/app/signup/page.tsx
git commit -m "feat(newsletter): opt-in RGPD a l'inscription"
```

---

## Task 7: Page profil + toggle opt-in

**Files:**
- Create: `src/app/profil/page.tsx`
- Create: `src/app/profil/actions.ts`

- [ ] **Step 1: Créer l'action**

`src/app/profil/actions.ts` :
```ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function setNewsletterOptIn(formData: FormData) {
  const optIn = formData.get('newsletter') === 'on';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  // Écriture sur sa propre ligne (RLS profiles_update_own autorise).
  const { error } = await supabase
    .from('profiles').update({ newsletter_opt_in: optIn }).eq('id', user.id);
  if (error) throw new Error(error.message);
  revalidatePath('/profil');
}
```

- [ ] **Step 2: Créer la page**

`src/app/profil/page.tsx` :
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setNewsletterOptIn } from './actions';

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('email, newsletter_opt_in').eq('id', user.id).single();

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Mon profil</h1>
      <p className="mt-2 text-sm text-gray-600">{profile?.email}</p>
      <form action={setNewsletterOptIn} className="mt-6 flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="newsletter"
            value="on"
            defaultChecked={profile?.newsletter_opt_in ?? false}
          />
          Recevoir la newsletter
        </label>
        <button className="rounded bg-black px-3 py-2 text-white">Enregistrer</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: build OK, route `/profil` listée.

- [ ] **Step 4: Vérification manuelle**

Se connecter, ouvrir `/profil`, cocher/décocher + enregistrer, vérifier la persistance après reload.

- [ ] **Step 5: Commit**

```bash
git add src/app/profil/page.tsx src/app/profil/actions.ts
git commit -m "feat(newsletter): page profil avec toggle opt-in"
```

---

## Task 8: Route de désinscription tokenisée

**Files:**
- Create: `src/app/api/newsletter/unsubscribe/route.ts`

- [ ] **Step 1: Implémenter la route GET**

`src/app/api/newsletter/unsubscribe/route.ts` :
```ts
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verify } from '@/lib/newsletter-token';

function html(body: string): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
     <meta name="viewport" content="width=device-width,initial-scale=1" />
     <title>Désinscription</title></head>
     <body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem">
     ${body}</body></html>`,
    { headers: { 'content-type': 'text/html; charset=utf-8' } },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const userId = verify(token);
  if (!userId) {
    return html('<h1>Lien invalide</h1><p>Ce lien de désinscription n\'est pas valide.</p>');
  }
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { error } = await adminDb
    .from('profiles').update({ newsletter_opt_in: false }).eq('id', userId);
  if (error) {
    return html('<h1>Erreur</h1><p>Réessayez plus tard.</p>');
  }
  return html('<h1>Désinscription confirmée</h1><p>Vous ne recevrez plus la newsletter.</p>');
}
```

- [ ] **Step 2: Vérifier le build**

Run: `npm run build`
Expected: build OK, route `/api/newsletter/unsubscribe` listée.

- [ ] **Step 3: Vérification manuelle**

Dans un node REPL ou un petit script, générer un token pour un userId réel
(`node -e "process.env.NEWSLETTER_UNSUBSCRIBE_SECRET='...'; const {sign}=require('./...');"`),
ou récupérer le lien depuis un email envoyé (Task 9). Ouvrir l'URL → page de confirmation,
puis vérifier en SQL que `newsletter_opt_in = false`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/newsletter/unsubscribe/route.ts
git commit -m "feat(newsletter): route de desinscription tokenisee sans login"
```

---

## Task 9: Admin — rédaction, preview, envoi, historique

**Files:**
- Create: `src/app/admin/newsletter/page.tsx`
- Create: `src/app/admin/newsletter/actions.ts`
- Modify: `src/lib/supabase/types.ts` (type `NewsletterEdition`)
- Modify: `src/app/admin/layout.tsx` (lien nav)

- [ ] **Step 1: Ajouter le type**

Dans `src/lib/supabase/types.ts`, ajouter :
```ts
export interface NewsletterEdition {
  id: string;
  subject: string;
  body_html: string;
  sent_at: string | null;
}
```

- [ ] **Step 2: Ajouter le lien de navigation admin**

Dans `src/app/admin/layout.tsx`, dans le `<nav>`, après le lien Utilisateurs :
```tsx
        <Link href="/admin/newsletter" className="underline">Newsletter</Link>
```

- [ ] **Step 3: Implémenter les actions**

`src/app/admin/newsletter/actions.ts` :
```ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { renderMarkdown } from '@/lib/markdown';
import { buildEmailHtml } from '@/lib/newsletter-email';
import { sendBatch, type OutgoingEmail } from '@/lib/resend';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('non authentifié');
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') throw new Error('accès refusé');
}

function adminDb() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function saveDraft(formData: FormData) {
  await assertAdmin();
  const subject = String(formData.get('subject')).trim();
  const md = String(formData.get('body_md'));
  if (!subject) throw new Error('sujet requis');
  const body_html = renderMarkdown(md);
  const { error } = await adminDb()
    .from('newsletter_editions').insert({ subject, body_html, sent_at: null });
  if (error) throw new Error(error.message);
  revalidatePath('/admin/newsletter');
}

export async function sendEdition(formData: FormData) {
  await assertAdmin();
  const subject = String(formData.get('subject')).trim();
  const md = String(formData.get('body_md'));
  if (!subject) throw new Error('sujet requis');
  const body_html = renderMarkdown(md);

  const db = adminDb();
  const { data: recipients, error: recErr } = await db
    .from('profiles').select('id, email').eq('newsletter_opt_in', true);
  if (recErr) throw new Error(recErr.message);
  if (!recipients || recipients.length === 0) {
    revalidatePath('/admin/newsletter');
    redirect('/admin/newsletter?msg=' + encodeURIComponent('aucun inscrit'));
  }

  const emails: OutgoingEmail[] = recipients.map((r) => ({
    to: r.email,
    subject,
    html: buildEmailHtml(body_html, r.id),
  }));
  const { sent, failed } = await sendBatch(emails);

  const { error: insErr } = await db
    .from('newsletter_editions')
    .insert({ subject, body_html, sent_at: new Date().toISOString() });
  if (insErr) throw new Error(insErr.message);

  revalidatePath('/admin/newsletter');
  redirect('/admin/newsletter?msg=' + encodeURIComponent(`envoyé: ${sent}, échecs: ${failed}`));
}
```

Note : `redirect` lance une exception de contrôle de flux (NEXT_REDIRECT) — appelé en dernier dans chaque branche, c'est volontaire et ne doit pas être enveloppé dans un try/catch.

- [ ] **Step 4: Implémenter la page (form + preview + historique)**

`src/app/admin/newsletter/page.tsx` :
```tsx
import { createClient } from '@/lib/supabase/server';
import { renderMarkdown } from '@/lib/markdown';
import { saveDraft, sendEdition } from './actions';
import type { NewsletterEdition } from '@/lib/supabase/types';

export default async function AdminNewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; preview?: string }>;
}) {
  const { msg, preview } = await searchParams;
  const supabase = await createClient();
  const { data: editions } = await supabase
    .from('newsletter_editions')
    .select('*')
    .order('sent_at', { ascending: false, nullsFirst: true });

  return (
    <main>
      <h1 className="text-2xl font-bold">Newsletter</h1>
      {msg && <p className="mt-2 rounded bg-gray-100 p-2 text-sm">{msg}</p>}

      <form className="mt-4 flex flex-col gap-3">
        <input name="subject" required placeholder="Sujet"
          className="border p-2 rounded" defaultValue="" />
        <textarea name="body_md" rows={10} placeholder="Corps en Markdown"
          className="border p-2 rounded font-mono text-sm" defaultValue={preview ?? ''} />
        <div className="flex gap-2">
          <button formAction={saveDraft}
            className="rounded border px-3 py-2">Enregistrer brouillon</button>
          <button formAction={sendEdition}
            className="rounded bg-black px-3 py-2 text-white">Envoyer</button>
        </div>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Historique</h2>
      <table className="mt-2 w-full text-sm">
        <thead>
          <tr className="text-left"><th className="py-2">Sujet</th><th>Statut</th></tr>
        </thead>
        <tbody>
          {(editions as NewsletterEdition[] ?? []).map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2">{e.subject}</td>
              <td>{e.sent_at ? `envoyé le ${new Date(e.sent_at).toLocaleString('fr-FR')}` : 'brouillon'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

Note : la preview live (rendu HTML avant envoi) est volontairement simple — l'admin peut enregistrer un brouillon puis vérifier. `renderMarkdown` est importé pour un éventuel bloc de preview ; si non utilisé, retirer l'import pour éviter un warning lint.

- [ ] **Step 5: Vérifier le build**

Run: `npm run build`
Expected: build OK, route `/admin/newsletter` listée.

- [ ] **Step 6: Vérification manuelle**

En tant qu'admin : ouvrir `/admin/newsletter`, écrire un sujet + markdown, « Enregistrer brouillon » → apparaît en historique (brouillon). « Envoyer » → message `envoyé: N`, l'édition passe en « envoyé », email reçu sur l'adresse du compte Resend, le lien de désinscription fonctionne (Task 8).

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/newsletter src/lib/supabase/types.ts src/app/admin/layout.tsx
git commit -m "feat(newsletter): redaction, envoi resend et historique admin"
```

---

## Task 10: Tableau de gestion utilisateurs enrichi

**Files:**
- Modify: `src/app/admin/users/page.tsx`
- (action `setUserRole` inchangée dans `src/app/admin/users/actions.ts`)

Volume faible → on charge tous les profils (+ statut abonnement via embedding Postgrest) et on filtre/compte en mémoire selon `searchParams`.

- [ ] **Step 1: Réécrire la page avec colonnes, filtres et compteurs**

`src/app/admin/users/page.tsx` :
```tsx
import { createClient } from '@/lib/supabase/server';
import { setUserRole } from './actions';
import type { Profile, Role } from '@/lib/supabase/types';

const ROLES: Role[] = ['free', 'paid', 'admin'];

type Row = Profile & { subscriptions: { status: string | null } | null };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; status?: string }>;
}) {
  const { q, role, status } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('*, subscriptions(status)')
    .order('created_at', { ascending: true });

  const all = (data as Row[] | null) ?? [];
  const subStatus = (r: Row) => r.subscriptions?.status ?? null;

  const filtered = all.filter((r) => {
    if (q && !r.email.toLowerCase().includes(q.toLowerCase())) return false;
    if (role && r.role !== role) return false;
    if (status === 'active' && subStatus(r) !== 'active') return false;
    if (status === 'past_due' && subStatus(r) !== 'past_due') return false;
    if (status === 'none' && subStatus(r)) return false;
    return true;
  });

  const total = all.length;
  const activeSubs = all.filter((r) => subStatus(r) === 'active').length;
  const newsletter = all.filter((r) => r.newsletter_opt_in).length;

  return (
    <main>
      <h1 className="text-2xl font-bold">Utilisateurs</h1>

      <div className="mt-3 flex gap-4 text-sm">
        <span>Total : <strong>{total}</strong></span>
        <span>Abonnés actifs : <strong>{activeSubs}</strong></span>
        <span>Inscrits newsletter : <strong>{newsletter}</strong></span>
      </div>

      <form className="mt-4 flex flex-wrap gap-2 text-sm" method="get">
        <input name="q" defaultValue={q ?? ''} placeholder="Rechercher email"
          className="border p-1 rounded" />
        <select name="role" defaultValue={role ?? ''} className="border p-1 rounded">
          <option value="">Tous rôles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ''} className="border p-1 rounded">
          <option value="">Tout abonnement</option>
          <option value="active">active</option>
          <option value="past_due">past_due</option>
          <option value="none">aucun</option>
        </select>
        <button className="rounded border px-3">Filtrer</button>
        <a href="/api/admin/users/export" className="rounded border px-3 py-1">Export CSV</a>
      </form>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="py-2">Email</th><th>Rôle</th><th>Abonnement</th>
            <th>Newsletter</th><th>Inscrit le</th><th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="py-2">{p.email}</td>
              <td>{p.role}</td>
              <td>{subStatus(p) ?? '—'}</td>
              <td>{p.newsletter_opt_in ? '✓' : '—'}</td>
              <td>{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
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

- [ ] **Step 2: Vérifier le build**

Run: `npm run build`
Expected: build OK.

- [ ] **Step 3: Vérification manuelle**

En admin : `/admin/users` montre colonnes enrichies + compteurs ; recherche par email et filtres rôle/statut fonctionnent ; changement de rôle toujours opérationnel.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/users/page.tsx
git commit -m "feat(admin): tableau users enrichi (colonnes, recherche, compteurs)"
```

---

## Task 11: Export CSV des utilisateurs

**Files:**
- Create: `src/app/api/admin/users/export/route.ts`

- [ ] **Step 1: Implémenter la route GET**

`src/app/api/admin/users/export/route.ts` :
```ts
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function csvField(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  // Re-check admin (pas seulement le layout — c'est une route directe).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('non authentifié', { status: 401 });
  const { data: me } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (me?.role !== 'admin') return new Response('accès refusé', { status: 403 });

  const adminDb = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data } = await adminDb
    .from('profiles')
    .select('email, role, newsletter_opt_in, created_at, subscriptions(status)')
    .order('created_at', { ascending: true });

  type Row = {
    email: string; role: string; newsletter_opt_in: boolean;
    created_at: string; subscriptions: { status: string | null } | null;
  };
  const rows = (data as Row[] | null) ?? [];

  const header = ['email', 'role', 'abonnement', 'newsletter', 'inscrit_le'];
  const lines = rows.map((r) => [
    r.email,
    r.role,
    r.subscriptions?.status ?? '',
    r.newsletter_opt_in ? 'oui' : 'non',
    r.created_at,
  ].map(csvField).join(','));
  const csv = [header.map(csvField).join(','), ...lines].join('\r\n');

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="utilisateurs.csv"',
    },
  });
}
```

- [ ] **Step 2: Vérifier le build**

Run: `npm run build`
Expected: build OK, route `/api/admin/users/export` listée.

- [ ] **Step 3: Vérification manuelle**

En admin : cliquer « Export CSV » dans `/admin/users` → téléchargement de `utilisateurs.csv` avec les colonnes attendues. Tester en non-admin (ou déconnecté) → 403/401.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/users/export/route.ts
git commit -m "feat(admin): export CSV des utilisateurs"
```

---

## Task 12: Vérification finale

- [ ] **Step 1: Suite de tests complète**

Run: `npm test`
Expected: tous les tests passent (14 existants + nouveaux : newsletter-token 4, markdown 3, newsletter-email 1).

- [ ] **Step 2: Build complet**

Run: `npm run build`
Expected: build OK ; nouvelles routes présentes : `/profil`, `/admin/newsletter`,
`/api/newsletter/unsubscribe`, `/api/admin/users/export`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: aucun erreur (corriger imports inutilisés éventuels signalés en Task 9).

- [ ] **Step 4: Parcours manuel de bout en bout**

1. Inscription avec opt-in coché → `newsletter_opt_in = true`.
2. `/admin/newsletter` : rédiger + envoyer → email reçu (compte Resend).
3. Cliquer le lien de désinscription dans l'email → page de confirmation → `newsletter_opt_in = false`.
4. `/admin/users` : colonnes, compteurs, recherche, filtres, export CSV.

- [ ] **Step 5: Mettre à jour le HANDOFF (optionnel) et préparer la PR**

Push de la branche + ouverture PR vers `main` quand l'utilisateur le demande.

---

## Notes d'exécution

- **Co-auteur Claude** : ne PAS ajouter `Co-Authored-By: Claude` aux commits (préférence utilisateur).
- **Resend en local** : sans domaine vérifié, n'envoie qu'à l'adresse du compte Resend ; pour un vrai test multi-destinataires il faut vérifier un domaine (hors périmètre Phase 3, à faire en prod).
- **Supabase** : Docker up + `supabase start` ; clés via `supabase status -o env` (voir HANDOFF).
- **RLS** : `newsletter_editions` est admin-only (0002) ; les lectures/écritures admin passent par la session admin ou service-role.
