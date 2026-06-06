# Discipline de layout — règles dures

Échouer à l'une de ces règles = livrer du travail cassé. Les compter est mécanique (pré-flight).

## Hero
- Tient dans le viewport initial. Titre **≤ 2 lignes** desktop, sous-texte **≤ 20 mots** et ≤ 4 lignes, CTA visibles sans scroll.
- Échelle de police pensée AVEC la taille de l'asset. Défaut `text-4xl md:text-5xl lg:text-6xl` ; `text-6xl md:text-7xl` seulement si titre 3–5 mots. Un titre hero sur 4 lignes = erreur de taille de police, jamais de longueur de copy.
- Padding haut max `pt-24` (~6rem) desktop. Plus = le contenu flotte, lu comme un bug.
- **Stack hero : max 4 éléments texte** — (1) eyebrow OU brand strip OU rien · (2) titre · (3) sous-texte · (4) CTA (1 primaire + 1 secondaire max). **Bannis dans le hero :** tagline sous les CTA, micro-strip de confiance, teaser de prix, liste de features, rangée d'avatars. → sections dédiées sous le hero.
- « Used by / Trusted by » = section sous le hero, jamais dans la même rangée.

## Navigation
- **Une seule ligne au desktop.** Si ça ne tient pas à `lg` (1024px) : condenser, retirer le secondaire, ou hamburger. Nav sur 2 lignes = cassé.
- Hauteur cap 80px desktop, défaut 64–72px.

## CTA
- Texte sur **une ligne** au desktop. Sinon raccourcir (3 mots max) ou élargir le bouton.
- **Pas deux CTA de même intention** sur une page (« Nous contacter » + « Discutons » = même intention → un seul libellé partout).

## Grilles & sections
- **Bento : exactement autant de cellules que de contenu.** Pas de cellule vide. 3 items → 3 cellules (split 1+2…).
- Diversité de fond des bento : au moins 2–3 cellules avec vraie variation visuelle (image, gradient on-brand, motif, fond teinté). Pas 6 cartes blanc-sur-blanc typo-only.
- **Anti-répétition de layout** : une famille de layout (3-col-cards, full-width-quote, split-text-image) apparaît **au plus une fois** par page. 8 sections → ≥ 4 familles différentes.
- **Cap zigzag** : max 2 sections image+texte alternées d'affilée. La 3ᵉ = pré-flight fail. Casser avec full-width / vertical-stack / bento / marquee.
- **Ban split-header** par défaut (« gros titre à gauche + petit paragraphe à droite »). Empiler verticalement (titre puis corps ≤ 65ch). Split réservé à une vraie raison compositionnelle (visuel/interactif à droite).

## Eyebrow (règle #1 violée)
- Petit label uppercase tracké au-dessus d'un titre de section. Signature CSS typique : `text-[11px] uppercase tracking-[0.18em]`.
- **Max 1 eyebrow par 3 sections** (le hero compte pour 1). Si section A a un eyebrow, les 2 suivantes n'en ont pas.
- Pré-flight mécanique : compter les `uppercase tracking` au-dessus de titres. Si `> ceil(nbSections / 3)` → échec.
- Alternative : le supprimer. Le titre seul suffit.

## Theme lock
- La page a UN thème. Les sections ne s'inversent pas. Pas de section warm-paper au milieu d'une page sombre.
- Exception : « color block story » / « theme switch on scroll » délibéré, une fois par page.
- Tints de fond dans la même famille OK (`bg-zinc-950` à côté de `bg-zinc-900`).

## Materiality
- Cartes seulement si l'élévation communique une vraie hiérarchie ; sinon `border-t`, `divide-y`, espace négatif.
- Ombre teintée vers la teinte du fond, jamais noir pur sur fond clair.
- **Shape lock** : une seule échelle de rayon par page (tout-sharp, tout-soft 12–16px, ou tout-pill), sauf règle documentée et suivie partout.

## Densité de contenu
- Défaut par section : titre ≤ 8 mots + sous-paragraphe ≤ 25 mots + un visuel OU un CTA.
- Pas de data-dump (table 20 lignes, liste 30 prix) sur une page marketing → top 3–5 + « voir tout », ou autre page.
- Liste > 5 items → composant différent (split 2-col, card grid, tabs/accordion, scroll-snap, carousel, marquee), pas un `<ul>` plus long.

## Mobile
- Repli `< 768px` **déclaré explicitement par section** pour chaque layout multi-colonnes. Pas de « Tailwind gère ».
