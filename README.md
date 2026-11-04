# Logbook

Journal de bord personnel, accessible en ligne, hébergé gratuitement sur GitHub Pages.

## Principe

- Connexion via **Google (OAuth)** — pas de compte ni mot de passe propre à l'app.
- Les données du journal sont stockées dans le **Google Drive de l'utilisateur**, pas sur un serveur tiers.
- Site **statique**, sans backend ni base de données à maintenir.

## Stack

HTML / CSS / JavaScript natifs, sans framework ni étape de build. Objectif : rester simple, maintenable sur le long terme, et sobre en ressources (pas de pipeline CI, pas de dépendances à mettre à jour).

## Branches

- `develop` — branche de travail, par défaut.
- `release` — version stabilisée, prête à publier (point de passage avant `gh-page`).
- `gh-page` — branche servie par GitHub Pages (site public à l'URL `https://lchouville.github.io/logbook/`).

Flux : `develop` → `release` → `gh-page`.

## État du projet

Scaffold initial uniquement. Prochaines étapes :

- [ ] Créer un client OAuth Google (Google Cloud Console) et renseigner son ID dans `js/config.js`.
- [ ] Implémenter la connexion Google (Google Identity Services).
- [ ] Implémenter la lecture/écriture des entrées dans le Google Drive de l'utilisateur (scope minimal `drive.file`).
- [ ] Modéliser une entrée : thème, niveau d'accès (N1-N5), statut, mesures du soir (énergie, ressenti /10), type de journée, ressenti à froid.
- [ ] Activer GitHub Pages sur la branche `gh-page`.
