# Reprise : import d'entrées IA depuis le Drive (2026-11-23)

## Objectif

Permettre de déposer des entrées écrites par IA sur le Drive (dossier `entries_to_import`), de les lister dans une page « Intégration », et de les intégrer dans le bon tableau de bord. Ajout en cours de route : export/import des tableaux de bord et modèles, connexion d'un dossier Drive unique « Logbook », compteur et chargement par lots sur la page Intégration.

## Fait

Changements livrés :

- Système de connexion d'un dossier Drive « Logbook » unique (scope `drive.file`, Picker, popup de connexion/création), toutes les données de l'app (dashboards, modèles, entrées, intégration) vivent dedans.
- Page Intégration (`#integration`, sidebar) : liste des fichiers en attente dans `entries_to_import`, sélecteur de tableau de bord cible, boutons Intégrer/Rejeter.
- Export JSON des tableaux de bord et des modèles (boutons en haut des pages Entrées / Modèles).
- Import JSON des tableaux de bord et des modèles (mêmes pages), avec confirmation avant remplacement.
- Renommage des dossiers de données par dashboard en `logbook-default` / `logbook-<nom>`.
- Compteur de fiches à intégrer (`#integration-count`) + chargement par lots de 5 (`INTEGRATION_BATCH_SIZE`) dans `loadIntegrationFiles()` (js/app.js) pour éviter une longue attente unique.
- 59 fiches de test « Rituel du soir » (25/09 → 22/11/2026) créées manuellement dans `entries_to_import` via le token de session de l'app, à partir des bilans hebdo et du tableau de mesures Notion (voir skill `remplir-journal`).

## Reste à faire / à tester

- **Rien n'a été testé en live après le dernier lot de modifs** (compteur + chargement par lots). Reprendre par un test complet dans le navigateur :

  1. Se connecter à l'app (`http://localhost:8080`), dossier Logbook déjà lié.
  2. Ouvrir la page Intégration, vérifier que le compteur affiche la progression par lots de 5 puis le total final.
  3. Intégrer une fiche : vérifier qu'elle disparaît de la liste **sans recharger la page** (le code le fait déjà via `integrationFiles = integrationFiles.filter(...)` + `renderIntegrationList()`, mais pas vérifié en conditions réelles depuis les derniers changements).
  4. Rejeter une fiche : même vérification.
  5. Tester l'import direct d'entrée (upload + Drive) sur la page Entrées.
  6. Tester l'export puis l'import des tableaux de bord et des modèles (aller-retour).
  7. Tester l'export/import d'un tableau de bord contenant une entrée de **statut « Bilan »** : vérifier que le statut est bien préservé après le ré-import.
  8. Tester l'export/import d'un **modèle utilisé par une entrée** (`modeleId`) : exporter les modèles, les réimporter, vérifier que les entrées qui le référencent restent cohérentes (même `contenuSchema`, pas de rupture du lien `modeleId`).

- Les 59 fiches de test dans `entries_to_import` sont de vraies données (mesures H/F du rituel du soir) — à conserver, intégrer ou nettoyer selon ce que l'utilisateur en fait, pas supprimer sans demande explicite.
- Nettoyage mineur non fait : sélecteurs CSS orphelins pour `#sidebar-connect-logbook-button`/`#sidebar-create-logbook-button` (boutons supprimés du HTML, CSS encore présent).

## Pièges connus

- Le token de session (`auth.js`) ne survit pas à un rechargement de page ni à une nouvelle session de navigateur : il faut se reconnecter à chaque nouvel onglet/session pour tester.
- Scope Drive `drive.file` : l'app ne voit que les fichiers créés avec son propre token. Ne jamais écrire dans `entries_to_import` (ou ailleurs dans le dossier Logbook) via le connecteur Drive général — invisible pour l'app. Utiliser le token de la page (`auth.getAccessToken()`), cf. skill `remplir-journal`.
- Écrire beaucoup de fichiers Drive en boucle synchrone dans `javascript_tool` peut dépasser le timeout CDP (45 s) : préférer des lots de ~7-10 fichiers par appel.

## Fichiers touchés

`index.html`, `js/app.js`, `js/drive.js`, `js/entries.js`, `js/modal.js`, `js/picker.js`, `js/sidebar.js`, `css/style.css`.
