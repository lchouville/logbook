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
const viewerList = document.getElementById('viewer-list');

let currentFileId = null;
let currentOnPartagesRecusChanged = null;

function renderViewerEntries(entries) {
  viewerList.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const li = document.createElement('li');

    const summary = document.createElement('p');
    summary.textContent = `${entry.date} — ${entry.themes.join(', ')} (${entry.niveauAcces}, ${entry.statut})`;
    li.appendChild(summary);

    const mesures = document.createElement('p');
    mesures.textContent = `Énergie ${entry.mesuresSoir?.energie ?? '—'}/10, ressenti ${entry.mesuresSoir?.ressenti ?? '—'}/10`;
    li.appendChild(mesures);

    if (entry.texte) {
      const texte = document.createElement('p');
      texte.textContent = entry.texte;
      li.appendChild(texte);
    }

    if (entry.ressentiAFroid != null) {
      const froid = document.createElement('p');
      froid.textContent = `Ressenti à froid : ${entry.ressentiAFroid}/10`;
      li.appendChild(froid);
    }

    viewerList.appendChild(li);
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
  viewerList.innerHTML = '';
  const loading = document.createElement('li');
  loading.textContent = 'Chargement…';
  viewerList.appendChild(loading);

  try {
    const entries = await loadSharedFile(fileId);
    viewerGrantAccess.hidden = true;
    renderViewerEntries(entries);
    await recordPartageRecu(fileId, onPartagesRecusChanged);
  } catch (error) {
    viewerList.innerHTML = '';
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
