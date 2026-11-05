import { onAuthChange, signIn, signOut, getAccessToken } from './auth.js';
import {
  loadSharedFile,
  getSharedFileName,
  loadPartagesRecus,
  savePartagesRecus,
  createPartageRecuShortcut,
} from './drive.js';
import { pickSharedFile } from './picker.js';
import { applyTheme, DEFAULT_THEME } from './theme.js';

applyTheme(DEFAULT_THEME);

const signInButton = document.getElementById('sign-in');
const signOutButton = document.getElementById('sign-out');
const authStatus = document.getElementById('auth-status');
const viewerSection = document.getElementById('viewer');
const viewerGrantAccess = document.getElementById('viewer-grant-access');
const viewerError = document.getElementById('viewer-error');
const viewerList = document.getElementById('viewer-list');

const fileId = new URLSearchParams(window.location.search).get('id');

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);

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

async function recordPartageRecu() {
  try {
    const recus = await loadPartagesRecus();
    if (recus.some((p) => p.fichierId === fileId)) return;
    const nom = await getSharedFileName(fileId);
    try {
      await createPartageRecuShortcut(fileId, nom);
    } catch (error) {
      console.warn('Échec de la création du raccourci Drive :', error);
    }
    await savePartagesRecus([
      ...recus,
      { id: crypto.randomUUID(), fichierId: fileId, nom, premierAccesLe: new Date().toISOString() },
    ]);
  } catch (error) {
    console.error('Échec de l\'enregistrement dans « Partages reçus » :', error);
    viewerError.textContent = `Partage affiché, mais pas ajouté à « Partages reçus » : ${error.message}`;
  }
}

async function loadAndRender() {
  viewerError.textContent = '';
  try {
    const entries = await loadSharedFile(fileId);
    viewerGrantAccess.hidden = true;
    renderViewerEntries(entries);
    await recordPartageRecu();
  } catch (error) {
    viewerList.innerHTML = '';
    viewerGrantAccess.hidden = false;
    viewerError.textContent = `Accès au fichier partagé impossible pour l'instant (${error.message}). Donne l'accès via le bouton ci-dessous.`;
  }
}

viewerGrantAccess.addEventListener('click', async () => {
  viewerError.textContent = '';
  try {
    await pickSharedFile(getAccessToken());
    await loadAndRender();
  } catch (error) {
    viewerError.textContent = error.message;
  }
});

onAuthChange(async (token) => {
  const connected = Boolean(token);
  signInButton.hidden = connected;
  signOutButton.hidden = !connected;
  viewerSection.hidden = !connected;
  authStatus.textContent = connected ? 'Connecté à Google Drive.' : 'Non connecté.';
  if (!fileId) {
    viewerError.textContent = 'Lien de partage invalide : identifiant manquant.';
    return;
  }
  if (connected) {
    await loadAndRender();
  } else {
    viewerList.innerHTML = '';
  }
});
