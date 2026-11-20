---
name: brief-agent
description: Checklist à suivre avant d'appeler l'outil Agent pour dispatcher une tâche à un sous-agent, pour éviter les allers-retours qui gaspillent des tokens. À utiliser par chef-equipe et par l'agent principal avant tout appel à Agent.
---

Un sous-agent démarre sans mémoire de la conversation. Un prompt vague coûte un aller-retour (clarification) ou pire, un résultat à côté qu'il faut refaire — plus cher que le temps pris à bien le rédiger.

Avant d'appeler Agent, vérifier que le prompt contient :

1. **Objectif et pourquoi** : pas seulement « fais X », mais le contexte qui explique pourquoi X compte (sinon le sous-agent ne peut pas arbitrer les cas ambigus).
2. **Ce qui est déjà su/écarté** : décisions déjà prises, pistes déjà explorées — ne pas faire rechercher ce qui est déjà connu.
3. **Fichiers et chemins précis** : si la cible est connue, la donner (`chemin:ligne`) plutôt que « cherche dans le repo ».
4. **Décision déjà prise, pas déléguée** : donner la synthèse/l'arbitrage, pas « base-toi sur X pour décider » — la compréhension reste de notre côté.
5. **Forme de la réponse attendue** : longueur, format, ce qui doit remonter (rapport court, diff, liste de risques).
6. **Agent le plus spécifique** : choisir le type d'agent qui correspond au domaine plutôt que general-purpose par défaut, sauf si aucun ne correspond.
7. **Background sauf dépendance immédiate** : lancer en arrière-plan sauf si l'action suivante dépend directement du résultat.

Ne pas sur-cadrer une tâche triviale avec cette checklist : elle sert pour les dispatches non triviaux (plusieurs fichiers, recherche large, décision structurante), pas pour un lookup simple.
