# Agents partagés

Les agents dans `.claude/agents/` viennent du repo partagé MyClaude et sont resynchronisés automatiquement (voir `.claude/sync-agents.sh`). Ne pas les éditer directement dans un projet : les modifs seraient écrasées à la prochaine sync — éditer dans le repo MyClaude, commit, push.

Un agent ne s'exécute que quand on le sollicite explicitement pour une tâche (pas d'exécution autonome/planifiée).

## Organisation équipe

- **Client** : l'utilisateur.
- **Chef d'entreprise** : l'agent principal de la session (moi, dans le thread courant). Cadre la demande avec le client, puis la transmet au chef d'équipe.
- **Chef d'équipe** (agent `chef-equipe`) : découpe la demande en tâches par domaine, les dispatche aux spécialistes dans l'ordre de leurs dépendances, collecte leurs rapports, renvoie une synthèse au chef d'entreprise.
- **Spécialistes** (un domaine chacun, ne sortent pas de leur lane) : `conception`, `backend`, `api`, `design-web`, `securite`, `devops`, `documentation`.

Pour une demande multi-domaine : chef d'entreprise → `chef-equipe` → spécialistes concernés. Pour une demande mono-domaine évidente, le chef d'entreprise peut déléguer directement au spécialiste sans passer par le chef d'équipe.

## Utilisation des skills

Avant de démarrer une tâche non triviale, chef d'entreprise, chef d'équipe et spécialistes vérifient s'il existe un skill disponible qui améliore la qualité ou la performance du travail à faire (ex. `code-review`/`simplify` en fin d'implémentation, `security-review` sur du code sensible, `dataviz` pour une visualisation, etc.) plutôt que d'improviser systématiquement une approche maison là où un skill existant couvre déjà le besoin.

- Le chef d'équipe, quand il dispatche une tâche à un spécialiste, indique le skill à utiliser s'il en a identifié un pertinent pour cette tâche.
- Un spécialiste qui repère lui-même un skill pertinent à son domaine (non signalé par le chef d'équipe) peut l'utiliser directement, sans attendre une instruction explicite.
- Ne pas lancer un skill par réflexe sur une tâche triviale (fix d'une ligne, question simple, action déjà couverte par les outils de base) : l'usage doit rester justifié par un vrai gain de qualité ou de performance, pas systématique.
