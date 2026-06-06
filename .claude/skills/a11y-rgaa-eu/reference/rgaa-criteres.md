# RGAA 4.1.2 — 13 thématiques & points de contrôle

106 critères, ~257 tests. Alignés WCAG 2.1 AA via EN 301 549. Ci-dessous l'essentiel opérationnel par thématique (pas la liste exhaustive des tests — pour le détail officiel, se référer au RGAA 4.1.2 publié par la DINUM).

## 1. Images
Toute image porteuse d'info a une alternative pertinente (`alt`). Images décoratives ignorées (`alt=""`, ou CSS). Images-textes évitées. Images cliquables = alternative décrivant la destination. Légendes liées.

## 2. Cadres
Chaque `<iframe>` a un `title` pertinent.

## 3. Couleurs
Information jamais donnée par la **seule** couleur. Contraste texte ≥ 4.5:1 (≥ 3:1 grand texte). Contraste des composants d'interface et informations portées par la couleur ≥ 3:1.

## 4. Multimédia
Média temporel : transcription, sous-titres synchronisés, audiodescription si pertinent. Contrôles accessibles (lecture/pause/volume au clavier). Pas de lecture auto intrusive.

## 5. Tableaux
Tableaux de données : `<caption>`, en-têtes `<th>` + `scope` (ou `headers/id` si complexe). Tableaux de mise en forme évités (linéarisation correcte, pas d'attribut de données).

## 6. Liens
Intitulé explicite (sens hors contexte) : « Voir les tarifs » > « cliquez ici ». Liens identiques = même intitulé/destination. Liens images = alternative = intitulé.

## 7. Scripts
Composants riches accessibles (clavier + restitution lecteur d'écran), via ARIA conforme au design pattern WAI-ARIA. Messages de statut restitués (`aria-live`). Pas de piège clavier. Alternative si script indispensable.

## 8. Éléments obligatoires
`DOCTYPE`, code source valide (balises, attributs). `<html lang>` présent et pertinent ; changements de langue signalés. `<title>` de page pertinent et unique. Pas de contenu qui change le contexte sans demande.

## 9. Structuration de l'information
Titres `<h1>`–`<h6>` hiérarchisés sans saut de niveau. Landmarks / régions (`header nav main aside footer`, rôles ARIA si besoin). Listes réelles (`<ul> <ol> <dl>`). Citations balisées.

## 10. Présentation de l'information
CSS pour la présentation (contenu lisible CSS désactivé). Info portée par la forme/taille/position aussi disponible autrement. Texte zoomable 200% sans perte. Pas de scroll horizontal au zoom / 320px. `:focus` visible. Espacement du texte ajustable sans casse.

## 11. Formulaires
`<label>` lié à chaque champ (`for`/`id`). Champs de même nature regroupés (`<fieldset>/<legend>`). Champs obligatoires et formats attendus indiqués (texte, pas couleur seule). Erreurs : identifiées, décrites, suggestions de correction, liées au champ. Autocomplete pertinent (`autocomplete`). Contrôle avant envoi pour actions à conséquence.

## 12. Navigation
Au moins 2 systèmes de navigation (menu, plan, recherche). Lien d'évitement / accès rapide au contenu. Ordre de tabulation cohérent. `tabindex` positif évité. Focus géré dans les composants (modales : focus piégé volontairement + retour).

## 13. Consultation
Pas de limite de temps non contrôlable (ou ajustable/désactivable). Contenu clignotant ≤ 3 fois/s. Respect des préférences système (`prefers-reduced-motion`, `prefers-color-scheme`, `prefers-reduced-transparency`). Documents en téléchargement accessibles ou alternative. Pas de changement de contexte au focus/à la saisie.

---

## Mapping rapide → WCAG / dimension d'audit

| Thématique RGAA | Dimension SKILL.md | WCAG clés |
|---|---|---|
| 3, 1, 4 | 1. Perception | 1.1.1, 1.4.3, 1.4.11, 1.4.1 |
| 7, 12, 10 (focus) | 2. Clavier & focus | 2.1.1, 2.1.2, 2.4.7, 2.4.3, 2.5.5/2.5.8 |
| 8, 9 | 3. Structure | 1.3.1, 2.4.6, 3.1.1, 4.1.2 |
| 11 | 4. Formulaires | 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2 |
| 13, 10 (zoom), 7 (live) | 5. Robustesse/préférences | 1.4.4, 1.4.10, 2.2.1, 2.3.1, 2.3.3, 4.1.3 |

## Déclaration de conformité (France)
Niveaux : **non conforme** (< 50%), **partiellement conforme** (≥ 50%), **totalement conforme** (100% des critères applicables). La déclaration d'accessibilité + le taux + le schéma pluriannuel sont des obligations légales pour les entités assujetties. Vérifier l'assujettissement (secteur public, ou privé via EAA / seuil de CA).
