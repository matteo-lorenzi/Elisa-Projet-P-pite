---
name: pepite-tokens
description: À utiliser quand il faut ajouter, modifier ou référencer un token de design (couleur, espacement, typographie, rayon, ombre, z-index) en Tailwind CSS v4, ou éditer le bloc @theme de src/app/globals.css. Garantit des tokens OKLCH cohérents, primitive vs sémantique, échelle modulaire, mode clair/sombre. Source de vérité technique du design system. PAS pour décider l'identité (voir pepite-identite) ni construire des composants (voir frontend-craft).
license: MIT
---

# pepite-tokens

## Overview

Couche **implémentation** du design system : on grave dans le CSS les décisions prises par `pepite-identite`. Source de vérité technique = le bloc `@theme` de `src/app/globals.css`.

**Stack réel :** Tailwind **v4** (CSS-first), Next 16, React 19. Pas de `tailwind.config.js`, pas de shadcn. La config vit en CSS via `@import "tailwindcss"` + `@theme`.

**Principe :** tout token a un sens sémantique. Pas de token par valeur. Primitive → sémantique. Couleurs en **OKLCH**.

## When to Use

- Ajouter/modifier une couleur, un espacement, une police, un rayon, une ombre, un z-index
- Mettre en place ou faire évoluer le bloc `@theme`
- Brancher le mode sombre sur des tokens
- **Pas** pour : décider l'esthétique (`pepite-identite`), coder un composant (`frontend-craft`)

## Avant d'écrire (obligatoire)

1. Lis `docs/design/identite.md` (valeurs décidées). S'il manque → lance d'abord `pepite-identite`.
2. **Vérifie la syntaxe Tailwind v4 installée** avant de coder (voir `AGENTS.md` : ce n'est pas le Tailwind d'avant). En cas de doute sur `@theme`, `@custom-variant`, `@utility` → consulte la doc de la version installée, ne devine pas.
3. Lis l'état courant de `src/app/globals.css`.

## Pattern Tailwind v4

Deux couches : **primitives** (`:root`, valeurs brutes OKLCH) puis **tokens sémantiques** (`@theme`, qui génèrent les utilitaires `bg-*`, `text-*`, etc.).

```css
@import "tailwindcss";

/* 1. PRIMITIVES — valeurs brutes, OKLCH, jamais utilisées directement dans le markup */
:root {
  --p-ink:      oklch(0.20 0.02 270);
  --p-paper:    oklch(0.99 0.00 0);
  --p-accent:   oklch(0.62 0.17 145);   /* accent unique, voir identite.md */
  --p-muted:    oklch(0.55 0.01 270);
  --p-surface:  oklch(0.97 0.00 0);
  /* échelle d'espacement = rythme, pas une grille linéaire molle */
}

/* 2. SÉMANTIQUE — ce que le markup consomme. Tailwind génère les utilitaires. */
@theme inline {
  --color-background: var(--p-paper);
  --color-foreground: var(--p-ink);
  --color-surface:    var(--p-surface);
  --color-accent:     var(--p-accent);
  --color-muted:      var(--p-muted);

  --font-display: "Cabinet Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-sans:    var(--font-geist-sans);
  --font-mono:    var(--font-geist-mono);

  /* échelle typographique modulaire, ratio ≥ 1.25, fluide */
  --text-display: clamp(2.5rem, 6vw, 5.5rem);

  /* rayon : UNE échelle verrouillée (voir SHAPE LOCK dans frontend-craft) */
  --radius: 0.75rem;

  /* z-index sémantique, jamais 999/9999 */
  --z-dropdown: 1000; --z-sticky: 1100; --z-modal: 1300; --z-toast: 1400;
}

/* 3. MODE SOMBRE — on bascule les PRIMITIVES, les sémantiques suivent */
@media (prefers-color-scheme: dark) {
  :root {
    --p-paper:   oklch(0.16 0.01 270);
    --p-ink:     oklch(0.96 0.00 0);
    --p-surface: oklch(0.21 0.01 270);
  }
}
```

## Règles

- **OKLCH partout.** Neutres teintés = +0.005–0.015 de chroma vers la teinte de marque, pas « vers le chaud » par défaut.
- **Sémantique dans le markup**, jamais une primitive ni un hex en dur. `bg-background`, `text-foreground`, `text-muted`, `bg-accent`.
- **Contraste** : tout token texte/fond doit viser WCAG AA (corps ≥ 4.5:1). Vérifier avant de commit (déléguer la vérif à `a11y-rgaa-eu`).
- **Une échelle de rayon, une échelle d'espacement, un accent** — verrouillés.
- Mode sombre : basculer les primitives, pas réécrire les sémantiques.
- Pas de token jetable : si une valeur sert < 3 fois avec la même intention, inline-la.

## Common Mistakes

- `tailwind.config.js` réflexe → n'existe pas en v4 CSS-first.
- Hex en dur dans un composant → casse le theming et le mode sombre.
- Primitive consommée dans le markup → court-circuite la couche sémantique.
- Couleurs en HSL/hex au lieu d'OKLCH → dérive de chroma au theming.
- `z-index: 9999` → utiliser l'échelle sémantique.
