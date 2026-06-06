# Identité — VulgaRuRale (Vulgarisation du droit rural)

> Source de vérité de la marque. Produite par le skill `pepite-identite`.
> `pepite-tokens` et `frontend-craft` **lisent** ce fichier comme contexte (jamais d'appel inter-skill).
> Dernière mise à jour : 2026-06-06.

## Produit & cible

- **Produit** : bibliothèque de documents pédagogiques, schémas et newsletter pour comprendre le **droit rural**. Accès sur abonnement (vitrine publique + app derrière login : bibliothèque, abonnement, profil, admin).
- **Cible prioritaire** : métiers directement concernés par l'agriculture — **agriculteurs, exploitants, professionnels** (conseillers, juristes ruraux). Public de praticiens, pas d'étudiants en premier.
- **Promesse** : déjargoniser le droit rural en réponses claires et actionnables pour le terrain.

## 1. Voix (3 mots + modulateurs)

**Claire · Efficace · Terrain.**
Modulateurs : pédagogue, humaine.

Concrètement : on explique le droit comme on l'expliquerait à un exploitant pressé, debout dans sa cour. Court, concret, sans condescendance. Le vocabulaire métier agricole est assumé ; le jargon **juridique** est toujours traduit.

## 2. Référence nommée (anti-slop)

**« Revue spécialisée moderne, lisibilité Stripe-restraint, accent ardoise — PAS le vert agricole. »**

- Lane = éditorial documentaire restrained. La clarté EST le design ; pas de décoration gratuite.
- **Vert agricole écarté volontairement** : c'est le réflexe 1er ordre de la catégorie. Le lien au monde rural passe par l'**imagerie et la copy**, pas par la palette.
- Test inverse : un concurrent décrirait le site modal du secteur comme « vert, feuille, tracteur, beige ». On ne ressemble pas à ça.

## 3. Typographie

| Rôle | Police | Source | Pourquoi |
|---|---|---|---|
| **Display / titres** | **Bricolage Grotesque** | Google Fonts (libre) | Grotesque caractérielle, éditoriale, lisible en grand. Distinctive sans crier. |
| **Corps / texte long** | **Source Sans 3** | Google Fonts (libre) | Sans **humaniste**, excellente lisibilité sur texte long (juridique/pédagogique) et sur petits écrans. Solide pour l'a11y. |
| **Mono (optionnel)** | Geist Mono (déjà présent) | next/font | Références d'articles de loi, codes, métadonnées. |

- Chargement via `next/font/google` (les deux sont sur Google Fonts → pas de fichiers locaux).
- **Option premium** (si budget plus tard) : Söhne Breit (Klim, payant) en display — c'est l'esprit visuel validé.
- Échelle modulaire, ratio ≥ 1.25, display fluide `clamp()`.
- Emphase = italique/gras de **la même** police. Jamais de serif injecté.
- Pas de serif par défaut. Pas de police de la liste de rejet (Inter, Geist-default, DM, Space, Fraunces, etc.).

## 4. Couleur — stratégie **Restrained** (OKLCH)

Neutres teintés froids + **un seul accent** (bleu ardoise) ≤ ~10% des surfaces. Accent verrouillé sur tout le site.

### Mode clair (défaut)
| Rôle | OKLCH | Usage |
|---|---|---|
| `background` (off-white) | `oklch(0.985 0.002 255)` | Fond de page |
| `surface` | `oklch(0.965 0.004 255)` | Cartes, encarts |
| `foreground` (encre) | `oklch(0.20 0.02 255)` | Texte principal |
| `muted` | `oklch(0.50 0.02 255)` | Texte secondaire (vérifier ≥ 4.5:1) |
| `accent` (ardoise) | `oklch(0.45 0.12 255)` | Liens, CTA, focus |
| `accent-ink` | `oklch(0.985 0 0)` | Texte sur fond accent (blanc cassé) |

### Mode sombre
| Rôle | OKLCH |
|---|---|
| `background` | `oklch(0.17 0.012 255)` |
| `surface` | `oklch(0.21 0.014 255)` |
| `foreground` | `oklch(0.96 0.003 255)` |
| `muted` | `oklch(0.68 0.02 255)` |
| `accent` | `oklch(0.70 0.12 255)` (remonté pour contraste sur sombre) |

Règles : OKLCH partout · neutres teintés vers la teinte accent (froid), pas vers le chaud · **pas** de beige/cream + brass · pas d'AI purple/blue-glow · contraste corps ≥ 4.5:1 (à valider par `a11y-rgaa-eu`).

## 5. Imagerie

- **Signature de marque = le schéma.** Le produit, ce sont des schémas qui rendent le droit lisible. Les diagrammes pédagogiques (parcelles, baux, successions, filiations d'exploitation) sont l'asset visuel central, pas un décor.
- **Photographie documentaire réelle** du monde agricole français (exploitations, terrain, paysages, gestes du métier). Chercher l'objet physique : « registre parcellaire posé sur une table d'exploitation » > « agriculture ».
- **Bannir** : stock « agriculteur souriant pouce levé », `<div>` coloré à la place d'un visuel, blob gradient.
- Sources si pas d'asset : générer, sinon photo libre vérifiée (URL qui résout). Jamais d'ID deviné.

## 6. Logo / direction

- Wordmark **« VulgaRuRale »** (ou « Vulgarisation du droit rural » en version longue) en Bricolage Grotesque.
- Mark optionnel : glyphe **schématique** simple (trait évoquant un diagramme / une parcelle / une ramification), monochrome, qui rend en clair ET sombre.
- Pas d'icône ronde décorative au-dessus de chaque titre.

## 7. Copy — do / don't

**Do** : phrases courtes · traduire chaque terme juridique · exemples terrain concrets · vocabulaire métier agricole assumé · boutons verbe + objet (« Accéder à la bibliothèque »).
**Don't** : jargon juridique non expliqué · buzzwords marketing · **tirets cadratins (—)** et `--` · ton condescendant · faux chiffres précis sans source · eyebrow uppercase au-dessus de chaque section.

## 8. Test anti-slop (passé)

- **1er ordre** : devine-t-on le thème depuis « site sur le droit rural » ? Le réflexe serait vert + feuille. On l'a écarté → OK.
- **2e ordre** : « droit rural pas-vert → éditorial documentaire ardoise » reste un choix articulé (lisibilité = cœur du produit), pas un défaut. La distinctivité vient de la signature **schéma** + photographie documentaire + accent ardoise rare dans la catégorie.
