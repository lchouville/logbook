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
  blankContenuSchema,
  migrateEntryContenu,
  migrateModeleContenu,
  previewContenuTexte,
  resolveTitreModele,
  buildBilanRituelDuSoir,
  NIVEAUX_ACCES,
  STATUTS,
  THEMES,
  FIXED_BLOCK_KEYS,
} from './entries.js';
import { applyTheme, DEFAULT_THEME } from './theme.js';
import { initSidebar, renderSidebar, closeSidebarOnMobile } from './sidebar.js';
import { openModal, closeModal } from './modal.js';
import { renderJournalPartage } from './viewer.js';
import { createFieldsEditor } from './schema.js';
import { createContentEditor } from './contenu.js';

const authSection = document.getElementById('auth');
const signInButton = document.getElementById('sign-in');
const authStatus = document.getElementById('auth-status');
const appShell = document.getElementById('app-shell');
const signOutButton = document.getElementById('sign-out');

const themeSelect = document.getElementById('theme-select');
const settingsError = document.getElementById('settings-error');
const entriesSection = document.getElementById('entries');
const journalPartageSection = document.getElementById('journal-partage');
const modelesSection = document.getElementById('modeles');
const modeleNewButton = document.getElementById('modele-new-button');
const modeleFormTitle = document.getElementById('modele-form-title');
const modeleFormError = document.getElementById('modele-form-error');
const entryNewButton = document.getElementById('entry-new-button');
const entryNewMenu = document.getElementById('entry-new-menu');
const entryForm = document.getElementById('entry-form');
const entryFormTitle = document.getElementById('entry-form-title');
const entrySubmitButton = document.getElementById('entry-submit');
const entryDeleteButton = document.getElementById('entry-delete');
const entryTitre = document.getElementById('entry-titre');
const entryThemes = document.getElementById('entry-themes');
const entryNiveau = document.getElementById('entry-niveau');
const entryStatut = document.getElementById('entry-statut');
const entryContenuList = document.getElementById('entry-contenu-list');
const entryContenuAddTexte = document.getElementById('entry-contenu-add-texte');
const entryContenuAddTableau = document.getElementById('entry-contenu-add-tableau');
const entryDate = document.getElementById('entry-date');
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
const modeleTitrePattern = document.getElementById('modele-titre-pattern');
const modeleThemes = document.getElementById('modele-themes');
const modeleNiveau = document.getElementById('modele-niveau');
const modeleStatut = document.getElementById('modele-statut');
const modeleContenuList = document.getElementById('modele-contenu-list');
const modeleContenuAddTexte = document.getElementById('modele-contenu-add-texte');
const modeleContenuAddTableau = document.getElementById('modele-contenu-add-tableau');
const modeleBlocksList = document.getElementById('modele-blocks-list');
const modeleAddFieldButton = document.getElementById('modele-add-field-button');
const modeleSubmit = document.getElementById('modele-submit');
const modeleCancel = document.getElementById('modele-cancel');
const modeleList = document.getElementById('modele-list');
const modeleListDefaut = document.getElementById('modele-list-defaut');
const modeleError = document.getElementById('modele-error');

let entries = [];
let settings = {};
let partages = [];
let partagesRecus = [];
let modeles = [];
let editingPartageId = null;
let editingEntryId = null;
let editingEntryModeleId = null;
let activeTitrePattern = null;
let activeTitreRang = null;
let activeCalculAuto = null;
let editingModeleId = null;
let ownerName = null;
let currentJournalId = null;
let modelesViewActive = false;

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
populateSelect(modeleThemes, THEMES);
populateSelect(modeleNiveau, NIVEAUX_ACCES);
populateSelect(modeleStatut, STATUTS);

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
const entryContentEditor = createContentEditor({
  listEl: entryContenuList,
  addTexteButtonEl: entryContenuAddTexte,
  addTableauButtonEl: entryContenuAddTableau,
  idPrefix: 'entry-contenu',
});
const modeleContentEditor = createContentEditor({
  listEl: modeleContenuList,
  addTexteButtonEl: modeleContenuAddTexte,
  addTableauButtonEl: modeleContenuAddTableau,
  idPrefix: 'modele-contenu',
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
    appendCell(row, previewContenuTexte(entry));

    entryTableBody.appendChild(row);
  }
}

function stopEditEntry() {
  editingEntryId = null;
  editingEntryModeleId = null;
  activeTitrePattern = null;
  activeCalculAuto = null;
  entryForm.reset();
  entryRessentiFroidSlot.hidden = true;
  entryRessentiFroidSlot.innerHTML = '';
  entryDate.value = new Date().toISOString().slice(0, 10);
  entryFormTitle.textContent = 'Nouvelle entrée';
  entrySubmitButton.textContent = 'Enregistrer';
  entryDeleteButton.hidden = true;
  entryError.textContent = '';
}

function applyFixedFieldsToForm(fields, els) {
  for (const option of els.themes.options) option.selected = (fields.themes ?? []).includes(option.value);
  els.niveau.value = fields.niveauAcces ?? '';
  els.statut.value = fields.statut ?? '';
}

const entryFixedFieldEls = {
  themes: entryThemes,
  niveau: entryNiveau,
  statut: entryStatut,
};

function startEditEntry(entry) {
  editingEntryId = entry.id;
  editingEntryModeleId = entry.modeleId ?? null;
  entryTitre.value = entry.titre ?? '';
  applyFixedFieldsToForm(entry, entryFixedFieldEls);
  entryDate.value = entry.date;
  entryRessentiFroidSlot.hidden = false;
  renderRessentiAFroidSlot(entry);
  entryFieldsEditor.render(entry.champsSchema ?? blankChampsSchema(), entry.champsPersonnalises ?? {});
  entryContentEditor.render(entry.contenuSchema, entry.contenuValeurs ?? {}, Boolean(entry.modeleId));
  entryFormTitle.textContent = 'Modifier l’entrée';
  entrySubmitButton.textContent = 'Enregistrer les modifications';
  entryDeleteButton.hidden = false;
  entryError.textContent = '';
  openModal('entry-form-modal');
}

function openBlankEntryForm() {
  stopEditEntry();
  entryFieldsEditor.render(blankChampsSchema(), {});
  entryContentEditor.render(blankContenuSchema(), {}, false);
  openModal('entry-form-modal');
}

function cloneContenuSchema(schema) {
  return {
    blocks: schema.blocks.map((block) => ({
      ...block,
      colonnes: block.colonnes?.map((c) => ({ ...c })),
      lignes: block.lignes?.map((l) => ({ ...l })),
    })),
    order: [...schema.order],
  };
}

function renderBilanRituelContenu(dateIso) {
  const rituelModele = modeles.find((m) => m.nom === 'Rituel du soir');
  const entriesRituel = rituelModele ? entries.filter((e) => e.modeleId === rituelModele.id) : [];
  const { contenuSchema, contenuValeurs } = buildBilanRituelDuSoir(entriesRituel, dateIso);
  entryContentEditor.render(contenuSchema, contenuValeurs, true);
}

function applyModeleToForm(modele) {
  stopEditEntry();
  editingEntryModeleId = modele.id;
  if (modele.titrePattern) {
    activeTitrePattern = modele.titrePattern;
    activeTitreRang = entries.filter((e) => e.modeleId === modele.id).length + 1;
    entryTitre.value = resolveTitreModele(activeTitrePattern, { date: entryDate.value, id: activeTitreRang });
  }
  applyFixedFieldsToForm(modele, entryFixedFieldEls);
  const modeleSchema = modele.champsSchema ?? { fields: [], order: [] };
  entryFieldsEditor.render(
    {
      fields: modeleSchema.fields.map((f) => ({ ...f, options: f.options ? [...f.options] : f.options })),
      order: [...FIXED_BLOCK_KEYS, ...modeleSchema.order],
    },
    { ...(modele.champsPersonnalises ?? {}) },
  );
  if (modele.calculAuto === 'bilan-rituel-du-soir') {
    activeCalculAuto = modele.calculAuto;
    renderBilanRituelContenu(entryDate.value);
  } else {
    entryContentEditor.render(
      cloneContenuSchema(modele.contenuSchema),
      { ...(modele.contenuValeursParDefaut ?? {}) },
      true,
    );
  }
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
  };
}

const modeleFixedFieldEls = {
  themes: modeleThemes,
  niveau: modeleNiveau,
  statut: modeleStatut,
};

function startEditModele(modele) {
  editingModeleId = modele.id;
  modeleNom.value = modele.nom;
  modeleTitrePattern.value = modele.titrePattern ?? '';
  applyFixedFieldsToForm(modele, modeleFixedFieldEls);
  modeleFieldsEditor.render(modele.champsSchema ?? { fields: [], order: [] }, modele.champsPersonnalises ?? {});
  modeleContentEditor.render(modele.contenuSchema, modele.contenuValeursParDefaut ?? {}, false);
  modeleFormTitle.textContent = 'Modifier le modèle';
  modeleSubmit.textContent = 'Enregistrer les modifications';
  modeleCancel.hidden = false;
  modeleFormError.textContent = '';
  openModal('modele-form-modal');
}

function stopEditModele() {
  editingModeleId = null;
  modeleForm.reset();
  modeleFieldsEditor.render({ fields: [], order: [] }, {});
  modeleContentEditor.render(blankContenuSchema(), {}, false);
  modeleFormTitle.textContent = 'Nouveau modèle';
  modeleSubmit.textContent = 'Créer le modèle';
  modeleCancel.hidden = true;
  modeleFormError.textContent = '';
}

function renderModelesDefaut(modelesDefaut) {
  modeleListDefaut.innerHTML = '';
  for (const modele of modelesDefaut) {
    const li = document.createElement('li');
    const nom = document.createElement('p');
    nom.textContent = modele.nom;
    li.appendChild(nom);
    modeleListDefaut.appendChild(li);
  }
}

async function loadModelesDefaut() {
  const index = await (await fetch('models/index.json')).json();
  return Promise.all(index.map(async (fichier) => (await fetch(`models/${fichier}`)).json()));
}

loadModelesDefaut()
  .then(renderModelesDefaut)
  .catch((error) => {
    modeleError.textContent = `Échec du chargement des modèles par défaut : ${error.message}`;
  });

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

function diffChampsSchema(oldSchema, newSchema) {
  const oldIds = new Set(oldSchema.fields.map((f) => f.id));
  const newIds = new Set(newSchema.fields.map((f) => f.id));
  return {
    added: newSchema.fields.filter((f) => !oldIds.has(f.id)),
    removed: oldSchema.fields.filter((f) => !newIds.has(f.id)),
  };
}

// Les entrées copient le champsSchema du modèle au moment de leur création
// (pas de référence vivante) : on répercute ici les propriétés ajoutées
// (valeur vide) ou retirées (selon le choix de l'utilisateur) sur les
// entrées déjà créées via ce modèle.
function syncEntriesChampsSchema(modeleId, added, removed, deleteRemovedValues) {
  const removedIds = new Set(removed.map((f) => f.id));
  return entries.map((entry) => {
    if (entry.modeleId !== modeleId) return entry;
    let fields = entry.champsSchema?.fields ?? [];
    let order = entry.champsSchema?.order ?? [];
    const champsPersonnalises = { ...entry.champsPersonnalises };

    for (const field of added) {
      if (fields.some((f) => f.id === field.id)) continue;
      fields = [...fields, { ...field }];
      order = [...order, field.id];
    }

    if (deleteRemovedValues) {
      fields = fields.filter((f) => !removedIds.has(f.id));
      order = order.filter((id) => !removedIds.has(id));
      for (const field of removed) delete champsPersonnalises[field.id];
    }

    return { ...entry, champsSchema: { fields, order }, champsPersonnalises };
  });
}

modeleCancel.addEventListener('click', () => {
  stopEditModele();
  closeModal();
});

modeleForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  modeleFormError.textContent = '';
  const nom = modeleNom.value.trim();
  const titrePattern = modeleTitrePattern.value.trim();
  const fixed = readModeleFixedFields();
  const champsPersonnalises = modeleFieldsEditor.getValues();
  const champsSchema = modeleFieldsEditor.getSchema();
  const contenuSchema = modeleContentEditor.getSchema();
  const contenuValeursParDefaut = modeleContentEditor.getValues();
  const previousModeles = modeles;
  const previousEntries = entries;
  let entriesChanged = false;

  if (editingModeleId) {
    const previousModele = modeles.find((m) => m.id === editingModeleId);
    const { added, removed } = diffChampsSchema(previousModele?.champsSchema ?? { fields: [], order: [] }, champsSchema);
    let deleteRemovedValues = false;
    if (removed.length > 0 && entries.some((e) => e.modeleId === editingModeleId)) {
      deleteRemovedValues = window.confirm(
        `Ce modèle retire la propriété « ${removed.map((f) => f.nom).join(' », « ')} ».\n\n` +
          `La supprimer aussi des entrées déjà créées via ce modèle ?\n` +
          `OK = la supprimer aussi des entrées\nAnnuler = conserver les valeurs déjà saisies`,
      );
    }
    if (added.length > 0 || removed.length > 0) {
      entries = syncEntriesChampsSchema(editingModeleId, added, removed, deleteRemovedValues);
      entriesChanged = true;
    }
    modeles = modeles.map((m) =>
      m.id === editingModeleId
        ? { ...m, nom, titrePattern, ...fixed, champsPersonnalises, champsSchema, contenuSchema, contenuValeursParDefaut }
        : m,
    );
  } else {
    modeles = [
      ...modeles,
      {
        id: crypto.randomUUID(),
        nom,
        titrePattern,
        ...fixed,
        champsPersonnalises,
        champsSchema,
        contenuSchema,
        contenuValeursParDefaut,
        creeLe: new Date().toISOString(),
      },
    ];
  }
  renderModeles();
  renderEntryNewMenu();
  if (entriesChanged) renderEntries();
  try {
    await saveModeles(modeles);
    if (entriesChanged) await saveEntries(entries);
    stopEditModele();
    closeModal();
  } catch (error) {
    modeles = previousModeles;
    entries = previousEntries;
    renderModeles();
    renderEntryNewMenu();
    if (entriesChanged) renderEntries();
    modeleFormError.textContent = `Échec de l'enregistrement du modèle : ${error.message}`;
  }
});

function renderMainView() {
  entriesSection.hidden = true;
  journalPartageSection.hidden = true;
  modelesSection.hidden = true;

  if (modelesViewActive) {
    modelesSection.hidden = false;
  } else if (currentJournalId) {
    journalPartageSection.hidden = false;
    renderJournalPartage(currentJournalId, (updated) => {
      partagesRecus = updated;
      renderPartagesRecus();
      renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId });
    });
  } else {
    entriesSection.hidden = false;
  }
}

function setJournalId(fichierId) {
  modelesViewActive = false;
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
  onOpenModeles: () => {
    modelesViewActive = true;
    renderMainView();
    closeSidebarOnMobile();
  },
});

modeleNewButton.addEventListener('click', () => {
  stopEditModele();
  openModal('modele-form-modal');
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

entryDate.addEventListener('change', () => {
  if (editingEntryId) return;
  if (activeTitrePattern) {
    entryTitre.value = resolveTitreModele(activeTitrePattern, { date: entryDate.value, id: activeTitreRang });
  }
  if (activeCalculAuto === 'bilan-rituel-du-soir') {
    renderBilanRituelContenu(entryDate.value);
  }
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
  const contenuSchema = entryContentEditor.getSchema();
  const contenuValeurs = entryContentEditor.getValues();
  const previousEntries = entries;

  if (editingEntryId) {
    const original = entries.find((e) => e.id === editingEntryId);
    const updated = updateEntry(original, {
      titre: entryTitre.value.trim(),
      date: entryDate.value,
      themes,
      niveauAcces: entryNiveau.value,
      statut: entryStatut.value,
      champsPersonnalises,
      champsSchema,
      contenuSchema,
      contenuValeurs,
    });
    entries = entries.map((e) => (e.id === editingEntryId ? updated : e));
  } else {
    const entry = createEntry({
      titre: entryTitre.value.trim(),
      date: entryDate.value,
      themes,
      niveauAcces: entryNiveau.value,
      statut: entryStatut.value,
      champsPersonnalises,
      champsSchema,
      modeleId: editingEntryModeleId,
      contenuSchema,
      contenuValeurs,
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

entryDeleteButton.addEventListener('click', async () => {
  if (!editingEntryId) return;
  if (!window.confirm('Supprimer définitivement cette entrée ?')) return;
  entryError.textContent = '';
  const previousEntries = entries;
  entries = entries.filter((e) => e.id !== editingEntryId);
  try {
    await saveEntries(entries);
    await syncPartages();
    renderEntries();
    stopEditEntry();
    closeModal();
  } catch (error) {
    entries = previousEntries;
    entryError.textContent = `Échec de la suppression : ${error.message}`;
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
      entries = (await loadEntries()).map(migrateEntryContenu);
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
      modeles = (await loadModeles()).map(migrateModeleContenu);
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
    modelesViewActive = false;
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
