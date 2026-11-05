import { getAccessToken } from './auth.js';

const APP_FOLDER_NAME = 'Application';
const DATA_FOLDER_NAME = 'logbook';
const PARTAGES_FOLDER_NAME = 'partages';
const DATA_FILE_NAME = 'logbook-data.json';
const SETTINGS_FILE_NAME = 'logbook-settings.json';
const PARTAGES_FILE_NAME = 'logbook-partages.json';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FOLDER_COLOR = '#cd74e6'; // Lavande (palette officielle Google Drive)
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_ABOUT_URL = 'https://www.googleapis.com/drive/v3/about';

let folderIdCache = null;
let partagesFolderIdCache = null;
const fileIdCache = new Map();

function authHeaders() {
  const token = getAccessToken();
  if (!token) throw new Error('Non connecté à Google.');
  return { Authorization: `Bearer ${token}` };
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
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, { headers: authHeaders() });
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
  const response = await fetch(`${DRIVE_FILES_URL}?fields=id`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error(`Création du dossier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

async function findOrCreateFolder(name, parentId) {
  const existing = await findFolder(name, parentId);
  return existing ?? createFolder(name, parentId);
}

async function getDataFolderId() {
  if (folderIdCache) return folderIdCache;
  const appFolderId = await findOrCreateFolder(APP_FOLDER_NAME, null);
  folderIdCache = await findOrCreateFolder(DATA_FOLDER_NAME, appFolderId);
  return folderIdCache;
}

async function getPartagesFolderId() {
  if (partagesFolderIdCache) return partagesFolderIdCache;
  const dataFolderId = await getDataFolderId();
  partagesFolderIdCache = await findOrCreateFolder(PARTAGES_FOLDER_NAME, dataFolderId);
  return partagesFolderIdCache;
}

async function migrateLegacyFile(folderId) {
  const params = new URLSearchParams({
    q: `name='${DATA_FILE_NAME}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id,parents)',
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Recherche du fichier Drive (migration) : ${await describeError(response)}`);
  const data = await response.json();
  const legacyFile = data.files?.[0];
  if (!legacyFile) return null;

  const moveParams = new URLSearchParams({
    addParents: folderId,
    removeParents: (legacyFile.parents ?? []).join(','),
    fields: 'id',
  });
  const moveResponse = await fetch(`${DRIVE_FILES_URL}/${legacyFile.id}?${moveParams}`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!moveResponse.ok) throw new Error(`Déplacement du fichier Drive : ${await describeError(moveResponse)}`);
  return legacyFile.id;
}

async function findFileId(fileName, folderId) {
  if (fileIdCache.has(fileName)) return fileIdCache.get(fileName);
  const params = new URLSearchParams({
    q: `name='${fileName}' and trashed=false and '${folderId}' in parents`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Recherche du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  const fileId = data.files?.[0]?.id ?? (fileName === DATA_FILE_NAME ? await migrateLegacyFile(folderId) : null);
  fileIdCache.set(fileName, fileId);
  return fileId;
}

async function createFile(fileName, content, folderId) {
  const metadata = { name: fileName, mimeType: 'application/json', parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error(`Création du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  fileIdCache.set(fileName, data.id);
  return data.id;
}

async function updateFile(fileId, content) {
  const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  if (!response.ok) throw new Error(`Mise à jour du fichier Drive : ${await describeError(response)}`);
}

async function loadJsonFile(fileName, fallback, folderId) {
  const fileId = await findFileId(fileName, folderId);
  if (!fileId) return fallback;
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Lecture du fichier Drive : ${await describeError(response)}`);
  return response.json();
}

async function saveJsonFile(fileName, content, folderId) {
  const fileId = await findFileId(fileName, folderId);
  if (fileId) {
    await updateFile(fileId, content);
    return fileId;
  }
  return createFile(fileName, content, folderId);
}

export async function loadEntries() {
  return loadJsonFile(DATA_FILE_NAME, [], await getDataFolderId());
}

export async function saveEntries(entries) {
  return saveJsonFile(DATA_FILE_NAME, entries, await getDataFolderId());
}

export async function loadSettings() {
  return loadJsonFile(SETTINGS_FILE_NAME, {}, await getDataFolderId());
}

export async function saveSettings(settings) {
  return saveJsonFile(SETTINGS_FILE_NAME, settings, await getDataFolderId());
}

export async function loadPartages() {
  return loadJsonFile(PARTAGES_FILE_NAME, [], await getDataFolderId());
}

export async function savePartages(partages) {
  return saveJsonFile(PARTAGES_FILE_NAME, partages, await getDataFolderId());
}

export async function createSharedFile(fileName, entries) {
  return createFile(fileName, entries, await getPartagesFolderId());
}

export async function updateSharedFile(fileId, entries) {
  return updateFile(fileId, entries);
}

export async function renameSharedFile(fileId, newName) {
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error(`Renommage du fichier Drive : ${await describeError(response)}`);
}

export async function getOwnerDisplayName() {
  const params = new URLSearchParams({ fields: 'user' });
  const response = await fetch(`${DRIVE_ABOUT_URL}?${params}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Lecture du profil Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.user?.displayName ?? data.user?.emailAddress ?? null;
}

export async function shareFileWithEmail(fileId, email) {
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}/permissions?sendNotificationEmail=false&fields=id`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'user', emailAddress: email }),
  });
  if (!response.ok) throw new Error(`Partage du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  return data.id;
}

export async function revokePermission(fileId, permissionId) {
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}/permissions/${permissionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Révocation de l'accès Drive : ${await describeError(response)}`);
}

export async function deleteSharedFile(fileId) {
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error(`Suppression du fichier Drive : ${await describeError(response)}`);
}

export async function loadSharedFile(fileId) {
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Lecture du fichier partagé : ${await describeError(response)}`);
  return response.json();
}
