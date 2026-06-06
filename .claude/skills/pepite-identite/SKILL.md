---
name: pepite-identite
description: À utiliser quand il faut créer, définir ou réviser l'identité visuelle de marque — palette de couleurs, choix de typographie, ton et voix, direction de logo, ambiance esthétique — pour le site vitrine Elisa Projet Pépite, avant de coder. Couvre brand, charte, aesthetic, mood, direction artistique. Produit un document d'identité source de vérité. PAS pour coder des composants (voir frontend-craft) ni pour graver les tokens CSS (voir pepite-tokens).
license: MIT
---

# pepite-identite

## Overview

Couche de **décision** de marque. On choisit ici l'esthétique (couleurs, typo, voix, imagerie) **avant** d'écrire du code ou des tokens. Le livrable est un document, pas du CSS.

**Principe :** une identité distinctive se décide par des mots concrets et une référence nommée, jamais par réflexe de catégorie. « landing de startup » n'est pas une recette.

**Source de vérité :** ce skill écrit/ met à jour `docs/design/identite.md`. `pepite-tokens` et `frontend-craft` le **lisent** ensuite comme contexte (ils ne l'appellent jamais — composition automatique).

## When to Use

- Définir l'identité d'un nouveau site / d'une nouvelle marque
- Choisir palette, typographie, ton, direction de logo
- Réviser une direction esthétique jugée fade ou « AI-générée »
- **Pas** pour : écrire des tokens (`pepite-tokens`), coder une page (`frontend-craft`), auditer l'a11y (`a11y-rgaa-eu`)

## Procédure

### 1. Brief → 3 mots de voix concrets
Écris **trois mots d'objet physique**, pas « moderne » ou « élégant ». Ex : « chaleureux, mécanique, affirmé » ou « calme, clinique, précis ». Ces mots pilotent tout le reste.

### 2. Référence nommée (le 2ᵉ test anti-slop)
Avant de choisir, **nomme la référence** : « restraint Stripe purple-on-white », « drench orange Klim », « forest deep-green Patagonia ». Une ambition non nommée finit toujours en beige.
Test inverse : décris en une phrase ce que tu vas construire comme un concurrent décrirait le sien. Si la phrase colle au site modal de la catégorie → recommence.

### 3. Typographie — procédure (jamais sautée)
1. Pars des 3 mots de voix.
2. Liste les 3 polices que tu prendrais par réflexe. Si l'une est dans la **liste de rejet** ci-dessous → rejette-la.
3. Cherche dans un vrai catalogue (Google Fonts, Pangram Pangram, Velvetyne, Klim) la police pour la marque **comme objet physique**.
4. Cross-check : « élégant » ≠ serif. « technique » ≠ sans. Si le choix final = le réflexe initial → recommence.

**Liste de rejet (défauts training-data, bannis comme défaut) :** Inter · Geist (par défaut) · DM Sans · DM Serif · Space Grotesk · Space Mono · Plus Jakarta · Outfit · Instrument Sans/Serif · Fraunces · Playfair Display · Cormorant · Lora · Crimson · Syne · IBM Plex *.
**Serif = très déconseillé par défaut.** Acceptable seulement si le brief nomme un serif, ou si l'aesthetic est réellement éditorial/luxe/heritage ET que tu peux articuler pourquoi CE serif. Par défaut → sans display (ex : Cabinet Grotesk, PP Neue Montreal, GT Walsheim, Söhne Breit).
Emphase dans un titre = italique/gras de la **même** police, jamais injecter un serif au milieu d'un sans.

### 4. Couleur — stratégie avant couleurs
Choisis une **stratégie** sur l'axe d'engagement, puis les couleurs (en **OKLCH**) :
- **Restrained** : neutres teintés + 1 accent ≤10%. Défaut produit.
- **Committed** : une couleur saturée porte 30–60% des surfaces. Défaut marque identitaire.
- **Full palette** : 3–4 rôles nommés, chacun délibéré.
- **Drenched** : la surface EST la couleur. Héros de marque.

Règles : max 1 accent par défaut, saturation < 80%. **Un seul accent verrouillé sur toute la page.** Pas de défaut beige/cream + brass/ocre (le tell premium-consumer n°2). Le réflexe « AI purple/blue glow » est banni sauf demande explicite.

### 5. Imagerie
Une vitrine sans image est incomplète, pas « épurée ». Décide la stratégie d'imagerie (photo réelle, asset généré, scène SVG/canvas). Jamais de `<div>` coloré à la place d'un héros. Cherche l'objet physique (« pâtes fraîches sur bois rayé » > « cuisine italienne »).

### 6. Test anti-slop final
Si quelqu'un peut dire « une IA a fait ça » sans hésiter → échec.
- **1ᵉ ordre** : si on devine le thème depuis la seule catégorie → réflexe training-data.
- **2ᵉ ordre** : si on devine l'aesthetic depuis « catégorie + anti-référence » → piège un cran plus loin. Retravaille jusqu'à ce que les deux réponses ne soient pas évidentes.

## Livrable (obligatoire)

Écris/maj `docs/design/identite.md` avec : les 3 mots de voix · la référence nommée · police display + body (avec source) · stratégie couleur + valeurs OKLCH (bg, surface, ink, accent, muted) · stratégie d'imagerie · ton de copy (do/don't). Ce fichier devient l'entrée de `pepite-tokens`.

## Common Mistakes

- Choisir la police/couleur avant les 3 mots de voix → générique.
- « C'est créatif donc serif » → tell le plus testé en prod.
- Stratégie couleur implicite → finit en beige neutre.
- Sauter l'imagerie « pour rester épuré » → page incomplète.
- Graver des tokens CSS ici → c'est le rôle de `pepite-tokens`.
