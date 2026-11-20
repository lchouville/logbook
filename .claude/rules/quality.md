# Règles qualité, tests, sécurité et conformité (tous projets)

## Priorités de qualité (dans cet ordre)
1. Sécurité
2. Maintenabilité
3. Performance
4. Impact environnemental (code léger, peu de dépendances, pas de calcul ou d'appel réseau inutile)

En cas de conflit, la priorité la plus haute l'emporte.

## Tests
- Préférence par défaut (une consigne du projet peut la contredire) : TDD (test d'abord, puis code) sur le serveur, la base de données et l'UI s'il y en a.
- Si un Docker est en place dans le projet, lancer les tests dedans ; sinon en local.

## Secrets et `.env`
- Les secrets vont dans `.env`, jamais committé (dans `.gitignore`).
- Toujours fournir `.env.example` avec toutes les clés et des valeurs factices ou vides, pour le remplir facilement.
- Si le projet est hébergé sur GitHub Pages : enregistrer les secrets dans GitHub (secrets du dépôt, via `gh secret set`) et les consommer par les Actions. Ne jamais afficher une valeur de secret, ni l'écrire dans la documentation.
- Attention : une variable injectée au build d'une app front (ex. `VITE_*`) finit en clair dans le bundle public. Seules des valeurs non sensibles passent par le build ; les vrais secrets restent côté serveur.

## Conformité
- Toute application respecte le RGAA (accessibilité) et le RGPD (données personnelles : minimisation, consentement, droit d'accès et de suppression, pas de traceur sans consentement).
- Approche mobile first quand c'est possible.
