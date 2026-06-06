---
name: frontend-craft
description: À utiliser quand il faut construire, coder, refondre ou améliorer une page, une section ou un composant frontend (Next.js / React / Tailwind) — hero, navigation, sections landing, cartes, formulaires, états loading/empty/error, motion. Produit du code production anti-slop, non templated. Lit l'identité et les tokens comme contexte. PAS pour l'audit d'accessibilité (voir a11y-rgaa-eu), décider l'identité (voir pepite-identite) ou graver les tokens (voir pepite-tokens).
license: MIT
---

# frontend-craft

## Overview

Construit du frontend **production-grade, anti-slop**, pour le site vitrine (Next 16, React 19, Tailwind v4). Pas de prototype, pas de « point de départ » : code complet, responsive, accessible, on-brand.

**Principe :** si quelqu'un peut dire « une IA a fait ça » sans hésiter, c'est raté. Engagement esthétique > prudence. Chaque section gagne sa place.

**Lit (ne pas appeler) :** `docs/design/identite.md` et `src/app/globals.css` comme contexte. Si l'identité manque → la créer d'abord via `pepite-identite`.

## When to Use

- Construire/refondre une page, section ou composant frontend
- Améliorer un design fade, ajouter du motion, corriger une mise en page
- **Pas** pour : auditer l'a11y (`a11y-rgaa-eu`), décider la marque (`pepite-identite`), éditer les tokens (`pepite-tokens`)

## Workflow

1. **Lire le contexte.** `docs/design/identite.md` + `globals.css` + un composant représentatif existant. Réutiliser ce qui marche. Si pas d'identité → `pepite-identite` d'abord.
2. **Lire le brief / la salle.** Une phrase de « design read » avant de coder. Pas de défaut esthétique par réflexe.
3. **Vérifier le stack.** `AGENTS.md` : ce n'est pas le Next.js d'avant — lire la doc de la version installée avant d'écrire (App Router, conventions, déprécations).
4. **Construire** selon les règles ci-dessous + les références.
5. **Pré-flight** (voir checklist) avant de déclarer terminé. Pour l'a11y/perf approfondie → `a11y-rgaa-eu`.

## Règles cœur (les détails en références)

**Typographie** — display via `clamp()`, ratio ≥ 1.25, plafond ~6rem. Corps 65–75ch. Max 3 familles. Emphase = italique/gras de la même police. Pas d'ALL CAPS en corps. `text-wrap: balance` sur h1–h3.

**Couleur** — OKLCH, **un seul accent verrouillé** sur toute la page. Gris sur fond coloré = délavé (utiliser une teinte plus sombre du fond). Contraste corps ≥ 4.5:1 (placeholders compris).

**Layout** — Flexbox 1D / Grid 2D. Grilles responsives : `repeat(auto-fit, minmax(280px, 1fr))`. Cartes = réponse paresseuse, seulement si c'est la bonne affordance ; cartes imbriquées = toujours faux. Échelle de rayon unique verrouillée. Z-index sémantique (tokens), jamais 9999.

**Hero** — tient dans le viewport initial. Titre ≤ 2 lignes, sous-texte ≤ 20 mots, CTA visibles sans scroll. Max 4 éléments texte. Logo wall = section sous le hero, jamais dedans.

**États interactifs** — toujours le cycle complet : loading (skeleton à la forme finale, pas de spinner générique), empty (composé, indique quoi faire), error (inline pour formulaires). `:active` → `scale-[0.98]`. **Vérifier le contraste de chaque bouton/CTA.**

**Formulaires** — label AU-DESSUS de l'input, jamais placeholder-as-label. Helper présent dans le markup, erreur SOUS l'input.

**Motion** — motivé (hiérarchie / narration / feedback / transition d'état), jamais « ça faisait cool ». Ease-out exponentiel, pas de bounce/elastic. `@media (prefers-reduced-motion: reduce)` **obligatoire** sur chaque animation. Ne pas animer les propriétés de layout sans raison.

**Copy** — chaque mot gagne sa place. **Pas de tirets cadratins (—) ni `--`.** Pas de buzzwords marketing. Boutons = verbe + objet. Liens = sens autonome.

## Références (charger selon le besoin)

- **Discipline de layout** (règles dures hero/nav/bento/zigzag/eyebrow) → [reference/layout-rules.md](reference/layout-rules.md)
- **AI tells & bans absolus** (à matcher-et-refuser avant de shipper) → [reference/ai-tells.md](reference/ai-tells.md)

## Pré-flight (avant « terminé »)

- [ ] Aucun AI tell (voir `reference/ai-tells.md`)
- [ ] Hero tient dans le viewport, CTA visibles, titre ≤ 2 lignes
- [ ] Un seul accent, une seule échelle de rayon, un seul thème (pas d'inversion de section)
- [ ] Chaque bouton/CTA : contraste OK, texte sur une ligne au desktop
- [ ] États loading/empty/error présents là où pertinent
- [ ] `prefers-reduced-motion` couvert pour chaque animation
- [ ] Repli mobile déclaré pour chaque layout multi-colonnes
- [ ] Aucun tiret cadratin ; copy relue (pas de chaîne cassée/hallucinée)
- [ ] Tokens sémantiques utilisés, zéro hex en dur
- [ ] Audit a11y/perf délégué à `a11y-rgaa-eu` avant mise en ligne

## Common Mistakes

- Coder sans lire `identite.md` / `globals.css` → hors-charte.
- Hero qui déborde, CTA sous la ligne de flottaison.
- Eyebrow uppercase au-dessus de chaque section (le tell n°1).
- 3+ zigzags image/texte d'affilée.
- Hex en dur au lieu des tokens.
- Animation sans `prefers-reduced-motion`.
