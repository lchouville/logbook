# Zoning — Fiche personnalité (mobile first)

Écrans empilés verticalement sur mobile (une colonne), identiques en
desktop avec plus de respiration latérale — pas de layout différent, le
système de grille existant de l'app s'adapte déjà (voir `design-web`).

## Écran « Fiche »

```text
┌─────────────────────────┐
│ Titre « Fiche personnalité » + bouton export │
├─────────────────────────┤
│ Zone Identité             │
│  (champs personnalisés,   │
│   éditeur existant)       │
├─────────────────────────┤
│ Zone Tests (liste de 4)   │
│  ┌───────────────────┐   │
│  │ Test X — statut    │   │
│  │ [Faire/Refaire] [🗑]│   │
│  └───────────────────┘   │
│  (×4, un par test)        │
├─────────────────────────┤
│ Lien « Supprimer la fiche »│
└─────────────────────────┘
```

## Écran « Consentement » (avant un test)

```text
┌─────────────────────────┐
│ Nom du test                │
├─────────────────────────┤
│ Texte : indicatif, pas un  │
│ diagnostic, stocké dans    │
│ votre Drive                │
├─────────────────────────┤
│ [Annuler]   [Commencer]    │
└─────────────────────────┘
```

## Écran « Questions » (une question à la fois)

```text
┌─────────────────────────┐
│ Progression (ex. 3/8)      │
├─────────────────────────┤
│ Question                   │
│ Choix (radio)               │
├─────────────────────────┤
│ [Précédent]      [Suivant] │
└─────────────────────────┘
```

## Écran « Résultat »

```text
┌─────────────────────────┐
│ Tendance affichée           │
│ Rappel « indicatif »        │
├─────────────────────────┤
│ [Refaire]        [Fermer]   │
└─────────────────────────┘
```

## Modal « Export »

```text
┌─────────────────────────┐
│ Sections à inclure          │
│  ☑ Identité                 │
│  ☑ Test 1  ☑ Test 2 ...      │
├─────────────────────────┤
│ [PDF]            [PNG]      │
└─────────────────────────┘
```
