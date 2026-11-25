# Règles du projet : techno, architecture, conventions

À remplir après l'étape « cahier des charges technique » (voir `design.md`).

## Stack
- Site statique (HTML/CSS/JS, pas de build).
- Dev : lancer `python dev-server.py` (port **8080** par défaut) — port autorisé pour l'OAuth Google (`GOOGLE_CLIENT_ID`), à la fois en local et sur `gh-pages`. Remplace `python -m http.server` : sert aussi, sous `/__dev_drive__/`, une émulation locale de l'API Drive utilisée par le bouton « Mode test local » (voir `js/auth.js`, `js/drive.js`), données stockées dans `.devdrive/` (gitignoré, jamais commit). Uniquement actif sur `localhost`/`127.0.0.1` ; sans effet sur `gh-pages`.

## Architecture
- Début de développement : regarder les autres projets du même genre dans les dépôts de l'utilisateur, proposer une architecture et demander validation avant de coder.

## Branches et release
- Modèle Gitflow complet de `git.md` adopté depuis `v0.1.0` : `main` (prod, tags `vX.Y.Z`), `develop` (intégration), `release` (branche orpheline, builds compilés par version uniquement, alimentée par la CI).
- Pas de branche `gh-pages` dédiée : le déploiement Pages est basé sur l'artefact GitHub Actions (`build_type: workflow`), déclenché par push sur `main` (`.github/workflows/deploy.yml`) — `portfolio.json` est généré à ce moment-là et servi directement à l'URL publique.
- Pas de `package.json` (pas de build Node) : la version du projet vit uniquement dans les tags git et `portfolio.json`, aucun fichier à synchroniser manuellement.

## Conventions spécifiques
- À définir (textes affichés à l'utilisateur, structure des dossiers, etc.).
