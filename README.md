# Logbook

Journal de bord personnel, accessible en ligne, hébergé gratuitement sur GitHub Pages.

## Principe

- Connexion via **Google (OAuth)** — pas de compte ni mot de passe propre à l'app.
- Les données du journal sont stockées dans le **Google Drive de l'utilisateur**, pas sur un serveur tiers.
- Site **statique**, sans backend ni base de données à maintenir.

## Stack

HTML / CSS / JavaScript natifs, sans framework ni étape de build. Objectif : rester simple, maintenable sur le long terme, et sobre en ressources (pas de dépendances à mettre à jour côté app).

## Branches

- `develop` — branche de travail, par défaut.
- `release` — version stabilisée, prête à publier (point de passage avant `gh-page`).
- `gh-page` — branche servie par GitHub Pages (site public à l'URL `https://lchouville.github.io/logbook/`).

Flux : `develop` → `release` → `gh-page`.

`develop`, `release` et `gh-page` sont protégées : push direct interdit, passage obligatoire par une Pull Request. Une CI légère (GitHub Actions, voir `.github/workflows/ci.yml`) valide le HTML sur chaque PR vers ces branches ; la PR ne peut être mergée que si ce contrôle passe.

## Workflow de contribution

Tout ajout ou correctif passe par une branche dédiée, jamais par un commit direct :

- `feature/<nom>` — nouvelle fonctionnalité. Part de `develop`, PR vers `develop`.
- `fix/<correctif>` — correction non urgente. Part de `develop`, PR vers `develop`.
- `hotfix/<correctif>` — correction urgente sur une version déjà publiée. Part de `release`, PR vers `release`, puis `release` est mergée vers `gh-page` et reportée (merge ou cherry-pick) sur `develop` pour ne pas perdre le correctif.

## État du projet

Scaffold initial uniquement. Prochaines étapes :

- [ ] Créer un client OAuth Google (Google Cloud Console) et renseigner son ID dans `js/config.js`.
- [ ] Implémenter la connexion Google (Google Identity Services).
- [ ] Implémenter la lecture/écriture des entrées dans le Google Drive de l'utilisateur (scope minimal `drive.file`).
- [ ] Modéliser une entrée : thème, niveau d'accès (N1-N5), statut, mesures du soir (énergie, ressenti /10), type de journée, ressenti à froid.
- [ ] Activer GitHub Pages sur la branche `gh-page`.
