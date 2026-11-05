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

## Configuration Google OAuth

Projet Google Cloud : `logbook-513714`. Client OAuth Web "Logbook Web" créé, origines autorisées `https://lchouville.github.io` et `http://localhost:8080`, scope `drive.file`. L'écran de consentement est en mode Externe/Test : seuls les comptes ajoutés dans "Utilisateurs tests" (console Google Cloud) peuvent se connecter. Le Client ID est dans `js/config.js` (voir "Configuration locale et secrets" ci-dessous) — public par nature (visible côté client), à ne pas confondre avec le code secret du client (jamais utilisé ni stocké ici, une app statique sans backend n'en a pas besoin).

Pour le partage (voir plus bas), l'API Picker doit aussi être activée dans ce projet : Google Cloud Console → APIs & Services → Identifiants → Créer des identifiants → Clé API, restreinte à l'API Picker et aux référents HTTP `http://localhost:8080/*` et `https://lchouville.github.io/*`. La clé va dans `GOOGLE_PICKER_API_KEY` (`js/config.js`), publique comme le Client ID.

## Configuration locale et secrets

`js/config.js` n'est **pas commité** (`.gitignore`) : même si le Client ID et la clé Picker sont des identifiants publics par conception (visibles côté client, protégés par les restrictions référent/API côté Google Cloud plutôt que par le secret), les garder hors de l'historique Git évite qu'ils traînent dans chaque PR/commit d'une branche de travail. `js/config.template.js` est le fichier commité, avec des placeholders `__GOOGLE_CLIENT_ID__` / `__GOOGLE_PICKER_API_KEY__`.

- **En local** : copier `js/config.template.js` vers `js/config.js` et renseigner les vraies valeurs à la main.
- **En publication** : `.github/workflows/deploy.yml` se déclenche sur chaque push vers `gh-page`, génère `js/config.js` à partir du template et des secrets du dépôt (`GOOGLE_CLIENT_ID`, `GOOGLE_PICKER_API_KEY` — Settings → Secrets and variables → Actions), puis déploie directement sur GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`) sans jamais commiter le fichier généré.
- **Prérequis unique côté réglages GitHub** (à faire une fois, manuellement) : dans Settings → Pages, mettre la source sur **GitHub Actions** (plutôt que "Deploy from a branch"), sinon ce workflow ne publie rien.

## Stockage Drive

Les entrées sont stockées dans un unique fichier JSON `logbook-data.json`, dans le dossier `Application/logbook` du Drive de l'utilisateur (créés automatiquement au premier enregistrement si absents, en couleur Lavande `#CD74E6`). `js/drive.js` gère ça avec le scope `drive.file` — l'app ne voit que les fichiers/dossiers qu'elle crée elle-même. Si un ancien `logbook-data.json` traîne à la racine du Drive (créé avant l'introduction de ce dossier), il est automatiquement déplacé dans `Application/logbook` au lieu d'être dupliqué. Modèle d'une entrée (`js/entries.js`) : thème(s), niveau d'accès (N1-N5), statut (A Valider / A Compléter / Complete / Bilan), type de journée, mesures du soir (énergie, ressenti /10), texte, et un `ressentiAFroid` rempli plus tard (pas encore d'UI dédiée).

Les préférences utilisateur (thème pour l'instant) sont stockées dans un second fichier JSON, `logbook-settings.json`, dans le même dossier `Application/logbook`. `js/drive.js` expose `loadSettings`/`saveSettings` en généralisant la logique de lecture/écriture déjà utilisée pour `logbook-data.json`.

## Thème

Le thème par défaut s'inspire visuellement de Notion (typo système, bordures fines, cartes sobres). Trois réglages possibles, choisis via le sélecteur "Thème" une fois connecté : Clair, Sombre, Appareil (suit `prefers-color-scheme`, c'est la valeur par défaut). Le réglage est stocké dans `logbook-settings.json` (`{ "theme": "device" | "light" | "dark" }`) et appliqué via l'attribut `data-theme` sur `<html>`, lu par les variables CSS définies dans `css/style.css` (`js/theme.js` pour la logique d'application).

Prévu plus tard : import de thèmes personnalisés depuis un dossier partagé (structure encore à définir) — `logbook-settings.json` n'enregistrera à terme que la référence du thème actif, pas son contenu.

## Partage

Un partage rend visible, à une personne précise, un sous-ensemble filtré des entrées (texte et mesures inclus), via un lien vers `partage.html?id=<fichierId>`.

Le filtre (`regles`) associe chaque thème partagé à l'ensemble des niveaux d'accès visibles pour ce thème — le niveau est relatif au thème, pas un filtre global croisé (ex. `{ "Travail": ["N1","N2"], "Santé": ["N1"] }` partage les entrées Travail de niveau N1 ou N2, et seulement les entrées Santé de niveau N1). Une entrée est visible si au moins un de ses thèmes a une règle incluant son niveau (`filtrerEntreesPartage` dans `js/entries.js`).

Côté stockage, un partage crée/maintient à jour (à chaque sauvegarde d'entrée, par son `fichierId` directement — pas de recherche par nom) un fichier dans `Application/logbook/partages/`, nommé `<Nom du propriétaire> — <nom du partage>.json` (le nom du propriétaire vient de l'API Drive `about`, `getOwnerDisplayName` dans `js/drive.js` — pas besoin d'élargir le scope OAuth pour ça) afin que la personne invitée reconnaisse facilement le bon fichier dans le sélecteur Google. La configuration de tous les partages (nom, règles, emails invités, fichier associé, id de la permission Drive accordée) est dans `logbook-partages.json` à la racine de `Application/logbook`.

Un partage existant peut être modifié (nom, règles, email) via le bouton "Modifier" — rechange le fichier Drive si le nom change, et ne révoque/recrée la permission Drive que si l'email change.

Côté accès, la personne invitée est ajoutée comme lectrice du fichier filtré via l'API Drive (`permissions.create`) — elle doit donc aussi être ajoutée en "Utilisateur test" du projet Google Cloud (même contrainte que pour le propriétaire, l'app étant en mode Test). Comme ce fichier n'est pas créé par sa propre session de l'app, le scope `drive.file` ne lui donne pas accès automatiquement : au premier chargement de `partage.html`, elle doit le sélectionner une fois via un sélecteur Google (Picker, `js/picker.js`), ce qui lui accorde l'accès à ce fichier précis sans élargir le scope du propriétaire ni le sien (le Picker nécessite `setAppId`, le numéro de projet Google Cloud — préfixe numérique du Client ID — sans quoi l'autorisation ne s'enregistre pas et l'API Drive continue de renvoyer 403 après la sélection).

## État du projet

- [x] Créer un client OAuth Google (Google Cloud Console) et renseigner son ID dans `js/config.js`.
- [x] Implémenter la connexion Google (Google Identity Services).
- [x] Activer GitHub Pages sur la branche `gh-page`.
- [x] Implémenter la lecture/écriture des entrées dans le Google Drive de l'utilisateur (scope minimal `drive.file`).
- [x] Modéliser une entrée : thème, niveau d'accès (N1-N5), statut, mesures du soir (énergie, ressenti /10), type de journée, ressenti à froid.
- [x] UI pour remplir le ressenti à froid d'une entrée existante (après 2 jours).
- [x] Thème clair/sombre/appareil, par défaut proche de Notion, préférence stockée dans `logbook-settings.json`.
- [ ] Import de thèmes personnalisés depuis un dossier partagé (structure à définir).
- [x] Partage du tableau de bord par lien, filtré par thème et niveau d'accès (`partage.html`, accès invité via Google Picker).
- [ ] Tester en conditions réelles (deux comptes Google distincts) le flux Picker + révocation d'un partage, une fois la clé API Picker configurée (correctif `setAppId` appliqué, pas encore reconfirmé par un nouveau test croisé).
- [x] Modifier un partage existant (nom, règles, email).
- [x] Sortir `js/config.js` de Git (généré à la publication depuis des secrets GitHub Actions, `js/config.template.js` commité à la place).
- [ ] Basculer la source de GitHub Pages sur "GitHub Actions" (Settings → Pages) et renseigner les secrets `GOOGLE_CLIENT_ID`/`GOOGLE_PICKER_API_KEY` du dépôt — sans ça, `deploy.yml` ne publie rien.
- [ ] Publier l'application OAuth (sortir du mode Test) une fois le branding complété, pour éviter l'expiration du jeton au bout de 7 jours.
