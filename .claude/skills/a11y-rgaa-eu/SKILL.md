---
name: a11y-rgaa-eu
description: À utiliser quand il faut vérifier, auditer ou corriger l'accessibilité numérique (a11y) ou la conformité RGAA, WCAG, EN 301 549 ou European Accessibility Act d'une page ou d'un composant — contraste, navigation clavier, ARIA, structure sémantique HTML, gestion du focus, alternatives textuelles, sous-titres, formulaires accessibles, reduced-motion, lecteur d'écran. Produit un rapport gradué avec sévérités et correctifs. Pour un audit complet, lancer en subagent.
license: MIT
---

# a11y-rgaa-eu

## Overview

Audit **technique** d'accessibilité selon les normes européennes et françaises en vigueur. On documente et grade les écarts (correction = un autre passage, ou sur demande explicite).

**Subagent recommandé :** pour un audit multi-pages, lancer ce skill via le tool Agent (contexte isolé) — il lit beaucoup de fichiers et produit un rapport autonome.

## Normes applicables (cadre 2026)

| Norme | Portée | Note |
|---|---|---|
| **RGAA 4.1.2** | Référentiel **français** (13 thématiques, 106 critères, ~257 tests) | Transpose et opérationnalise EN 301 549 / WCAG. Référence d'audit en France. |
| **EN 301 549 (V3.2.1)** | Norme **européenne** harmonisée | Socle technique commun UE. |
| **WCAG 2.1 niveau AA** | International (socle de RGAA/EN) | Cible minimale. Viser aussi les ajouts **WCAG 2.2** (focus visible, target size, etc.). |
| **Directive (UE) 2016/2102** | Secteur **public** | Déclaration d'accessibilité obligatoire. |
| **EAA — Directive (UE) 2019/882** | Services **privés** B2C (e-commerce, banque, transport…) | **Applicable depuis le 28/06/2025.** À vérifier selon le service rendu par le site. |
| **France** : loi 2005-102 art. 47, décret 2019-768 | Obligations FR | Mention de conformité (« non / partiellement / totalement conforme »), déclaration d'accessibilité, schéma pluriannuel. |

**[À confirmer avec l'utilisateur]** le périmètre légal exact (le site rend-il un service couvert par l'EAA ?). En cas de doute, auditer au niveau **RGAA 4.1.2 / WCAG 2.1 AA** par défaut.

Détail des 13 thématiques RGAA + mapping WCAG → [reference/rgaa-criteres.md](reference/rgaa-criteres.md).

## Méthode d'audit

Évaluer 5 dimensions, scorer chacune **0–4**.

### 1. Perception (contraste, alternatives)
Contraste texte ≥ 4.5:1 (corps), ≥ 3:1 (grand texte ≥ 18px ou gras ≥ 14px) — placeholders inclus. Composants UI et états (focus, bordures d'input) ≥ 3:1. Alternatives textuelles pertinentes sur images porteuses d'info ; `alt=""` sur décoratives. Sous-titres/transcription pour le multimédia. Info jamais portée par la **seule** couleur.

### 2. Utilisable au clavier & focus
Tout actionnable atteignable et activable au clavier, **ordre de tabulation logique**, **pas de piège clavier**. **Focus visible** (ne jamais supprimer l'outline sans alternative ≥ 3:1). Cibles tactiles ≥ 44×44px (WCAG 2.2 : 24px min). Skip-link vers le contenu principal.

### 3. Structure sémantique
HTML sémantique : un seul `<h1>`, hiérarchie de titres sans saut, landmarks (`header/nav/main/footer`), listes réelles, `<button>` pour les actions (pas `<div onclick>`). Langue déclarée (`<html lang="fr">`). ARIA seulement si le natif ne suffit pas (« no ARIA > bad ARIA »).

### 4. Formulaires
Chaque champ a un `<label>` lié (`for`/`id`), jamais placeholder-as-label. Champs requis indiqués (pas que par la couleur). Erreurs identifiées, décrites en texte, liées au champ (`aria-describedby`), focus géré. Regroupements (`<fieldset>/<legend>`).

### 5. Robustesse & préférences
Valide / pas d'attributs ARIA cassés. Respecte `prefers-reduced-motion` (alternative crossfade/instant pour chaque animation). Pas de contenu clignotant > 3 fois/s. Zoom 200% sans perte d'info ni scroll horizontal. Testé avec un lecteur d'écran si possible.

## Rapport (format de sortie)

### Score de santé a11y
| # | Dimension | Score /4 | Constat clé |
|---|---|---|---|
| 1 | Perception | ? | |
| 2 | Clavier & focus | ? | |
| 3 | Structure | ? | |
| 4 | Formulaires | ? | |
| 5 | Robustesse/préférences | ? | |
| **Total** | | **?/20** | **[bande]** |

Bandes : 18–20 Excellent · 14–17 Bon · 10–13 Acceptable · 6–9 Faible · 0–5 Critique.

### Constats par sévérité
Taguer chaque écart **P0–P3** :
- **P0** bloquant (échec WCAG A, contenu inatteignable)
- **P1** majeur (violation WCAG AA / critère RGAA non conforme)
- **P2** mineur (contournement existe)
- **P3** polish

Pour chaque écart : **[P?] Nom** · Localisation (fichier/ligne/composant) · Dimension · Impact utilisateur · **Critère RGAA + critère WCAG** violé · Correctif concret.

### Synthèse
Score · nombre d'écarts par sévérité · top 3–5 critiques · taux de conformité RGAA estimé (conforme / partiellement / non conforme) · prochaines étapes priorisées (P0 → P1 → P2).

## Common Mistakes

- Auditer en WCAG générique sans mapper aux critères **RGAA** (la conformité française se prononce sur RGAA).
- Supprimer l'outline de focus « pour l'esthétique » → P1 systématique.
- ARIA ajouté par réflexe sur des éléments natifs → casse plus que ça n'aide.
- Placeholder utilisé comme label.
- Oublier `prefers-reduced-motion` (lié à `frontend-craft`).
- Annoncer « conforme » sans le rapport et les preuves (sévérités + critères).
