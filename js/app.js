import { onAuthChange, signIn, signOut } from './auth.js';
import {
  loadEntries,
  saveEntries,
  loadSettings,
  saveSettings,
  loadPartages,
  savePartages,
  loadModeles,
  saveModeles,
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
  updateEntry,
  peutRemplirRessentiAFroid,
  filtrerEntreesPartage,
  NIVEAUX_ACCES,
  STATUTS,
  THEMES,
  TYPES_JOURNEE,
  FIXED_BLOCK_KEYS,
} from './entries.js';
import { applyTheme, DEFAULT_THEME } from './theme.js';
import { initSidebar, renderSidebar, closeSidebarOnMobile } from './sidebar.js';
import { openModal, closeModal } from './modal.js';
import { renderJournalPartage } from './viewer.js';
import { createFieldsEditor } from './schema.js';

const authSection = document.getElementById('auth');
const signInButton = document.getElementById('sign-in');
const authStatus = document.getElementById('auth-status');
const appShell = document.getElementById('app-shell');
const signOutButton = document.getElementById('sign-out');

const themeSelect = document.getElementById('theme-select');
const settingsError = document.getElementById('settings-error');
const entriesSection = document.getElementById('entries');
const journalPartageSection = document.getElementById('journal-partage');
const entryNewButton = document.getElementById('entry-new-button');
const entryNewMenu = document.getElementById('entry-new-menu');
const entryForm = document.getElementById('entry-form');
const entryFormTitle = document.getElementById('entry-form-title');
const entrySubmitButton = document.getElementById('entry-submit');
const entryTitre = document.getElementById('entry-titre');
const entryThemes = document.getElementById('entry-themes');
const entryNiveau = document.getElementById('entry-niveau');
const entryStatut = document.getElementById('entry-statut');
const entryTypeJournee = document.getElementById('entry-type-journee');
const entryEnergie = document.getElementById('entry-energie');
const entryRessenti = document.getElementById('entry-ressenti');
const entryTexte = document.getElementById('entry-texte');
const entryDateDisplay = document.getElementById('entry-date-display');
const entryRessentiFroidSlot = document.getElementById('entry-ressenti-froid-slot');
const entryBlocksList = document.getElementById('entry-blocks-list');
const entryAddFieldButton = document.getElementById('entry-add-field-button');
const entryTableBody = document.getElementById('entry-table-body');
const entryError = document.getElementById('entry-error');
const partageForm = document.getElementById('partage-form');
const partageNom = document.getElementById('partage-nom');
const partageEmail = document.getElementById('partage-email');
const partageReglesFieldset = document.getElementById('partage-regles');
const partageSubmit = document.getElementById('partage-submit');
const partageCancel = document.getElementById('partage-cancel');
const partageList = document.getElementById('partage-list');
const partageError = document.getElementById('partage-error');
const partagesRecusList = document.getElementById('partages-recus-list');
const partagesRecusError = document.getElementById('partages-recus-error');
const modeleForm = document.getElementById('modele-form');
const modeleNom = document.getElementById('modele-nom');
const modeleThemes = document.getElementById('modele-themes');
const modeleNiveau = document.getElementById('modele-niveau');
const modeleStatut = document.getElementById('modele-statut');
const modeleTypeJournee = document.getElementById('modele-type-journee');
const modeleEnergie = document.getElementById('modele-energie');
const modeleRessenti = document.getElementById('modele-ressenti');
const modeleTexte = document.getElementById('modele-texte');
const modeleBlocksList = document.getElementById('modele-blocks-list');
const modeleAddFieldButton = document.getElementById('modele-add-field-button');
const modeleSubmit = document.getElementById('modele-submit');
const modeleCancel = document.getElementById('modele-cancel');
const modeleList = document.getElementById('modele-list');
const modeleError = document.getElementById('modele-error');

let entries = [];
let settings = {};
let partages = [];
let partagesRecus = [];
let modeles = [];
let editingPartageId = null;
let editingEntryId = null;
let editingModeleId = null;
let ownerName = null;
let currentJournalId = null;

function buildSharedFileName(nom) {
  return `${(ownerName ?? 'Logbook').trim()} — ${nom.trim()}.json`;
}

function buildPartageLink(fichierId) {
  return new URL(`index.html?journal=${fichierId}`, window.location.href).toString();
}

function getJournalIdFromUrl() {
  return new URLSearchParams(window.location.search).get('journal');
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
populateSelect(modeleThemes, THEMES);
populateSelect(modeleNiveau, NIVEAUX_ACCES);
populateSelect(modeleStatut, STATUTS);
populateSelect(modeleTypeJournee, TYPES_JOURNEE);

function blankChampsSchema() {
  return { fields: [], order: [...FIXED_BLOCK_KEYS] };
}

const entryFixedBlockElements = Object.fromEntries(
  FIXED_BLOCK_KEYS.map((key) => [key, entryBlocksList.querySelector(`li[data-order-key="${key}"]`)]),
);
const entryFieldsEditor = createFieldsEditor({
  listEl: entryBlocksList,
  addButtonEl: entryAddFieldButton,
  idPrefix: 'custom-field',
  fixedBlockElements: entryFixedBlockElements,
});
const modeleFieldsEditor = createFieldsEditor({
  listEl: modeleBlocksList,
  addButtonEl: modeleAddFieldButton,
  idPrefix: 'modele-field',
});

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
      renderRessentiAFroidSlot(entries.find((e) => e.id === entry.id));
    } catch (err) {
      entries = previousEntries;
      error.textContent = `Échec de l'enregistrement : ${err.message}`;
    }
  });

  return form;
}

function renderRessentiAFroidSlot(entry) {
  entryRessentiFroidSlot.innerHTML = '';
  const label = document.createElement('span');
  label.className = 'entry-property-label';
  label.textContent = 'Ressenti à froid';
  entryRessentiFroidSlot.appendChild(label);

  if (entry.ressentiAFroid != null) {
    const value = document.createElement('span');
    value.className = 'entry-property-value';
    value.textContent = `${entry.ressentiAFroid}/10`;
    entryRessentiFroidSlot.appendChild(value);
  } else if (peutRemplirRessentiAFroid(entry)) {
    entryRessentiFroidSlot.appendChild(buildRessentiAFroidForm(entry));
  } else {
    const value = document.createElement('span');
    value.className = 'entry-property-value';
    value.textContent = '—';
    entryRessentiFroidSlot.appendChild(value);
  }
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

function appendCell(row, text) {
  const td = document.createElement('td');
  td.textContent = text;
  row.appendChild(td);
  return td;
}

function renderEntries() {
  entryTableBody.innerHTML = '';
  for (const entry of [...entries].reverse()) {
    const row = document.createElement('tr');
    row.dataset.entryId = entry.id;

    appendCell(row, entry.date);
    appendCell(row, entry.titre ?? '');
    appendCell(row, entry.themes.join(', '));
    appendCell(row, entry.niveauAcces);
    appendCell(row, entry.statut);
    appendCell(row, entry.texte ?? '');

    entryTableBody.appendChild(row);
  }
}

function stopEditEntry() {
  editingEntryId = null;
  entryForm.reset();
  entryRessentiFroidSlot.hidden = true;
  entryRessentiFroidSlot.innerHTML = '';
  entryDateDisplay.textContent = new Date().toISOString().slice(0, 10);
  entryFormTitle.textContent = 'Nouvelle entrée';
  entrySubmitButton.textContent = 'Enregistrer';
  entryError.textContent = '';
}

function applyFixedFieldsToForm(fields, els) {
  for (const option of els.themes.options) option.selected = (fields.themes ?? []).includes(option.value);
  els.niveau.value = fields.niveauAcces ?? '';
  els.statut.value = fields.statut ?? '';
  els.typeJournee.value = fields.typeJournee ?? '';
  els.energie.value = fields.energie ?? fields.mesuresSoir?.energie ?? '';
  els.ressenti.value = fields.ressenti ?? fields.mesuresSoir?.ressenti ?? '';
  els.texte.value = fields.texte ?? '';
}

const entryFixedFieldEls = {
  themes: entryThemes,
  niveau: entryNiveau,
  statut: entryStatut,
  typeJournee: entryTypeJournee,
  energie: entryEnergie,
  ressenti: entryRessenti,
  texte: entryTexte,
};

function startEditEntry(entry) {
  editingEntryId = entry.id;
  entryTitre.value = entry.titre ?? '';
  applyFixedFieldsToForm(entry, entryFixedFieldEls);
  entryDateDisplay.textContent = entry.date;
  entryRessentiFroidSlot.hidden = false;
  renderRessentiAFroidSlot(entry);
  entryFieldsEditor.render(entry.champsSchema ?? blankChampsSchema(), entry.champsPersonnalises ?? {});
  entryFormTitle.textContent = 'Modifier l’entrée';
  entrySubmitButton.textContent = 'Enregistrer les modifications';
  entryError.textContent = '';
  openModal('entry-form-modal');
}

function openBlankEntryForm() {
  stopEditEntry();
  entryFieldsEditor.render(blankChampsSchema(), {});
  openModal('entry-form-modal');
}

function applyModeleToForm(modele) {
  stopEditEntry();
  applyFixedFieldsToForm(modele, entryFixedFieldEls);
  const modeleSchema = modele.champsSchema ?? { fields: [], order: [] };
  entryFieldsEditor.render(
    {
      fields: modeleSchema.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : f.options })),
      order: [...FIXED_BLOCK_KEYS, ...modeleSchema.order],
    },
    { ...(modele.champsPersonnalises ?? {}) },
  );
  openModal('entry-form-modal');
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
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
  try {
    await savePartagesRecus(partagesRecus);
  } catch (error) {
    partagesRecus = previous;
    partagesRecusError.textContent = `Échec du retrait : ${error.message}`;
    renderPartagesRecus();
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
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

    const voirButton = document.createElement('button');
    voirButton.type = 'button';
    voirButton.textContent = 'Voir';
    voirButton.addEventListener('click', () => setJournalId(partageRecu.fichierId));
    actions.appendChild(voirButton);

    const retirerButton = document.createElement('button');
    retirerButton.type = 'button';
    retirerButton.textContent = 'Retirer';
    retirerButton.addEventListener('click', () => retirerPartageRecu(partageRecu));
    actions.appendChild(retirerButton);

    li.appendChild(actions);
    partagesRecusList.appendChild(li);
  }
}

function readModeleFixedFields() {
  return {
    themes: Array.from(modeleThemes.selectedOptions).map((option) => option.value),
    niveauAcces: modeleNiveau.value,
    statut: modeleStatut.value,
    typeJournee: modeleTypeJournee.value,
    energie: modeleEnergie.valueAsNumber,
    ressenti: modeleRessenti.valueAsNumber,
    texte: modeleTexte.value,
  };
}

const modeleFixedFieldEls = {
  themes: modeleThemes,
  niveau: modeleNiveau,
  statut: modeleStatut,
  typeJournee: modeleTypeJournee,
  energie: modeleEnergie,
  ressenti: modeleRessenti,
  texte: modeleTexte,
};

function startEditModele(modele) {
  editingModeleId = modele.id;
  modeleNom.value = modele.nom;
  applyFixedFieldsToForm(modele, modeleFixedFieldEls);
  modeleFieldsEditor.render(modele.champsSchema ?? { fields: [], order: [] }, modele.champsPersonnalises ?? {});
  modeleSubmit.textContent = 'Enregistrer les modifications';
  modeleCancel.hidden = false;
  modeleError.textContent = '';
}

function stopEditModele() {
  editingModeleId = null;
  modeleForm.reset();
  modeleFieldsEditor.render({ fields: [], order: [] }, {});
  modeleSubmit.textContent = 'Créer le modèle';
  modeleCancel.hidden = true;
}

function renderModeles() {
  modeleList.innerHTML = '';
  for (const modele of modeles) {
    const li = document.createElement('li');

    const nom = document.createElement('p');
    nom.textContent = modele.nom;
    li.appendChild(nom);

    const actions = document.createElement('div');
    actions.className = 'partage-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Modifier';
    editButton.addEventListener('click', () => startEditModele(modele));
    actions.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => deleteModele(modele));
    actions.appendChild(deleteButton);

    li.appendChild(actions);
    modeleList.appendChild(li);
  }
}

async function deleteModele(modele) {
  modeleError.textContent = '';
  if (editingModeleId === modele.id) stopEditModele();
  const previousModeles = modeles;
  modeles = modeles.filter((m) => m.id !== modele.id);
  renderModeles();
  renderEntryNewMenu();
  try {
    await saveModeles(modeles);
  } catch (error) {
    modeles = previousModeles;
    modeleError.textContent = `Échec de la suppression : ${error.message}`;
    renderModeles();
    renderEntryNewMenu();
  }
}

modeleCancel.addEventListener('click', stopEditModele);

modeleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  modeleError.textContent = '';
  const nom = modeleNom.value.trim();
  const fixed = readModeleFixedFields();
  const champsPersonnalises = modeleFieldsEditor.getValues();
  const champsSchema = modeleFieldsEditor.getSchema();
  const previousModeles = modeles;

  if (editingModeleId) {
    modeles = modeles.map((m) => (m.id === editingModeleId ? { ...m, nom, ...fixed, champsPersonnalises, champsSchema } : m));
  } else {
    modeles = [
      ...modeles,
      { id: crypto.randomUUID(), nom, ...fixed, champsPersonnalises, champsSchema, creeLe: new Date().toISOString() },
    ];
  }
  renderModeles();
  renderEntryNewMenu();
  try {
    await saveModeles(modeles);
    stopEditModele();
  } catch (error) {
    modeles = previousModeles;
    renderModeles();
    renderEntryNewMenu();
    modeleError.textContent = `Échec de l'enregistrement du modèle : ${error.message}`;
  }
});

function renderMainView() {
  if (currentJournalId) {
    entriesSection.hidden = true;
    journalPartageSection.hidden = false;
    renderJournalPartage(currentJournalId, (updated) => {
      partagesRecus = updated;
      renderPartagesRecus();
      renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
    });
  } else {
    entriesSection.hidden = false;
    journalPartageSection.hidden = true;
  }
}

function setJournalId(fichierId) {
  currentJournalId = fichierId;
  const url = new URL(window.location.href);
  if (fichierId) {
    url.searchParams.set('journal', fichierId);
  } else {
    url.searchParams.delete('journal');
  }
  window.history.pushState({ journal: fichierId }, '', url);
  renderMainView();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
  closeModal();
  closeSidebarOnMobile();
}

window.addEventListener('popstate', () => {
  currentJournalId = getJournalIdFromUrl();
  renderMainView();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
});

initSidebar({
  onSelectJournal: setJournalId,
  onOpenSettings: () => openModal('settings'),
  onOpenPartages: () => openModal('partages'),
  onOpenAcces: () => openModal('partages-recus'),
  onOpenModeles: () => openModal('modeles'),
});

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);

function closeEntryNewMenu() {
  entryNewMenu.hidden = true;
  entryNewButton.setAttribute('aria-expanded', 'false');
}

function toggleEntryNewMenu() {
  const willOpen = entryNewMenu.hidden;
  entryNewMenu.hidden = !willOpen;
  entryNewButton.setAttribute('aria-expanded', String(willOpen));
}

function renderEntryNewMenu() {
  for (const button of entryNewMenu.querySelectorAll('button[data-modele-id]:not([data-modele-id=""])')) {
    button.remove();
  }
  for (const modele of modeles) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = modele.nom;
    button.dataset.modeleId = modele.id;
    entryNewMenu.appendChild(button);
  }
}

entryNewButton.addEventListener('click', (event) => {
  event.stopPropagation();
  if (modeles.length === 0) {
    openBlankEntryForm();
    return;
  }
  toggleEntryNewMenu();
});

entryNewMenu.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  closeEntryNewMenu();
  const modele = modeles.find((m) => m.id === button.dataset.modeleId);
  if (modele) {
    applyModeleToForm(modele);
  } else {
    openBlankEntryForm();
  }
});

document.addEventListener('click', (event) => {
  if (!entryNewMenu.hidden && !event.target.closest('#entry-new-wrapper')) closeEntryNewMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !entryNewMenu.hidden) closeEntryNewMenu();
});

entryTableBody.addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  const entry = row && entries.find((e) => e.id === row.dataset.entryId);
  if (entry) startEditEntry(entry);
});

entryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  entryError.textContent = '';
  const themes = Array.from(entryThemes.selectedOptions).map((option) => option.value);
  const champsPersonnalises = entryFieldsEditor.getValues();
  const champsSchema = entryFieldsEditor.getSchema();
  const previousEntries = entries;

  if (editingEntryId) {
    const original = entries.find((e) => e.id === editingEntryId);
    const updated = updateEntry(original, {
      titre: entryTitre.value.trim(),
      themes,
      niveauAcces: entryNiveau.value,
      statut: entryStatut.value,
      typeJournee: entryTypeJournee.value,
      energie: entryEnergie.valueAsNumber,
      ressenti: entryRessenti.valueAsNumber,
      texte: entryTexte.value,
      champsPersonnalises,
      champsSchema,
    });
    entries = entries.map((e) => (e.id === editingEntryId ? updated : e));
  } else {
    const entry = createEntry({
      titre: entryTitre.value.trim(),
      date: new Date().toISOString().slice(0, 10),
      themes,
      niveauAcces: entryNiveau.value,
      statut: entryStatut.value,
      typeJournee: entryTypeJournee.value,
      energie: entryEnergie.valueAsNumber,
      ressenti: entryRessenti.valueAsNumber,
      texte: entryTexte.value,
      champsPersonnalises,
      champsSchema,
    });
    entries = [...entries, entry];
  }

  try {
    await saveEntries(entries);
    await syncPartages();
    renderEntries();
    stopEditEntry();
    closeModal();
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

function renderTableLoading(tbody, colspan) {
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  const td = document.createElement('td');
  td.colSpan = colspan;
  td.textContent = 'Chargement…';
  row.appendChild(td);
  tbody.appendChild(row);
}

onAuthChange(async (token) => {
  const connected = Boolean(token);
  authSection.hidden = connected;
  appShell.hidden = !connected;
  authStatus.textContent = connected ? 'Connecté à Google Drive.' : 'Non connecté.';
  entryError.textContent = '';
  settingsError.textContent = '';
  partageError.textContent = '';
  partagesRecusError.textContent = '';
  modeleError.textContent = '';

  if (connected) {
    currentJournalId = getJournalIdFromUrl();
    renderTableLoading(entryTableBody, 6);
    renderLoading(partageList);
    renderLoading(partagesRecusList);
    renderLoading(modeleList);

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

    try {
      modeles = await loadModeles();
    } catch (error) {
      modeles = [];
      modeleError.textContent = `Échec du chargement des modèles : ${error.message}`;
    }
    renderModeles();
    renderEntryNewMenu();

    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
    renderMainView();
  } else {
    entries = [];
    settings = {};
    partages = [];
    partagesRecus = [];
    modeles = [];
    ownerName = null;
    currentJournalId = null;
    themeSelect.value = DEFAULT_THEME;
    applyTheme(DEFAULT_THEME);
    renderEntries();
    renderPartages();
    renderPartagesRecus();
    renderModeles();
    renderEntryNewMenu();
    closeModal();
  }
});
