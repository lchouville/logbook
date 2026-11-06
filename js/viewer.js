import { getAccessToken } from './auth.js';
import {
  loadSharedFile,
  getSharedFileName,
  loadPartagesRecus,
  savePartagesRecus,
  createPartageRecuShortcut,
} from './drive.js';
import { pickSharedFile } from './picker.js';

const viewerGrantAccess = document.getElementById('viewer-grant-access');
const viewerError = document.getElementById('viewer-error');
const viewerTableBody = document.getElementById('viewer-table-body');

let currentFileId = null;
let currentOnPartagesRecusChanged = null;

function appendCell(row, text) {
  const td = document.createElement('td');
  td.textContent = text;
  row.appendChild(td);
  return td;
}

function renderViewerLoading() {
  viewerTableBody.innerHTML = '';
  const row = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = 9;
  td.textContent = 'Chargement…';
  row.appendChild(td);
  viewerTableBody.appendChild(row);
}

function renderViewerEntries(entries) {
  viewerTableBody.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const row = document.createElement('tr');

    appendCell(row, entry.date);
    appendCell(row, entry.titre ?? '');
    appendCell(row, entry.themes.join(', '));
    appendCell(row, entry.niveauAcces);
    appendCell(row, entry.statut);
    appendCell(row, entry.mesuresSoir?.energie ?? '—');
    appendCell(row, entry.mesuresSoir?.ressenti ?? '—');
    appendCell(row, entry.texte ?? '');
    appendCell(row, entry.ressentiAFroid != null ? `${entry.ressentiAFroid}/10` : '—');

    viewerTableBody.appendChild(row);
  }
}

async function recordPartageRecu(fileId, onPartagesRecusChanged) {
  try {
    const recus = await loadPartagesRecus();
    const existing = recus.find((p) => p.fichierId === fileId);
    const maintenant = new Date().toISOString();
    let updated;
    if (existing) {
      updated = recus.map((p) => (p.fichierId === fileId ? { ...p, dernierAccesLe: maintenant } : p));
    } else {
      const nom = await getSharedFileName(fileId);
      try {
        await createPartageRecuShortcut(fileId, nom);
      } catch (error) {
        console.warn('Échec de la création du raccourci Drive :', error);
      }
      updated = [
        ...recus,
        { id: crypto.randomUUID(), fichierId: fileId, nom, premierAccesLe: maintenant, dernierAccesLe: maintenant },
      ];
    }
    await savePartagesRecus(updated);
    onPartagesRecusChanged?.(updated);
  } catch (error) {
    console.error("Échec de l'enregistrement dans « Partages reçus » :", error);
    viewerError.textContent = `Journal affiché, mais pas ajouté à « Partages reçus » : ${error.message}`;
  }
}

export async function renderJournalPartage(fileId, onPartagesRecusChanged) {
  currentFileId = fileId;
  currentOnPartagesRecusChanged = onPartagesRecusChanged;

  viewerError.textContent = '';
  renderViewerLoading();

  try {
    const entries = await loadSharedFile(fileId);
    viewerGrantAccess.hidden = true;
    renderViewerEntries(entries);
    await recordPartageRecu(fileId, onPartagesRecusChanged);
  } catch (error) {
    viewerTableBody.innerHTML = '';
    viewerGrantAccess.hidden = false;
    viewerError.textContent = `Accès au journal partagé impossible pour l'instant (${error.message}). Donne l'accès via le bouton ci-dessous.`;
  }
}

viewerGrantAccess.addEventListener('click', async () => {
  viewerError.textContent = '';
  try {
    await pickSharedFile(getAccessToken());
    await renderJournalPartage(currentFileId, currentOnPartagesRecusChanged);
  } catch (error) {
    viewerError.textContent = error.message;
  }
});
