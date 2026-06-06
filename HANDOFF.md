# Handoff: Suite de skills design + identité + tokens (VulgaRuRale)

**Generated**: 2026-06-06
**Branch**: refactor/env-seam
**Status**: In Progress — fondation design posée et vérifiée (build OK), refonte UI à faire

> Ce handoff remplace l'ancien (chantier « durcissement env / PR #5 », mergé). Son reste encore ouvert (Phase 3 prod / Phase 4 housekeeping + gotchas env) est replié plus bas dans **« Autre chantier ouvert »** — ne pas le perdre.

## Goal

Mettre en place le design du site **VulgaRuRale** (« Vulgarisation du droit rural » : bibliothèque de documents/schémas pédagogiques sur abonnement ; Next 16 + React 19 + Tailwind v4 + Supabase + Stripe). La session a installé des skills design, audité/restructuré ces skills en une suite spécialisée, créé l'identité de marque, et gravé les design tokens.

## Completed

- [x] Audit lecture-seule des skills design (impeccable, taste-skill, ckm:design, frontend-design)
- [x] Architecture validée: suite de skills **spécialisées** à descriptions disjointes ; généralistes retirés
- [x] 4 skills créées dans `.claude/skills/` (projet, versionnées): `pepite-identite`, `pepite-tokens`, `frontend-craft`, `a11y-rgaa-eu`
- [x] Généralistes supprimés de `~/.claude/skills/` (design, impeccable, taste-skill)
- [x] `.gitignore` corrigé: `/.claude/*` + `!/.claude/skills/` (skills versionnés, settings locaux ignorés)
- [x] Identité de marque → `docs/design/identite.md` (source de vérité)
- [x] Tokens gravés: `src/app/globals.css` (OKLCH + dark mode) + `next/font` wiré dans `src/app/layout.tsx`
- [x] **Build vérifié** `npm run build` → exit 0, TypeScript OK, polices self-hostées sans erreur

## Not Yet Done

- [ ] **`frontend-craft` sur `src/app/page.tsx`** (home = boilerplate `max-w-3xl`, gris) → refondre avec les tokens (`bg-background`, `text-foreground`, `font-display`, accent ardoise)
- [ ] Refondre header/nav de `src/app/layout.tsx` (actuellement `border-b`/`underline` bruts)
- [ ] Appliquer tokens aux autres routes (bibliotheque, abonnement, login, profil, admin)
- [ ] Lancer `a11y-rgaa-eu` (audit RGAA/WCAG) avant mise en ligne
- [ ] Décider si commit (rien de committé)
- [ ] (Optionnel) test subagent de validation des skills (RED baseline non fait — voir Warnings)

## Failed Approaches (Don't Repeat These)

- **ckm:design** (repo ui-ux-pro-max): installée puis **supprimée**. Route vers ~10 sous-skills absentes, **viole la spec** (invoque `/ckm:brand`, `/ui-ux-pro-max` par commande — appel inter-skill interdit), dépend de Gemini (payant), cible shadcn (absent). Ne pas réinstaller.
- **impeccable**: bien faite mais **bug d'install** — son setup hardcode `node .claude/skills/impeccable/scripts/context.mjs` (chemin projet-relatif) alors qu'elle était user-global → scripts introuvables. Supprimée. Si réutilisée: l'installer en projet `.claude/skills/`.
- **Police Söhne Breit** (vue au preview): **payante** (Klim) → abandonnée pour **Bricolage Grotesque** + **Source Sans 3** (libres, Google Fonts). Söhne notée comme option premium dans identite.md.
- **Vérif police via `require('next/font/google')` runtime**: retourne `undefined` (module transformé au build, pas requérable). PAS une preuve d'absence. Vérifier dans `node_modules/next/dist/compiled/@next/font/dist/google/font-data.json` (les 2 polices y sont).

## Key Decisions

| Décision | Rationale |
|----------|-----------|
| 4 skills spécialisées vs 1 généraliste | Préférence utilisateur; descriptions disjointes = pas de collision de triggers (le défaut des généralistes) |
| Retirer impeccable/taste/design/frontend-design | Triple chevauchement « build a page »; contenu recyclé comme source des nouvelles skills |
| Pas d'orchestrateur | La spec interdit l'appel inter-skill; composition auto suffit. Subagent (`Agent`) pour passes lourdes (audit a11y) |
| Source de vérité = `docs/design/identite.md` | Évite conflit d'ownership; les skills la LISENT comme contexte |
| Vert agricole écarté | Réflexe 1er ordre « droit rural »; distinctivité via schéma + photo documentaire + accent ardoise |
| Tokens 2 couches (primitives `:root` → `@theme inline`) | Dark mode en basculant les primitives; le markup ne consomme que le sémantique |

## Current State

**Working**: `npm run build` exit 0. Polices Bricolage Grotesque (display) + Source Sans 3 (corps) self-hostées via `next/font`. Tokens OKLCH + dark mode. Utilitaires générés: `bg-background bg-surface text-foreground text-muted bg-accent text-accent-ink border-border font-display font-sans`.

**Broken**: rien. Les pages utilisent encore l'ancien style (fonctionnel, pas encore refondu).

**Uncommitted**: `M .gitignore`, `M src/app/globals.css`, `M src/app/layout.tsx`, `?? .claude/` (skills), `?? docs/design/`, `?? HANDOFF.md`. Rien de staged.

## Files to Know

| File | Why |
|------|-----|
| `docs/design/identite.md` | **Source de vérité marque** (voix, typo, couleurs OKLCH, imagerie). Lire AVANT toute UI |
| `src/app/globals.css` | Tokens: primitives OKLCH + `@theme` sémantique + dark mode |
| `src/app/layout.tsx` | Wiring `next/font` (`--font-bricolage`, `--font-source-sans`) + header/nav à refondre |
| `src/app/page.tsx` | Home boilerplate à refondre en premier |
| `.claude/skills/frontend-craft/` | SKILL.md + `reference/layout-rules.md` + `reference/ai-tells.md` |
| `.claude/skills/a11y-rgaa-eu/` | SKILL.md + `reference/rgaa-criteres.md` (RGAA 4.1.2 / EN 301 549 / WCAG / EAA) |
| `.claude/skills/pepite-identite\|pepite-tokens/` | Procédures identité + tokens |
| `AGENTS.md` | « This is NOT the Next.js you know » → lire `node_modules/next/dist/docs/` avant de coder |

## Code Context

Tokens disponibles (Tailwind v4, générés par `@theme inline`):
```
bg-background  bg-surface  text-foreground  text-muted
bg-accent  text-accent  text-accent-ink  border-border
font-display  font-sans
```

Accent (table complète dans identite.md):
```css
/* clair */ --p-accent: oklch(0.45 0.12 255);  /* bleu ardoise */
/* sombre */ --p-accent: oklch(0.70 0.12 255);
```

Wiring fonts (layout.tsx, en place):
```tsx
const fontDisplay = Bricolage_Grotesque({ subsets:['latin'], variable:'--font-bricolage', display:'swap' });
const fontSans = Source_Sans_3({ subsets:['latin'], variable:'--font-source-sans', display:'swap' });
// <html className={`${fontDisplay.variable} ${fontSans.variable}`}>
```

## Resume Instructions

1. Lire `docs/design/identite.md`. Ne pas réinventer la marque.
2. Invoquer `frontend-craft` et refondre `src/app/page.tsx`:
   - `bg-background text-foreground`, titres `font-display`, accent ardoise sur CTA/liens.
   - Suivre `reference/layout-rules.md` (hero dans le viewport, max 1 eyebrow/3 sections) et `reference/ai-tells.md` (pas de gradient text, pas d'em-dash).
   - Signature marque: prévoir un **schéma** pédagogique comme asset, pas un décor.
3. Vérifier: `npm run build`
   - Expected: `✓ Compiled successfully`, exit 0.
   - Si erreur police: vérifier le nom dans `font-data.json` (pas via require runtime).
4. Avant mise en ligne: invoquer `a11y-rgaa-eu` (idéalement via le tool `Agent`) → rapport gradué P0–P3.

## Setup Required

- `npm run build` télécharge les polices Google au build (réseau requis la 1ère fois, puis self-hostées).
- **Plus besoin de `GEMINI_API_KEY`** (skill `design` retirée).
- `.env.local` (Supabase/Stripe/Resend) présent — non touché cette session. Les 10 vars de `REQUIRED_ENV` (`src/lib/env.ts`) doivent exister sinon le serveur throw au boot (voulu).

## Warnings

- **`.claude/skills/` est désormais versionné** (négation `.gitignore`). Le reste de `.claude/` (settings/hooks locaux) reste ignoré. `git check-ignore .claude/skills/...` → exit 1 (non ignoré).
- **Règle spec Agent Skills**: une skill ne peut PAS en appeler une autre par commande; composition automatique. Les nouvelles skills se référencent par nom mais ne s'invoquent jamais.
- **writing-skills (TDD-for-skills) non complété**: pas de RED baseline subagent. Skills construites depuis contenu éprouvé (impeccable/taste). Si comportement inattendu → gap-test subagent.
- **Périmètre légal a11y à confirmer**: le site rend-il un service couvert par l'EAA (Directive UE 2019/882, applicable depuis 28/06/2025)? Défaut: auditer RGAA 4.1.2 / WCAG 2.1 AA.
- **Ne PAS ajouter `Co-Authored-By: Claude`** aux commits (mémoire `no-claude-coauthor`).
- `suppressHydrationWarning` sur `<html>`/`<body>` = **intentionnel**.
- `globals.css`: git prévient LF→CRLF (Windows), cosmétique.

---

## Autre chantier ouvert (handoff précédent — durcissement env / prod)

Workstream distinct, surtout **mergé dans `main`** (`3a55a06`). Reste non réalisable sans creds cloud:

- **Phase 3 Production** 🔑 : domaine Resend vérifié + `NEWSLETTER_FROM` sur ce domaine ; activer confirmation email à l'inscription (Supabase cloud) ; déploiement (Vercel) + 10 vars d'env prod (`REQUIRED_ENV` dans `src/lib/env.ts`) ; Stripe live (clés + `STRIPE_PRICE_ID` live + webhook prod + `STRIPE_WEBHOOK_SECRET`).
- **Phase 4 Housekeeping** : `claude mcp remove stripe` (MCP en doublon) ; fichiers seed (docs = métadonnées sans fichier → `/url` 404). Plan détaillé: `docs/superpowers/plans/2026-06-05-finition-prod-durcissement.md`.

**Gotchas environnement réutilisables**:
- **git-guardrails** (`.claude/hooks/`) s'active au redémarrage de session → `git push`/`reset --hard`/`clean -f`/`branch -D`/`checkout .`/`restore .` bloqués. Utiliser `! <cmd>` ou autorisation explicite. (`gh pr merge/create` NON bloqués.)
- **Docker/supabase pas sur PATH enfant** → `$env:Path += ";$env:LOCALAPPDATA\Programs\DockerDesktop\resources\bin"` (mémoire `docker-cli-path`). Dev local: Docker up → `npx supabase start` → `npm run dev` (:3000), Studio :54323.
- **Stripe CLI pointe par défaut sur le mauvais compte (NoNeed)** → forcer `--api-key <clé VulgaRuRale>` (mémoire `stripe-cli-account`).
- **Outils PowerShell échouent dans le tool Bash** (`$env:`, `Select-String`) → utiliser le tool PowerShell.
- **`supabase db reset` destructif** (efface comptes + abonnement test ; refaire inscription + promo admin).
- Newsletter en test: sink `delivered@resend.dev`, jamais un vrai email.
- Comptes test: admin `lorenzi.matteo30@gmail.com` (mdp inconnu de l'agent) ; `test-free@vulgarurale.test` / `Test1234!`. Buckets: `documents-free` / `documents-premium`.
- Tests: `npm test` (57/57 vitest), `npm run build`, `npm run lint`.
