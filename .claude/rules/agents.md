# Agents partagés

Les agents dans `.claude/agents/` viennent du repo partagé MyClaude et sont resynchronisés automatiquement (voir `.claude/sync-agents.sh`). Ne pas les éditer directement dans un projet : les modifs seraient écrasées à la prochaine sync — éditer dans le repo MyClaude, commit, push.

Un agent ne s'exécute que quand on le sollicite explicitement pour une tâche (pas d'exécution autonome/planifiée).
