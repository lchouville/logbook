# Parcours utilisateur et user stories — Fiche personnalité

## Parcours principal

1. Depuis la sidebar, l'utilisateur·rice ouvre « Fiche personnalité »
   (section séparée des dashboards du JDB).
2. Première visite : fiche vide, champs d'identité à remplir (optionnel) et
   4 tests listés avec leur statut (« non commencé »).
3. Lancement d'un test → écran de consentement (indicatif, pas un
   diagnostic, stocké dans son Drive) → questions → résultat affiché
   immédiatement, enregistré.
4. Visites suivantes : fiche affiche l'identité + le résultat courant de
   chaque test complété, avec possibilité de refaire ou supprimer chacun.
5. Depuis la fiche, export PDF ou PNG (choix des sections à inclure),
   téléchargé localement.
6. Suppression d'un test ou de la fiche entière, à tout moment, avec
   confirmation.

## User stories

### Identité

- En tant qu'utilisateur·rice, je veux renseigner des champs d'identité
  libres (nom affiché, autres champs personnalisés) afin de me représenter
  sans dépendre du JDB.
  - Critères : champs créés/modifiés/supprimés via le même éditeur de
    champs que le reste de l'app ; rien n'est pré-rempli ; les valeurs
    sont sauvegardées dans mon Drive.

### Tests

- En tant qu'utilisateur·rice, je veux voir un écran de consentement avant
  de commencer un test afin de comprendre qu'il est indicatif et où le
  résultat est stocké.
  - Critères : l'écran apparaît avant chaque test (y compris en le
    refaisant) ; le test ne démarre pas sans validation explicite.
- En tant qu'utilisateur·rice, je veux répondre à quelques questions et
  obtenir une tendance afin d'avoir une indication sans diagnostic.
  - Critères : résultat affiché en termes de tendance (pas de score
    clinique) ; mention visible rappelant la nature non diagnostique.
- En tant qu'utilisateur·rice, je veux refaire un test afin de mettre à
  jour mon résultat si je change d'avis.
  - Critères : le nouveau résultat remplace l'ancien, pas d'historique
    conservé.
- En tant qu'utilisateur·rice, je veux supprimer le résultat d'un test
  afin de retirer une information que je ne veux plus garder.
  - Critères : suppression immédiate après confirmation, test repasse au
    statut « non commencé ».

### Partage

- En tant qu'utilisateur·rice, je veux exporter ma fiche (ou une sélection
  de sections) en PDF ou en PNG afin de la partager ponctuellement sans
  donner accès à mon Drive.
  - Critères : génération entièrement côté client ; je choisis les
    sections incluses avant export ; aucun envoi réseau vers un service
    tiers.

### Suppression globale

- En tant qu'utilisateur·rice, je veux supprimer la fiche entière afin de
  ne plus avoir aucune donnée sensible stockée si je change d'avis sur la
  fonctionnalité.
  - Critères : confirmation explicite ; suppression du fichier Drive
    dédié ; aucune trace restante côté app.
