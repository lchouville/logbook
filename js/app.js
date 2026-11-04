import { onAuthChange, signIn, signOut } from './auth.js';
import { loadEntries, saveEntries } from './drive.js';
import { createEntry, NIVEAUX_ACCES, STATUTS, THEMES, TYPES_JOURNEE } from './entries.js';

const signInButton = document.getElementById('sign-in');
const signOutButton = document.getElementById('sign-out');
const authStatus = document.getElementById('auth-status');
const entriesSection = document.getElementById('entries');
const entryForm = document.getElementById('entry-form');
const entryThemes = document.getElementById('entry-themes');
const entryNiveau = document.getElementById('entry-niveau');
const entryStatut = document.getElementById('entry-statut');
const entryTypeJournee = document.getElementById('entry-type-journee');
const entryEnergie = document.getElementById('entry-energie');
const entryRessenti = document.getElementById('entry-ressenti');
const entryTexte = document.getElementById('entry-texte');
const entryList = document.getElementById('entry-list');
const entryError = document.getElementById('entry-error');

let entries = [];

function populateSelect(select, options) {
  for (const option of options) {
    const el = document.createElement('option');
    el.value = option;
    el.textContent = option;
    select.appendChild(el);
  }
}

populateSelect(entryThemes, THEMES);
populateSelect(entryNiveau, NIVEAUX_ACCES);
populateSelect(entryStatut, STATUTS);
populateSelect(entryTypeJournee, TYPES_JOURNEE);

function renderEntries() {
  entryList.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const li = document.createElement('li');
    li.textContent = `${entry.date} — ${entry.themes.join(', ')} (${entry.niveauAcces}, ${entry.statut})`;
    entryList.appendChild(li);
  }
}

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);

entryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  entryError.textContent = '';
  const themes = Array.from(entryThemes.selectedOptions).map((option) => option.value);
  const entry = createEntry({
    date: new Date().toISOString().slice(0, 10),
    themes,
    niveauAcces: entryNiveau.value,
    statut: entryStatut.value,
    typeJournee: entryTypeJournee.value,
    energie: entryEnergie.valueAsNumber,
    ressenti: entryRessenti.valueAsNumber,
    texte: entryTexte.value,
  });
  const previousEntries = entries;
  entries = [...entries, entry];
  try {
    await saveEntries(entries);
    renderEntries();
    entryForm.reset();
  } catch (error) {
    entries = previousEntries;
    entryError.textContent = `Échec de l'enregistrement : ${error.message}`;
  }
});

onAuthChange(async (token) => {
  const connected = Boolean(token);
  signInButton.hidden = connected;
  signOutButton.hidden = !connected;
  entriesSection.hidden = !connected;
  authStatus.textContent = connected ? 'Connecté à Google Drive.' : 'Non connecté.';
  entryError.textContent = '';
  if (connected) {
    try {
      entries = await loadEntries();
    } catch (error) {
      entries = [];
      entryError.textContent = `Échec du chargement des entrées : ${error.message}`;
    }
  } else {
    entries = [];
  }
  renderEntries();
});
