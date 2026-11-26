# Cahier des charges fonctionnel — Fiche personnalité

## Contexte

Fiche optionnelle, distincte du journal de bord (pas une entrée du JDB), qui
rassemble des informations personnelles sur l'utilisateur·rice : identité,
et résultats de quelques tests exploratoires (personnalité, identité de
genre, orientation, politique). Partageable en PDF/PNG à la demande.

## Objectifs

- Donner à l'utilisateur·rice un espace unique et optionnel pour se
  représenter (identité + tendances), séparé du contenu quotidien du JDB.
- Permettre un partage ponctuel (PDF/PNG) sans exposer les données au-delà
  de ce que l'utilisateur·rice choisit d'exporter.
- Ne jamais donner l'impression d'un diagnostic : les tests indiquent une
  tendance, pas un résultat clinique ou définitif.

## Public

Utilisateur·rice unique du logbook (usage personnel), comme le reste de
l'app.

## Fonctionnalités

- Une fiche par utilisateur·rice (pas de multi-fiches), accessible depuis
  la sidebar comme une page distincte des dashboards du JDB.
- Champs libres d'identité (nom affiché, et autres champs géré par le
  système de champs personnalisés déjà existant — `createFieldsEditor`,
  voir `js/schema.js`), entièrement optionnels.
- Tests proposés au départ, chacun indépendant (on peut en faire un seul,
  tous, ou aucun) :
  - Type de personnalité (style MBTI/Big Five simplifié)
  - Identité de genre
  - Orientation (relationnelle et sexuelle)
  - Politique
- Chaque test : quelques questions à choix, résultat affiché comme une
  **tendance** (ex. "plutôt introverti·e"), jamais comme un résultat
  définitif ou un diagnostic. Refaisable à volonté, résultat précédent
  remplacé (pas d'historique des tentatives).
- Export PDF et export PNG de la fiche (ou d'une sélection de sections),
  générés côté client (navigateur), sans passer par un service tiers.
- Suppression possible de la fiche entière ou d'un test en particulier à
  tout moment.

## Contraintes

- RGPD : ces données sont sensibles (orientation, identité de genre,
  opinions politiques relèvent des catégories particulières de l'art. 9
  RGPD). Minimisation stricte : rien de pré-rempli, rien de déduit
  automatiquement depuis le JDB, consentement explicite avant de démarrer
  chaque test (écran d'avertissement : "indicatif, pas un diagnostic").
  Suppression simple et visible.
- Stockage dans le Drive de l'utilisateur·rice (fichier JSON dédié dans le
  dossier Logbook connecté), même mécanisme que `logbook-data.json` — pas
  de serveur applicatif, pas de base de données tierce.
- Export PDF/PNG uniquement côté client (pas d'upload vers un service
  externe de génération de document).
- Accessibilité RGAA et mobile first, comme le reste de l'app.

## Périmètre

### Inclus
- Fiche unique, champs d'identité personnalisables, 4 tests listés
  ci-dessus, export PDF/PNG, suppression.

### Exclus (pour cette première version)
- Historique des résultats de test dans le temps (évolution).
- Partage direct via le mécanisme de partage existant du JDB (`partages`) —
  seul l'export fichier (PDF/PNG) est prévu ici.
- Ajout d'autres tests au-delà des 4 listés (pourra être demandé plus tard).
- Comparaison entre plusieurs utilisateurs·rices.
