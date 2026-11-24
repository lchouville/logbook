import { GOOGLE_CLIENT_ID, DRIVE_SCOPE } from './config.js';

const TOKEN_STORAGE_KEY = 'logbook_access_token';
const SIGNED_OUT_KEY = 'logbook_signed_out';
const SESSION_DURATION_KEY = 'logbook_session_duration';
const LAST_SIGNIN_KEY = 'logbook_last_signin_at';

// Mode test local (dev uniquement, voir dev-server.py) : contourne la connexion
// Google, les appels Drive (js/drive.js) sont redirigés vers un dossier sur disque
// (.devdrive/, gitignoré). Jamais actif ailleurs qu'en localhost — même si ce token
// fuitait vers gh-pages, le serveur de dev n'existe pas en prod, donc rien à lire.
export const isLocalDevHost = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname);
const DEV_LOCAL_TOKEN = 'dev-local-token';

export function isDevLocalMode() {
  return accessToken === DEV_LOCAL_TOKEN;
}

export function enableDevLocalMode() {
  accessToken = DEV_LOCAL_TOKEN;
  sessionStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.removeItem(SIGNED_OUT_KEY);
  markSignedIn();
  notifyChange();
}

// Le token Google lui-même expire toujours après ~1h (fixé par Google, non
// configurable) et se renouvelle en silence (cf refreshAccessToken plus bas).
// Cette durée-ci est différente : le temps max depuis la dernière connexion
// EXPLICITE avant de forcer une reconnexion manuelle, même si Google aurait
// pu renouveler le token silencieusement.
export const SESSION_DURATIONS_MS = {
  '1h': 3600e3,
  '5h': 5 * 3600e3,
  '1j': 24 * 3600e3,
  '7j': 7 * 24 * 3600e3,
  '30j': 30 * 24 * 3600e3,
  '4mois': 4 * 30 * 24 * 3600e3,
  '8mois': 8 * 30 * 24 * 3600e3,
  '1an': 365 * 24 * 3600e3,
  jamais: null,
};
const DEFAULT_SESSION_DURATION = 'jamais';

export function getSessionDuration() {
  const stored = localStorage.getItem(SESSION_DURATION_KEY);
  return stored && stored in SESSION_DURATIONS_MS ? stored : DEFAULT_SESSION_DURATION;
}

export function setSessionDuration(value) {
  if (!(value in SESSION_DURATIONS_MS)) throw new Error('Durée de session inconnue : ' + value);
  localStorage.setItem(SESSION_DURATION_KEY, value);
}

function isSessionExpired() {
  const durationMs = SESSION_DURATIONS_MS[getSessionDuration()];
  if (durationMs == null) return false; // "jamais"
  const lastSignInAt = Number(localStorage.getItem(LAST_SIGNIN_KEY));
  return Boolean(lastSignInAt) && Date.now() - lastSignInAt > durationMs;
}

// Marque le début d'une session : ne touche pas un timestamp déjà présent,
// pour que la durée se compte depuis la dernière connexion EXPLICITE (ou le
// premier chargement de page) et ne soit pas repoussée par chaque
// renouvellement silencieux du token Google (sinon la durée ne finirait
// jamais par s'écouler en usage normal).
function markSignedIn() {
  if (!localStorage.getItem(LAST_SIGNIN_KEY)) {
    localStorage.setItem(LAST_SIGNIN_KEY, String(Date.now()));
  }
}

let tokenClient = null;
let accessToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
// Amorce le suivi pour une session déjà active avant l'ajout de cette durée
// (sinon lastSignInAt resterait absent jusqu'au premier renouvellement de token).
if (accessToken) markSignedIn();
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
        markSignedIn();
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
  if (isSessionExpired()) {
    forceExpiredLogout();
    return null;
  }
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
  localStorage.removeItem(LAST_SIGNIN_KEY);
  notifyChange();
}

// Déconnexion forcée par dépassement de la durée de session choisie dans les
// paramètres : contrairement à signOut(), ne révoque pas le token (il a pu
// déjà expirer côté Google) mais marque bien l'utilisateur comme déconnecté,
// pour qu'il doive recliquer "Se connecter" plutôt que de repartir sur une
// reconnexion silencieuse.
function forceExpiredLogout() {
  accessToken = null;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.setItem(SIGNED_OUT_KEY, '1');
  localStorage.removeItem(LAST_SIGNIN_KEY);
  notifyChange();
}

// Tente une reconnexion silencieuse (sans écran de consentement) à chaque
// chargement de page tant que l'utilisateur ne s'est pas déconnecté
// explicitement — évite de recliquer "Se connecter" à chaque nouvel onglet
// si une session Google active et un consentement déjà donné existent.
// Désactivé en localhost : le choix Google/test local doit toujours être explicite
// (sinon une reconnexion Google silencieuse pourrait devancer le clic sur le bouton
// de test local), voir isLocalDevHost.
if (!isLocalDevHost && !accessToken && localStorage.getItem(SIGNED_OUT_KEY) !== '1') {
  if (isSessionExpired()) {
    forceExpiredLogout();
  } else {
    getTokenClient().then((client) => {
      client.requestAccessToken({ prompt: '' });
    });
  }
}
