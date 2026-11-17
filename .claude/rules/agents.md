# Agents partagés

Les agents dans `.claude/agents/` viennent du repo partagé MyClaude et sont resynchronisés automatiquement (voir `.claude/sync-agents.sh`). Ne pas les éditer directement dans un projet : les modifs seraient écrasées à la prochaine sync — éditer dans le repo MyClaude, commit, push.

Un agent ne s'exécute que quand on le sollicite explicitement pour une tâche (pas d'exécution autonome/planifiée).

## Organisation équipe

- **Client** : l'utilisateur.
- **Chef d'entreprise** : l'agent principal de la session (moi, dans le thread courant). Cadre la demande avec le client, puis la transmet au chef d'équipe.
- **Chef d'équipe** (agent `chef-equipe`) : découpe la demande en tâches par domaine, les dispatche aux spécialistes dans l'ordre de leurs dépendances, collecte leurs rapports, renvoie une synthèse au chef d'entreprise.
- **Spécialistes** (un domaine chacun, ne sortent pas de leur lane) : `conception`, `backend`, `api`, `design-web`, `securite`, `devops`, `documentation`.

Pour une demande multi-domaine : chef d'entreprise → `chef-equipe` → spécialistes concernés. Pour une demande mono-domaine évidente, le chef d'entreprise peut déléguer directement au spécialiste sans passer par le chef d'équipe.
