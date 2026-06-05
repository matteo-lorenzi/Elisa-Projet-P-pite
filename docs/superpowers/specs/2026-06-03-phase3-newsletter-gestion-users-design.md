# Phase 3 — Newsletter & gestion utilisateurs (design)

**Date** : 2026-06-03
**Phase** : 3 (Phases 1 & 2 mergées)
**Spec parent** : `2026-06-03-plateforme-vulgarisation-droit-rural-design.md`

## Objectif

Permettre aux inscrits de consentir (RGPD) à une newsletter, à l'admin de rédiger et
d'envoyer des éditions par email, à tout destinataire de se désinscrire sans se
connecter, et à l'admin de gérer la liste complète des utilisateurs.

## Décisions arrêtées (brainstorm)

| Décision | Choix | Raison |
|----------|-------|--------|
| Fournisseur email | **Resend** | SDK simple, DX moderne, free tier suffisant, test local via expéditeur de bac à sable |
| Désinscription | **Token HMAC signé (stateless)** | Rien à stocker, invalidable globalement via rotation du secret, pas de migration |
| Rédaction | **Markdown → HTML** | Écriture simple, rendu propre, pas d'éditeur lourd (YAGNI WYSIWYG pour un seul admin) |
| Envoi | **Synchrone (batch Resend ≤100)** dans la server action | Volume faible (un seul admin, peu d'inscrits) ; file async = YAGNI pour l'instant |
| Migration DB | **Aucune** | Opt-in (`profiles.newsletter_opt_in`) et `newsletter_editions` déjà présents (0001) ; RLS admin-only déjà posée (0002) |

## Périmètre

### 1. Opt-in RGPD

- **Inscription (`/signup`)** : checkbox « Recevoir la newsletter » (décochée par défaut).
  `signUp` lit la valeur ; après création du compte (session active en dev, confirmation
  email désactivée), `update profiles set newsletter_opt_in = <valeur>` sur la propre ligne
  de l'utilisateur (RLS `profiles_update_own` autorise).
- **Profil (`/profil`)** : nouvelle page (utilisateur connecté) affichant l'état d'opt-in
  avec un toggle. Server action `setNewsletterOptIn` écrit sur la propre ligne.
- Trigger `handle_new_user` inchangé (défaut `false`).

### 2. Désinscription tokenisée (HMAC, stateless)

- `src/lib/newsletter-token.ts` (fonction pure, TDD) :
  - `sign(userId): string` → `"<userId>.<hmac>"`
  - `verify(token): string | null` → `userId` si signature valide, sinon `null`
  - HMAC-SHA256 avec `NEWSLETTER_UNSUBSCRIBE_SECRET`. Comparaison à temps constant.
- Route `GET /api/newsletter/unsubscribe?token=...` :
  - `verify(token)` → si invalide, page d'erreur ; sinon
    `update profiles set newsletter_opt_in = false where id = <userId>` (service-role,
    car pas de session) → page de confirmation. Aucun login requis.
- Lien injecté dans le pied de **chaque** email, personnalisé par destinataire.

### 3. Rédaction + envoi (admin)

- `src/lib/markdown.ts` (TDD) : conversion markdown → HTML sûr (échappement du HTML brut
  dans la source, pas d'injection).
- `src/lib/resend.ts` : client Resend (`RESEND_API_KEY`), expéditeur `NEWSLETTER_FROM`.
- Page `/admin/newsletter` :
  - Formulaire : sujet + textarea markdown.
  - Aperçu (preview) du rendu HTML.
  - Bouton « Envoyer ».
  - Historique des éditions (`newsletter_editions`, sujet + date d'envoi / brouillon).
- Server actions :
  - `saveDraft` → insert `newsletter_editions` (`sent_at = null`). Re-check admin.
  - `sendEdition` → re-check admin ; charge les destinataires
    (`profiles where newsletter_opt_in = true`, service-role) ; rend le HTML une fois ;
    pour chaque destinataire ajoute un pied de désinscription personnalisé
    (`sign(userId)`) ; envoie par batch Resend (≤100 par appel) ; un envoi en échec
    (bounce/erreur) est loggé sans interrompre le lot ; à la fin `set sent_at = now()`.

### 4. Tableau de gestion utilisateurs (`/admin/users` étendu)

L'existant (email + rôle + `setUserRole`) est conservé. Ajouts :

- **Colonnes enrichies** : email, rôle, statut abonnement (`active` / `past_due` / `—`),
  opt-in newsletter (✓ / —), date d'inscription. Données via `profiles` joint à
  `subscriptions` (admin lit tout via RLS).
- **Recherche / filtre** : champ email + filtres rôle et statut abonnement, pilotés par
  `searchParams` (server component, pas de state client) → requête filtrée côté serveur.
- **Compteurs** (en-tête) : total utilisateurs, abonnés actifs, inscrits newsletter.
  Calcul serveur.
- **Export CSV** : route `GET /api/admin/users/export` (re-check admin) → CSV
  (email, rôle, abonnement, opt-in, date d'inscription) en téléchargement direct.

## Variables d'environnement (`.env.local`, gitignored)

- `RESEND_API_KEY`
- `NEWSLETTER_FROM` (ex. `newsletter@vulgarurale.fr` ; en dev, expéditeur Resend de test)
- `NEWSLETTER_UNSUBSCRIBE_SECRET` (secret HMAC, aléatoire fort)

## Sécurité

- Désinscription : token HMAC vérifié à temps constant ; ne révèle pas d'autres champs ;
  n'agit que sur `newsletter_opt_in`. Pas d'énumération exploitable (un token falsifié
  échoue la vérif).
- Toutes les écritures hors « propre ligne » passent par service-role **après re-check
  admin** côté serveur (même pattern que Phase 2 `setUserRole`).
- Export CSV et envoi : routes/actions gardées par re-vérif admin, pas seulement par le
  layout.
- Envoi synchrone accepté pour le volume actuel ; limite documentée (file async = futur
  si la liste grossit fortement).

## Gestion des erreurs

- Email qui bounce / échoue → loggé, n'interrompt pas l'envoi global (conforme spec parent).
- Token de désinscription invalide → page d'erreur claire, pas de modification.
- `sendEdition` sans destinataire → message « aucun inscrit », pas d'appel Resend.

## Tests

- **Unitaires (TDD)** :
  - `newsletter-token` : `sign`/`verify` aller-retour ; rejet d'un token falsifié /
    tronqué / mauvais secret.
  - `markdown` : rendu nominal ; échappement du HTML brut injecté.
- **Build** : nouvelles routes `/profil`, `/admin/newsletter`,
  `/api/newsletter/unsubscribe`, `/api/admin/users/export` compilent.
- **Manuel (local, Mailpit)** : opt-in à l'inscription → édition admin → email reçu →
  clic lien désinscription → `newsletter_opt_in` repassé à `false` → plus reçu.

## Hors périmètre (YAGNI)

- File d'envoi asynchrone / worker.
- Éditeur WYSIWYG.
- Gestion avancée des bounces (suppression list, webhooks Resend).
- Segments / listes multiples.
- Double opt-in (email de confirmation d'abonnement newsletter).

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `src/app/signup/page.tsx` | + checkbox opt-in |
| `src/app/auth/actions.ts` | `signUp` écrit `newsletter_opt_in` |
| `src/app/profil/page.tsx` + `actions.ts` | nouvelle page profil + toggle |
| `src/lib/newsletter-token.ts` (+ `.test.ts`) | HMAC sign/verify (TDD) |
| `src/lib/markdown.ts` (+ `.test.ts`) | markdown → HTML (TDD) |
| `src/lib/resend.ts` | client Resend |
| `src/app/api/newsletter/unsubscribe/route.ts` | désinscription |
| `src/app/admin/newsletter/page.tsx` + `actions.ts` | rédaction / envoi / historique |
| `src/app/admin/users/page.tsx` + `actions.ts` | tableau enrichi + recherche + compteurs |
| `src/app/api/admin/users/export/route.ts` | export CSV |
| `src/app/admin/layout.tsx` | + lien nav « Newsletter » |
