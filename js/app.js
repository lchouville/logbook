import { onAuthChange, signIn, signOut } from './auth.js';
import {
  loadEntries,
  saveEntries,
  loadSettings,
  saveSettings,
  loadPartages,
  savePartages,
  createSharedFile,
  updateSharedFile,
  renameSharedFile,
  getOwnerDisplayName,
  shareFileWithEmail,
  revokePermission,
  deleteSharedFile,
  loadPartagesRecus,
  savePartagesRecus,
} from './drive.js';
import {
  createEntry,
  peutRemplirRessentiAFroid,
  filtrerEntreesPartage,
  NIVEAUX_ACCES,
  STATUTS,
  THEMES,
  TYPES_JOURNEE,
} from './entries.js';
import { applyTheme, DEFAULT_THEME } from './theme.js';

const signInButton = document.getElementById('sign-in');
const signOutButton = document.getElementById('sign-out');
const authStatus = document.getElementById('auth-status');
const settingsSection = document.getElementById('settings');
const themeSelect = document.getElementById('theme-select');
const settingsError = document.getElementById('settings-error');
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
const partagesSection = document.getElementById('partages');
const partageForm = document.getElementById('partage-form');
const partageNom = document.getElementById('partage-nom');
const partageEmail = document.getElementById('partage-email');
const partageReglesFieldset = document.getElementById('partage-regles');
const partageSubmit = document.getElementById('partage-submit');
const partageCancel = document.getElementById('partage-cancel');
const partageList = document.getElementById('partage-list');
const partageError = document.getElementById('partage-error');
const partagesRecusSection = document.getElementById('partages-recus');
const partagesRecusList = document.getElementById('partages-recus-list');
const partagesRecusError = document.getElementById('partages-recus-error');

let entries = [];
let settings = {};
let partages = [];
let partagesRecus = [];
let editingPartageId = null;
let ownerName = null;

function buildSharedFileName(nom) {
  return `${(ownerName ?? 'Logbook').trim()} — ${nom.trim()}.json`;
}

themeSelect.addEventListener('change', async () => {
  settingsError.textContent = '';
  const previousTheme = settings.theme ?? DEFAULT_THEME;
  const theme = themeSelect.value;
  applyTheme(theme);
  settings = { ...settings, theme };
  try {
    await saveSettings(settings);
  } catch (error) {
    settings = { ...settings, theme: previousTheme };
    themeSelect.value = previousTheme;
    applyTheme(previousTheme);
    settingsError.textContent = `Échec de l'enregistrement : ${error.message}`;
  }
});

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

function buildPartageReglesTable() {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.appendChild(document.createElement('th'));
  for (const niveau of NIVEAUX_ACCES) {
    const th = document.createElement('th');
    th.textContent = niveau;
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const theme of THEMES) {
    const row = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = theme;
    row.appendChild(th);
    for (const niveau of NIVEAUX_ACCES) {
      const td = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.theme = theme;
      checkbox.dataset.niveau = niveau;
      td.appendChild(checkbox);
      row.appendChild(td);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  partageReglesFieldset.appendChild(table);
  return table;
}

const partageReglesTable = buildPartageReglesTable();

function readPartageRegles() {
  const regles = {};
  for (const checkbox of partageReglesTable.querySelectorAll('input[type="checkbox"]:checked')) {
    const { theme, niveau } = checkbox.dataset;
    regles[theme] = regles[theme] ? [...regles[theme], niveau] : [niveau];
  }
  return regles;
}

function resetPartageRegles() {
  for (const checkbox of partageReglesTable.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = false;
  }
}

function applyPartageRegles(regles) {
  for (const checkbox of partageReglesTable.querySelectorAll('input[type="checkbox"]')) {
    const { theme, niveau } = checkbox.dataset;
    checkbox.checked = Boolean(regles[theme]?.includes(niveau));
  }
}

function startEditPartage(partage) {
  editingPartageId = partage.id;
  partageNom.value = partage.nom;
  partageEmail.value = partage.emails[0] ?? '';
  applyPartageRegles(partage.regles);
  partageSubmit.textContent = 'Enregistrer les modifications';
  partageCancel.hidden = false;
  partageError.textContent = '';
}

function stopEditPartage() {
  editingPartageId = null;
  partageForm.reset();
  resetPartageRegles();
  partageSubmit.textContent = 'Créer le partage';
  partageCancel.hidden = true;
}

function buildPartageLink(fichierId) {
  return new URL(`partage.html?id=${fichierId}`, window.location.href).toString();
}

function renderEntries() {
  entryList.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const li = document.createElement('li');

    const summary = document.createElement('p');
    summary.textContent = `${entry.date} — ${entry.themes.join(', ')} (${entry.niveauAcces}, ${entry.statut})`;
    li.appendChild(summary);

    if (entry.ressentiAFroid != null) {
      const froid = document.createElement('p');
      froid.textContent = `Ressenti à froid : ${entry.ressentiAFroid}/10`;
      li.appendChild(froid);
    } else if (peutRemplirRessentiAFroid(entry)) {
      li.appendChild(buildRessentiAFroidForm(entry));
    }

    entryList.appendChild(li);
  }
}

async function syncPartages() {
  for (const partage of partages) {
    try {
      await updateSharedFile(partage.fichierId, filtrerEntreesPartage(entries, partage.regles));
    } catch (error) {
      partageError.textContent = `Échec de la synchronisation d'un partage : ${error.message}`;
    }
  }
}

async function deletePartage(partage) {
  partageError.textContent = '';
  if (editingPartageId === partage.id) stopEditPartage();
  const previousPartages = partages;
  partages = partages.filter((p) => p.id !== partage.id);
  renderPartages();
  try {
    await deleteSharedFile(partage.fichierId);
    await savePartages(partages);
  } catch (error) {
    partages = previousPartages;
    partageError.textContent = `Échec de la suppression : ${error.message}`;
    renderPartages();
  }
}

function renderPartages() {
  partageList.innerHTML = '';
  for (const partage of partages) {
    const li = document.createElement('li');

    const titre = document.createElement('p');
    titre.textContent = partage.nom;
    li.appendChild(titre);

    const regles = document.createElement('p');
    regles.textContent = Object.entries(partage.regles)
      .map(([theme, niveaux]) => `${theme} (${niveaux.join(', ')})`)
      .join(' · ');
    li.appendChild(regles);

    const email = document.createElement('p');
    email.textContent = partage.emails.join(', ');
    li.appendChild(email);

    const linkRow = document.createElement('div');
    linkRow.className = 'partage-link';
    const linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.readOnly = true;
    linkInput.value = buildPartageLink(partage.fichierId);
    const copyButton = document.createElement('button');
    copyButton.type = 'button';
    copyButton.textContent = 'Copier le lien';
    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(linkInput.value);
      copyButton.textContent = 'Copié !';
      setTimeout(() => {
        copyButton.textContent = 'Copier le lien';
      }, 1500);
    });
    linkRow.append(linkInput, copyButton);
    li.appendChild(linkRow);

    const actions = document.createElement('div');
    actions.className = 'partage-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Modifier';
    editButton.addEventListener('click', () => startEditPartage(partage));
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => deletePartage(partage));
    actions.appendChild(deleteButton);

    li.appendChild(actions);

    partageList.appendChild(li);
  }
}

async function retirerPartageRecu(partageRecu) {
  partagesRecusError.textContent = '';
  const previous = partagesRecus;
  partagesRecus = partagesRecus.filter((p) => p.id !== partageRecu.id);
  renderPartagesRecus();
  try {
    await savePartagesRecus(partagesRecus);
  } catch (error) {
    partagesRecus = previous;
    partagesRecusError.textContent = `Échec du retrait : ${error.message}`;
    renderPartagesRecus();
  }
}

function renderPartagesRecus() {
  partagesRecusList.innerHTML = '';
  for (const partageRecu of partagesRecus) {
    const li = document.createElement('li');

    const titre = document.createElement('p');
    titre.textContent = partageRecu.nom;
    li.appendChild(titre);

    const actions = document.createElement('div');
    actions.className = 'partage-actions';

    const voirLink = document.createElement('a');
    voirLink.href = buildPartageLink(partageRecu.fichierId);
    voirLink.textContent = 'Voir';
    actions.appendChild(voirLink);

    const retirerButton = document.createElement('button');
    retirerButton.type = 'button';
    retirerButton.textContent = 'Retirer';
    retirerButton.addEventListener('click', () => retirerPartageRecu(partageRecu));
    actions.appendChild(retirerButton);

    li.appendChild(actions);
    partagesRecusList.appendChild(li);
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
    await syncPartages();
    renderEntries();
    entryForm.reset();
  } catch (error) {
    entries = previousEntries;
    entryError.textContent = `Échec de l'enregistrement : ${error.message}`;
  }
});

partageCancel.addEventListener('click', stopEditPartage);

partageForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  partageError.textContent = '';
  const regles = readPartageRegles();
  if (Object.keys(regles).length === 0) {
    partageError.textContent = 'Coche au moins un niveau pour un thème.';
    return;
  }
  const nom = partageNom.value.trim();
  const email = partageEmail.value.trim();

  if (editingPartageId) {
    const partage = partages.find((p) => p.id === editingPartageId);
    try {
      const filtered = filtrerEntreesPartage(entries, regles);
      await updateSharedFile(partage.fichierId, filtered);
      let fileName = partage.fileName;
      if (nom !== partage.nom) {
        fileName = buildSharedFileName(nom);
        await renameSharedFile(partage.fichierId, fileName);
      }
      let permissionId = partage.permissionId;
      if (email !== partage.emails[0]) {
        if (permissionId) await revokePermission(partage.fichierId, permissionId);
        permissionId = await shareFileWithEmail(partage.fichierId, email);
      }
      partages = partages.map((p) =>
        p.id === editingPartageId ? { ...p, nom, regles, emails: [email], fileName, permissionId } : p,
      );
      await savePartages(partages);
      renderPartages();
      stopEditPartage();
    } catch (error) {
      partageError.textContent = `Échec de la modification du partage : ${error.message}`;
    }
    return;
  }

  try {
    const fileName = buildSharedFileName(nom);
    const filtered = filtrerEntreesPartage(entries, regles);
    const fichierId = await createSharedFile(fileName, filtered);
    const permissionId = await shareFileWithEmail(fichierId, email);
    partages = [
      ...partages,
      {
        id: crypto.randomUUID(),
        nom,
        regles,
        emails: [email],
        fileName,
        fichierId,
        permissionId,
        creeLe: new Date().toISOString(),
      },
    ];
    await savePartages(partages);
    renderPartages();
    partageForm.reset();
    resetPartageRegles();
  } catch (error) {
    partageError.textContent = `Échec de la création du partage : ${error.message}`;
  }
});

function renderLoading(list) {
  list.innerHTML = '';
  const li = document.createElement('li');
  li.textContent = 'Chargement…';
  list.appendChild(li);
}

onAuthChange(async (token) => {
  const connected = Boolean(token);
  signInButton.hidden = connected;
  signOutButton.hidden = !connected;
  settingsSection.hidden = !connected;
  entriesSection.hidden = !connected;
  partagesSection.hidden = !connected;
  partagesRecusSection.hidden = !connected;
  authStatus.textContent = connected ? 'Connecté à Google Drive.' : 'Non connecté.';
  entryError.textContent = '';
  settingsError.textContent = '';
  partageError.textContent = '';
  partagesRecusError.textContent = '';
  if (connected) {
    renderLoading(entryList);
    renderLoading(partageList);
    renderLoading(partagesRecusList);

    try {
      settings = await loadSettings();
    } catch (error) {
      settings = {};
      settingsError.textContent = `Échec du chargement des préférences : ${error.message}`;
    }
    themeSelect.value = settings.theme ?? DEFAULT_THEME;
    applyTheme(settings.theme ?? DEFAULT_THEME);

    try {
      entries = await loadEntries();
    } catch (error) {
      entries = [];
      entryError.textContent = `Échec du chargement des entrées : ${error.message}`;
    }
    renderEntries();

    try {
      partages = await loadPartages();
    } catch (error) {
      partages = [];
      partageError.textContent = `Échec du chargement des partages : ${error.message}`;
    }
    try {
      ownerName = await getOwnerDisplayName();
    } catch {
      ownerName = null;
    }
    renderPartages();

    try {
      partagesRecus = await loadPartagesRecus();
    } catch (error) {
      partagesRecus = [];
      partagesRecusError.textContent = `Échec du chargement des partages reçus : ${error.message}`;
    }
    renderPartagesRecus();
  } else {
    entries = [];
    settings = {};
    partages = [];
    partagesRecus = [];
    ownerName = null;
    themeSelect.value = DEFAULT_THEME;
    applyTheme(DEFAULT_THEME);
    renderEntries();
    renderPartages();
    renderPartagesRecus();
  }
});
