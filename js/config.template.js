export const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__';
// Accès complet (pas drive.file) : les fiches importées par le skill remplir-journal
// sont créées par l'app Google Drive de Claude, pas par cette app — drive.file les
// rendrait invisibles à l'API même dans le dossier connecté (restriction par app
// créatrice, pas par dossier). Implique de pouvoir lire/écrire n'importe quel fichier
// du Drive de l'utilisateur, pas seulement son dossier Logbook.
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
// Clé API Picker (Google Cloud Console > APIs & Services > Identifiants > Clé API,
// restreinte à l'API Picker et aux référents localhost:8080 / lchouville.github.io).
export const GOOGLE_PICKER_API_KEY = '__GOOGLE_PICKER_API_KEY__';
