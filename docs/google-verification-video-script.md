# Script — vidéo de démo pour la vérification Google OAuth

Contexte : Google exige une vidéo de démonstration pour valider l'usage du scope
restreint `https://www.googleapis.com/auth/drive` (voir *Google Cloud Console >
Google Auth Platform > Accès aux données > Démonstration vidéo*).

## Avant d'enregistrer

- **Ne pas enregistrer sur le projet/compte de production** si l'app a déjà des
  utilisateurs réels (c'est le cas ici en pratique, même peu nombreux) : utiliser un
  compte Google de test distinct du compte habituel, pour ne pas perturber son propre
  usage ni consommer le quota d'« utilisateurs non validés ».
- Se connecter sur `http://localhost:8080` (ou une URL de l'app déployée) avec ce
  compte de test, en étant **déconnecté** au départ pour montrer le flux de connexion
  complet.
- Avant de lancer l'enregistrement, déposer manuellement un fichier `.json` de fiche
  dans le dossier `entries_to_import` du Drive de ce compte de test, **en dehors de
  l'app** (ex. upload direct depuis l'interface Google Drive) — c'est la situation
  concrète qui justifie le scope complet.
- Langue : Google review lit l'anglais en priorité. Soit sous-titrer la vidéo en
  anglais, soit doubler chaque réplique d'une phrase anglaise courte à l'oral. Le
  script ci-dessous donne les deux.
- Outil d'enregistrement : n'importe quel capture d'écran + micro (ex. OBS, QuickTime,
  l'enregistreur Windows intégré). Héberger le résultat sur YouTube (non répertorié
  suffit, pas besoin de public) et coller le lien dans le champ prévu.
- Durée cible : 2 à 4 minutes, pas plus.

## Scène 1 — Contexte de l'app (10-15 s)

**À l'écran** : page d'accueil de Logbook (`index.html`), non connecté.

**Narration (FR)** : « Logbook est une application de journal personnel. Les données
sont stockées exclusivement dans le Google Drive de l'utilisateur, dans un dossier
dédié. »

**Narration (EN)** : "Logbook is a personal journaling app. All data lives in the
user's own Google Drive, inside a dedicated folder."

## Scène 2 — Connexion et écran de consentement (20-30 s)

**À l'écran** :
1. Cliquer sur « Se connecter avec Google ».
2. Laisser l'écran de consentement OAuth s'afficher en entier (montrer le nom de
   l'app, le scope Drive listé, l'écran « Application non validée » s'il apparaît —
   c'est normal tant que la vérification n'est pas terminée).
3. Cliquer sur « Avancé » puis accéder à l'app si l'écran d'avertissement apparaît.
4. Accepter le consentement.

**Narration (FR)** : « L'utilisateur se connecte avec son compte Google et autorise
l'application à accéder à son Drive. »

**Narration (EN)** : "The user signs in with their Google account and grants Drive
access."

## Scène 3 — Montrer le dossier Drive avec une fiche ajoutée de l'extérieur (20-30 s)

**À l'écran** : basculer sur l'onglet Google Drive (déjà ouvert), montrer le dossier
`Application/logbook/entries_to_import` contenant le fichier déposé manuellement avant
l'enregistrement (cf. préparatifs), en soulignant qu'il n'a **pas** été créé par
l'application Logbook elle-même.

**Narration (FR)** : « Voici une fiche déposée directement dans ce dossier, en dehors
de l'application — par exemple par un outil tiers d'import automatisé. »

**Narration (EN)** : "Here is a file dropped directly into this folder from outside
the app — for example by a third-party import tool."

## Scène 4 — Montrer que l'app voit bien cette fiche (20-30 s)

**À l'écran** : revenir sur Logbook, ouvrir la section « Intégration » dans la barre
latérale, montrer que la fiche déposée à la scène 3 apparaît dans la liste des fiches
en attente.

**Narration (FR)** : « Grâce au scope Drive complet, l'application retrouve cette
fiche et propose de l'intégrer au journal, même si elle n'a pas été créée par
l'application. »

**Narration (EN)** : "With the full Drive scope, the app can find and import this
file, even though it wasn't created by the app itself."

## Scène 5 — Justification du scope restreint (15-20 s)

**À l'écran** : optionnel, revenir sur Google Cloud Console > Accès aux données, pour
montrer le texte de justification déjà rempli (ou rester sur l'app et continuer la
narration en voix off sur fond d'écran de l'app).

**Narration (FR)** : « Le scope restreint `drive.file` ne donne accès qu'aux fichiers
créés par l'application elle-même : il ne suffit pas ici, car les fiches peuvent être
ajoutées par un outil externe. L'application ne lit et n'écrit que dans son propre
dossier applicatif, jamais ailleurs dans le Drive de l'utilisateur. »

**Narration (EN)** : "The restricted drive.file scope only grants access to files the
app itself created, which isn't enough here since files can be added by an external
tool. The app only ever reads and writes inside its own application folder, never
elsewhere in the user's Drive."

## Scène 6 — Clôture (5-10 s)

**À l'écran** : retour à l'écran principal de l'app.

**Narration (FR)** : « Merci. »

**Narration (EN)** : "Thank you."

## Checklist avant export

- [ ] Compte de test (pas le compte personnel habituel) utilisé pendant tout
      l'enregistrement.
- [ ] Écran de consentement OAuth visible en entier, avec le scope Drive listé.
- [ ] Fichier déposé hors-app bien visible dans Drive avant d'être montré dans
      l'app.
- [ ] Narration ou sous-titres en anglais présents.
- [ ] Vidéo hébergée sur YouTube (lien non répertorié accepté), lien collé dans
      *Accès aux données > Démonstration vidéo*.
