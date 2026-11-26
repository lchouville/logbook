# Bibliothèque de données — Fiche personnalité

Pas de base de données (stockage JSON dans le Drive de l'utilisateur·rice,
comme le JDB) : MCD/MLD/MPD non applicables, voir `design.md`.

## Entités

### ProfileSheet (une seule par utilisateur·rice)

| Attribut        | Type   | Description                                                    |
|------------------|--------|------------------------------------------------------------------|
| `identity`       | objet  | Champs d'identité personnalisables (voir ci-dessous)             |
| `tests`          | objet  | Résultat courant de chaque test, par clé de test (voir ci-dessous)|

### Identity

Réutilise exactement le système de champs personnalisés existant
(`createFieldsEditor`, `js/schema.js`) : mêmes types de champ (texte,
nombre, date, select, case, photo), même forme `{ schema: { fields, order },
values }`. Rien n'est pré-rempli ni déduit des entrées du JDB.

### TestResult (une par test, clé = `personality` | `genderIdentity` |
`orientation` | `political`)

| Attribut      | Type              | Description                                                        |
|----------------|-------------------|----------------------------------------------------------------------|
| `completedAt`  | string (ISO date) | Date de la dernière complétion                                       |
| `answers`      | objet              | Réponses brutes aux questions (clé = id question, valeur = choix)    |
| `result`       | string             | Tendance affichée (ex. `introverti·e`), calculée depuis `answers`    |

Les questions de chaque test sont fixes, définies dans le code (pas
éditables par l'utilisateur·rice) — seul le résultat est stocké côté
Drive, pas un barème ou une définition de test.

Pas d'historique : relancer un test remplace entièrement son
`TestResult` précédent (`answers` + `result` + `completedAt`).

## Règles de gestion

- Chaque test est indépendant : en faire un, plusieurs ou aucun n'affecte
  pas les autres.
- Avant de démarrer un test, écran de consentement explicite rappelant
  qu'il est indicatif (pas un diagnostic) et que le résultat est stocké
  dans le Drive personnel de l'utilisateur·rice.
- Suppression possible à tout moment, au niveau d'un test (`tests.<clé>`
  remis à `null`) ou de la fiche entière (fichier Drive supprimé).
- Aucune donnée de `ProfileSheet` n'est lue ni modifiée automatiquement
  par le reste de l'app (JDB, modèles, dashboards) : la fiche est isolée.

## Données personnelles concernées (RGPD)

- **Identité** (champs libres `identity`) : données personnelles
  standard, à la discrétion de l'utilisateur·rice.
- **Résultats des 4 tests** : catégories particulières au sens de
  l'art. 9 RGPD (orientation sexuelle, données relatives à la santé/vie
  privée, opinions politiques, assimilable pour l'identité de genre).
  Traitement couvert par le consentement explicite par test (base légale :
  consentement, art. 9.2.a).
- **Responsable du traitement** : l'utilisateur·rice elle-même/lui-même —
  les données vivent exclusivement dans son propre Drive Google, jamais
  sur un serveur ou une base opérée par l'app. L'app agit en simple client
  (comme pour le reste du JDB), sans accès ni copie de ces données.
- **Minimisation** : aucun champ pré-rempli, aucune déduction depuis les
  entrées du JDB, aucun envoi réseau hors Google Drive (export PDF/PNG
  généré et resté côté client).
- **Droit de suppression** : immédiat et par granularité (test par test ou
  fiche entière), voir règles de gestion ci-dessus.
