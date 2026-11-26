import { GOOGLE_CLIENT_ID, GOOGLE_PICKER_API_KEY } from './config.js';

// Le numéro de projet Google Cloud est le préfixe numérique du Client ID OAuth
// (format <numéro_projet>-xxxxx.apps.googleusercontent.com).
const GOOGLE_PROJECT_NUMBER = GOOGLE_CLIENT_ID.split('-')[0];

let pickerApiReady = null;

function loadPickerApi() {
  if (pickerApiReady) return pickerApiReady;
  pickerApiReady = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => window.gapi.load('picker', resolve);
    document.head.appendChild(script);
  });
  return pickerApiReady;
}

// Sélectionner un dossier déjà existant (pas créé par l'app) via le Picker est
// le seul moyen, sous le scope restreint drive.file, de donner à l'app un accès
// durable à ce dossier et à son contenu : une simple recherche par nom ne verra
// jamais un dossier que l'app n'a pas elle-même créé.
// parentId optionnel : ouvre le Picker directement dans ce dossier (ex.
// Application/, cf probeLogbookFolder dans drive.js) plutôt qu'à la racine du
// Drive, pour éviter à l'utilisateur de devoir y naviguer lui-même.
export async function pickFolder(accessToken, parentId) {
  await loadPickerApi();
  return new Promise((resolve, reject) => {
    // setOwnedByMe(true) : ce dossier vit dans le Drive de l'utilisateur, pas
    // partagé par quelqu'un d'autre — sans ça, le Picker peut n'afficher que
    // l'onglet « Partagé avec moi » et cacher « Mon Drive ».
    const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setOwnedByMe(true)
      .setSelectFolderEnabled(true)
      .setIncludeFolders(true);
    if (parentId) view.setParent(parentId);
    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_PICKER_API_KEY)
      .setAppId(GOOGLE_PROJECT_NUMBER)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          resolve(data.docs[0].id);
        } else if (data.action === google.picker.Action.CANCEL) {
          reject(new Error('Sélection annulée.'));
        }
      })
      .build();
    picker.setVisible(true);
  });
}

// Pour l'import d'une entrée depuis le Drive de l'utilisateur lui-même (pas un
// fichier partagé par quelqu'un d'autre, cf pickSharedFile ci-dessous).
export async function pickOwnJsonFile(accessToken) {
  await loadPickerApi();
  return new Promise((resolve, reject) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setOwnedByMe(true)
      .setIncludeFolders(false)
      .setMimeTypes('application/json');
    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_PICKER_API_KEY)
      .setAppId(GOOGLE_PROJECT_NUMBER)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          resolve(data.docs[0].id);
        } else if (data.action === google.picker.Action.CANCEL) {
          reject(new Error('Sélection annulée.'));
        }
      })
      .build();
    picker.setVisible(true);
  });
}

export async function pickSharedFile(accessToken) {
  await loadPickerApi();
  return new Promise((resolve, reject) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setOwnedByMe(false)
      .setIncludeFolders(false)
      .setMimeTypes('application/json');
    const picker = new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(GOOGLE_PICKER_API_KEY)
      .setAppId(GOOGLE_PROJECT_NUMBER)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) {
          resolve(data.docs[0].id);
        } else if (data.action === google.picker.Action.CANCEL) {
          reject(new Error('Sélection annulée.'));
        }
      })
      .build();
    picker.setVisible(true);
  });
}
