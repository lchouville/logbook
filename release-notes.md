# Release notes

## v0.1.0 - 2026-11-25

## Changements

- prepare-release: v0.1.0 (#70)
- Accessibilité, polish visuel et chargement progressif des entrées (#53)
- chore: add shared Claude rules and release automation (#52)
- Bilan mensuel, affichage version app, lisibilité tableaux/graphiques (#55)
- Multi-dashboard: modèles/partages, pages, fixes de corruption Drive (#54)
- Refonte page d'entrée, modèles et champs perso par entrée (#49)
- Champs personnalisés et page détaillée par entrée (#46)
- Rafraîchissement automatique du token Drive (#43)
- Entrées personnalisées : tableau et popup (#40)
- Replace scattered profile controls with a dropdown menu (#37)
- Add a retractable sidebar and single-page navigation between journals (#34)
- Show a loading indicator and render lists progressively (#31)
- Surface recordPartageRecu failures instead of swallowing them (#28)
- Create a Drive shortcut to each accepted partage (#25)
- Add silent token reacquisition and a Partages reçus section (#22)
- Add editing of existing partages, name shared files after owner + share (#19)
- Fix Picker grant not taking effect: missing setAppId() (#16)
- Add privacy policy page for OAuth verification (#13)
- Add UI to fill in the retrospective feeling of past entries (#8)
- Add link-based dashboard sharing filtered by theme and access level (#10)
- Add customizable light/dark/device theme, Notion-inspired by default (#9)
- Promote develop to release (#6)
- Store journal data under Application/logbook Drive folder (#5)
- Surface Drive save/load errors instead of failing silently (#4)
- Add Drive-backed storage for journal entries (#3)
- Add Google OAuth sign-in (#2)
- Document feature/fix/hotfix branching rules (#1)

## 🚀 Fonctionnalités

- feat(entries): sélection multiple avec recherche, filtres et actions groupées (#67)
- feat(drive): import d'entrées IA via le Drive (#66)

## 🐛 Corrections

- fix: corrige 3 bugs critiques remontés par l'audit complet (#68)

## 🔧 Maintenance

- chore(ci): migre vers le modèle de release main/tags/release-compilé (#69)
- chore: self-updating sync-claude.sh (#65)
- chore: sync-agents.sh manages the shared gitignore block (#64)
- chore: stop tracking shared Claude agents/rules/skills (#63)
- chore: track newly-shared rule files in sync manifest (#62)
- chore: add brief-agent and dispatch-taches skills (#60)
- chore: sync agents with Skill tool access (#59)
- chore: add remplir-journal skill (#57)

## 📝 Documentation

- docs(git): clarify branch workflow for sequential unrelated tasks (#61)

