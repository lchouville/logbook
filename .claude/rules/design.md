# Étapes de conception (tous projets, avant tout développement)

Ordre à suivre, une validation de l'utilisateur à la fin de chaque étape. Livrables dans `docs/design/`.

1. **Cahier des charges fonctionnel** : objectifs, public, fonctionnalités, contraintes, périmètre (inclus / exclus).
2. **Bibliothèque de données** : entités, attributs, types, relations, règles de gestion, données personnelles concernées (RGPD). Puis les modèles de base de données, dans cet ordre :
   - **MCD** (conceptuel) : entités, associations, cardinalités, indépendant de la technologie.
   - **MLD** (logique) : tables, clés primaires et étrangères, dérivé du MCD.
   - **MPD** (physique) : types, contraintes, index et script de création propres au SGBD choisi, dérivé du MLD.
3. **Parcours utilisateur (user flows) et user stories** : « En tant que… je veux… afin de… », avec critères d'acceptation (base des tests TDD).
4. **Zoning** : découpage des écrans en zones fonctionnelles, mobile first.
5. **Wireframes** : structure des écrans sans habillage.
6. **Maquettes** : rendu visuel (couleurs, typographie, composants), accessibilité RGAA (contrastes, tailles).
7. **Prototype** : parcours cliquable pour valider l'ergonomie avant de coder.
8. **Cahier des charges technique** : architecture (voir `project.md`), stack, modèle de données technique, API, sécurité, tests, déploiement (voir `cicd.md`).

## Adaptation
- Sans interface (API, script, serveur seul) : sauter les étapes 4 à 7.
- Sans base de données : sauter MCD, MLD et MPD ; garder la bibliothèque de données.
- Projet petit : version courte de chaque étape, mais ne pas supprimer d'étape sans l'accord de l'utilisateur.
- Les user stories validées servent de backlog et de base aux tests (voir `quality.md`).
