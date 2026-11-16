# Règles CI/CD (tous projets)

## À l'initialisation du projet, mettre en place
- GitHub Actions de CI sur chaque PR : lint, tests, build.
- Action de release notes en brouillon : à chaque fusion dans `develop` et `main`, mise à jour automatique d'une release GitHub en brouillon (draft), par exemple avec `release-drafter`.
  - Contenu groupé par type de commit/PR (`feat`, `fix`, `perf`, `docs`, `chore`...), à partir des Conventional Commits (voir `git.md`) ; la version suivante proposée suit `vX.Y.Z` (voir versionnage).
  - Le brouillon n'est jamais publié automatiquement : l'utilisateur le relit, le corrige puis le publie au moment du tag.
  - Sections `hotfix` mises en avant pour les `hotfix-release/`.
- Action de fusion des notes : quand la release est publiée, les notes sont ajoutées automatiquement :
  - à la fin de `release-notes.md` (en-tête `## vX.Y.Z - date`, sans toucher aux versions précédentes), via une PR automatique vers `develop` pour respecter la protection des branches ;
  - directement sur `gh-pages` (page des notes de version, FR/EN), sans attendre le prochain déploiement de `main`.
  - Les notes sont rédigées en anglais ; la version française est écrite au moment de la relecture du brouillon, avant publication.
  - Idempotente : ne rien ajouter si la version est déjà présente dans le fichier.
- Action de release : à chaque tag `vX.Y.Z` sur `main`, publication de la release GitHub à partir du brouillon (notes relues) et publication du build compilé sur la branche `release` (dossier `vX.Y.Z/` et mise à jour de `latest/`), voir `git.md`.
- Action de déploiement GitHub Pages : publication du build de `main` sur `gh-pages` (site et documentation détaillée).
- Contrôle sur les PR vers `main` : échec si `visual-ref/` ou `REPRISE.md` est présent (voir `git.md`).
- Génération de `portfolio.json` à chaque tag et publication sur `gh-pages` avec le déploiement (voir `docs.md`).
- Sécurisation des branches `main` et `develop` : PR obligatoire, CI verte requise, pas de push direct, pas de force push, branche à jour avant fusion.
- Sécurisation des PR et des Actions : permissions minimales du `GITHUB_TOKEN`, Actions épinglées (version ou SHA), secrets uniquement via les secrets GitHub.

## Build de production (branches `release` et `gh-pages`)
- Ce qui est publié (`gh-pages`, branche `release`, artefacts de release) est uniquement l'application compilée, jamais le code source natif.
- Build de production : minification et mangling, pas de source maps publiées (`build.sourcemap: false` avec Vite), pas de code mort, pas de commentaires.
- Obfuscation du JavaScript en plus de la minification quand l'application l'exige, en vérifiant l'impact sur les performances (priorité sécurité, puis performance : voir `quality.md`).
- Aucun secret ni logique sensible dans le code client : tout code livré au navigateur peut être lu. Ce qui doit rester privé reste côté serveur.
- Vérifier dans la CI que le build publié ne contient ni `.map` ni dossier `src/`.

## Précaution
- La création de workflows locaux se fait directement. Les réglages distants (protection de branches, secrets, activation de Pages) modifient le dépôt GitHub : demander confirmation avant de les appliquer.
