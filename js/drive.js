import { getAccessToken, refreshAccessToken, isDevLocalMode } from './auth.js';

// En mode test local (voir js/auth.js, isDevLocalMode), les mêmes appels sont
// redirigés vers le serveur de dev (dev-server.py) qui émule ce sous-ensemble
// de l'API Drive sur disque (.devdrive/) plutôt que vers Google.
function filesUrl() {
  return isDevLocalMode() ? '/__dev_drive__/files' : 'https://www.googleapis.com/drive/v3/files';
}
function uploadUrl() {
  return isDevLocalMode() ? '/__dev_drive__/upload/files' : 'https://www.googleapis.com/upload/drive/v3/files';
}
function aboutUrl() {
  return isDevLocalMode() ? '/__dev_drive__/about' : 'https://www.googleapis.com/drive/v3/about';
}

const APP_FOLDER_NAME = 'Application';
const LOGBOOK_FOLDER_NAME = 'Logbook';
const DATA_FOLDER_NAME = 'logbook';
const PARTAGES_FOLDER_NAME = 'shares';
const LEGACY_PARTAGES_FOLDER_NAME = 'partages';
const DATA_FILE_NAME = 'logbook-data.json';
const SETTINGS_FILE_NAME = 'logbook-settings.json';
const PARTAGES_FILE_NAME = 'logbook-shares.json';
const LEGACY_PARTAGES_FILE_NAME = 'logbook-partages.json';
const MODELES_FILE_NAME = 'logbook-templates.json';
const LEGACY_MODELES_FILE_NAME = 'logbook-modeles.json';
const PARTAGES_RECUS_FILE_NAME = 'logbook-received-shares.json';
const LEGACY_PARTAGES_RECUS_FILE_NAME = 'logbook-partages-recus.json';
const PARTAGES_RECUS_FOLDER_NAME = 'received-shares';
const LEGACY_PARTAGES_RECUS_FOLDER_NAME = 'partages-recus';
const PHOTOS_FOLDER_NAME = 'photos';
const INTEGRATION_FOLDER_NAME = 'entries_to_import';
const DASHBOARDS_FILE_NAME = 'logbook-dashboards.json';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const SHORTCUT_MIME_TYPE = 'application/vnd.google-apps.shortcut';
const FOLDER_COLOR = '#cd74e6'; // Lavande (palette officielle Google Drive)

let folderIdCache = null;
let folderIdPromise = null;
let partagesFolderIdCache = null;
let partagesRecusFolderIdCache = null;
let photosFolderIdCache = null;
let integrationFolderIdCache = null;
let integrationFolderIdPromise = null;
let activeDashboardId = 'default';
const fileIdCache = new Map();

// Change de dashboard actif et vide tous les caches : les ids de dossier/fichier
// résolus dépendent du dashboard, donc les garder pointerait vers l'ancien dossier.
export function setActiveDashboard(dashboardId) {
  activeDashboardId = dashboardId;
  folderIdCache = null;
  folderIdPromise = null;
  partagesFolderIdCache = null;
  partagesRecusFolderIdCache = null;
  photosFolderIdCache = null;
  integrationFolderIdCache = null;
  integrationFolderIdPromise = null;
  fileIdCache.clear();
}

function authHeaders() {
  const token = getAccessToken();
  if (!token) throw new Error('Non connecté à Google.');
  return { Authorization: `Bearer ${token}` };
}

// Point d'entrée unique pour tous les appels Drive : rejoue automatiquement
// la requête une fois avec un token rafraîchi si l'API renvoie 401 (token
// expiré), au lieu de laisser chaque appelant échouer silencieusement.
async function driveFetch(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { ...options.headers, ...authHeaders() } });
  if (response.status !== 401) return response;

  const refreshed = await refreshAccessToken();
  if (!refreshed) throw new Error('Session Google expirée, reconnecte-toi.');

  return fetch(url, { ...options, headers: { ...options.headers, ...authHeaders() } });
}

async function describeError(response) {
  const body = await response.json().catch(() => null);
  const apiMessage = body?.error?.message;
  return apiMessage ? `${response.status} ${apiMessage}` : `${response.status} ${response.statusText}`;
}

async function findFolder(name, parentId) {
  const parentClause = parentId ? `'${parentId}' in parents` : "'root' in parents";
  const params = new URLSearchParams({
    q: `name='${name}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false and ${parentClause}`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });
  const response = await driveFetch(`${filesUrl()}?${params}`);
  if (!response.ok) throw new Error(`Recherche du dossier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.files?.[0]?.id ?? null;
}

async function createFolder(name, parentId) {
  const metadata = {
    name,
    mimeType: FOLDER_MIME_TYPE,
    parents: parentId ? [parentId] : undefined,
    folderColorRgb: FOLDER_COLOR,
  };
  const response = await driveFetch(`${filesUrl()}?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error(`Création du dossier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

// legacyName : ancien nom (français) du même dossier. S'il est trouvé sous ce nom,
// on le renomme en place plutôt que d'en créer un nouveau, pour que les dossiers déjà
// présents dans le Drive de l'utilisateur basculent vers le nom anglais sans rien perdre.
async function findOrCreateFolder(name, parentId, legacyName) {
  const existing = await findFolder(name, parentId);
  if (existing) return existing;
  const legacy = legacyName && (await findFolder(legacyName, parentId));
  if (legacy) {
    await renameSharedFile(legacy, name);
    return legacy;
  }
  return createFolder(name, parentId);
}

// Toutes les données de l'app (dashboards, modèles, entrées, entries_to_import)
// vivent dans le dossier Logbook connecté une fois par l'utilisateur via le
// Picker (cf connectLogbookFolder plus bas) — jamais dans un dossier que l'app
// aurait créé elle-même ailleurs sur le Drive.
async function getAppFolderId() {
  return getLogbookFolderId();
}

export async function loadDashboards() {
  const appFolderId = await getAppFolderId();
  const dashboards = await loadJsonFile(DASHBOARDS_FILE_NAME, null, appFolderId);
  if (dashboards) return dashboards;
  // Migration : pas encore de registre -> le dossier "logbook" existant devient le dashboard "default".
  const defaultDashboards = [
    { id: 'default', nom: 'Mon journal de bord', dossierNom: DATA_FOLDER_NAME, creeLe: new Date().toISOString() },
  ];
  await saveJsonFile(DASHBOARDS_FILE_NAME, defaultDashboards, appFolderId);
  return defaultDashboards;
}

export async function saveDashboards(dashboards) {
  return saveJsonFile(DASHBOARDS_FILE_NAME, dashboards, await getAppFolderId());
}

export async function createDashboardFolder(dossierNom) {
  return findOrCreateFolder(dossierNom, await getAppFolderId());
}

// Convention de nommage des dossiers de dashboard : "logbook-default" pour le
// dashboard par défaut, "logbook-<nom>" (espaces remplacés par "_") pour les
// autres — appliquée aussi bien à la création (cf createDashboard, app.js) qu'en
// migration à la volée pour les dashboards déjà résolus sous un ancien nom
// ("logbook" ou "logbook-<uuid>").
export function expectedDossierNom(dashboard) {
  const base = dashboard.id === 'default' ? 'default' : dashboard.nom.trim().replace(/\s+/g, '_');
  return `logbook-${base}`;
}

// dashboardId par défaut = le dashboard actif ; un appelant peut passer un autre id
// (ex. le sélecteur de tableau dans le partage) sans toucher au dashboard actif ni à
// son cache, puisque seul le résultat pour activeDashboardId est mis en cache ici.
// loadAccountData (app.js) déclenche plusieurs chargements en parallèle (entrées,
// partages, accès reçus...) qui dépendent tous de ce dossier dès le premier accès
// à un dashboard sans dossierId connu : sans partage de la promesse en cours, ils
// lancent chacun leur propre recherche-puis-création en même temps (aucun n'a
// encore le résultat des autres), créant plusieurs dossiers en double.
async function getDataFolderId(dashboardId = activeDashboardId) {
  if (dashboardId === activeDashboardId && folderIdCache) return folderIdCache;
  if (dashboardId === activeDashboardId && folderIdPromise) return folderIdPromise;

  const resolving = (async () => {
    const appFolderId = await getAppFolderId();
    const dashboards = await loadDashboards();
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) throw new Error('Dashboard inconnu : ' + dashboardId);
    // dossierId est déjà connu depuis la création : l'utiliser directement évite de
    // re-chercher le dossier par nom juste après sa création, requête sujette au délai
    // d'indexation de la recherche Drive (le dossier peut ne pas encore être trouvable).
    // Les anciens registres (dashboard "default" migré) n'ont pas encore de dossierId :
    // on le résout une fois par nom puis on le persiste, pour que tous les dashboards
    // soient ensuite stockés de la même façon.
    let folderId = dashboard.dossierId;
    if (!folderId) {
      folderId = await findOrCreateFolder(dashboard.dossierNom ?? DATA_FOLDER_NAME, appFolderId);
      dashboard.dossierId = folderId;
      await saveJsonFile(DASHBOARDS_FILE_NAME, dashboards, appFolderId);
    }

    // Migration à la volée vers la convention "logbook-<nom>" ("logbook-default"
    // pour le dashboard par défaut) : couvre aussi bien l'ancien nom "logbook" que
    // l'ancien "logbook-<uuid>" utilisé à la création avant cette convention.
    const expected = expectedDossierNom(dashboard);
    if (dashboard.dossierNom !== expected) {
      await renameSharedFile(folderId, expected);
      dashboard.dossierNom = expected;
      await saveJsonFile(DASHBOARDS_FILE_NAME, dashboards, appFolderId);
    }

    return folderId;
  })();

  if (dashboardId === activeDashboardId) folderIdPromise = resolving;
  try {
    const folderId = await resolving;
    if (dashboardId === activeDashboardId) folderIdCache = folderId;
    return folderId;
  } finally {
    if (dashboardId === activeDashboardId) folderIdPromise = null;
  }
}

async function getPartagesFolderId(dashboardId = activeDashboardId) {
  if (dashboardId === activeDashboardId && partagesFolderIdCache) return partagesFolderIdCache;
  const dataFolderId = await getDataFolderId(dashboardId);
  const folderId = await findOrCreateFolder(PARTAGES_FOLDER_NAME, dataFolderId, LEGACY_PARTAGES_FOLDER_NAME);
  if (dashboardId === activeDashboardId) partagesFolderIdCache = folderId;
  return folderId;
}

async function getPartagesRecusFolderId() {
  if (partagesRecusFolderIdCache) return partagesRecusFolderIdCache;
  const dataFolderId = await getDataFolderId();
  partagesRecusFolderIdCache = await findOrCreateFolder(
    PARTAGES_RECUS_FOLDER_NAME,
    dataFolderId,
    LEGACY_PARTAGES_RECUS_FOLDER_NAME,
  );
  return partagesRecusFolderIdCache;
}

async function getPhotosFolderId() {
  if (photosFolderIdCache) return photosFolderIdCache;
  photosFolderIdCache = await findOrCreateFolder(PHOTOS_FOLDER_NAME, await getDataFolderId());
  return photosFolderIdCache;
}

export async function uploadPhoto(file, fieldId) {
  const metadata = { name: `${fieldId}-${crypto.randomUUID()}`, mimeType: file.type || 'image/jpeg', parents: [await getPhotosFolderId()] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);
  const response = await driveFetch(`${uploadUrl()}?uploadType=multipart&fields=id`, { method: 'POST', body: form });
  if (!response.ok) throw new Error(`Envoi de la photo Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

export async function fetchPhotoBlob(fileId) {
  const response = await driveFetch(`${filesUrl()}/${fileId}?alt=media`);
  if (!response.ok) throw new Error(`Lecture de la photo Drive : ${await describeError(response)}`);
  return response.blob();
}

export async function deletePhoto(fileId) {
  const response = await driveFetch(`${filesUrl()}/${fileId}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) throw new Error(`Suppression de la photo Drive : ${await describeError(response)}`);
}

// Dossier "Logbook" de l'utilisateur : racine de toutes les données de l'app
// (dashboards, modèles, entrées, entries_to_import), potentiellement pas créé
// par l'app elle-même. Son id est choisi une fois par l'utilisateur via le
// Picker (cf connectLogbookFolder) et persisté en local (pas sur Drive : on ne
// peut pas stocker ce pointeur DANS le dossier qu'il désigne avant de le
// connaître).
// Clé distincte en mode test local : les ids du vrai Drive et ceux du stockage
// local (.devdrive/) ne se recoupent jamais, les mélanger ferait pointer l'un
// vers un id introuvable dans l'autre dès qu'on bascule de mode.
function logbookFolderIdKey() {
  return isDevLocalMode() ? 'logbook_dev_drive_folder_id' : 'logbook_drive_folder_id';
}
let logbookFolderIdCache = null;
export const LOGBOOK_FOLDER_NOT_CONNECTED = 'LOGBOOK_FOLDER_NOT_CONNECTED';

export async function connectLogbookFolder(folderId) {
  localStorage.setItem(logbookFolderIdKey(), folderId);
  logbookFolderIdCache = folderId;
}

// Recherche Application/Logbook par nom (ne peut trouver que ce que l'app a
// elle-même déjà créé ou auquel elle a déjà accès — scope drive.file oblige) :
// sert uniquement à décider quelle action proposer dans la popup de connexion
// (Connecter si trouvé, Créer sinon), pas à se connecter automatiquement — un
// faux négatif (dossier existant mais jamais vu par l'app) ne doit pas bloquer
// l'utilisateur, juste lui laisser l'option "Créer".
export async function probeLogbookFolder() {
  const appFolderId = await findFolder(APP_FOLDER_NAME, null);
  if (!appFolderId) return { found: false, appFolderId: null, logbookFolderId: null };
  const logbookFolderId = await findFolder(LOGBOOK_FOLDER_NAME, appFolderId);
  return { found: Boolean(logbookFolderId), appFolderId, logbookFolderId };
}

// Premier usage, aucun dossier Logbook existant à connecter : l'app crée et
// connecte elle-même Application/Logbook (toujours visible pour elle puisque
// créé par son propre token, pas besoin de passer par le Picker).
export async function createLogbookFolder() {
  const rootAppFolderId = await findOrCreateFolder(APP_FOLDER_NAME, null);
  const logbookFolderId = await findOrCreateFolder(LOGBOOK_FOLDER_NAME, rootAppFolderId);
  await connectLogbookFolder(logbookFolderId);
  return logbookFolderId;
}

export function isLogbookFolderConnected() {
  return Boolean(localStorage.getItem(logbookFolderIdKey()));
}

// Vérifié une seule fois par session (pas à chaque appel) : une suppression du
// dossier en cours de session ne sera détectée qu'au prochain chargement de
// page, mais évite un aller-retour Drive supplémentaire à chaque résolution.
let logbookFolderValidated = false;

function disconnectLogbookFolder() {
  localStorage.removeItem(logbookFolderIdKey());
  logbookFolderIdCache = null;
  logbookFolderValidated = false;
}

async function getLogbookFolderId() {
  if (logbookFolderIdCache && logbookFolderValidated) return logbookFolderIdCache;
  const stored = logbookFolderIdCache ?? localStorage.getItem(logbookFolderIdKey());
  if (!stored) throw new Error(LOGBOOK_FOLDER_NOT_CONNECTED);

  // Le dossier a pu être supprimé/déplacé hors d'atteinte depuis Drive directement :
  // sans cette vérification, l'app resterait "connectée" à un id mort et échouerait
  // sur chaque appel sans jamais réafficher la popup de connexion.
  const params = new URLSearchParams({ fields: 'id,trashed' });
  const response = await driveFetch(`${filesUrl()}/${stored}?${params}`);
  const data = response.ok ? await response.json() : null;
  if (!data || data.trashed) {
    disconnectLogbookFolder();
    throw new Error(LOGBOOK_FOLDER_NOT_CONNECTED);
  }

  logbookFolderIdCache = stored;
  logbookFolderValidated = true;
  return logbookFolderIdCache;
}

// Même parade qu'au cache de getDataFolderId : sans elle, deux appels concurrents
// (page qui liste l'intégration + upload lancé en parallèle) ne se voient pas l'un
// l'autre pendant leur recherche-puis-création respective et créent chacun un
// dossier entries_to_import.
async function getIntegrationFolderId() {
  if (integrationFolderIdCache) return integrationFolderIdCache;
  if (integrationFolderIdPromise) return integrationFolderIdPromise;
  integrationFolderIdPromise = (async () => {
    const appFolderId = await getAppFolderId();
    return findOrCreateFolder(INTEGRATION_FOLDER_NAME, appFolderId);
  })();
  try {
    integrationFolderIdCache = await integrationFolderIdPromise;
    return integrationFolderIdCache;
  } finally {
    integrationFolderIdPromise = null;
  }
}

export async function listIntegrationFiles() {
  const params = new URLSearchParams({
    q: `trashed=false and '${await getIntegrationFolderId()}' in parents`,
    spaces: 'drive',
    fields: 'files(id,name)',
    orderBy: 'name',
  });
  const response = await driveFetch(`${filesUrl()}?${params}`);
  if (!response.ok) throw new Error(`Liste des entrées à intégrer : ${await describeError(response)}`);
  const data = await response.json();
  return data.files ?? [];
}

export async function loadIntegrationFile(fileId) {
  return loadSharedFile(fileId);
}

export async function deleteIntegrationFile(fileId) {
  return deleteSharedFile(fileId);
}

async function migrateLegacyFile(folderId) {
  const params = new URLSearchParams({
    q: `name='${DATA_FILE_NAME}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id,parents)',
  });
  const response = await driveFetch(`${filesUrl()}?${params}`);
  if (!response.ok) throw new Error(`Recherche du fichier Drive (migration) : ${await describeError(response)}`);
  const data = await response.json();
  const legacyFile = data.files?.[0];
  if (!legacyFile) return null;

  const moveParams = new URLSearchParams({
    addParents: folderId,
    removeParents: (legacyFile.parents ?? []).join(','),
    fields: 'id',
  });
  const moveResponse = await driveFetch(`${filesUrl()}/${legacyFile.id}?${moveParams}`, { method: 'PATCH' });
  if (!moveResponse.ok) throw new Error(`Déplacement du fichier Drive : ${await describeError(moveResponse)}`);
  return legacyFile.id;
}

async function findFileByName(fileName, folderId) {
  const params = new URLSearchParams({
    q: `name='${fileName}' and trashed=false and '${folderId}' in parents`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });
  const response = await driveFetch(`${filesUrl()}?${params}`);
  if (!response.ok) throw new Error(`Recherche du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.files?.[0]?.id ?? null;
}

// dashboardId : le dashboard dont dépend folderId (pas forcément l'actif — un appelant
// peut résoudre le dossier d'un autre dashboard, ex. le sélecteur de tableau du partage).
// Sert uniquement à borner la migration legacy ci-dessous au bon dashboard.
// legacyFileName : ancien nom (français) du même fichier. S'il est trouvé sous ce nom,
// on le renomme en place vers le nom anglais plutôt que d'en créer un nouveau.
async function findFileId(fileName, folderId, dashboardId = activeDashboardId, legacyFileName) {
  // Clé incluant le dossier : un même nom de fichier (logbook-data.json, etc.) existe
  // dans le dossier de chaque dashboard, un cache par nom seul renverrait l'id du
  // mauvais dossier dès qu'on lit deux dashboards différents dans la même session.
  const cacheKey = `${folderId}:${fileName}`;
  if (fileIdCache.has(cacheKey)) return fileIdCache.get(cacheKey);
  let fileId = await findFileByName(fileName, folderId);
  if (!fileId && legacyFileName) {
    fileId = await findFileByName(legacyFileName, folderId);
    if (fileId) await renameSharedFile(fileId, fileName);
  }
  // La migration ne doit jouer que pour le dashboard "default" : sa recherche n'est pas
  // bornée à un dossier (legacy, fichier posé n'importe où dans le Drive), donc avec
  // plusieurs dashboards elle irait voler le logbook-data.json d'un autre dashboard.
  const canMigrate = !fileId && fileName === DATA_FILE_NAME && dashboardId === 'default';
  fileId = fileId ?? (canMigrate ? await migrateLegacyFile(folderId) : null);
  fileIdCache.set(cacheKey, fileId);
  return fileId;
}

async function createFile(fileName, content, folderId) {
  const metadata = { name: fileName, mimeType: 'application/json', parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

  const response = await driveFetch(`${uploadUrl()}?uploadType=multipart&fields=id`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(`Création du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  fileIdCache.set(`${folderId}:${fileName}`, data.id);
  return data.id;
}

async function updateFile(fileId, content) {
  const response = await driveFetch(`${uploadUrl()}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  if (!response.ok) throw new Error(`Mise à jour du fichier Drive : ${await describeError(response)}`);
}

async function loadJsonFile(fileName, fallback, folderId, dashboardId, legacyFileName) {
  const fileId = await findFileId(fileName, folderId, dashboardId, legacyFileName);
  if (!fileId) return fallback;
  const response = await driveFetch(`${filesUrl()}/${fileId}?alt=media`);
  if (!response.ok) throw new Error(`Lecture du fichier Drive : ${await describeError(response)}`);
  return response.json();
}

async function saveJsonFile(fileName, content, folderId, dashboardId, legacyFileName) {
  const fileId = await findFileId(fileName, folderId, dashboardId, legacyFileName);
  if (fileId) {
    await updateFile(fileId, content);
    return fileId;
  }
  return createFile(fileName, content, folderId);
}

// dashboardId optionnel : par défaut le dashboard actif, mais le sélecteur de tableau
// du formulaire de partage peut cibler un autre dashboard sans y bascule l'app entière.
// Transmis à loadJsonFile/findFileId pour que la migration legacy (cf findFileId) se
// base sur le dashboard réellement résolu plutôt que sur l'actif.
export async function loadEntries(dashboardId) {
  return loadJsonFile(DATA_FILE_NAME, [], await getDataFolderId(dashboardId), dashboardId);
}

export async function saveEntries(entries, dashboardId) {
  return saveJsonFile(DATA_FILE_NAME, entries, await getDataFolderId(dashboardId));
}

export async function loadSettings() {
  return loadJsonFile(SETTINGS_FILE_NAME, {}, await getDataFolderId());
}

export async function saveSettings(settings) {
  return saveJsonFile(SETTINGS_FILE_NAME, settings, await getDataFolderId());
}

// Les partages restent par dashboard (registre + dossier "partages" propres à chacun) :
// dashboardId permet au sélecteur du formulaire de partage de lire/écrire ceux d'un
// autre dashboard que l'actif.
export async function loadPartages(dashboardId) {
  return loadJsonFile(PARTAGES_FILE_NAME, [], await getDataFolderId(dashboardId), dashboardId, LEGACY_PARTAGES_FILE_NAME);
}

export async function savePartages(partages, dashboardId) {
  return saveJsonFile(PARTAGES_FILE_NAME, partages, await getDataFolderId(dashboardId), dashboardId, LEGACY_PARTAGES_FILE_NAME);
}

// Les modèles sont communs à tous les dashboards (stockés dans le dossier "Application",
// pas dans celui d'un dashboard) : un seul modèle créé est utilisable partout.
export async function loadModeles() {
  const appFolderId = await getAppFolderId();
  const existing = await loadJsonFile(MODELES_FILE_NAME, null, appFolderId, undefined, LEGACY_MODELES_FILE_NAME);
  if (existing) return existing;
  // Migration : fusionne les modèles déjà présents dans chaque dashboard (avant ce
  // changement, les modèles étaient stockés par dashboard) en une seule liste globale.
  const dashboards = await loadDashboards();
  const merged = [];
  const seenIds = new Set();
  for (const dashboard of dashboards) {
    const folderId = await getDataFolderId(dashboard.id);
    const dashboardModeles = await loadJsonFile(MODELES_FILE_NAME, [], folderId);
    for (const modele of dashboardModeles) {
      if (!seenIds.has(modele.id)) {
        seenIds.add(modele.id);
        merged.push(modele);
      }
    }
  }
  await saveJsonFile(MODELES_FILE_NAME, merged, appFolderId);
  return merged;
}

export async function saveModeles(modeles) {
  return saveJsonFile(MODELES_FILE_NAME, modeles, await getAppFolderId(), undefined, LEGACY_MODELES_FILE_NAME);
}

export async function createSharedFile(fileName, entries, dashboardId) {
  return createFile(fileName, entries, await getPartagesFolderId(dashboardId));
}

export async function updateSharedFile(fileId, entries) {
  return updateFile(fileId, entries);
}

export async function renameSharedFile(fileId, newName) {
  const response = await driveFetch(`${filesUrl()}/${fileId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error(`Renommage du fichier Drive : ${await describeError(response)}`);
}

export async function getOwnerDisplayName() {
  const params = new URLSearchParams({ fields: 'user' });
  const response = await driveFetch(`${aboutUrl()}?${params}`);
  if (!response.ok) throw new Error(`Lecture du profil Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.user?.displayName ?? data.user?.emailAddress ?? null;
}

export async function shareFileWithEmail(fileId, email) {
  const response = await driveFetch(`${filesUrl()}/${fileId}/permissions?sendNotificationEmail=false&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email }),
  });
  if (!response.ok) throw new Error(`Partage du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

export async function revokePermission(fileId, permissionId) {
  const response = await driveFetch(`${filesUrl()}/${fileId}/permissions/${permissionId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Révocation de l'accès Drive : ${await describeError(response)}`);
}

export async function deleteSharedFile(fileId) {
  const response = await driveFetch(`${filesUrl()}/${fileId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Suppression du fichier Drive : ${await describeError(response)}`);
}

export async function loadSharedFile(fileId) {
  const response = await driveFetch(`${filesUrl()}/${fileId}?alt=media`);
  if (!response.ok) throw new Error(`Lecture du fichier partagé : ${await describeError(response)}`);
  return response.json();
}

export async function getSharedFileName(fileId) {
  const params = new URLSearchParams({ fields: 'name' });
  const response = await driveFetch(`${filesUrl()}/${fileId}?${params}`);
  if (!response.ok) throw new Error(`Lecture du nom du fichier partagé : ${await describeError(response)}`);
  const data = await response.json();
  return data.name;
}

export async function createPartageRecuShortcut(fileId, name) {
  const folderId = await getPartagesRecusFolderId();
  const metadata = {
    name,
    mimeType: SHORTCUT_MIME_TYPE,
    parents: [folderId],
    shortcutDetails: { targetId: fileId },
  };
  const response = await driveFetch(`${filesUrl()}?fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error(`Création du raccourci Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

export async function loadPartagesRecus() {
  return loadJsonFile(PARTAGES_RECUS_FILE_NAME, [], await getDataFolderId(), undefined, LEGACY_PARTAGES_RECUS_FILE_NAME);
}

export async function savePartagesRecus(partagesRecus) {
  return saveJsonFile(
    PARTAGES_RECUS_FILE_NAME,
    partagesRecus,
    await getDataFolderId(),
    undefined,
    LEGACY_PARTAGES_RECUS_FILE_NAME,
  );
}
