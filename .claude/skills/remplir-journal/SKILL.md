---
name: remplir-journal
description: Lire ou écrire des entrées du journal de bord (logbook) directement dans le Google Drive de l'utilisateur, via les outils Drive connectés, en respectant exactement le format JSON attendu par l'app (js/entries.js, js/drive.js).
---

# Remplir le journal de bord depuis le Drive

L'app ne valide rien à la lecture au-delà de petites migrations de compat (`migrateEntryContenu`/`migrateModeleContenu` dans `js/entries.js`). Un JSON mal formé écrit directement sur le Drive casse silencieusement l'affichage ou fait planter l'app — suivre ce protocole à la lettre.

## 1. Localiser les fichiers

Arborescence sur le Drive de l'utilisateur :

```
Application/
  logbook-dashboards.json          ← registre des tableaux de bord
  logbook-modeles.json             ← modèles communs à tous les tableaux
  <dossierNom d'un dashboard>/     ← ex. "logbook" pour le dashboard "default"
    logbook-data.json              ← LES ENTRÉES (tableau JSON, un seul fichier)
    logbook-settings.json          ← ne pas toucher (préférences UI)
    logbook-partages.json          ← ne pas toucher sauf demande explicite
    logbook-partages-recus.json    ← ne pas toucher
```

1. Chercher le dossier `Application` à la racine du Drive.
2. Lire `logbook-dashboards.json` dedans → liste `[{ id, nom, dossierNom, dossierId?, creeLe }]`.
   - S'il y a plusieurs dashboards, demander à l'utilisateur lequel cibler (par `nom`).
   - Résoudre le dossier par `dossierId` si présent, sinon par `dossierNom` (nom réel du dossier — `nom` n'est que le libellé affiché, peut diverger après un renommage dans l'app).
3. Lire `logbook-data.json` dans ce dossier → tableau d'entrées (`[]` si le fichier n'existe pas encore).

## 2. Forme exacte d'une entrée

Reproduire `createEntry()` (`js/entries.js`) :

```json
{
  "id": "<UUID v4>",
  "titre": "string",
  "date": "YYYY-MM-DD",
  "themes": ["Travail"],
  "niveauAcces": "N1",
  "statut": "A Compléter",
  "ressentiAFroid": null,
  "champsPersonnalises": {},
  "champsSchema": { "fields": [], "order": ["themes", "niveau", "statut"] },
  "modeleId": null,
  "contenuSchema": {
    "blocks": [{ "id": "<UUID v4>", "type": "texte", "titre": "Texte" }],
    "order": ["<même UUID que le bloc>"]
  },
  "contenuValeurs": { "<id du bloc texte>": "Le texte libre de l'entrée." },
  "creeLe": "<ISO 8601, instant de création>"
}
```

Règles :
- `id` et chaque id de bloc : UUID v4 généré neuf (jamais réutilisé, jamais prévisible).
- `themes` : sous-ensemble de `THEMES` (`js/entries.js`) — `['Relation','Santé','Travail','Trauma','Moral','Identité de genre','Rêves','Projet']`. Ne pas en inventer sans demander.
- `niveauAcces` : un seul parmi `N1`..`N5`.
- `statut` : un seul parmi `A Valider`, `A Compléter`, `Complete`, `Bilan`.
- `ressentiAFroid` : toujours `null` à la création (rempli plus tard par l'utilisateur dans l'app).
- Bloc `tableau` (si besoin, cf `createTableauBlock`) : `{ id, type: "tableau", titre, colonnes: [{id, nom}], lignes: [{id, nom}] }`, et `contenuValeurs[blockId]` devient `{ [ligneId]: { [colonneId]: "valeur" } }`.
- Si l'entrée est basée sur un modèle de `logbook-modeles.json`, copier son `contenuSchema` tel quel et mettre `modeleId` à l'id du modèle — ne jamais modifier les `blocks`/`colonnes`/`lignes` d'un modèle dans ce cas (l'app les verrouille aussi côté UI).

## 3. Écrire

`logbook-data.json` est **toujours réécrit en entier** (pas de patch partiel) — c'est ce que fait `saveEntries` côté app. Donc : lire le tableau complet, ajouter/modifier l'entrée dans le tableau en mémoire, réécrire le fichier entier avec le tableau complet.

Avant d'écrire, vérifier :
- Le contenu reste un JSON **valide** et un **tableau** à la racine.
- Aucun `id` dupliqué.
- Tous les champs obligatoires ci-dessus sont présents (ne pas en omettre, même `null`).

## 4. Limite critique : scope `drive.file`

L'app utilise le scope OAuth restreint `drive.file` : elle ne voit que les fichiers qu'elle a **elle-même créés avec son propre token**. Un fichier créé via le connecteur Drive général de Claude (`mcp__claude_ai_Google_Drive__*`) est **invisible pour l'app**, même au même endroit, même compte Google — la recherche de l'app renverra `files: []`.

Pour qu'un fichier écrit par ce skill soit vu par l'app, il faut l'écrire avec le token de session de l'app elle-même, pas avec le connecteur Drive général :
1. Ouvrir l'app dans le navigateur (Claude in Chrome), connecté avec le compte de l'utilisateur.
2. Exécuter en JS dans la page : `const auth = await import('/js/auth.js'); const token = auth.getAccessToken();`
3. Faire l'upload multipart (`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id`) avec ce token, pas avec le connecteur Drive.
4. Si le contenu est trop gros pour tenir dans un seul appel `javascript_tool`, le déposer d'abord comme fichier statique servi par le serveur local de l'app (ex. `cp` dans le dossier du repo), le faire `fetch()` depuis la page, puis l'uploader avec le token récupéré à l'étape 2.

## 5. Prudence

- Si l'utilisateur a l'app ouverte dans un onglet en même temps, une écriture par ce skill peut être écrasée par le prochain auto-save de l'app (ou inversement) — prévenir l'utilisateur de recharger la page après une modification faite ici.
- Ne jamais toucher `logbook-dashboards.json`, `logbook-modeles.json`, `logbook-settings.json`, `logbook-partages*.json` sauf demande explicite de l'utilisateur pour cette tâche précise.
