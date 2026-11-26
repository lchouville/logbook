# Wireframes + maquette — Fiche personnalité

Pas de nouveaux composants visuels : la fiche réutilise à l'identique les
styles et composants existants (`css/style.css`, `js/modal.js`,
`js/schema.js`), donc wireframe et habillage visuel sont traités ensemble.

## Composants réutilisés

- **Panneau modal** (`#modal-panel`) : la fiche s'ouvre comme une section
  modale au même titre que l'entrée ou le formulaire de modèle.
- **Éditeur de champs** (`createFieldsEditor`) : zone Identité, sans
  changement de comportement (glisser-déposer, popover d'ajout/édition).
- **Boutons** : style bouton primaire (`--color-accent` /
  `--color-accent-fg`) pour « Commencer »/« Suivant »/export, style
  secondaire (`--color-bg-secondary`, bordure `--color-border`) pour
  « Annuler »/« Précédent », `--color-danger` pour supprimer.
- **Cartes de test** : même carte que les blocs existants
  (`--shadow-card`, `--radius`), une par test, avec pastille de statut
  (« Non commencé » en `--color-fg-secondary`, « Complété » en
  `--color-accent`).

## Points spécifiques à la fiche

- **Écran de consentement** : fond `--color-bg-secondary`, texte
  d'avertissement en évidence (pas juste un texte secondaire discret —
  taille normale, pas grisé, pour rester lisible même en lecture rapide).
- **Résultat de test** : la tendance affichée n'est jamais présentée en
  rouge/vert (pas de connotation bon/mauvais résultat) ; un seul traitement
  neutre avec l'accent de couleur standard.
- **Icône de suppression** sur chaque carte de test : contraste suffisant
  au repos (pas seulement au survol) pour l'accessibilité RGAA — rouge
  `--color-danger` sur fond `--color-bg`, ratio déjà validé ailleurs dans
  l'app pour ce même token.

## Accessibilité (RGAA)

- Tous les tokens de couleur réutilisés sont déjà validés dans le reste de
  l'app (contrastes clair/sombre) — aucun nouveau couple couleur à
  auditer.
- Navigation clavier : écran de consentement et questions suivent le même
  focus trap que les modales existantes (`js/modal.js`).
- Chaque question de test a un `<label>` explicite associé à son champ de
  réponse (radio), pas de placeholder utilisé comme label.
