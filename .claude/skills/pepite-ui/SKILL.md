---
name: pepite-ui
description: À utiliser quand il faut ajouter un composant interactif accessible (dialog/modal, popover, select, combobox, dropdown menu, tooltip) au dashboard admin, en adaptant une primitive Radix UI aux tokens OKLCH du projet et au système Tailwind v4 CSS-first. Triggers — "add a dialog/modal", "add an accessible select", "combobox/popover/tooltip/dropdown", "menu accessible". Conserve focus-trap/ARIA/clavier de Radix. PAS pour le présentationnel (voir frontend-craft), décider l'identité (voir pepite-identite), graver les tokens (voir pepite-tokens).
license: MIT
---

# pepite-ui

## Overview

Couche **composants interactifs accessibles** du dashboard admin. On **adapte des primitives Radix UI** (focus-trap, ARIA, clavier, portals déjà résolus) au design system maison : tokens OKLCH `--color-*`, shape-lock, échelle z-index, dark mode système + switch.

**Complète `frontend-craft`, ne le remplace pas.** Périmètre strict : le seul interactif a11y-critique. Tout le présentationnel reste à `frontend-craft`.

**Principe :** ne jamais réimplémenter l'a11y à la main. Radix fournit le comportement ; toi tu fournis le skin (tokens, rayon, z-index, motion). Zéro token HSL, zéro `--background`/`--primary` étranger.

**Stack figé :** Next 16.2.7, React 19.2.4 (App Router), Tailwind v4 CSS-first (`@theme inline`, pas de `tailwind.config.js`). Lis `AGENTS.md` : ce n'est pas le Next/Tailwind d'avant.

## When to Use

Phrases déclencheuses : « add a dialog/modal », « add an accessible select to the admin filters », « combobox », « popover », « tooltip », « dropdown menu », « menu accessible », « overlay ».

| Composant | Périmètre | Skill |
|---|---|---|
| card, hero, badge, button, section, layout, formulaire statique | présentationnel | **frontend-craft** (pas ici) |
| dialog / modal, popover, select, combobox, dropdown menu, tooltip, alert-dialog, hover-card | interactif a11y-critique | **pepite-ui** (ici) |

Doute « bouton simple ou trigger interactif » : si l'élément ouvre/ferme un overlay, piège le focus, ou navigue au clavier → pepite-ui. Sinon → frontend-craft.

## Source des primitives

- Installer **uniquement** la primitive Radix nécessaire : `npm i @radix-ui/react-dialog` (ou `-select`, `-popover`, `-dropdown-menu`, `-tooltip`…). Une primitive par besoin, pas le méta-paquet.
- **INTERDIT : `npx shadcn add` / MCP shadcn par défaut.** La CLI écrit des tokens HSL (`--background`, `--primary`) dans `globals.css` et touche la config → casse `pepite-tokens`.
- Code shadcn = utilisable **comme source** à copier-coller dans le repo **puis re-skinner**, jamais via la CLI qui modifie la config. Tu possèdes le code après collage.

## Re-skin vers les tokens (cœur du skill)

Tout composant emprunté arrive avec des couleurs étrangères. Les remplacer **toutes** :

| Token étranger (Radix/shadcn) | Remplacer par (maison) |
|---|---|
| `hsl(...)`, `--background`, `--foreground` | `bg-background`, `text-foreground` |
| `--primary`, `--primary-foreground` | `bg-accent`, `text-accent-ink` |
| `--muted`, `--muted-foreground` | `bg-surface`, `text-muted` |
| `--border`, `--input` | `border-border` |
| `rounded-md`, `rounded-sm`, valeurs ad hoc | rayon unique : `rounded-[--radius]` |
| `z-50`, `z-[9999]` | z-index sémantique : `--z-modal`, `--z-dropdown`, `--z-toast` |

Règles :
- **Shape-lock** : un seul rayon (`--radius`). Pas de rayon improvisé par composant.
- **Z-index** : overlays/portals consomment l'échelle sémantique (`--z-dropdown` < `--z-sticky` < `--z-modal` < `--z-toast`). Jamais 999/9999.
- **Dark mode** : aucun style en dur. Les tokens `--color-*` portent déjà système + switch (`[data-theme]`). Si ça consomme `--color-*`, le dark suit gratuitement.
- **Mapping = source de vérité `pepite-tokens`.** Les tokens existent dans `src/app/globals.css` (`@theme inline`). Décris le mapping couleur en t'appuyant sur eux ; ne pas inventer de token. (Charger le contexte tokens si besoin — ne pas appeler le skill par commande.)

## Soumission en form serveur (Select / Combobox / Radio)

Piège récurrent admin : les primitives Radix de saisie (Select, Combobox, RadioGroup) **ne soumettent pas de champ natif**. Remplacer un `<select name="…">` dans un `<form method="get|post">` casse le filtrage/POST serveur.

Deux options :
- **Hidden input synced** : `<input type="hidden" name="role" value={value} />` piloté par `onValueChange`. Garde la soumission native du form.
- **searchParams (filtres GET)** : `onValueChange` → push dans l'URL (`router`/`searchParams`). Pas de form du tout.

Vérifier le markup existant avant de remplacer : si le `<select>` natif vit dans un form serveur, conserver le `name` via l'une des deux voies.

## Accessibilité

- **Conserver** le focus-trap, l'ARIA (`role`, `aria-*`), la navigation clavier (Tab, flèches, Esc, Home/End), et les portals fournis par Radix. Ne **pas** les réimplémenter.
- Garder `Portal` pour overlays/dropdowns (évite les pièges d'`overflow`/`z-index` du parent).
- `prefers-reduced-motion` : couper/réduire toute animation d'ouverture/fermeture.
- Conformité RGAA : faire vérifier via `a11y-rgaa-eu` si le composant est livré (contraste du skin, focus visible, libellés). Ne pas court-circuiter — Radix gère le comportement, pas le contraste de TON skin.

## Anti-slop

- Pas de style ad hoc : réutiliser les tokens et le rayon verrouillé, cohérence avec l'identité éditoriale (contexte `pepite-identite` / `docs/design/identite.md`).
- Focus visible on-brand (anneau via `--color-accent`), pas l'outline navigateur par défaut supprimé sans remplacement.
- Motion sobre : translate/opacity courts (~150ms), jamais de bounce décoratif.

## Workflow type — Dialog

1. **Installer** : `npm i @radix-ui/react-dialog`
2. **Composer** la primitive : `Root` / `Trigger` / `Portal` / `Overlay` / `Content` / `Title` / `Description` / `Close`.
3. **Re-skin** : `Overlay` (voile `bg-foreground/40`, `z-[--z-modal]`), `Content` (`bg-surface text-foreground border-border rounded-[--radius]`, centrage, `z-[--z-modal]`).
4. **Vérifier** : focus-trap actif, `Esc` ferme, Tab cyclique, `Title`/`Description` reliés (`aria-labelledby`/`describedby`), `prefers-reduced-motion` respecté.

```tsx
// src/components/admin/ui/Dialog.tsx  — Radix re-skinné aux tokens maison
"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      {/* voile : token foreground en alpha, z-index sémantique */}
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-[--z-modal] bg-foreground/40
                   data-[state=open]:animate-in data-[state=open]:fade-in-0
                   motion-reduce:animate-none"
      />
      <DialogPrimitive.Content
        {...props}
        className="fixed left-1/2 top-1/2 z-[--z-modal] w-full max-w-md
                   -translate-x-1/2 -translate-y-1/2
                   rounded-[--radius] border border-border
                   bg-surface text-foreground p-6 shadow-lg
                   focus:outline-none motion-reduce:transition-none"
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export const DialogTitle = DialogPrimitive.Title;       // relié en aria-labelledby
export const DialogDescription = DialogPrimitive.Description;
```

Autres primitives : même boucle (installer → composer → re-skin tokens/rayon/z-index → vérifier a11y + reduced-motion). Select/Combobox/Dropdown : penser `Portal` + `z-[--z-dropdown]`. Tooltip : `z-[--z-dropdown]`, délai sobre.

## Common Mistakes

| Erreur | Correctif |
|---|---|
| `npx shadcn add dialog` | Interdit (écrit HSL + touche config). Installer la primitive Radix, coller le markup, re-skinner. |
| Token HSL ou `--primary`/`--background` laissé dans le code | Mapper vers `--color-*` (table ci-dessus). |
| `z-[9999]` sur un overlay | Token sémantique `--z-modal` / `--z-dropdown`. |
| Rayon improvisé (`rounded-md`) | `rounded-[--radius]` (shape-lock). |
| Réécrire focus-trap / gestion clavier | Garder le comportement Radix, ne styler que l'apparence. |
| Animation sans garde reduced-motion | `motion-reduce:animate-none` / `motion-reduce:transition-none`. |
| Styler une card/badge ici | Hors périmètre → frontend-craft. |
| Radix Select/Combobox dans form serveur sans champ soumis | Hidden input synced (`name`) ou `onValueChange` → searchParams. |
