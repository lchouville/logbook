import { onAuthChange, signIn, signOut, getSessionDuration, setSessionDuration } from './auth.js';
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
  setActiveDashboard,
  loadDashboards,
  saveDashboards,
  createDashboardFolder,
  deletePhoto,
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
  buildBilanMensuelRituelDuSoir,
  NIVEAUX_ACCES,
  STATUTS,
  THEMES,
  FIXED_BLOCK_KEYS,
} from './entries.js';
import { applyTheme, DEFAULT_THEME } from './theme.js';
import { initSidebar, renderSidebar, closeSidebarOnMobile } from './sidebar.js';
import { openModal, closeModal } from './modal.js';
import { renderJournalPartage, setViewerPageSize } from './viewer.js';
import { createFieldsEditor } from './schema.js';
import { createContentEditor } from './contenu.js';

const APP_VERSION = '0.1.0';

const authSection = document.getElementById('auth');
const signInButton = document.getElementById('sign-in');
const authStatus = document.getElementById('auth-status');
const appShell = document.getElementById('app-shell');
const signOutButton = document.getElementById('sign-out');

const themeSelect = document.getElementById('theme-select');
const entriesPageSizeSelect = document.getElementById('entries-page-size-select');
const confirmDashboardDeleteCheckbox = document.getElementById('confirm-dashboard-delete-checkbox');
const sessionDurationSelect = document.getElementById('session-duration-select');
const settingsError = document.getElementById('settings-error');
const appVersionEl = document.getElementById('app-version');
appVersionEl.textContent = `Version ${APP_VERSION}`;
const entriesSection = document.getElementById('entries');
const journalPartageSection = document.getElementById('journal-partage');
const modelesSection = document.getElementById('modeles');
const settingsSection = document.getElementById('settings');
const partagesSection = document.getElementById('partages');
const partagesRecusSection = document.getElementById('partages-recus');
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
const partageDashboardSelect = document.getElementById('partage-dashboard');
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
const modeleBilansList = document.getElementById('modele-bilans-list');
const modeleBilanAddButton = document.getElementById('modele-bilan-add-button');
const modeleList = document.getElementById('modele-list');
const modeleListDefaut = document.getElementById('modele-list-defaut');
const modeleError = document.getElementById('modele-error');
const sidebarDashboardsError = document.getElementById('sidebar-dashboards-error');

const ACTIVE_DASHBOARD_KEY = 'logbook_active_dashboard_id';

const ENTRIES_PAGE_SIZE_DEFAULT = 10;

let entries = [];
let entriesPageSize = ENTRIES_PAGE_SIZE_DEFAULT;
let entriesVisibleCount = ENTRIES_PAGE_SIZE_DEFAULT;
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
let activeSourceModeleId = null;
let editingModeleId = null;
// Bilans en cours d'édition dans le formulaire de modèle (sous-modèles portés
// par `modele.bilans`, pas des entités Drive séparées) : liste de travail
// locale, écrite dans le modèle parent seulement à la soumission du formulaire.
let modeleBilans = [];
let ownerName = null;
let currentJournalId = null;
// Page affichée dans #main-content : 'entries' | 'modeles' | 'settings' | 'partages' | 'acces'.
// currentJournalId prime dessus (journal partagé reçu affiché par-dessus, cf renderMainView).
let mainView = 'entries';
let dashboards = [];
let activeDashboardId = 'default';
// Le formulaire de partage peut cibler un dashboard différent de l'actif (sélecteur
// dans la section Partage) : ces deux variables suivent ce choix indépendamment de
// `partages`/`entries` (qui, eux, restent toujours ceux du dashboard actif).
let partageViewDashboardId = null;
let partageViewPartages = [];

function buildSharedFileName(nom) {
  return `${(ownerName ?? 'Logbook').trim()} — ${nom.trim()}.json`;
}

function buildPartageLink(fichierId) {
  return new URL(`index.html?journal=${fichierId}`, window.location.href).toString();
}

function getJournalIdFromUrl() {
  return new URLSearchParams(window.location.search).get('journal');
}

// Préférence locale au navigateur (pas de Drive) : affichable/modifiable dès le départ.
sessionDurationSelect.value = getSessionDuration();
sessionDurationSelect.addEventListener('change', () => {
  setSessionDuration(sessionDurationSelect.value);
});

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

entriesPageSizeSelect.addEventListener('change', async () => {
  settingsError.textContent = '';
  const previousPageSize = entriesPageSize;
  const pageSize = Number(entriesPageSizeSelect.value);
  entriesPageSize = pageSize;
  setViewerPageSize(pageSize);
  settings = { ...settings, entriesPageSize: pageSize };
  try {
    await saveSettings(settings);
  } catch (error) {
    entriesPageSize = previousPageSize;
    setViewerPageSize(previousPageSize);
    entriesPageSizeSelect.value = String(previousPageSize);
    settings = { ...settings, entriesPageSize: previousPageSize };
    settingsError.textContent = `Échec de l'enregistrement : ${error.message}`;
  }
});

confirmDashboardDeleteCheckbox.addEventListener('change', async () => {
  settingsError.textContent = '';
  const previousValue = settings.confirmDashboardDeleteByName ?? true;
  const value = confirmDashboardDeleteCheckbox.checked;
  settings = { ...settings, confirmDashboardDeleteByName: value };
  try {
    await saveSettings(settings);
  } catch (error) {
    settings = { ...settings, confirmDashboardDeleteByName: previousValue };
    confirmDashboardDeleteCheckbox.checked = previousValue;
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
    th.scope = 'col';
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
  partageDashboardSelect.disabled = true;
  partageError.textContent = '';
}

function stopEditPartage() {
  editingPartageId = null;
  partageForm.reset();
  resetPartageRegles();
  // partage-dashboard fait partie du form : reset() le remettrait au premier <option>.
  partageDashboardSelect.value = partageViewDashboardId ?? activeDashboardId;
  partageDashboardSelect.disabled = false;
  partageSubmit.textContent = 'Créer le partage';
  partageCancel.hidden = true;
}

function appendCell(row, text) {
  const td = document.createElement('td');
  td.textContent = text;
  row.appendChild(td);
  return td;
}

let entriesLoadMoreObserver = null;

function getEntriesLoadMoreObserver() {
  if (!entriesLoadMoreObserver) {
    entriesLoadMoreObserver = new IntersectionObserver((observedEntries) => {
      if (observedEntries.some((observed) => observed.isIntersecting)) {
        entriesVisibleCount += entriesPageSize;
        renderEntries();
      }
    });
  }
  return entriesLoadMoreObserver;
}

function renderEntries() {
  entryTableBody.innerHTML = '';
  if (entries.length === 0) {
    renderTableMessage(entryTableBody, 6, 'Aucune entrée. Créez-en une avec « + Nouvelle entrée ».');
    return;
  }
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre));
  const visible = sorted.slice(0, entriesVisibleCount);

  for (const entry of visible) {
    const row = document.createElement('tr');
    row.dataset.entryId = entry.id;
    row.tabIndex = 0;

    appendCell(row, entry.date);
    appendCell(row, entry.titre ?? '');
    appendCell(row, entry.themes.join(', '));
    appendCell(row, entry.niveauAcces);
    appendCell(row, entry.statut);
    appendCell(row, previewContenuTexte(entry));

    entryTableBody.appendChild(row);
  }

  const observer = getEntriesLoadMoreObserver();
  observer.disconnect();
  if (visible.length < sorted.length) {
    const sentinelRow = document.createElement('tr');
    const sentinelCell = document.createElement('td');
    sentinelCell.colSpan = 6;
    sentinelRow.appendChild(sentinelCell);
    entryTableBody.appendChild(sentinelRow);
    observer.observe(sentinelRow);
  }
}

function stopEditEntry() {
  editingEntryId = null;
  editingEntryModeleId = null;
  activeTitrePattern = null;
  activeCalculAuto = null;
  activeSourceModeleId = null;
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

const BILAN_BUILDERS = {
  'bilan-rituel-du-soir': buildBilanRituelDuSoir,
  'bilan-mensuel-rituel-du-soir': buildBilanMensuelRituelDuSoir,
};

// sourceModeleId : id du modèle (n'importe lequel comportant un bloc tableau
// de mesures) dont les entrées sont agrégées pour le bilan — porté par le
// modèle de bilan lui-même (`modele.sourceModeleId`), pas câblé en dur sur
// un nom de modèle particulier.
function renderBilanRituelContenu(dateIso, calculAuto, sourceModeleId) {
  const entriesSource = sourceModeleId ? entries.filter((e) => e.modeleId === sourceModeleId) : [];
  const builder = BILAN_BUILDERS[calculAuto] ?? buildBilanRituelDuSoir;
  const { contenuSchema, contenuValeurs } = builder(entriesSource, dateIso);
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
  entryContentEditor.render(cloneContenuSchema(modele.contenuSchema), { ...(modele.contenuValeursParDefaut ?? {}) }, true);
  openModal('entry-form-modal');
}

// Un bilan est un sous-modèle de `modele` (dans `modele.bilans`), pas une entité
// Drive séparée : il hérite des thèmes/niveau d'accès du modèle parent (le
// statut est toujours « Bilan ») et agrège les entrées dont le `modeleId` est
// celui du parent — jamais celui du bilan lui-même, pour ne pas réagréger ses
// propres entrées de bilan au prochain calcul.
function applyBilanToForm(modele, bilan) {
  stopEditEntry();
  editingEntryModeleId = bilan.id;
  activeTitrePattern = bilan.titrePattern || null;
  activeTitreRang = entries.filter((e) => e.modeleId === bilan.id).length + 1;
  if (activeTitrePattern) {
    entryTitre.value = resolveTitreModele(activeTitrePattern, { date: entryDate.value, id: activeTitreRang });
  }
  applyFixedFieldsToForm({ themes: modele.themes, niveauAcces: modele.niveauAcces, statut: 'Bilan' }, entryFixedFieldEls);
  entryFieldsEditor.render({ fields: [], order: [...FIXED_BLOCK_KEYS] }, {});
  activeCalculAuto = bilan.calculAuto;
  activeSourceModeleId = modele.id;
  renderBilanRituelContenu(entryDate.value, activeCalculAuto, activeSourceModeleId);
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

// Si le tableau affiché dans le sélecteur de partage est l'actif, répercute le
// résultat dans `partages` (utilisé par syncPartages lors de l'édition d'entrées).
function syncPartageViewIntoActive() {
  if (partageViewDashboardId === activeDashboardId) partages = partageViewPartages;
}

async function deletePartage(partage) {
  partageError.textContent = '';
  if (editingPartageId === partage.id) stopEditPartage();
  const previousPartages = partageViewPartages;
  partageViewPartages = partageViewPartages.filter((p) => p.id !== partage.id);
  renderPartages();
  try {
    await deleteSharedFile(partage.fichierId);
    await savePartages(partageViewPartages, partageViewDashboardId);
    syncPartageViewIntoActive();
  } catch (error) {
    partageViewPartages = previousPartages;
    partageError.textContent = `Échec de la suppression : ${error.message}`;
    renderPartages();
  }
}

function renderPartages() {
  partageList.innerHTML = '';
  if (partageViewPartages.length === 0) {
    renderListMessage(partageList, 'Aucun partage. Créez-en un ci-dessus.');
    return;
  }
  for (const partage of partageViewPartages) {
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
    deleteButton.className = 'button-danger';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => deletePartage(partage));
    actions.appendChild(deleteButton);

    li.appendChild(actions);

    partageList.appendChild(li);
  }
}

function populatePartageDashboardSelect() {
  partageDashboardSelect.innerHTML = '';
  for (const dashboard of dashboards) {
    const option = document.createElement('option');
    option.value = dashboard.id;
    option.textContent = dashboard.nom;
    partageDashboardSelect.appendChild(option);
  }
  partageDashboardSelect.value = partageViewDashboardId ?? activeDashboardId;
}

// Charge les partages du tableau de bord sélectionné dans le formulaire (par défaut
// le dernier actif), indépendamment de `partages` qui reste toujours celui de l'actif.
let partageViewRequestId = 0;

async function loadPartageView(dashboardId) {
  stopEditPartage();
  partageViewDashboardId = dashboardId;
  partageDashboardSelect.value = dashboardId;
  partageError.textContent = '';
  renderLoading(partageList);
  // Un changement rapide du sélecteur peut faire se chevaucher deux appels : si une
  // requête plus ancienne et plus lente répond après une plus récente, elle écraserait
  // la liste déjà affichée pour le nouveau tableau sélectionné. On ignore les réponses
  // qui ne correspondent plus à la dernière sélection demandée.
  const requestId = ++partageViewRequestId;
  let result;
  let error;
  try {
    result = dashboardId === activeDashboardId ? partages : await loadPartages(dashboardId);
  } catch (err) {
    error = err;
  }
  if (requestId !== partageViewRequestId) return;
  if (error) {
    partageViewPartages = [];
    partageError.textContent = `Échec du chargement des partages : ${error.message}`;
  } else {
    partageViewPartages = result;
  }
  renderPartages();
}

partageDashboardSelect.addEventListener('change', () => {
  loadPartageView(partageDashboardSelect.value);
});

async function retirerPartageRecu(partageRecu) {
  partagesRecusError.textContent = '';
  const previous = partagesRecus;
  partagesRecus = partagesRecus.filter((p) => p.id !== partageRecu.id);
  renderPartagesRecus();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  try {
    await savePartagesRecus(partagesRecus);
  } catch (error) {
    partagesRecus = previous;
    partagesRecusError.textContent = `Échec du retrait : ${error.message}`;
    renderPartagesRecus();
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  }
}

function renderPartagesRecus() {
  partagesRecusList.innerHTML = '';
  if (partagesRecus.length === 0) {
    renderListMessage(partagesRecusList, 'Aucun accès reçu pour le moment.');
    return;
  }
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

const BILAN_FREQUENCE_LABELS = {
  'bilan-rituel-du-soir': 'Hebdomadaire',
  'bilan-mensuel-rituel-du-soir': 'Mensuel',
};

function renderModeleBilans() {
  modeleBilansList.innerHTML = '';
  for (const bilan of modeleBilans) {
    const li = document.createElement('li');
    li.className = 'modele-bilan-row';

    const nomInput = document.createElement('input');
    nomInput.type = 'text';
    nomInput.placeholder = 'Nom du bilan';
    nomInput.value = bilan.nom;
    nomInput.addEventListener('input', () => (bilan.nom = nomInput.value));
    li.appendChild(nomInput);

    const titreInput = document.createElement('input');
    titreInput.type = 'text';
    titreInput.placeholder = 'Titre (ex : Bilan du {date})';
    titreInput.value = bilan.titrePattern;
    titreInput.addEventListener('input', () => (bilan.titrePattern = titreInput.value));
    li.appendChild(titreInput);

    const frequenceSelect = document.createElement('select');
    for (const [value, label] of Object.entries(BILAN_FREQUENCE_LABELS)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      frequenceSelect.appendChild(option);
    }
    frequenceSelect.value = bilan.calculAuto;
    frequenceSelect.addEventListener('change', () => (bilan.calculAuto = frequenceSelect.value));
    li.appendChild(frequenceSelect);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Supprimer';
    deleteButton.addEventListener('click', () => {
      modeleBilans = modeleBilans.filter((b) => b.id !== bilan.id);
      renderModeleBilans();
    });
    li.appendChild(deleteButton);

    modeleBilansList.appendChild(li);
  }
}

modeleBilanAddButton.addEventListener('click', () => {
  modeleBilans = [
    ...modeleBilans,
    { id: crypto.randomUUID(), nom: '', titrePattern: '', calculAuto: 'bilan-rituel-du-soir' },
  ];
  renderModeleBilans();
});

function startEditModele(modele) {
  editingModeleId = modele.id;
  modeleNom.value = modele.nom;
  modeleTitrePattern.value = modele.titrePattern ?? '';
  applyFixedFieldsToForm(modele, modeleFixedFieldEls);
  modeleFieldsEditor.render(modele.champsSchema ?? { fields: [], order: [] }, modele.champsPersonnalises ?? {});
  modeleContentEditor.render(modele.contenuSchema, modele.contenuValeursParDefaut ?? {}, false);
  modeleBilans = (modele.bilans ?? []).map((b) => ({ ...b }));
  renderModeleBilans();
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
  modeleBilans = [];
  renderModeleBilans();
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
  if (modeles.length === 0) {
    renderListMessage(modeleList, 'Aucun modèle. Créez-en un ci-dessus.');
    return;
  }
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
    deleteButton.className = 'button-danger';
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
  const bilans = modeleBilans.filter((b) => b.nom.trim()).map((b) => ({ ...b, nom: b.nom.trim() }));
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
        ? { ...m, nom, titrePattern, ...fixed, champsPersonnalises, champsSchema, contenuSchema, contenuValeursParDefaut, bilans }
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
        bilans,
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
  settingsSection.hidden = true;
  partagesSection.hidden = true;
  partagesRecusSection.hidden = true;

  // Les pages explicites (sidebar) priment sur le journal partagé affiché : sinon,
  // cliquer Paramètres/Partage/Modèles/Accès depuis la vue d'un journal reçu ne fait
  // rien, puisque ce bloc resterait sur journalPartageSection.
  if (mainView === 'modeles') {
    modelesSection.hidden = false;
  } else if (mainView === 'settings') {
    settingsSection.hidden = false;
  } else if (mainView === 'partages') {
    partagesSection.hidden = false;
  } else if (mainView === 'acces') {
    partagesRecusSection.hidden = false;
  } else if (currentJournalId) {
    journalPartageSection.hidden = false;
    renderJournalPartage(currentJournalId, (updated) => {
      partagesRecus = updated;
      renderPartagesRecus();
      renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
    });
  } else {
    entriesSection.hidden = false;
  }
}

function setJournalId(fichierId) {
  mainView = 'entries';
  currentJournalId = fichierId;
  const url = new URL(window.location.href);
  if (fichierId) {
    url.searchParams.set('journal', fichierId);
  } else {
    url.searchParams.delete('journal');
  }
  window.history.pushState({ journal: fichierId }, '', url);
  renderMainView();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  closeModal();
  closeSidebarOnMobile();
}

window.addEventListener('popstate', () => {
  currentJournalId = getJournalIdFromUrl();
  renderMainView();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
});

initSidebar({
  onSelectJournal: setJournalId,
  onOpenSettings: () => {
    mainView = 'settings';
    renderMainView();
    closeSidebarOnMobile();
  },
  onOpenPartages: () => {
    mainView = 'partages';
    renderMainView();
    populatePartageDashboardSelect();
    loadPartageView(activeDashboardId);
    closeSidebarOnMobile();
  },
  onOpenAcces: () => {
    mainView = 'acces';
    renderMainView();
    closeSidebarOnMobile();
  },
  onOpenModeles: () => {
    mainView = 'modeles';
    renderMainView();
    closeSidebarOnMobile();
  },
  onSelectDashboard: switchDashboard,
  onCreateDashboard: createDashboard,
  onRenameDashboard: renameDashboard,
  onArchiveDashboard: archiveDashboard,
  onUnarchiveDashboard: unarchiveDashboard,
  onDeleteDashboard: deleteDashboard,
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

    for (const bilan of modele.bilans ?? []) {
      const bilanButton = document.createElement('button');
      bilanButton.type = 'button';
      bilanButton.className = 'entry-new-menu-bilan';
      bilanButton.textContent = `↳ ${bilan.nom}`;
      bilanButton.dataset.modeleId = modele.id;
      bilanButton.dataset.bilanId = bilan.id;
      entryNewMenu.appendChild(bilanButton);
    }
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
  const bilan = modele && button.dataset.bilanId ? modele.bilans?.find((b) => b.id === button.dataset.bilanId) : null;
  if (bilan) {
    applyBilanToForm(modele, bilan);
  } else if (modele) {
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
  if (BILAN_BUILDERS[activeCalculAuto]) {
    renderBilanRituelContenu(entryDate.value, activeCalculAuto, activeSourceModeleId);
  }
});

entryTableBody.addEventListener('click', (event) => {
  const row = event.target.closest('tr');
  const entry = row && entries.find((e) => e.id === row.dataset.entryId);
  if (entry) startEditEntry(entry);
});

entryTableBody.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const row = event.target.closest('tr');
  const entry = row && entries.find((e) => e.id === row.dataset.entryId);
  if (!entry) return;
  event.preventDefault();
  startEditEntry(entry);
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
  const deleted = entries.find((e) => e.id === editingEntryId);
  entries = entries.filter((e) => e.id !== editingEntryId);
  try {
    await saveEntries(entries);
    deleted.champsSchema.fields
      .filter((f) => f.type === 'photo' && deleted.champsPersonnalises[f.id])
      .forEach((f) => deletePhoto(deleted.champsPersonnalises[f.id]).catch(() => {}));
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
    const partage = partageViewPartages.find((p) => p.id === editingPartageId);
    try {
      const sourceEntries = await loadEntries(partageViewDashboardId);
      const filtered = filtrerEntreesPartage(sourceEntries, regles);
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
      partageViewPartages = partageViewPartages.map((p) =>
        p.id === editingPartageId ? { ...p, nom, regles, emails: [email], fileName, permissionId } : p,
      );
      await savePartages(partageViewPartages, partageViewDashboardId);
      syncPartageViewIntoActive();
      renderPartages();
      stopEditPartage();
    } catch (error) {
      partageError.textContent = `Échec de la modification du partage : ${error.message}`;
    }
    return;
  }

  try {
    const fileName = buildSharedFileName(nom);
    const sourceEntries = await loadEntries(partageViewDashboardId);
    const filtered = filtrerEntreesPartage(sourceEntries, regles);
    const fichierId = await createSharedFile(fileName, filtered, partageViewDashboardId);
    const permissionId = await shareFileWithEmail(fichierId, email);
    partageViewPartages = [
      ...partageViewPartages,
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
    await savePartages(partageViewPartages, partageViewDashboardId);
    syncPartageViewIntoActive();
    renderPartages();
    partageForm.reset();
    resetPartageRegles();
    // partage-dashboard fait partie du form : reset() le remettrait au premier <option>.
    partageDashboardSelect.value = partageViewDashboardId;
  } catch (error) {
    partageError.textContent = `Échec de la création du partage : ${error.message}`;
  }
});

function renderListMessage(list, message) {
  list.innerHTML = '';
  const li = document.createElement('li');
  li.className = 'list-message';
  li.textContent = message;
  list.appendChild(li);
}

function renderLoading(list) {
  renderListMessage(list, 'Chargement…');
}

function renderTableMessage(tbody, colspan, message) {
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  row.className = 'table-message';
  const td = document.createElement('td');
  td.colSpan = colspan;
  td.textContent = message;
  row.appendChild(td);
  tbody.appendChild(row);
}

function renderTableLoading(tbody, colspan) {
  renderTableMessage(tbody, colspan, 'Chargement…');
}

// Charge entries/settings/partages/partagesRecus/modeles pour le dashboard actif
// (déjà sélectionné via setActiveDashboard) et réaffiche les vues correspondantes.
// Partagée entre la connexion initiale et la bascule de dashboard.
async function loadAccountData() {
  entryError.textContent = '';
  settingsError.textContent = '';
  partageError.textContent = '';
  partagesRecusError.textContent = '';
  modeleError.textContent = '';
  renderTableLoading(entryTableBody, 6);
  renderLoading(partageList);
  renderLoading(partagesRecusList);
  renderLoading(modeleList);

  const loadSettingsTask = (async () => {
    try {
      settings = await loadSettings();
    } catch (error) {
      settings = {};
      settingsError.textContent = `Échec du chargement des préférences : ${error.message}`;
    }
    themeSelect.value = settings.theme ?? DEFAULT_THEME;
    applyTheme(settings.theme ?? DEFAULT_THEME);
    entriesPageSize = settings.entriesPageSize ?? ENTRIES_PAGE_SIZE_DEFAULT;
    setViewerPageSize(entriesPageSize);
    entriesPageSizeSelect.value = String(entriesPageSize);
    confirmDashboardDeleteCheckbox.checked = settings.confirmDashboardDeleteByName ?? true;
  })();

  const loadEntriesTask = (async () => {
    try {
      entries = (await loadEntries()).map(migrateEntryContenu);
    } catch (error) {
      entries = [];
      entryError.textContent = `Échec du chargement des entrées : ${error.message}`;
    }
    entriesVisibleCount = entriesPageSize;
    renderEntries();
  })();

  const loadPartagesTask = (async () => {
    try {
      partages = await loadPartages();
    } catch (error) {
      partages = [];
      partageError.textContent = `Échec du chargement des partages : ${error.message}`;
    }
    partageViewDashboardId = activeDashboardId;
    partageViewPartages = partages;
    renderPartages();
  })();

  const loadOwnerNameTask = (async () => {
    try {
      ownerName = await getOwnerDisplayName();
    } catch {
      ownerName = null;
    }
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  })();

  const loadPartagesRecusTask = (async () => {
    try {
      partagesRecus = await loadPartagesRecus();
    } catch (error) {
      partagesRecus = [];
      partagesRecusError.textContent = `Échec du chargement des partages reçus : ${error.message}`;
    }
    renderPartagesRecus();
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  })();

  const loadModelesTask = (async () => {
    try {
      modeles = (await loadModeles()).map(migrateModeleContenu);
    } catch (error) {
      modeles = [];
      modeleError.textContent = `Échec du chargement des modèles : ${error.message}`;
    }
    renderModeles();
    renderEntryNewMenu();
  })();

  await Promise.all([
    loadEntriesTask,
    loadSettingsTask,
    loadPartagesTask,
    loadOwnerNameTask,
    loadPartagesRecusTask,
    loadModelesTask,
  ]);
}

let dashboardSwitchInProgress = false;

async function switchDashboard(dashboardId) {
  // Ignore tout clic pendant qu'un chargement de dashboard est en cours : sinon deux
  // appels se chevauchent et se marchent dessus sur activeDashboardId/folderIdCache
  // (partagés côté drive.js), et on finit par charger les données du mauvais dossier.
  if (dashboardId === activeDashboardId) {
    // "Mes entrées" a été retiré de la sidebar : cliquer sur le dashboard déjà actif
    // est maintenant le seul moyen de revenir à ses entrées depuis une autre page
    // (Partage/Modèles/Paramètres/Accès) ou depuis un journal partagé reçu.
    if (currentJournalId !== null || mainView !== 'entries') setJournalId(null);
    return;
  }
  if (dashboardSwitchInProgress) return;
  dashboardSwitchInProgress = true;
  try {
    await switchDashboardUnguarded(dashboardId);
  } finally {
    dashboardSwitchInProgress = false;
  }
}

async function switchDashboardUnguarded(dashboardId) {
  sidebarDashboardsError.textContent = '';
  stopEditEntry();
  stopEditModele();
  stopEditPartage();
  closeModal();
  // Un dashboard n'affiche que ses entrées : on quitte toute autre page/journal en cours.
  mainView = 'entries';
  if (currentJournalId !== null) {
    currentJournalId = null;
    const url = new URL(window.location.href);
    url.searchParams.delete('journal');
    window.history.pushState({ journal: null }, '', url);
  }
  activeDashboardId = dashboardId;
  localStorage.setItem(ACTIVE_DASHBOARD_KEY, dashboardId);
  setActiveDashboard(dashboardId);
  // Surligner le dashboard sélectionné tout de suite plutôt qu'après le chargement
  // réseau : sinon la sidebar semble figée pendant les quelques appels Drive séquentiels.
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  await loadAccountData();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  renderMainView();
  closeSidebarOnMobile();
}

async function createDashboard() {
  if (dashboardSwitchInProgress) return;
  const nom = window.prompt('Nom du nouveau tableau de bord :');
  if (!nom || !nom.trim()) return;
  sidebarDashboardsError.textContent = '';
  const id = crypto.randomUUID();
  const dossierNom = `logbook-${id}`;
  const previousDashboards = dashboards;
  try {
    const dossierId = await createDashboardFolder(dossierNom);
    dashboards = [...dashboards, { id, nom: nom.trim(), dossierNom, dossierId, creeLe: new Date().toISOString() }];
    await saveDashboards(dashboards);
    await switchDashboard(id);
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec de la création du tableau de bord : ${error.message}`;
  }
}

async function renameDashboard(dashboardId) {
  const dashboard = dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) return;
  const nom = window.prompt('Nouveau nom du tableau de bord :', dashboard.nom);
  if (!nom || !nom.trim() || nom.trim() === dashboard.nom) return;
  sidebarDashboardsError.textContent = '';
  const previousDashboards = dashboards;
  dashboards = dashboards.map((d) => (d.id === dashboardId ? { ...d, nom: nom.trim() } : d));
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  try {
    await saveDashboards(dashboards);
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec du renommage : ${error.message}`;
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  }
}

// Archiver ne touche à aucune donnée Drive : juste un drapeau sur le registre qui
// sort le tableau de la liste active (voir sidebar.js) sans rien déplacer ni dupliquer.
async function archiveDashboard(dashboardId) {
  const dashboard = dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) return;
  if (!window.confirm(`Archiver « ${dashboard.nom} » ? Il restera consultable dans les tableaux archivés.`)) return;
  sidebarDashboardsError.textContent = '';
  const previousDashboards = dashboards;
  dashboards = dashboards.map((d) => (d.id === dashboardId ? { ...d, archive: true } : d));
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  try {
    await saveDashboards(dashboards);
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec de l'archivage : ${error.message}`;
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  }
}

async function unarchiveDashboard(dashboardId) {
  const dashboard = dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) return;
  sidebarDashboardsError.textContent = '';
  const previousDashboards = dashboards;
  dashboards = dashboards.map((d) => (d.id === dashboardId ? { ...d, archive: false } : d));
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  try {
    await saveDashboards(dashboards);
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec de la désarchivage : ${error.message}`;
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  }
}

// Suppression définitive : retire le tableau du registre puis supprime son dossier
// Drive (DELETE sur un dossier non vide efface aussi son contenu en cascade côté API).
async function deleteDashboard(dashboardId) {
  const dashboard = dashboards.find((d) => d.id === dashboardId);
  if (!dashboard) return;
  if (dashboards.length === 1) {
    sidebarDashboardsError.textContent = 'Impossible de supprimer le dernier tableau de bord.';
    return;
  }
  if (settings.confirmDashboardDeleteByName ?? true) {
    const saisie = window.prompt(
      `Suppression définitive et irréversible de « ${dashboard.nom} » et de toutes ses entrées.\nRetape le nom du tableau de bord pour confirmer :`,
    );
    if (saisie !== dashboard.nom) return;
  } else if (
    !window.confirm(`Supprimer définitivement « ${dashboard.nom} » et toutes ses entrées ? Cette action est irréversible.`)
  ) {
    return;
  }
  sidebarDashboardsError.textContent = '';
  const previousDashboards = dashboards;
  const wasActive = dashboardId === activeDashboardId;
  dashboards = dashboards.filter((d) => d.id !== dashboardId);
  try {
    await saveDashboards(dashboards);
    if (dashboard.dossierId) await deleteSharedFile(dashboard.dossierId);
    if (wasActive) await switchDashboard(dashboards[0].id);
    else renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec de la suppression : ${error.message}`;
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
  }
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
  sidebarDashboardsError.textContent = '';

  if (connected) {
    currentJournalId = getJournalIdFromUrl();
    mainView = 'entries';

    // Feedback immédiat : sans ça, sidebar et contenu restent figés/vides pendant les
    // premiers appels Drive (chargement du registre de dashboards), avant même que
    // loadAccountData démarre — ça donnait une impression de chargement incohérent.
    renderMainView();
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });

    try {
      dashboards = await loadDashboards();
    } catch (error) {
      dashboards = [{ id: 'default', nom: 'Mon journal de bord', dossierNom: 'logbook', creeLe: new Date().toISOString() }];
      sidebarDashboardsError.textContent = `Échec du chargement des tableaux de bord : ${error.message}`;
    }
    const storedDashboardId = localStorage.getItem(ACTIVE_DASHBOARD_KEY);
    activeDashboardId = dashboards.some((d) => d.id === storedDashboardId) ? storedDashboardId : 'default';
    setActiveDashboard(activeDashboardId);
    // Dashboards connus tout de suite : la liste/bouton "créer" s'affichent sans attendre
    // le reste (entrées/partages/modèles), qui arrive progressivement via loadAccountData.
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });

    await loadAccountData();

    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
    renderMainView();
  } else {
    entries = [];
    settings = {};
    partages = [];
    partagesRecus = [];
    modeles = [];
    dashboards = [];
    activeDashboardId = 'default';
    ownerName = null;
    currentJournalId = null;
    mainView = 'entries';
    themeSelect.value = DEFAULT_THEME;
    applyTheme(DEFAULT_THEME);
    entriesPageSize = ENTRIES_PAGE_SIZE_DEFAULT;
    setViewerPageSize(ENTRIES_PAGE_SIZE_DEFAULT);
    entriesPageSizeSelect.value = String(ENTRIES_PAGE_SIZE_DEFAULT);
    renderEntries();
    renderPartages();
    renderPartagesRecus();
    renderModeles();
    renderEntryNewMenu();
    closeModal();
  }
});
