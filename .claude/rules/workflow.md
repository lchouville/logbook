# Règles globales : optimisation et gestion de projet

## Langue (tous projets)
- Tout nom de dossier, de fichier et tout code (variables, fonctions, composants, commentaires, commits) en anglais, même si l'application développée est dans une autre langue.

## Début de projet
- Demander d'abord s'il existe déjà un cahier des charges. S'il existe, le lire et s'y conformer ; sinon, aider à le rédiger (objectifs, public, fonctionnalités, contraintes) et le faire valider.
- Préparer la conception avant tout développement en suivant les étapes de `design.md`, chacune validée par l'utilisateur avant de coder.
- Conserver le cahier des charges et la conception dans le dépôt (`docs/`), en anglais comme le reste (voir `docs.md`).

## Skills
- À chaque tâche demandée : vérifier d'abord si un skill disponible s'applique et l'utiliser.
- Si aucun skill ne correspond : proposer à l'utilisateur de chercher s'il en existe un avant de continuer.

## Tâches longues
- Avant de lancer une tâche longue (multi-fichiers, sous-agents, gros refactor, longues recherches) : estimer la consommation (% de la session 5h et de la semaine 7j, ordre de grandeur) et demander validation à l'utilisateur avant de commencer.
- Utiliser les pourcentages actuels de la barre de statut quand ils sont connus ; sinon donner une fourchette approximative en le précisant.

## Seuils d'usage critiques
- Si l'usage atteint 80 % (semaine) ou 85 % (session) : proposer d'arrêter la tâche en cours et attendre la réponse de l'utilisateur.
- Si l'utilisateur accepte : écrire une note de reprise dans `REPRISE.md` (racine, poussé sur `develop`/branches de travail, jamais sur `main`, voir `git.md`) : objectif, ce qui est fait, ce qui reste, fichiers touchés, prochaine étape précise, pièges connus. Une entrée par tâche (titre + date) : ajouter à la suite, sans écraser les autres entrées.
- Au démarrage d'une nouvelle session, si `REPRISE.md` existe : le signaler et proposer de reprendre la tâche.
- Quand une tâche reprise est terminée : supprimer son entrée de `REPRISE.md`. Si le fichier est alors vide, le supprimer.

## Économie de tokens (sans perte de qualité)
- Réponses courtes : résultat d'abord, pas de récap de ce qui est visible dans le diff.
- Chercher avant de lire : Grep/Glob, puis Read avec offset/limit. Ne jamais relire un fichier déjà lu ou édité.
- Appels d'outils indépendants en parallèle, dans un même message.
- Édits ciblés (Edit) plutôt que réécriture complète de fichier.
- Sorties shell bornées : `| head`, `| tail`, `--quiet`, `grep -c`; jamais de logs entiers.
- Sous-agents (Explore) uniquement pour recherches larges ; sinon travailler en direct.
- Ne pas poser de question si un défaut raisonnable existe (sauf les validations exigées par les règles : conception, tâches longues, seuils d'usage, réglages distants).
- Vérifier par test/lint ciblé, pas par relecture.
- Tâche terminée / sujet changé → suggérer /clear ; contexte long → /compact avec focus.
- Docs de librairies (React, Vite, etc.) : utiliser Context7 (use context7) plutôt que la mémoire, pour des APIs à jour.
