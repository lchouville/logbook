---
name: dispatch-taches
description: Méthode pour découper une demande multi-domaines en tâches, les ordonner par dépendance et les répartir entre sous-agents spécialisés sans gaspiller de tokens. À utiliser par chef-equipe, et par l'agent principal pour une demande mono-domaine évidente qui ne justifie pas de passer par chef-equipe.
---

1. **Découper par domaine réellement concerné** : conception, backend, api, design-web, securite, devops, documentation — n'en lister que ceux que la demande touche vraiment, pas tous par réflexe.
2. **Ordonner par dépendance** : conception avant implémentation ; backend/api avant le design-web qui les consomme ; securite en revue une fois le code concerné écrit ; devops pour le déploiement en dernier ; documentation tout en dernier (elle décrit le résultat final, pas une intention).
3. **Paralléliser ce qui n'a pas de dépendance** : un seul message avec plusieurs appels Agent pour les tâches indépendantes entre elles ; séquentiel sinon, en réutilisant le rapport d'une tâche pour cadrer le prompt de la suivante.
4. **Un seul domaine évident → déléguer directement**, sans découpage artificiel ni passage par un orchestrateur.
5. **Rédiger chaque prompt** en suivant le skill `brief-agent` (contexte, fichiers précis, décision déjà prise, forme de réponse attendue).
6. **Suivre l'avancement** avec TaskCreate/TaskUpdate quand il y a plusieurs tâches ; marquer terminé à réception du rapport, pas avant.
7. **Synthétiser, ne pas relayer brut** : à la fin, un résumé unique — ce qui a été fait par domaine, les points bloquants signalés par les spécialistes, ce qui reste. Les rapports individuels ne remontent pas un par un.
