---
name: lean-workflow
description: Méthode à bas coût en tokens pour toute tâche de code dans ce projet (explorer, modifier, vérifier) sans sacrifier la qualité. À utiliser au début d'une tâche non triviale.
---

1. **Cadrer** : reformuler la tâche en 1 ligne ; si un défaut raisonnable existe, avancer.
2. **Localiser** : Grep/Glob pour trouver les symboles ; lire seulement les plages utiles (offset/limit). Recherche large (>5 fichiers) → agent Explore.
3. **Modifier** : Edit ciblé, groupé en parallèle quand indépendant. Pas de refactor hors périmètre.
4. **Vérifier** : lancer uniquement le test/lint/build concerné, sortie tronquée (`| tail -30`).
5. **Rendre compte** : 2-4 lignes — ce qui change, ce qui est vérifié, ce qui reste.
6. **Hygiène de contexte** : changement de sujet → /clear ; session longue → /compact en précisant quoi garder.
