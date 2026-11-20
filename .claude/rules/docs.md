# Règles de documentation (tous projets)

## Documentation minimale (`README.md`, en anglais)
- Description du concept du projet.
- Installation.
- Utilisation / lancement.
- Auteur.

## Documentation détaillée
- En français et en anglais, sous forme de site web hébergé sur GitHub Pages (branche `gh-pages`, voir `git.md`).
- `release-notes.md` (remplace `CHANGELOG.md`) : historique des versions, alimenté automatiquement à chaque release publiée (voir `cicd.md`). Chaque version est ajoutée à la fin du fichier, sans modifier les précédentes. Pas d'édition à la main hors correction de coquille.
- Les mêmes notes sont publiées dans la documentation détaillée sur `gh-pages`.
- Aucun secret dans la documentation.

## Données pour le portfolio
- Le portfolio de l'utilisateur récupère ses infos depuis les dépôts : toutes les infos utiles au portfolio sont publiées sur la `gh-pages` de chaque projet.
- Fichier `portfolio.json` à la racine de `gh-pages`, stable et lisible par machine :
  - `name`, `slug`, `version` (dernier tag), `status` (`prerelease` si `X`=0, `release` si `X`=1), `updatedAt`
  - `description` et `tagline` en `fr` et `en`
  - `stack` (technologies), `tags`
  - `links` : dépôt, démo, documentation (FR/EN)
  - `images` : captures et logo (chemins relatifs sur la `gh-pages`)
  - `author`
- Généré ou mis à jour automatiquement par la CI à chaque tag (voir `cicd.md`), jamais à la main sur `gh-pages`.
- Uniquement des infos publiques : aucun secret ni donnée personnelle.
