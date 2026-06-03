# Plateforme de vulgarisation de droit rural — Design

**Date :** 2026-06-03
**Statut :** Validé en brainstorming, en attente de relecture utilisateur

## Objectif

Plateforme web qui vulgarise le droit rural. Un·e administrateur·rice publie des
documents pédagogiques (PDF, schémas explicatifs) et envoie une newsletter. Les
visiteur·euse·s créent un compte gratuit avec accès limité, ou s'abonnent (rôle
payant) pour débloquer l'ensemble des documents.

## Décisions structurantes

| Sujet | Décision |
|---|---|
| Stack | Supabase (Auth, Postgres + RLS, Storage) + Next.js (App Router) |
| Paiement | Abonnement Stripe récurrent (mensuel/annuel) |
| Découpage d'accès fichiers | Drapeau `is_premium` par fichier |
| Affichage premium aux gratuits | Visible mais verrouillé (cadenas + CTA « S'abonner ») |
| Consommation documents | Lecture en ligne dans le navigateur (PDF + schémas) |
| Newsletter | Emails via Resend/Brevo, opt-in RGPD pour tous les inscrits |
| Auth | Email + mot de passe (natif Supabase) |
| Rôles | `free` / `paid` / `admin` |
| Contrôle d'accès | RLS Postgres + URLs signées générées côté serveur |

## Architecture

```
┌─────────────────────────────────────────────┐
│  Next.js (App Router) — front + routes API   │
│  - Pages publiques : accueil, login, signup  │
│  - Espace membre : bibliothèque, lecteur PDF │
│  - Espace admin : users, docs, newsletter    │
└───────────┬───────────────────┬──────────────┘
            │                   │
   ┌────────▼────────┐   ┌──────▼───────┐   ┌──────────────┐
   │   Supabase      │   │    Stripe    │   │   Resend     │
   │ - Auth (email)  │   │ - Abonnement │   │ - Newsletter │
   │ - Postgres+RLS  │   │ - Webhooks   │   │   emails     │
   │ - Storage privé │   └──────┬───────┘   └──────────────┘
   └─────────────────┘          │
            ▲                    │ webhook (paiement OK/échec)
            └────────────────────┘ → met à jour statut abonnement
```

### Unités (chacune un rôle clair, ses tables, testable isolément)

- **Auth & profils** — inscription/connexion email + mot de passe, table `profiles`
  liée à `auth.users`, porte le rôle et le consentement newsletter.
- **Bibliothèque documents** — liste filtrable (catégorie, tags), lecteur en ligne
  PDF/schéma, drapeau premium, verrouillage visuel pour les gratuits.
- **Abonnement (Stripe)** — checkout, webhook qui synchronise le statut dans
  Supabase, portail « gérer mon abonnement ».
- **Newsletter** — opt-in, composition admin, envoi Resend, désinscription tokenisée.
- **Admin** — gestion utilisateurs (changer rôle), upload + métadonnées documents,
  rédaction/envoi newsletter.

## Modèle de données

Authentification gérée par `auth.users` (intégré Supabase).

### `profiles` — 1 ligne par utilisateur
| colonne | type | note |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | |
| `full_name` | text | nom complet |
| `display_name` | text | surnom affiché |
| `role` | enum | `free` / `paid` / `admin` |
| `newsletter_opt_in` | bool | consentement RGPD |
| `created_at` | timestamptz | |

### `subscriptions` — synchronisée depuis Stripe via webhook
| colonne | type | note |
|---|---|---|
| `user_id` | uuid FK→profiles | |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | |
| `status` | text | `active` / `past_due` / `canceled`… |
| `current_period_end` | timestamptz | fin de la période payée |

Le rôle `paid` est **dérivé** de `status = active`. La source de vérité reste Stripe.

### `documents`
| colonne | type | note |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `description` | text | |
| `author` | text | auteur du document |
| `type` | enum | `pdf` / `schema` |
| `storage_path` | text | chemin dans le bucket privé |
| `is_premium` | bool | **le drapeau** gratuit/premium |
| `category` | text | regroupement / filtre |
| `tags` | text[] | tableau de tags pour filtrer/chercher |
| `created_at` | timestamptz | |

### `newsletter_editions` — historique des envois
| colonne | type | note |
|---|---|---|
| `id` | uuid PK | |
| `subject` | text | |
| `body_html` | text | |
| `sent_at` | timestamptz | null = brouillon |

## Contrôle d'accès (cœur sécurité)

**Storage** : deux buckets — `documents-free` et `documents-premium` (privé strict).

**Lecture d'un document premium :**
```
1. User ouvre la fiche d'un doc premium
2. Route serveur Next vérifie : subscription.status == 'active' ?
3a. OUI → génère une URL signée temporaire (~60s) du fichier → lecteur PDF
3b. NON → pas d'URL ; affiche cadenas + CTA « S'abonner »
```

**RLS Postgres (filet de sécurité même si le front est contourné) :**
- `documents` : tout le monde lit les **métadonnées** (titre, description, premium)
  → permet d'afficher les premium verrouillés.
- Le **fichier** n'est jamais servi sans URL signée, générée uniquement côté serveur
  après vérification de l'abonnement.
- `profiles` / `subscriptions` : un user lit **uniquement sa propre ligne** ; l'admin
  lit tout.
- Écriture sur `documents` et changement de `role` : **admin seulement** (RLS).

**Principe :** le front masque, mais c'est le serveur + RLS qui empêchent réellement
l'accès. Un compte gratuit ne peut jamais obtenir l'URL signée d'un fichier premium.

## Phasage du build

### Phase 1 — Fondations & bibliothèque (site utilisable à la fin)
- Auth email + mot de passe, table `profiles`
- Bibliothèque documents : liste, filtres (catégorie / tags), lecteur PDF/schéma en ligne
- Drapeau premium : le gratuit voit les premium verrouillés (cadenas + CTA)
- Buckets storage + URLs signées + RLS
- Admin minimal : upload document, flag premium, auteur/tags

### Phase 2 — Abonnement Stripe
- Checkout Stripe abonnement récurrent
- Webhook → table `subscriptions` → déblocage de l'accès premium
- Page « gérer mon abonnement » (portail Stripe)
- Admin : voir / changer le rôle manuellement (cas limites)

### Phase 3 — Newsletter & gestion utilisateurs
- Opt-in RGPD à l'inscription et dans le profil
- Admin : rédaction d'édition, envoi via Resend, historique
- Désinscription tokenisée sans login
- Admin : tableau de gestion complet des utilisateurs

Chaque phase est un livrable testable. La phase 1 produit un site réellement debout.

## Gestion des erreurs

- **Webhook Stripe raté** → Stripe réessaie ; le statut reste la source de vérité,
  jamais débloqué sans `active`.
- **Paiement échoué (`past_due`)** → accès premium coupé, bandeau « régularise ton
  paiement ».
- **URL signée expirée** → régénérée au rechargement.
- **Email newsletter qui bounce** → loggé, n'interrompt pas l'envoi global.

## Tests

- **Unitaires** : logique « cet utilisateur peut-il voir ce fichier ? », dérivation
  du rôle depuis le statut d'abonnement.
- **Intégration** : RLS (un gratuit n'obtient jamais d'URL premium), webhook Stripe
  (simulé).
- **E2E** : parcours inscription → voir un doc verrouillé → s'abonner → doc débloqué.

## Hors périmètre (YAGNI pour l'instant)

- Connexion via Google / réseaux sociaux (email + mot de passe suffit).
- Téléchargement des fichiers (lecture en ligne uniquement).
- Newsletter publiée comme section du site (email uniquement).
- Plusieurs niveaux d'abonnement (un seul palier payant).
- Application mobile native.

## Notes complémentaires

- Contexte : droit rural français → prévoir l'interface en français et le respect RGPD
  (consentement explicite + désinscription).
- Choix Resend vs Brevo à trancher en phase 3 (Resend plus simple pour le dev,
  Brevo plus orienté marketing FR) — n'impacte pas l'architecture.
