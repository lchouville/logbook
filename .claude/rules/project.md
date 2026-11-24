# Règles du projet : techno, architecture, conventions

À remplir après l'étape « cahier des charges technique » (voir `design.md`).

## Stack
- Site statique (HTML/CSS/JS, pas de build).
- Dev : lancer `python dev-server.py` (port **8080** par défaut) — port autorisé pour l'OAuth Google (`GOOGLE_CLIENT_ID`), à la fois en local et sur `gh-pages`. Remplace `python -m http.server` : sert aussi, sous `/__dev_drive__/`, une émulation locale de l'API Drive utilisée par le bouton « Mode test local » (voir `js/auth.js`, `js/drive.js`), données stockées dans `.devdrive/` (gitignoré, jamais commit). Uniquement actif sur `localhost`/`127.0.0.1` ; sans effet sur `gh-pages`.

## Architecture
- Début de développement : regarder les autres projets du même genre dans les dépôts de l'utilisateur, proposer une architecture et demander validation avant de coder.

## Conventions spécifiques
- À définir (textes affichés à l'utilisateur, structure des dossiers, etc.).
