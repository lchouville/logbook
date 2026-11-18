# Règles Gitflow

## Branches
- `main` : production, toujours stable et déployable. Jamais de commit direct.
- `develop` : intégration, base de toutes les branches de travail.
- `feature/<short-name>` : nouvelle fonctionnalité, créée depuis `develop`, fusionnée dans `develop`.
- `fix/<short-name>` : correction de bug, même flux que `feature/`.
- `hotfix/<short-name>` : correction urgente créée depuis `develop`, fusionnée dans `develop` (comme un `fix/`, mais marquée à livrer en priorité). Plusieurs hotfix peuvent s'enchaîner avant d'être envoyés sur `main`.
- `hotfix-release/<version>` : lot de hotfix à envoyer sur `main`. Créée depuis `main` ; on y reporte (cherry-pick) uniquement les commits des hotfix déjà fusionnés dans `develop`, sans les fonctionnalités non livrées. Fusionnée dans `main` (tag `vX.Y.Z`, `Z` incrémenté). `develop` les contient déjà, pas de rétro-fusion sauf conflit de version (`package.json`).
- `prepare-release/<version>` : préparation d'une version depuis `develop`, fusionnée dans `main` (tag `vX.Y.Z`) et `develop`.
- `release` : branche de téléchargement des versions, sur le modèle de `gh-pages`. Branche orpheline qui ne contient que l'application compilée (voir `cicd.md`), un dossier par version (`vX.Y.Z/`) plus `latest/`. Alimentée uniquement par la CI à chaque tag sur `main`. Jamais de commit manuel, jamais de code source, jamais de fusion vers une autre branche.- Attention : git ne permet pas d'avoir à la fois une branche `release` et des branches `release/...`. Les branches de préparation s'appellent donc `prepare-release/`, jamais `release/`.
- `gh-pages` : uniquement si le projet est hébergé sur GitHub Pages. Branche de déploiement, alimentée depuis `main` (le build de `main` y est publié). Jamais de commit manuel ni de travail dessus, jamais de fusion de `gh-pages` vers une autre branche.
- Noms de branches en anglais, minuscules, séparés par des tirets.

## Fichiers de suivi hors `main` : `visual-ref/` et `REPRISE.md`
- Dossier à la racine contenant les références visuelles pour suivre l'avancement : captures, GIFs, maquettes de référence, rangés par fonctionnalité ou version (`visual-ref/<feature-or-version>/`).
- Versionné sur `develop` et les branches de travail, mais **jamais présent sur `main`** (ni sur `gh-pages`).
- Les `prepare-release/` et `hotfix-release/` retirent `visual-ref/` (`git rm -r`, avec `REPRISE.md`) avant la fusion dans `main`. Ordre pour `prepare-release/` : 1) fusion dans `develop`, 2) commit de retrait de `visual-ref/`, 3) fusion dans `main`. Ainsi la suppression n'atteint jamais `develop`.
- Fichiers légers (images compressées) pour ne pas alourdir le dépôt.
- `REPRISE.md` (notes de reprise, voir `workflow.md`) suit la même règle : poussé sur `develop` et les branches de travail pour être récupérable depuis un autre poste, mais jamais présent sur `main`. Retiré par `git rm` au même moment que `visual-ref/`, dans le même ordre (fusion dans `develop`, retrait, puis fusion dans `main`). Il ne doit pas figurer dans le `.gitignore`.

## Commits
- Format Conventional Commits, en anglais : `type(scope): description` (`feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`).
- Un commit = un changement logique. Description à l'impératif, sans point final, 72 caractères max.
- Ne jamais committer sans demande explicite de l'utilisateur.
- Ne jamais committer de secrets, de `node_modules/`, ni de sorties de build (seule exception : la CI sur les branches `release` et `gh-pages`).

## Fusions et PR
- Travail via Pull Request vers `develop` (ou `main` pour prepare-release/hotfix-release) ; pas de push direct sur `main` ni `develop`.
- Fusion des `feature/`, `fix/` et `hotfix/` en squash (un commit propre par hotfix, plus facile à cherry-pick) ; `prepare-release/` et `hotfix-release/` en merge commit pour garder l'historique.
- Avant une PR : lint et build passent, branche à jour avec sa base.
- Supprimer la branche après fusion.

## Interdits (sans accord explicite)
- `git push --force` (sauf `--force-with-lease` sur sa propre branche de travail), `git reset --hard`, réécriture d'historique publié.
- Modifier la config git ou contourner les hooks (`--no-verify`).

## Versionnage
- Format `vX.Y.Z`. Tag sur `main` à chaque version.
  - `X` : statut de la version. `0` = alpha/beta, `1` = release.
  - `Y` : mise à jour majeure, ajout de fonctionnalité. Remet `Z` à 0.
  - `Z` : correctif, ajout ou modification mineure.
- Version de départ : `v0.1.0`. Passage à `v1.0.0` uniquement sur décision de l'utilisateur (sortie de la release).
- Garder `package.json` (`version`) synchronisé avec le tag, sans le préfixe `v`.
- `hotfix-release/` incrémente `Z` ; `prepare-release/` incrémente `Y` (ou `X` pour la sortie en release).
