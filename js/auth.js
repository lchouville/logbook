import { GOOGLE_CLIENT_ID, DRIVE_SCOPE } from './config.js';

const TOKEN_STORAGE_KEY = 'logbook_access_token';
const SIGNED_OUT_KEY = 'logbook_signed_out';

let tokenClient = null;
let accessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
let refreshPromise = null;
const changeListeners = [];
const pendingTokenResolvers = [];

function notifyChange() {
  for (const listener of changeListeners) listener(accessToken);
}

function settlePendingTokenRequests(token) {
  const resolvers = pendingTokenResolvers.splice(0);
  for (const resolve of resolvers) resolve(token);
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
        settlePendingTokenRequests(accessToken);
      } else {
        settlePendingTokenRequests(null);
      }
    },
    error_callback: () => {
      settlePendingTokenRequests(null);
    },
  });
  return tokenClient;
}

// Renouvelle le token en arrière-plan (sans écran de consentement) quand un
// appel Drive renvoie 401 — le token GIS expire après ~1h et rien d'autre ne
// le détecte, ce qui laissait l'utilisateur "connecté" en apparence mais en
// échec sur chaque appel tant qu'il ne se déconnectait/reconnectait pas à la
// main. Repose sur la session Google du navigateur, pas sur le token expiré,
// donc fonctionne même longtemps après l'expiration.
export async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = requestSilentToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function requestSilentToken() {
  const client = await getTokenClient();
  const token = await new Promise((resolve) => {
    pendingTokenResolvers.push(resolve);
    client.requestAccessToken({ prompt: '' });
    setTimeout(() => resolve(null), 10000);
  });
  if (!token) {
    // Rafraîchissement impossible (session Google elle-même expirée) :
    // on efface le token mort sans marquer de déconnexion explicite, pour
    // que la tentative de reconnexion silencieuse au prochain chargement
    // de page (voir plus bas) reste active.
    accessToken = null;
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    notifyChange();
  }
  return token;
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
