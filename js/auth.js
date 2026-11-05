import { GOOGLE_CLIENT_ID, DRIVE_SCOPE } from './config.js';

const TOKEN_STORAGE_KEY = 'logbook_access_token';
const SIGNED_OUT_KEY = 'logbook_signed_out';

let tokenClient = null;
let accessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
const changeListeners = [];

function notifyChange() {
  for (const listener of changeListeners) listener(accessToken);
}

function waitForGoogleIdentity() {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
}

async function getTokenClient() {
  if (tokenClient) return tokenClient;
  await waitForGoogleIdentity();
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: (response) => {
      if (response.access_token) {
        accessToken = response.access_token;
        sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
        localStorage.removeItem(SIGNED_OUT_KEY);
        notifyChange();
      }
    },
  });
  return tokenClient;
}

export function onAuthChange(listener) {
  changeListeners.push(listener);
  listener(accessToken);
}

export function getAccessToken() {
  return accessToken;
}

export async function signIn() {
  const client = await getTokenClient();
  client.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.setItem(SIGNED_OUT_KEY, '1');
  notifyChange();
}

// Tente une reconnexion silencieuse (sans écran de consentement) à chaque
// chargement de page tant que l'utilisateur ne s'est pas déconnecté
// explicitement — évite de recliquer "Se connecter" à chaque nouvel onglet
// si une session Google active et un consentement déjà donné existent.
if (!accessToken && localStorage.getItem(SIGNED_OUT_KEY) !== '1') {
  getTokenClient().then((client) => {
    client.requestAccessToken({ prompt: '' });
  });
}
