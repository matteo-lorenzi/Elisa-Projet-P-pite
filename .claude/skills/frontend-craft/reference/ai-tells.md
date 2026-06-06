# AI tells & bans absolus

Match-and-refuse : si tu t'apprêtes à écrire l'un de ces patterns, réécris l'élément avec une autre structure. Le test : « une IA a fait ça » sans hésitation = échec.

## Bans absolus (cross-register)
- **Side-stripe borders** : `border-left/right` > 1px comme accent coloré sur cartes/alertes. → bordure pleine, fond teinté, numéro/icône, ou rien.
- **Gradient text** : `background-clip: text` + gradient. → couleur solide unique, emphase par poids/taille.
- **Glassmorphism par défaut** : blur/glass décoratif. Rare et intentionnel, ou rien. Si utilisé : +1px inner border, inner shadow, fallback solide sous `prefers-reduced-transparency`.
- **Hero-metric template** : gros chiffre + petit label + stats + accent gradient. Cliché SaaS.
- **Card grids identiques** : mêmes cartes icône+titre+texte répétées.
- **Eyebrow uppercase tracké au-dessus de chaque section** (voir layout-rules : max 1 / 3 sections).
- **Marqueurs numérotés 01/02/03** comme scaffolding par défaut. Justifiés seulement si la section EST une séquence ordonnée.
- **Texte qui déborde son conteneur** : tester le titre à chaque breakpoint.

## Couleur / CSS
- AI purple/blue glow, neon gradients par défaut → bannis sauf demande explicite.
- Palette premium-consumer beige/cream + brass/ocre + espresso → bannie comme défaut (tell n°2). Familles hex à éviter : fonds `#f5f1ea #f7f5f1 #fbf8f1 #efeae0`, accents `#b08947 #b6553a #9a2436`, textes `#1a1714`.
- Gris sur fond coloré (délavé) → teinte plus sombre du fond, ou transparence du texte.
- Ombre noir pur sur fond clair → teinter.

## Typographie
- Polices réflexe (défaut training-data) : Inter, DM Sans/Serif, Space Grotesk/Mono, Outfit, Plus Jakarta, Instrument, Fraunces, Playfair, Cormorant, Lora, IBM Plex, Geist-par-défaut.
- Serif « parce que créatif » = le tell le plus testé.
- ALL CAPS en corps.
- Italique display avec descendante (`y g j p q`) + `leading-none` → clippe. Min `leading-[1.1]` + `pb-1`.

## Layout & espacement
- Échelles plates (steps ~1.1×) → ratio ≥ 1.25.
- Tout centré quand variance élevée → forcer split/asymétrie (sauf manifesto/launch).
- Cartes imbriquées (toujours faux).

## Contenu (effet « Jane Doe »)
- Faux noms/avatars génériques, copy lorem.
- **Nombres faux-précis** (`92%`, `4.1×`, `5.8 mm`) sans source ni label `<!-- mock -->` → bannis.
- Copy « qui essaie de sonner pensif » (humilité passive-agressive, méta poético-cute). Relire chaque chaîne ; si douteux → phrase fonctionnelle plate.

## Images
- `<div>` colorés / fake screenshots en `<div>` / blobs gradient à la place d'un vrai visuel → bannis.
- Imagerie obligatoire sur brief qui l'implique. Sources : outil de génération si dispo, sinon `picsum.photos/seed/{seed}/{w}/{h}` ou Unsplash (vérifier que l'URL résout). Jamais d'ID deviné.
- Logo wall : vrais SVG (Simple Icons `https://cdn.simpleicons.org/{slug}/{color}`), pas de wordmarks texte. Logos seuls, pas de label catégorie dessous. Light + dark.

## Production-test tells (bannis d'office)
- Em-dash (—) et `--` comme flourish → interdits partout. Utiliser virgule, deux-points, point-virgule, parenthèses.
- Quotes ASCII droites (") → vraies quotes typographiques (« » ou " ") ou rien.
- Testimonials > 3 lignes ; attribution nom-seul (« – Sarah »).

## Le test à deux ordres
- **1ᵉ ordre** : devine-t-on le thème depuis la seule catégorie ? → réflexe.
- **2ᵉ ordre** : devine-t-on l'aesthetic depuis « catégorie + anti-référence » ? → piège un cran plus loin. Lane saturée actuelle : éditorial-typographique (display serif italique + petits labels mono + filets). Retravailler jusqu'à ce que les deux réponses ne soient pas évidentes.
