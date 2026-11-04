import { getAccessToken } from './auth.js';

const APP_FOLDER_NAME = 'Application';
const DATA_FOLDER_NAME = 'logbook';
const FILE_NAME = 'logbook-data.json';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FOLDER_COLOR = '#cd74e6'; // Lavande (palette officielle Google Drive)
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

let folderIdCache = null;
let fileIdCache = null;

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

async function migrateLegacyFile(folderId) {
  const params = new URLSearchParams({
    q: `name='${FILE_NAME}' and trashed=false`,
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

async function findFileId() {
  if (fileIdCache) return fileIdCache;
  const folderId = await getDataFolderId();
  const params = new URLSearchParams({
    q: `name='${FILE_NAME}' and trashed=false and '${folderId}' in parents`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Recherche du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  fileIdCache = data.files?.[0]?.id ?? (await migrateLegacyFile(folderId));
  return fileIdCache;
}

async function createFile(entries) {
  const folderId = await getDataFolderId();
  const metadata = { name: FILE_NAME, mimeType: 'application/json', parents: [folderId] };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(entries)], { type: 'application/json' }));

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error(`Création du fichier Drive : ${await describeError(response)}`);
  const data = await response.json();
  fileIdCache = data.id;
  return fileIdCache;
}

async function updateFile(fileId, entries) {
  const response = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  });
  if (!response.ok) throw new Error(`Mise à jour du fichier Drive : ${await describeError(response)}`);
}

export async function loadEntries() {
  const fileId = await findFileId();
  if (!fileId) return [];
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Lecture du fichier Drive : ${await describeError(response)}`);
  return response.json();
}

export async function saveEntries(entries) {
  const fileId = await findFileId();
  if (fileId) {
    await updateFile(fileId, entries);
  } else {
    await createFile(entries);
  }
}
