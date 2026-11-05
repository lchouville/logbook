import { onAuthChange, signIn, signOut } from './auth.js';
import { loadEntries, saveEntries } from './drive.js';
import { createEntry, peutRemplirRessentiAFroid, NIVEAUX_ACCES, STATUTS, THEMES, TYPES_JOURNEE } from './entries.js';

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

function buildRessentiAFroidForm(entry) {
  const form = document.createElement('form');
  form.className = 'ressenti-froid-form';

  const inputId = `ressenti-froid-${entry.id}`;
  const label = document.createElement('label');
  label.setAttribute('for', inputId);
  label.textContent = 'Ressenti à froid (0-10)';

  const input = document.createElement('input');
  input.type = 'number';
  input.id = inputId;
  input.min = '0';
  input.max = '10';
  input.step = '0.5';
  input.required = true;

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Enregistrer';

  const error = document.createElement('p');
  error.className = 'entry-error';
  error.setAttribute('role', 'alert');

  form.append(label, input, button, error);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const valeur = input.valueAsNumber;
    const previousEntries = entries;
    entries = entries.map((e) => (e.id === entry.id ? { ...e, ressentiAFroid: valeur } : e));
    try {
      await saveEntries(entries);
      renderEntries();
    } catch (err) {
      entries = previousEntries;
      error.textContent = `Échec de l'enregistrement : ${err.message}`;
    }
  });

  return form;
}

function renderEntries() {
  entryList.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const li = document.createElement('li');
    li.className = 'entry';

    const summary = document.createElement('p');
    summary.textContent = `${entry.date} — ${entry.themes.join(', ')} (${entry.niveauAcces}, ${entry.statut})`;
    li.appendChild(summary);

    if (entry.ressentiAFroid != null) {
      const froid = document.createElement('p');
      froid.className = 'entry-ressenti-froid';
      froid.textContent = `Ressenti à froid : ${entry.ressentiAFroid}/10`;
      li.appendChild(froid);
    } else if (peutRemplirRessentiAFroid(entry)) {
      li.appendChild(buildRessentiAFroidForm(entry));
    }

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
