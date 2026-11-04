import { getAccessToken } from './auth.js';

const FILE_NAME = 'logbook-data.json';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

let fileIdCache = null;

function authHeaders() {
  const token = getAccessToken();
  if (!token) throw new Error('Non connecté à Google.');
  return { Authorization: `Bearer ${token}` };
}

async function findFileId() {
  if (fileIdCache) return fileIdCache;
  const params = new URLSearchParams({
    q: `name='${FILE_NAME}' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id,name)',
  });
  const response = await fetch(`${DRIVE_FILES_URL}?${params}`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Erreur lors de la recherche du fichier Drive.');
  const data = await response.json();
  fileIdCache = data.files?.[0]?.id ?? null;
  return fileIdCache;
}

async function createFile(entries) {
  const metadata = { name: FILE_NAME, mimeType: 'application/json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(entries)], { type: 'application/json' }));

  const response = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!response.ok) throw new Error('Erreur lors de la création du fichier Drive.');
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
  if (!response.ok) throw new Error('Erreur lors de la mise à jour du fichier Drive.');
}

export async function loadEntries() {
  const fileId = await findFileId();
  if (!fileId) return [];
  const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, { headers: authHeaders() });
  if (!response.ok) throw new Error('Erreur lors de la lecture du fichier Drive.');
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
