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
