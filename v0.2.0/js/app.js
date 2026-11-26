import {
  onAuthChange,
  signIn,
  signOut,
  getSessionDuration,
  setSessionDuration,
  getAccessToken,
  isLocalDevHost,
  enableDevLocalMode,
} from './auth.js';
import { pickSharedFile, pickFolder, pickOwnJsonFile } from './picker.js';
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
  expectedDossierNom,
  deletePhoto,
  movePhotoToDashboard,
  listIntegrationFiles,
  loadIntegrationFile,
  deleteIntegrationFile,
  connectLogbookFolder,
  createLogbookFolder,
  isLogbookFolderConnected,
  probeLogbookFolder,
  loadSharedFile,
  LOGBOOK_FOLDER_NOT_CONNECTED,
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
  titreGroupKey,
  buildBilanRituelDuSoir,
  buildBilanMensuelRituelDuSoir,
  NIVEAUX_ACCES,
  STATUTS,
  THEMES,
  FIXED_BLOCK_KEYS,
  validateImportedEntry,
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
const devLocalButton = document.getElementById('dev-local-button');
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
const integrationSection = document.getElementById('integration');
const integrationCount = document.getElementById('integration-count');
const integrationError = document.getElementById('integration-error');
const integrationList = document.getElementById('integration-list');
const entryImportError = document.getElementById('entry-import-error');
const logbookFolderConnectButton = document.getElementById('logbook-folder-connect-button');
const logbookFolderCreateButton = document.getElementById('logbook-folder-create-button');
const logbookFolderModalError = document.getElementById('logbook-folder-modal-error');
const integrationProgressTitle = document.getElementById('integration-progress-title');
const integrationProgressBar = document.getElementById('integration-progress-bar');
const integrationProgressCount = document.getElementById('integration-progress-count');
const mappingCorrectionList = document.getElementById('mapping-correction-list');
const mappingCorrectionSubmit = document.getElementById('mapping-correction-submit');
const inspectionFicheTitle = document.getElementById('inspection-fiche-title');
const inspectionFicheDetail = document.getElementById('inspection-fiche-detail');
const inspectionFicheMappingList = document.getElementById('inspection-fiche-mapping-list');
const inspectionFicheIntegrerButton = document.getElementById('inspection-fiche-integrer');
const inspectionFicheRejeterButton = document.getElementById('inspection-fiche-rejeter');
const settingsChangeLogbookFolderButton = document.getElementById('settings-change-logbook-folder-button');
const entryImportButton = document.getElementById('entry-import-button');
const entryImportMenu = document.getElementById('entry-import-menu');
const entryImportUploadButton = document.getElementById('entry-import-upload-button');
const entryImportDriveButton = document.getElementById('entry-import-drive-button');
const entryImportFileInput = document.getElementById('entry-import-file-input');
const settingsSection = document.getElementById('settings');
const partagesSection = document.getElementById('partages');
const partagesRecusSection = document.getElementById('partages-recus');
const modeleNewButton = document.getElementById('modele-new-button');
const modelesExportButton = document.getElementById('modeles-export-button');
const modelesImportButton = document.getElementById('modeles-import-button');
const modelesImportFileInput = document.getElementById('modeles-import-file-input');
const dashboardsExportButton = document.getElementById('dashboards-export-button');
const dashboardsImportButton = document.getElementById('dashboards-import-button');
const dashboardsImportFileInput = document.getElementById('dashboards-import-file-input');
const modeleFormTitle = document.getElementById('modele-form-title');
const modeleFormError = document.getElementById('modele-form-error');
const entryNewButton = document.getElementById('entry-new-button');
const entryNewMenu = document.getElementById('entry-new-menu');
const entryForm = document.getElementById('entry-form');
const entryFormFields = document.getElementById('entry-form-fields');
const entryFormTitle = document.getElementById('entry-form-title');
const entryEditButton = document.getElementById('entry-edit');
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
const entrySearchInput = document.getElementById('entry-search-input');
const entryFilterTheme = document.getElementById('entry-filter-theme');
const entryFilterStatut = document.getElementById('entry-filter-statut');
const entryFilterNiveau = document.getElementById('entry-filter-niveau');
const entryFilterModele = document.getElementById('entry-filter-modele');
const entryFilterDateFrom = document.getElementById('entry-filter-date-from');
const entryFilterDateTo = document.getElementById('entry-filter-date-to');
const entryFilterArchive = document.getElementById('entry-filter-archive');
const entrySelectAllCheckbox = document.getElementById('entry-select-all');
const entryBulkActions = document.getElementById('entry-bulk-actions');
const entryBulkCount = document.getElementById('entry-bulk-count');
const entryBulkDeleteButton = document.getElementById('entry-bulk-delete');
const entryBulkMoveButton = document.getElementById('entry-bulk-move');
const entryBulkArchiveButton = document.getElementById('entry-bulk-archive');
const entryBulkModeleButton = document.getElementById('entry-bulk-modele');
const entryMoveDashboardSelect = document.getElementById('entry-move-dashboard');
const entryMoveError = document.getElementById('entry-move-error');
const entryMoveSubmitButton = document.getElementById('entry-move-submit');
const entryModeleChangeSelect = document.getElementById('entry-modele-change-select');
const entryModeleChangeError = document.getElementById('entry-modele-change-error');
const entryModeleChangeSubmitButton = document.getElementById('entry-modele-change-submit');
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
let integrationFiles = [];
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
// Page affichée dans #main-content : 'entries' | 'modeles' | 'integration' | 'settings' | 'partages' | 'acces'.
// currentJournalId prime dessus (journal partagé reçu affiché par-dessus, cf renderMainView).
let mainView = 'entries';
let dashboards = [];
let activeDashboardId = 'default';
// Le formulaire de partage peut cibler un dashboard différent de l'actif (sélecteur
// dans la section Partage) : ces deux variables suivent ce choix indépendamment de
// `partages`/`entries` (qui, eux, restent toujours ceux du dashboard actif).
let partageViewDashboardId = null;
let partageViewPartages = [];

const entryFilters = { search: '', theme: '', statut: '', niveau: '', modeleId: '', dateFrom: '', dateTo: '', archive: 'entries' };
let selectedEntryIds = new Set();

function getFilteredEntries() {
  const search = entryFilters.search.trim().toLowerCase();
  return [...entries]
    .filter((e) => {
      if (entryFilters.archive === 'entries' && e.archive) return false;
      if (entryFilters.archive === 'archived' && !e.archive) return false;
      if (search && !`${e.titre ?? ''} ${previewContenuTexte(e)}`.toLowerCase().includes(search)) return false;
      if (entryFilters.theme && !e.themes.includes(entryFilters.theme)) return false;
      if (entryFilters.statut && e.statut !== entryFilters.statut) return false;
      if (entryFilters.niveau && e.niveauAcces !== entryFilters.niveau) return false;
      if (entryFilters.modeleId && e.modeleId !== entryFilters.modeleId) return false;
      if (entryFilters.dateFrom && e.date < entryFilters.dateFrom) return false;
      if (entryFilters.dateTo && e.date > entryFilters.dateTo) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date) || a.titre.localeCompare(b.titre));
}

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

function populateFilterSelect(select, options, placeholder) {
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = placeholder;
  select.appendChild(emptyOption);
  populateSelect(select, options);
}

populateFilterSelect(entryFilterTheme, THEMES, 'Tous les thèmes');
populateFilterSelect(entryFilterStatut, STATUTS, 'Tous les statuts');
populateFilterSelect(entryFilterNiveau, NIVEAUX_ACCES, 'Tous les niveaux');

entrySearchInput.addEventListener('input', () => {
  entryFilters.search = entrySearchInput.value;
  renderEntries();
});
for (const [el, key] of [
  [entryFilterTheme, 'theme'],
  [entryFilterStatut, 'statut'],
  [entryFilterNiveau, 'niveau'],
  [entryFilterModele, 'modeleId'],
  [entryFilterDateFrom, 'dateFrom'],
  [entryFilterDateTo, 'dateTo'],
  [entryFilterArchive, 'archive'],
]) {
  el.addEventListener('change', () => {
    entryFilters[key] = el.value;
    renderEntries();
  });
}

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

function renderBulkActions() {
  const count = selectedEntryIds.size;
  entryBulkActions.hidden = count === 0;
  if (count === 0) return;
  entryBulkCount.textContent = `${count} entrée${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
  const selected = entries.filter((e) => selectedEntryIds.has(e.id));
  entryBulkArchiveButton.textContent = selected.every((e) => e.archive) ? 'Désarchiver' : 'Archiver';
}

function renderEntries() {
  entryTableBody.innerHTML = '';
  // La sélection ne doit pas survivre à la disparition d'une entrée (suppression,
  // déplacement) ni rester cochée pour une entrée qui sort du filtre actif.
  const filtered = getFilteredEntries();
  const filteredIds = new Set(filtered.map((e) => e.id));
  selectedEntryIds = new Set([...selectedEntryIds].filter((id) => filteredIds.has(id)));
  if (filtered.length === 0) {
    renderTableMessage(entryTableBody, 7, 'Aucune entrée.');
    entrySelectAllCheckbox.checked = false;
    entrySelectAllCheckbox.indeterminate = false;
    renderBulkActions();
    return;
  }
  const visible = filtered.slice(0, entriesVisibleCount);

  for (const entry of visible) {
    const row = document.createElement('tr');
    row.dataset.entryId = entry.id;
    row.tabIndex = 0;
    if (entry.archive) row.classList.add('entry-row-archived');
    if (selectedEntryIds.has(entry.id)) row.classList.add('entry-row-selected');

    const checkboxCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedEntryIds.has(entry.id);
    checkbox.setAttribute('aria-label', `Sélectionner ${entry.titre || 'cette entrée'}`);
    checkboxCell.appendChild(checkbox);
    row.appendChild(checkboxCell);

    appendCell(row, entry.date);
    appendCell(row, entry.titre ?? '');
    appendCell(row, entry.themes.join(', '));
    appendCell(row, entry.niveauAcces);
    appendCell(row, entry.statut);
    appendCell(row, previewContenuTexte(entry));

    entryTableBody.appendChild(row);
  }

  entrySelectAllCheckbox.checked = filtered.every((e) => selectedEntryIds.has(e.id));
  entrySelectAllCheckbox.indeterminate = !entrySelectAllCheckbox.checked && selectedEntryIds.size > 0;
  renderBulkActions();

  const observer = getEntriesLoadMoreObserver();
  observer.disconnect();
  if (visible.length < filtered.length) {
    const sentinelRow = document.createElement('tr');
    const sentinelCell = document.createElement('td');
    sentinelCell.colSpan = 7;
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
  setEntryFormReadOnly(false);
}

// Les entrées existantes s'ouvrent en lecture (fieldset désactivé) avec un
// bouton « Modifier » ; une nouvelle entrée s'ouvre toujours directement
// éditable.
function setEntryFormReadOnly(readOnly) {
  entryFormFields.disabled = readOnly;
  entryFieldsEditor.setReadOnly(readOnly);
  entryEditButton.hidden = !readOnly;
  entrySubmitButton.hidden = readOnly;
  entryDeleteButton.hidden = readOnly || !editingEntryId;
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
  entryFormTitle.textContent = entry.titre || 'Entrée';
  entrySubmitButton.textContent = 'Enregistrer les modifications';
  entryError.textContent = '';
  setEntryFormReadOnly(true);
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

// Reprend la structure d'un modèle en portant les valeurs de l'ancien contenu
// (texte libre, ou tableau apparié par nom de ligne/colonne) — utilisé pour lier
// une fiche d'import à un modèle choisi après coup, sans perdre ses données.
// Popup de correction manuelle : un champ du modèle sans correspondance automatique par
// nom, une liste déroulante pour choisir à quel champ importé le relier (ou le laisser
// vide). Résout avec une Map ligne-du-modèle -> ligne-importée-choisie (ou null).
function demanderCorrectionMappage(modeleLignesNonMappees, ancienneLignesDisponibles) {
  return new Promise((resolve) => {
    // Appelée pendant une intégration de groupe, la popup de progression est déjà ouverte :
    // la remplacer temporairement par la correction puis la rouvrir, plutôt que fermer tout
    // le système de popup (ce qui interromprait visuellement le traitement en cours).
    const progressModalWasOpen = !document.getElementById('integration-progress-modal').hidden;
    mappingCorrectionList.innerHTML = '';
    const selects = new Map();
    for (const ligne of modeleLignesNonMappees) {
      const li = document.createElement('li');
      const label = document.createElement('label');
      label.textContent = ligne.nom;
      li.appendChild(label);

      const select = document.createElement('select');
      select.setAttribute('aria-label', `Champ importé relié à « ${ligne.nom} »`);
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Laisser vide';
      select.appendChild(emptyOption);
      for (const ancienneLigne of ancienneLignesDisponibles) {
        const option = document.createElement('option');
        option.value = ancienneLigne.id;
        option.textContent = ancienneLigne.nom;
        select.appendChild(option);
      }
      li.appendChild(select);
      mappingCorrectionList.appendChild(li);
      selects.set(ligne.id, select);
    }

    function onSubmit() {
      mappingCorrectionSubmit.removeEventListener('click', onSubmit);
      if (progressModalWasOpen) {
        openModal('integration-progress-modal', { dismissable: false });
      } else {
        closeModal();
      }
      const corrections = new Map();
      for (const [modeleLigneId, select] of selects) corrections.set(modeleLigneId, select.value || null);
      resolve(corrections);
    }
    mappingCorrectionSubmit.addEventListener('click', onSubmit);
    openModal('mapping-correction-modal', { dismissable: false });
  });
}

// Bouton "Inspecter" (fiches avec mapping nécessaire ou champs en trop) : montre le
// diff avant de choisir, plutôt qu'intégrer/rejeter à l'aveugle depuis la liste. Le
// mappage choisi ici est mémorisé sur l'item (item.mappageCorrections) pour que
// l'intégration elle-même ne redemande pas la même chose.
function ouvrirInspectionFiche(item, classe) {
  inspectionFicheTitle.textContent = `Inspection — ${item.data.titre || '(sans titre)'} (${item.data.date})`;
  inspectionFicheDetail.innerHTML = '';
  inspectionFicheMappingList.innerHTML = '';

  const modele = modeles.find((m) => m.id === item.targetModeleId);
  const modeleTableau = modele?.contenuSchema.blocks.find((b) => b.type === 'tableau');
  const ancienTableau = item.data.contenuSchema.blocks.find((b) => b.type === 'tableau');
  const selects = new Map();

  if (modeleTableau && ancienTableau) {
    const { modeleLignesNonMappees, ancienneLignesDisponibles } = analyserMappageTableau(ancienTableau, modeleTableau);

    if (classe === 'champs-supplementaire') {
      const p = document.createElement('p');
      p.textContent = `Champs en trop dans la fiche, seront ajoutés en texte brut à l'entrée : ${ancienneLignesDisponibles.map((l) => l.nom).join(', ')}.`;
      inspectionFicheDetail.appendChild(p);
    } else if (classe === 'mapping-necessaire') {
      const p = document.createElement('p');
      p.textContent = 'Champs du modèle sans correspondance automatique : relie-les à un champ libre de la fiche si besoin.';
      inspectionFicheDetail.appendChild(p);

      const dejaChoisi = item.mappageCorrections ?? new Map();
      for (const ligne of modeleLignesNonMappees) {
        const li = document.createElement('li');
        const label = document.createElement('label');
        label.textContent = ligne.nom;
        li.appendChild(label);

        const select = document.createElement('select');
        select.setAttribute('aria-label', `Champ importé relié à « ${ligne.nom} »`);
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Laisser vide';
        select.appendChild(emptyOption);
        for (const ancienneLigne of ancienneLignesDisponibles) {
          const option = document.createElement('option');
          option.value = ancienneLigne.id;
          option.textContent = ancienneLigne.nom;
          select.appendChild(option);
        }
        select.value = dejaChoisi.get(ligne.id) ?? '';
        li.appendChild(select);
        inspectionFicheMappingList.appendChild(li);
        selects.set(ligne.id, select);
      }
    }
  }

  function cleanup() {
    inspectionFicheIntegrerButton.removeEventListener('click', onIntegrer);
    inspectionFicheRejeterButton.removeEventListener('click', onRejeter);
  }
  function onIntegrer() {
    cleanup();
    if (selects.size > 0) {
      const corrections = new Map();
      for (const [ligneId, select] of selects) if (select.value) corrections.set(ligneId, select.value);
      item.mappageCorrections = corrections;
    }
    closeModal();
    integrerFichierEnAttente(item);
  }
  function onRejeter() {
    cleanup();
    closeModal();
    rejeterFichier(item);
  }
  inspectionFicheIntegrerButton.addEventListener('click', onIntegrer);
  inspectionFicheRejeterButton.addEventListener('click', onRejeter);

  openModal('inspection-fiche-modal');
}

function trouverAncienBlock(ancienSchema, block) {
  return (
    ancienSchema.blocks.find((b) => b.type === block.type && b.titre === block.titre) ??
    ancienSchema.blocks.find((b) => b.type === block.type) ??
    null
  );
}

// Correspondances automatiques par nom de ligne entre le tableau importé et celui du
// modèle. Ce qui ne matche pas par nom (clés différentes pour la même mesure) reste à
// trancher manuellement : cf demanderCorrectionMappage.
function analyserMappageTableau(ancienBlock, modeleBlock) {
  const correspondances = new Map(); // ligne du modèle (id) -> ligne importée (id)
  const ancienneLignesUtilisees = new Set();
  for (const ligne of modeleBlock.lignes) {
    const ancienneLigne = ancienBlock.lignes.find((l) => l.nom === ligne.nom);
    if (ancienneLigne) {
      correspondances.set(ligne.id, ancienneLigne.id);
      ancienneLignesUtilisees.add(ancienneLigne.id);
    }
  }
  return {
    correspondances,
    modeleLignesNonMappees: modeleBlock.lignes.filter((l) => !correspondances.has(l.id)),
    ancienneLignesDisponibles: ancienBlock.lignes.filter((l) => !ancienneLignesUtilisees.has(l.id)),
  };
}

// Applique les correspondances (auto + corrections manuelles) et renvoie en plus les
// lignes importées jamais reliées — pour les reporter en texte brut dans l'entrée.
function appliquerMappageTableau(ancienBlock, ancienVals, modeleBlock, correspondances) {
  const valeurs = {};
  for (const ligne of modeleBlock.lignes) {
    const ancienneLigne = ancienBlock.lignes.find((l) => l.id === correspondances.get(ligne.id));
    const rowVals = {};
    // Le repli sur la 1re colonne importée ne vaut que pour la 1re colonne du modèle (la
    // mesure elle-même, souvent nommée différemment) — sinon une colonne du modèle sans
    // équivalent nommé (ex. "Commentaire") recopierait à tort la valeur de "Valeur".
    modeleBlock.colonnes.forEach((colonne, index) => {
      const ancienneColonne =
        ancienBlock.colonnes.find((c) => c.nom === colonne.nom) ?? (index === 0 ? ancienBlock.colonnes[0] : null);
      rowVals[colonne.id] = ancienneLigne && ancienneColonne ? (ancienVals[ancienneLigne.id]?.[ancienneColonne.id] ?? '') : '';
    });
    valeurs[ligne.id] = rowVals;
  }
  const lignesUtilisees = new Set(correspondances.values());
  const nonUtilisees = ancienBlock.lignes
    .filter((l) => !lignesUtilisees.has(l.id))
    .map((l) => ({ nom: l.nom, valeur: Object.values(ancienVals[l.id] ?? {}).filter(Boolean).join(' / ') }));
  // Une ligne du modèle reste vide si aucune colonne n'a reçu de valeur (pas de
  // correspondance, ou correspondance vers une case elle-même vide) — sert à décider le
  // statut de l'entrée après intégration (cf remapContenuVersModele).
  const aUneLigneVide = modeleBlock.lignes.some((ligne) => Object.values(valeurs[ligne.id]).every((v) => v === ''));
  return { valeurs, nonUtilisees, aUneLigneVide };
}

// correctionsExternes : déjà choisies via le bouton Inspecter (Map ligne-modèle ->
// ligne-importée) — évite de redemander le mappage pendant l'intégration elle-même.
// Si absentes (intégration groupée sans passer par l'inspection), retombe sur la
// popup de correction automatique, comme avant.
async function remapContenuVersModele(ancienSchema, ancienValeurs, modele, correctionsExternes) {
  const schema = cloneContenuSchema(modele.contenuSchema);
  const valeurs = structuredClone(modele.contenuValeursParDefaut ?? {});
  const nonMappees = [];
  let champsVides = false;

  for (const block of schema.blocks) {
    const ancienBlock = trouverAncienBlock(ancienSchema, block);
    if (!ancienBlock) continue;
    if (block.type === 'texte') {
      valeurs[block.id] = ancienValeurs[ancienBlock.id] ?? '';
    } else if (block.type === 'tableau') {
      const ancienVals = ancienValeurs[ancienBlock.id] ?? {};
      const { correspondances, modeleLignesNonMappees, ancienneLignesDisponibles } = analyserMappageTableau(ancienBlock, block);
      if (modeleLignesNonMappees.length > 0 && ancienneLignesDisponibles.length > 0) {
        const corrections = correctionsExternes ?? (await demanderCorrectionMappage(modeleLignesNonMappees, ancienneLignesDisponibles));
        for (const [modeleLigneId, ancienneLigneId] of corrections) {
          if (ancienneLigneId) correspondances.set(modeleLigneId, ancienneLigneId);
        }
      }
      const { valeurs: lignesVals, nonUtilisees, aUneLigneVide } = appliquerMappageTableau(ancienBlock, ancienVals, block, correspondances);
      valeurs[block.id] = lignesVals;
      nonMappees.push(...nonUtilisees);
      if (aUneLigneVide) champsVides = true;
    }
  }

  // Les clés importées jamais reliées à un champ du modèle (ni automatiquement, ni par
  // l'utilisateur) ne doivent pas disparaître : elles sont ajoutées en texte brut plutôt
  // que silencieusement perdues.
  if (nonMappees.length > 0) {
    const brut = nonMappees.map(({ nom, valeur }) => `${nom} : ${valeur}`).join('\n');
    const texteBlock = schema.blocks.find((b) => b.type === 'texte');
    if (texteBlock) {
      valeurs[texteBlock.id] = [valeurs[texteBlock.id], brut].filter(Boolean).join('\n\n');
    } else {
      const id = crypto.randomUUID();
      schema.blocks.push({ id, type: 'texte', titre: 'Champs non reliés au modèle' });
      schema.order.push(id);
      valeurs[id] = brut;
    }
  }

  return { contenuSchema: schema, contenuValeurs: valeurs, champsVides };
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

let integrationLoading = false;
let integrationTotal = 0;
// Groupes (par clé de titre généralisée, ou "clé::sous-groupe" pour un sous-groupe)
// repliés par l'utilisateur — persiste tant que la clé ne change pas, même quand la
// liste se re-rend après une sélection.
const collapsedGroupKeys = new Set();
// Une fois choisi au niveau du groupe, le sélecteur individuel correspondant (tableau
// ou modèle) disparaît pour chaque fiche du groupe — redondant une fois la destination
// commune fixée. Remis à zéro seulement par un rechargement complet de la liste.
const groupeDashboardChoisi = new Set();
const groupeModeleChoisi = new Set();
// Un seul essai de détection auto par groupe (pas à chaque re-rendu), pour ne pas
// réappliquer le modèle détecté après que l'utilisateur l'ait explicitement remis à
// "Garder tel quel".
const groupeModeleAutoDetecteTente = new Set();

function appendDashboardOptions(select, dashboardsActifs, placeholder) {
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = placeholder;
  select.appendChild(emptyOption);
  for (const dashboard of dashboardsActifs) {
    const option = document.createElement('option');
    option.value = dashboard.id;
    option.textContent = dashboard.nom;
    select.appendChild(option);
  }
}

function appendModeleOptions(select, placeholder) {
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = placeholder;
  select.appendChild(emptyOption);
  for (const modele of modeles) {
    const option = document.createElement('option');
    option.value = modele.id;
    option.textContent = modele.nom;
    select.appendChild(option);
  }
}

function renderIntegrationItemRow(item, dashboardsActifs, { hideDashboardSelect = false, hideModeleSelect = false } = {}) {
  const li = document.createElement('li');

  const nom = document.createElement('p');
  nom.textContent = item.error ? `${item.name} — ${item.error}` : `${item.data.titre || '(sans titre)'} (${item.data.date})`;
  li.appendChild(nom);

  // Détail (champs en trop / introuvables) : visible avant de choisir d'intégrer ou de
  // rejeter, pas seulement après coup via le texte brut ajouté à l'intégration.
  const { classe, detail } = item.error ? { classe: null, detail: null } : classerFiche(item);
  // Mapping nécessaire ou champs en trop : décision à prendre en connaissance de cause,
  // via l'inspection, plutôt qu'intégrer/rejeter à l'aveugle depuis la liste.
  const besoinInspection = classe === 'mapping-necessaire' || classe === 'champs-supplementaire';
  if (detail) {
    const detailEl = document.createElement('p');
    detailEl.className = 'integration-item-detail';
    detailEl.textContent = detail;
    li.appendChild(detailEl);
  }

  const actions = document.createElement('div');
  actions.className = 'partage-actions';

  let integrerButton;

  if (hideDashboardSelect) {
    const dashboardNom = dashboardsActifs.find((d) => d.id === item.targetDashboardId)?.nom ?? '';
    const span = document.createElement('span');
    span.textContent = dashboardNom;
    actions.appendChild(span);
  } else {
    const dashboardSelect = document.createElement('select');
    dashboardSelect.setAttribute('aria-label', 'Tableau de bord de destination');
    appendDashboardOptions(dashboardSelect, dashboardsActifs, 'Choisir un tableau…');
    dashboardSelect.value = item.targetDashboardId ?? '';
    dashboardSelect.disabled = Boolean(item.error);
    dashboardSelect.addEventListener('change', () => {
      item.targetDashboardId = dashboardSelect.value || null;
      integrerButton.disabled = Boolean(item.error) || !item.targetDashboardId;
    });
    actions.appendChild(dashboardSelect);
  }

  if (hideModeleSelect) {
    const modeleNomTexte = modeles.find((m) => m.id === item.targetModeleId)?.nom ?? 'Garder tel quel';
    const span = document.createElement('span');
    span.textContent = modeleNomTexte;
    actions.appendChild(span);
  } else {
    const modeleSelect = document.createElement('select');
    modeleSelect.setAttribute('aria-label', 'Lier au modèle');
    appendModeleOptions(modeleSelect, 'Garder tel quel');
    modeleSelect.value =
      item.targetModeleId ?? (modeles.some((m) => m.id === item.data?.modeleId) ? item.data.modeleId : '');
    modeleSelect.disabled = Boolean(item.error);
    modeleSelect.addEventListener('change', () => {
      item.targetModeleId = modeleSelect.value || null;
    });
    actions.appendChild(modeleSelect);
  }

  if (besoinInspection) {
    const inspecterButton = document.createElement('button');
    inspecterButton.type = 'button';
    inspecterButton.textContent = 'Inspecter';
    inspecterButton.disabled = Boolean(item.error) || !item.targetDashboardId;
    inspecterButton.addEventListener('click', () => ouvrirInspectionFiche(item, classe));
    actions.appendChild(inspecterButton);
    // Pas de bouton Intégrer direct ici : nécessaire seulement pour satisfaire la
    // fermeture de la variable `integrerButton` utilisée par le select de tableau plus haut.
    integrerButton = inspecterButton;
  } else {
    integrerButton = document.createElement('button');
    integrerButton.type = 'button';
    integrerButton.textContent = 'Intégrer';
    integrerButton.disabled = Boolean(item.error) || !item.targetDashboardId;
    integrerButton.addEventListener('click', () => integrerFichierEnAttente(item));
    actions.appendChild(integrerButton);

    const rejeterButton = document.createElement('button');
    rejeterButton.type = 'button';
    rejeterButton.className = 'button-danger';
    rejeterButton.textContent = 'Rejeter';
    rejeterButton.addEventListener('click', () => rejeterFichierEnAttente(item));
    actions.appendChild(rejeterButton);
  }

  li.appendChild(actions);
  return li;
}

// Classe une fiche par rapport au modèle choisi pour elle, pour le sous-groupage dans
// le groupe de titre : 'correspondante' (tout matche), 'champs-supplementaire' (tous
// les champs du modèle sont trouvés, mais la fiche en a d'autres en trop) ou
// 'mapping-necessaire' (des champs du modèle sont introuvables ET des champs libres de
// la fiche pourraient leur être reliés manuellement). classe null = pas de modèle choisi
// pour cette fiche, ou rien à comparer (pas de tableau des deux côtés). `detail` : à
// afficher sur la fiche pour voir en un coup d'œil ce qui est en trop/manquant avant de
// choisir d'intégrer ou de rejeter.
function classerFiche(item) {
  if (item.error || !item.targetModeleId) return { classe: null, detail: null };
  const modele = modeles.find((m) => m.id === item.targetModeleId);
  const modeleTableau = modele?.contenuSchema.blocks.find((b) => b.type === 'tableau');
  const ancienTableau = item.data.contenuSchema.blocks.find((b) => b.type === 'tableau');
  if (!modele || !modeleTableau || !ancienTableau) return { classe: 'correspondante', detail: null };
  const { modeleLignesNonMappees, ancienneLignesDisponibles } = analyserMappageTableau(ancienTableau, modeleTableau);
  const manquants = modeleLignesNonMappees.map((l) => l.nom);
  const enTrop = ancienneLignesDisponibles.map((l) => l.nom);
  if (manquants.length === 0 && enTrop.length === 0) return { classe: 'correspondante', detail: null };
  if (manquants.length === 0) return { classe: 'champs-supplementaire', detail: `Champs en trop : ${enTrop.join(', ')}` };
  if (enTrop.length > 0) {
    return {
      classe: 'mapping-necessaire',
      detail: `Champs du modèle introuvables : ${manquants.join(', ')} — champs libres : ${enTrop.join(', ')}`,
    };
  }
  return { classe: 'correspondante', detail: `Champs du modèle sans valeur : ${manquants.join(', ')}` };
}

// Clé spéciale pour regrouper à part les fichiers invalides (pas de titre à
// généraliser, et les actions de groupe — modèle, intégration groupée — n'ont pas
// de sens pour eux).
const ERROR_GROUP_KEY = Symbol('integration-error-group');

function groupIntegrationFiles(files) {
  const groups = new Map();
  for (const item of files) {
    const key = item.error ? ERROR_GROUP_KEY : titreGroupKey(item.data.titre);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function renderIntegrationList() {
  if (integrationFiles.length === 0) {
    integrationCount.textContent = integrationLoading ? `Chargement… 0/${integrationTotal}` : '';
    renderListMessage(integrationList, integrationLoading ? 'Chargement…' : 'Aucune entrée en attente d\'intégration.');
    return;
  }
  integrationCount.textContent = integrationLoading
    ? `Chargement… ${integrationFiles.length}/${integrationTotal}`
    : `${integrationFiles.length} fiche(s) à intégrer.`;
  integrationList.innerHTML = '';
  const dashboardsActifs = dashboards.filter((d) => !d.archive);
  for (const [key, items] of groupIntegrationFiles(integrationFiles)) {
    const groupLi = document.createElement('li');
    groupLi.className = 'integration-group';

    const collapsed = collapsedGroupKeys.has(key);

    const header = document.createElement('div');
    header.className = 'integration-group-header';

    const titreRow = document.createElement('div');
    titreRow.className = 'integration-group-title-row';

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'integration-group-toggle';
    toggleButton.setAttribute('aria-expanded', String(!collapsed));
    toggleButton.setAttribute('aria-label', collapsed ? 'Déplier le groupe' : 'Replier le groupe');
    toggleButton.textContent = collapsed ? '▸' : '▾';
    toggleButton.addEventListener('click', () => {
      if (collapsedGroupKeys.has(key)) collapsedGroupKeys.delete(key);
      else collapsedGroupKeys.add(key);
      renderIntegrationList();
    });
    titreRow.appendChild(toggleButton);

    const titre = document.createElement('p');
    titre.textContent =
      key === ERROR_GROUP_KEY
        ? `Fichiers en erreur (${items.length})`
        : `${key || '(sans titre)'} — ${items.length} fiche(s)`;
    titreRow.appendChild(titre);
    header.appendChild(titreRow);

    if (key !== ERROR_GROUP_KEY) {
      // Si au moins une fiche du groupe porte déjà un modeleId connu (import déjà lié à
      // un modèle existant), le proposer par défaut pour tout le groupe plutôt que de
      // repartir sur "Garder tel quel" — un seul essai, pour ne pas revenir dessus après
      // un choix explicite de l'utilisateur.
      // Attendre la fin du chargement par lots : sinon le premier lot (incomplet) ne
      // trouverait pas encore la fiche porteuse du modeleId et verrouillerait "aucun
      // modèle détecté" avant même que les lots suivants n'arrivent.
      if (!groupeModeleAutoDetecteTente.has(key) && !integrationLoading) {
        groupeModeleAutoDetecteTente.add(key);
        const modeleIdDetecte = items.map((i) => i.data?.modeleId).find((id) => id && modeles.some((m) => m.id === id));
        if (modeleIdDetecte && !groupeModeleChoisi.has(key)) {
          for (const item of items) {
            if (item.targetModeleId === undefined) item.targetModeleId = modeleIdDetecte;
          }
          groupeModeleChoisi.add(key);
        }
      }

      const groupActions = document.createElement('div');
      groupActions.className = 'partage-actions';

      const groupDashboardSelect = document.createElement('select');
      groupDashboardSelect.setAttribute('aria-label', 'Tableau de bord de destination pour le groupe');
      appendDashboardOptions(groupDashboardSelect, dashboardsActifs, 'Choisir un tableau pour le groupe…');
      groupDashboardSelect.addEventListener('change', () => {
        for (const item of items) item.targetDashboardId = groupDashboardSelect.value || null;
        if (groupDashboardSelect.value) groupeDashboardChoisi.add(key);
        else groupeDashboardChoisi.delete(key);
        renderIntegrationList();
      });
      groupActions.appendChild(groupDashboardSelect);

      const groupModeleSelect = document.createElement('select');
      groupModeleSelect.setAttribute('aria-label', 'Lier le groupe à un modèle');
      appendModeleOptions(groupModeleSelect, 'Garder tel quel');
      groupModeleSelect.value = groupeModeleChoisi.has(key) ? (items.find((i) => i.targetModeleId)?.targetModeleId ?? '') : '';
      groupModeleSelect.addEventListener('change', () => {
        for (const item of items) item.targetModeleId = groupModeleSelect.value || null;
        if (groupModeleSelect.value) groupeModeleChoisi.add(key);
        else groupeModeleChoisi.delete(key);
        renderIntegrationList();
      });
      groupActions.appendChild(groupModeleSelect);

      const integrerGroupeButton = document.createElement('button');
      integrerGroupeButton.type = 'button';
      integrerGroupeButton.textContent = 'Intégrer le groupe';
      integrerGroupeButton.addEventListener('click', () => integrerGroupe(items));
      groupActions.appendChild(integrerGroupeButton);

      const rejeterGroupeButton = document.createElement('button');
      rejeterGroupeButton.type = 'button';
      rejeterGroupeButton.className = 'button-danger';
      rejeterGroupeButton.textContent = 'Rejeter le groupe';
      rejeterGroupeButton.addEventListener('click', () => rejeterGroupe(items));
      groupActions.appendChild(rejeterGroupeButton);

      header.appendChild(groupActions);
    }
    groupLi.appendChild(header);

    const body = document.createElement('div');
    body.hidden = collapsed;

    // Sous-groupage uniquement si les fiches du groupe ne sont pas toutes dans le même
    // cas (ex. toutes "correspondante", ou aucun modèle choisi nulle part) : pas de
    // sous-titres inutiles tant qu'il n'y a rien à distinguer.
    const classements = key === ERROR_GROUP_KEY ? [] : items.map((item) => ({ item, classe: classerFiche(item).classe }));
    const sousGroupageUtile = key !== ERROR_GROUP_KEY && new Set(classements.map((c) => c.classe)).size > 1;

    const itemRowOptions = {
      hideDashboardSelect: groupeDashboardChoisi.has(key),
      hideModeleSelect: groupeModeleChoisi.has(key),
    };

    function appendItemList(container, itemsASuivre) {
      const itemList = document.createElement('ul');
      itemList.className = 'card-list';
      for (const item of itemsASuivre) itemList.appendChild(renderIntegrationItemRow(item, dashboardsActifs, itemRowOptions));
      container.appendChild(itemList);
    }

    if (!sousGroupageUtile) {
      appendItemList(body, items);
    } else {
      const SOUS_GROUPES = [
        { classe: 'correspondante', label: 'Correspondante' },
        { classe: 'champs-supplementaire', label: 'Champs supplémentaire' },
        { classe: 'mapping-necessaire', label: 'Mapping nécessaire' },
        { classe: null, label: 'Garder tel quel' },
      ];
      for (const { classe, label } of SOUS_GROUPES) {
        const subItems = classements.filter((c) => c.classe === classe).map((c) => c.item);
        if (subItems.length === 0) continue;
        const subKey = `${String(key)}::${classe}`;
        const subCollapsed = collapsedGroupKeys.has(subKey);

        const subHeader = document.createElement('div');
        subHeader.className = 'integration-subgroup-header';

        const subToggleButton = document.createElement('button');
        subToggleButton.type = 'button';
        subToggleButton.className = 'integration-group-toggle';
        subToggleButton.setAttribute('aria-expanded', String(!subCollapsed));
        subToggleButton.setAttribute('aria-label', subCollapsed ? 'Déplier le sous-groupe' : 'Replier le sous-groupe');
        subToggleButton.textContent = subCollapsed ? '▸' : '▾';
        subToggleButton.addEventListener('click', () => {
          if (collapsedGroupKeys.has(subKey)) collapsedGroupKeys.delete(subKey);
          else collapsedGroupKeys.add(subKey);
          renderIntegrationList();
        });
        subHeader.appendChild(subToggleButton);

        const subTitre = document.createElement('p');
        subTitre.textContent = `${label} (${subItems.length})`;
        subHeader.appendChild(subTitre);

        const subActions = document.createElement('div');
        subActions.className = 'partage-actions';

        const integrerSousGroupeButton = document.createElement('button');
        integrerSousGroupeButton.type = 'button';
        integrerSousGroupeButton.textContent = 'Intégrer le sous-groupe';
        integrerSousGroupeButton.addEventListener('click', () => integrerGroupe(subItems));
        subActions.appendChild(integrerSousGroupeButton);

        const rejeterSousGroupeButton = document.createElement('button');
        rejeterSousGroupeButton.type = 'button';
        rejeterSousGroupeButton.className = 'button-danger';
        rejeterSousGroupeButton.textContent = 'Rejeter le sous-groupe';
        rejeterSousGroupeButton.addEventListener('click', () => rejeterGroupe(subItems));
        subActions.appendChild(rejeterSousGroupeButton);

        subHeader.appendChild(subActions);

        body.appendChild(subHeader);

        const subBody = document.createElement('div');
        subBody.hidden = subCollapsed;
        appendItemList(subBody, subItems);
        body.appendChild(subBody);
      }
    }
    groupLi.appendChild(body);

    integrationList.appendChild(groupLi);
  }
}

const INTEGRATION_BATCH_SIZE = 5;

async function loadIntegrationFiles() {
  integrationError.textContent = '';
  integrationFiles = [];
  integrationTotal = 0;
  integrationLoading = true;
  renderIntegrationList();
  try {
    const files = await listIntegrationFiles();
    integrationTotal = files.length;
    const dashboardsActifs = dashboards.filter((d) => !d.archive);
    // Un seul tableau de bord : pas d'ambiguïté possible, on le présélectionne.
    // Plusieurs : le sélecteur reste vide pour forcer un choix explicite.
    const defaultDashboardId = dashboardsActifs.length === 1 ? dashboardsActifs[0].id : null;
    // Par lots pour afficher les résultats au fur et à mesure plutôt que d'attendre
    // que tous les fichiers (potentiellement nombreux) soient chargés d'un coup.
    for (let i = 0; i < files.length; i += INTEGRATION_BATCH_SIZE) {
      const batch = files.slice(i, i + INTEGRATION_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          try {
            const data = await loadIntegrationFile(file.id);
            const error = validateImportedEntry(data);
            return { id: file.id, name: file.name, data, error, targetDashboardId: defaultDashboardId };
          } catch (err) {
            return { id: file.id, name: file.name, data: null, error: err.message, targetDashboardId: defaultDashboardId };
          }
        }),
      );
      integrationFiles = [...integrationFiles, ...batchResults];
      renderIntegrationList();
    }
  } catch (error) {
    integrationFiles = [];
    integrationError.textContent =
      error.message === LOGBOOK_FOLDER_NOT_CONNECTED
        ? 'Connecte d\'abord ton dossier Logbook avec le bouton ci-dessus.'
        : `Échec du chargement : ${error.message}`;
  }
  integrationLoading = false;
  renderIntegrationList();
}

async function integrerFichierEnAttente(item) {
  integrationError.textContent = '';
  if (!item.targetDashboardId) {
    integrationError.textContent = 'Choisis un tableau de bord de destination.';
    return;
  }
  try {
    let data = item.data;
    if (item.targetModeleId) {
      const modele = modeles.find((m) => m.id === item.targetModeleId);
      if (modele) {
        const classe = classerFiche(item).classe;
        const { contenuSchema, contenuValeurs, champsVides } = await remapContenuVersModele(
          data.contenuSchema,
          data.contenuValeurs,
          modele,
          item.mappageCorrections,
        );
        // Un champ du modèle resté vide prime sur tout le reste (l'entrée n'est pas
        // utilisable telle quelle) ; sinon, une fiche qui a eu besoin d'un mappage ou qui
        // avait des champs en trop mérite une relecture même si tout a pu être rempli.
        let statut = data.statut;
        if (champsVides) statut = 'A Compléter';
        else if (classe === 'champs-supplementaire' || classe === 'mapping-necessaire') statut = 'A Valider';
        data = { ...data, modeleId: modele.id, contenuSchema, contenuValeurs, statut };
      }
    }
    if (item.targetDashboardId === activeDashboardId) {
      if (entries.some((e) => e.id === data.id)) {
        integrationError.textContent = 'Une entrée avec ce id existe déjà dans le journal.';
        return;
      }
      const previousEntries = entries;
      entries = [...entries, data];
      try {
        await saveEntries(entries);
      } catch (error) {
        entries = previousEntries;
        throw error;
      }
      renderEntries();
    } else {
      const targetEntries = await loadEntries(item.targetDashboardId);
      if (targetEntries.some((e) => e.id === data.id)) {
        integrationError.textContent = 'Une entrée avec ce id existe déjà dans ce tableau de bord.';
        return;
      }
      await saveEntries([...targetEntries, data], item.targetDashboardId);
    }
    await deleteIntegrationFile(item.id);
    integrationFiles = integrationFiles.filter((f) => f.id !== item.id);
    renderIntegrationList();
  } catch (error) {
    integrationError.textContent = `Échec de l'intégration : ${error.message}`;
  }
}

// Popup non fermable pendant la boucle : la liste d'intégration et les entrées sont
// mutées en mémoire au fil des items, une action concurrente (changer de tableau de
// bord, éditer une entrée) pendant ce traitement lirait/écrirait un état à moitié à jour.
async function traiterParLots(items, titre, traiterItem) {
  openModal('integration-progress-modal', { dismissable: false });
  integrationProgressTitle.textContent = titre;
  integrationProgressBar.max = items.length;
  integrationProgressBar.value = 0;
  integrationProgressCount.textContent = `0 / ${items.length}`;
  for (const item of items) {
    await traiterItem(item);
    integrationProgressBar.value += 1;
    integrationProgressCount.textContent = `${integrationProgressBar.value} / ${items.length}`;
  }
  closeModal();
}

async function rejeterFichier(item) {
  integrationError.textContent = '';
  try {
    await deleteIntegrationFile(item.id);
    integrationFiles = integrationFiles.filter((f) => f.id !== item.id);
    renderIntegrationList();
  } catch (error) {
    integrationError.textContent = `Échec du rejet : ${error.message}`;
  }
}

async function rejeterFichierEnAttente(item) {
  if (!window.confirm(`Rejeter définitivement « ${item.name} » sans l'intégrer ?`)) return;
  await rejeterFichier(item);
}

// Une seule confirmation pour tout le groupe plutôt qu'une popup par fiche.
async function rejeterGroupe(items) {
  if (!window.confirm(`Rejeter définitivement ces ${items.length} fiche(s) sans les intégrer ?`)) return;
  await traiterParLots([...items], 'Rejet en cours…', rejeterFichier);
}

async function integrerGroupe(items) {
  const eligibles = items.filter((item) => !item.error && item.targetDashboardId);
  if (eligibles.length === 0) return;
  await traiterParLots(eligibles, 'Intégration en cours…', integrerFichierEnAttente);
}

// Id du dossier Application détecté par probeLogbookFolder (cf openLogbookFolderModal),
// pour ouvrir le Picker directement dedans plutôt qu'à la racine du Drive.
let probedAppFolderId = null;

// Avant d'afficher la popup : sonde si Application/Logbook est déjà visible de
// l'app (créé par elle plus tôt, ou déjà connecté une fois). Si on retrouve sans
// ambiguïté le dossier (même nom, même emplacement attendu), on s'y reconnecte
// directement sans bloquer sur la popup — celle-ci ne reste nécessaire que pour
// le vrai premier usage (rien trouvé, cf probeLogbookFolder dans drive.js : un
// dossier existant mais jamais vu par l'app reste indétectable, d'où le bouton
// Créer qui reste la solution de repli dans ce cas).
async function openLogbookFolderModal() {
  logbookFolderModalError.textContent = '';
  let found = false;
  try {
    const probe = await probeLogbookFolder();
    found = probe.found;
    probedAppFolderId = probe.appFolderId;
    if (found) {
      await connectLogbookFolder(probe.logbookFolderId);
      await loadAccountAndDashboards();
      if (mainView === 'integration') await loadIntegrationFiles();
      return;
    }
  } catch {
    probedAppFolderId = null;
  }
  logbookFolderConnectButton.hidden = !found;
  logbookFolderCreateButton.hidden = found;
  openModal('logbook-folder-modal');
}

// Toutes les données de l'app (dashboards, entrées, modèles, entries_to_import)
// dépendent désormais du dossier Logbook connecté (cf getAppFolderId dans
// drive.js) : (re)connecter un dossier doit donc tout recharger depuis ce
// nouveau dossier, pas juste la liste d'intégration.
logbookFolderConnectButton.addEventListener('click', async () => {
  logbookFolderModalError.textContent = '';
  try {
    const folderId = await pickFolder(getAccessToken(), probedAppFolderId);
    await connectLogbookFolder(folderId);
    closeModal();
    await loadAccountAndDashboards();
    if (mainView === 'integration') await loadIntegrationFiles();
  } catch (error) {
    logbookFolderModalError.textContent = error.message;
  }
});

// Pas de dossier Logbook existant à pointer (premier usage) : l'app crée et
// connecte elle-même Application/Logbook, sans passer par le Picker.
logbookFolderCreateButton.addEventListener('click', async () => {
  logbookFolderModalError.textContent = '';
  try {
    await createLogbookFolder();
    closeModal();
    await loadAccountAndDashboards();
  } catch (error) {
    logbookFolderModalError.textContent = error.message;
  }
});

settingsChangeLogbookFolderButton.addEventListener('click', openLogbookFolderModal);

function closeEntryImportMenu() {
  entryImportMenu.hidden = true;
  entryImportButton.setAttribute('aria-expanded', 'false');
}

function toggleEntryImportMenu() {
  const willOpen = entryImportMenu.hidden;
  entryImportMenu.hidden = !willOpen;
  entryImportButton.setAttribute('aria-expanded', String(willOpen));
}

entryImportButton.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleEntryImportMenu();
});

document.addEventListener('click', (event) => {
  if (!entryImportMenu.hidden && !event.target.closest('#entry-import-wrapper')) closeEntryImportMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !entryImportMenu.hidden) closeEntryImportMenu();
});

entryImportUploadButton.addEventListener('click', () => {
  closeEntryImportMenu();
  entryImportFileInput.click();
});

// Importé depuis le journal d'un jdb précis (bouton "Importer" à côté de "+
// Nouvelle entrée") : contrairement à la liste d'attente (fichiers déposés sur le
// Drive par un tiers, où le jdb cible est ambigu), ici le contexte est déjà celui
// du jdb affiché, donc l'entrée y est ajoutée directement, sans détour.
async function integrerEntreeDirecte(data) {
  entryImportError.textContent = '';
  const error = validateImportedEntry(data);
  if (error) {
    entryImportError.textContent = error;
    return;
  }
  if (entries.some((e) => e.id === data.id)) {
    entryImportError.textContent = 'Une entrée avec ce id existe déjà dans ce journal.';
    return;
  }
  const previousEntries = entries;
  entries = [...entries, data];
  try {
    await saveEntries(entries);
    await syncPartages();
    renderEntries();
  } catch (err) {
    entries = previousEntries;
    entryImportError.textContent = `Échec de l'import : ${err.message}`;
  }
}

entryImportFileInput.addEventListener('change', async () => {
  const file = entryImportFileInput.files[0];
  entryImportFileInput.value = '';
  if (!file) return;
  entryImportError.textContent = '';
  try {
    await integrerEntreeDirecte(JSON.parse(await file.text()));
  } catch (error) {
    entryImportError.textContent = `Fichier illisible : ${error.message}`;
  }
});

entryImportDriveButton.addEventListener('click', async () => {
  closeEntryImportMenu();
  entryImportError.textContent = '';
  try {
    const fileId = await pickOwnJsonFile(getAccessToken());
    await integrerEntreeDirecte(await loadSharedFile(fileId));
  } catch (error) {
    entryImportError.textContent = error.message;
  }
});

function renderMainView() {
  entriesSection.hidden = true;
  journalPartageSection.hidden = true;
  modelesSection.hidden = true;
  integrationSection.hidden = true;
  settingsSection.hidden = true;
  partagesSection.hidden = true;
  partagesRecusSection.hidden = true;

  // Les pages explicites (sidebar) priment sur le journal partagé affiché : sinon,
  // cliquer Paramètres/Partage/Modèles/Accès depuis la vue d'un journal reçu ne fait
  // rien, puisque ce bloc resterait sur journalPartageSection.
  if (mainView === 'modeles') {
    modelesSection.hidden = false;
  } else if (mainView === 'integration') {
    integrationSection.hidden = false;
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
  onOpenIntegration: () => {
    mainView = 'integration';
    renderMainView();
    loadIntegrationFiles();
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

function downloadJson(data, fileName) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

modelesExportButton.addEventListener('click', () => {
  downloadJson(modeles, `logbook-templates-${new Date().toISOString().slice(0, 10)}.json`);
});

dashboardsExportButton.addEventListener('click', () => {
  downloadJson(dashboards, `logbook-dashboards-${new Date().toISOString().slice(0, 10)}.json`);
});

modelesImportButton.addEventListener('click', () => modelesImportFileInput.click());

modelesImportFileInput.addEventListener('change', async () => {
  const file = modelesImportFileInput.files[0];
  modelesImportFileInput.value = '';
  if (!file) return;
  modeleError.textContent = '';
  let imported;
  try {
    imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error('Le fichier ne contient pas un tableau JSON.');
  } catch (error) {
    modeleError.textContent = `Fichier illisible : ${error.message}`;
    return;
  }
  if (!window.confirm(`Remplacer les ${modeles.length} modèle(s) actuel(s) par les ${imported.length} du fichier ?`)) return;
  const previousModeles = modeles;
  modeles = imported;
  renderModeles();
  renderEntryNewMenu();
  try {
    await saveModeles(modeles);
  } catch (error) {
    modeles = previousModeles;
    renderModeles();
    renderEntryNewMenu();
    modeleError.textContent = `Échec de l'import : ${error.message}`;
  }
});

dashboardsImportButton.addEventListener('click', () => dashboardsImportFileInput.click());

dashboardsImportFileInput.addEventListener('change', async () => {
  const file = dashboardsImportFileInput.files[0];
  dashboardsImportFileInput.value = '';
  if (!file) return;
  sidebarDashboardsError.textContent = '';
  let imported;
  try {
    imported = JSON.parse(await file.text());
    if (!Array.isArray(imported)) throw new Error('Le fichier ne contient pas un tableau JSON.');
  } catch (error) {
    sidebarDashboardsError.textContent = `Fichier illisible : ${error.message}`;
    return;
  }
  if (!window.confirm(`Remplacer les ${dashboards.length} tableau(x) de bord actuel(s) par les ${imported.length} du fichier ?`)) return;
  const previousDashboards = dashboards;
  dashboards = imported;
  try {
    await saveDashboards(dashboards);
    if (!dashboards.some((d) => d.id === activeDashboardId)) {
      activeDashboardId = dashboards[0]?.id ?? 'default';
      setActiveDashboard(activeDashboardId);
    }
    renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });
    await loadAccountData();
    renderMainView();
  } catch (error) {
    dashboards = previousDashboards;
    sidebarDashboardsError.textContent = `Échec de l'import : ${error.message}`;
  }
});

signInButton.addEventListener('click', signIn);
signOutButton.addEventListener('click', signOut);

// Bouton de contournement réservé au dev (voir dev-server.py, auth.js isLocalDevHost) :
// jamais visible ailleurs qu'en localhost, jamais atteignable sur gh-pages.
devLocalButton.hidden = !isLocalDevHost;
devLocalButton.addEventListener('click', enableDevLocalMode);

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
  entryFilterModele.innerHTML = '';
  const emptyFilterOption = document.createElement('option');
  emptyFilterOption.value = '';
  emptyFilterOption.textContent = 'Tous les modèles';
  entryFilterModele.appendChild(emptyFilterOption);
  entryModeleChangeSelect.innerHTML = '';
  for (const modele of modeles) {
    const filterOption = document.createElement('option');
    filterOption.value = modele.id;
    filterOption.textContent = modele.nom;
    entryFilterModele.appendChild(filterOption);
    entryModeleChangeSelect.appendChild(filterOption.cloneNode(true));
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

entryTableBody.addEventListener('change', (event) => {
  if (event.target.type !== 'checkbox') return;
  const row = event.target.closest('tr');
  if (!row?.dataset.entryId) return;
  if (event.target.checked) selectedEntryIds.add(row.dataset.entryId);
  else selectedEntryIds.delete(row.dataset.entryId);
  renderEntries();
});

entryTableBody.addEventListener('click', (event) => {
  if (event.target.type === 'checkbox') return;
  const row = event.target.closest('tr');
  const entry = row && entries.find((e) => e.id === row.dataset.entryId);
  if (entry) startEditEntry(entry);
});

entryTableBody.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.type === 'checkbox') return;
  const row = event.target.closest('tr');
  const entry = row && entries.find((e) => e.id === row.dataset.entryId);
  if (!entry) return;
  event.preventDefault();
  startEditEntry(entry);
});

entrySelectAllCheckbox.addEventListener('change', () => {
  const filtered = getFilteredEntries();
  if (entrySelectAllCheckbox.checked) selectedEntryIds = new Set(filtered.map((e) => e.id));
  else selectedEntryIds = new Set();
  renderEntries();
});

entryBulkDeleteButton.addEventListener('click', async () => {
  const count = selectedEntryIds.size;
  if (!window.confirm(`Supprimer définitivement ${count} entrée${count > 1 ? 's' : ''} ?`)) return;
  const previousEntries = entries;
  const deleted = entries.filter((e) => selectedEntryIds.has(e.id));
  entries = entries.filter((e) => !selectedEntryIds.has(e.id));
  try {
    await saveEntries(entries);
    for (const entry of deleted) {
      entry.champsSchema.fields
        .filter((f) => f.type === 'photo' && entry.champsPersonnalises[f.id])
        .forEach((f) => deletePhoto(entry.champsPersonnalises[f.id]).catch(() => {}));
    }
    await syncPartages();
    selectedEntryIds = new Set();
    renderEntries();
  } catch (error) {
    entries = previousEntries;
    window.alert(`Échec de la suppression : ${error.message}`);
  }
});

entryBulkArchiveButton.addEventListener('click', async () => {
  const selected = entries.filter((e) => selectedEntryIds.has(e.id));
  const nextArchive = !selected.every((e) => e.archive);
  const previousEntries = entries;
  entries = entries.map((e) => (selectedEntryIds.has(e.id) ? { ...e, archive: nextArchive } : e));
  try {
    await saveEntries(entries);
    selectedEntryIds = new Set();
    renderEntries();
  } catch (error) {
    entries = previousEntries;
    window.alert(`Échec de l'archivage : ${error.message}`);
  }
});

entryBulkMoveButton.addEventListener('click', () => {
  entryMoveError.textContent = '';
  entryMoveDashboardSelect.innerHTML = '';
  appendDashboardOptions(
    entryMoveDashboardSelect,
    dashboards.filter((d) => !d.archive && d.id !== activeDashboardId),
    'Choisir un tableau…',
  );
  openModal('entry-move-modal');
});

entryMoveSubmitButton.addEventListener('click', async () => {
  const targetDashboardId = entryMoveDashboardSelect.value;
  if (!targetDashboardId) {
    entryMoveError.textContent = 'Choisis un tableau de bord de destination.';
    return;
  }
  const moved = entries.filter((e) => selectedEntryIds.has(e.id));
  const previousEntries = entries;
  const remaining = entries.filter((e) => !selectedEntryIds.has(e.id));
  try {
    const targetEntries = await loadEntries(targetDashboardId);
    const targetExistingIds = new Set(targetEntries.map((e) => e.id));
    const toAdd = moved.filter((e) => !targetExistingIds.has(e.id));
    // Écrit la destination avant de retirer la source : si cet appel échoue, la
    // source n'a pas bougé (rien à annuler) ; si c'est le retrait de la source qui
    // échoue ensuite, les entrées se retrouvent dupliquées (récupérable) plutôt que
    // perdues (si on écrivait la source en premier et que la destination échouait).
    await saveEntries([...targetEntries, ...toAdd], targetDashboardId);
    entries = remaining;
    await saveEntries(entries);
    for (const entry of toAdd) {
      for (const field of entry.champsSchema.fields) {
        if (field.type === 'photo' && entry.champsPersonnalises[field.id]) {
          await movePhotoToDashboard(entry.champsPersonnalises[field.id], targetDashboardId).catch(() => {});
        }
      }
    }
    await syncPartages();
    selectedEntryIds = new Set();
    renderEntries();
    closeModal();
  } catch (error) {
    entries = previousEntries;
    entryMoveError.textContent = `Échec du déplacement : ${error.message}`;
  }
});

entryBulkModeleButton.addEventListener('click', () => {
  entryModeleChangeError.textContent = '';
  openModal('entry-modele-change-modal');
});

entryModeleChangeSubmitButton.addEventListener('click', async () => {
  const modele = modeles.find((m) => m.id === entryModeleChangeSelect.value);
  if (!modele) {
    entryModeleChangeError.textContent = 'Choisis un modèle.';
    return;
  }
  closeModal();
  const previousEntries = entries;
  const idsToUpdate = [...selectedEntryIds];
  try {
    for (const id of idsToUpdate) {
      const entry = entries.find((e) => e.id === id);
      if (!entry) continue;
      const classe = classerFiche({ error: null, targetModeleId: modele.id, data: { contenuSchema: entry.contenuSchema } }).classe;
      const { contenuSchema, contenuValeurs, champsVides } = await remapContenuVersModele(
        entry.contenuSchema,
        entry.contenuValeurs,
        modele,
      );
      let statut = entry.statut;
      if (champsVides) statut = 'A Compléter';
      else if (classe === 'champs-supplementaire' || classe === 'mapping-necessaire') statut = 'A Valider';
      entries = entries.map((e) => (e.id === id ? { ...e, modeleId: modele.id, contenuSchema, contenuValeurs, statut } : e));
    }
    await saveEntries(entries);
    selectedEntryIds = new Set();
    renderEntries();
  } catch (error) {
    entries = previousEntries;
    window.alert(`Échec du changement de modèle : ${error.message}`);
  }
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

entryEditButton.addEventListener('click', () => setEntryFormReadOnly(false));

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

// Charge le registre des dashboards puis toutes les données du dashboard actif.
// Partagée entre la connexion Google initiale et une (re)connexion du dossier
// Logbook (cf connectLogbookFolderFlow) : dans les deux cas, tout ce qui dépend
// de getAppFolderId() (dashboards, entrées, modèles...) doit être rechargé depuis
// le bon dossier.
async function loadAccountAndDashboards() {
  // Feedback immédiat : sans ça, sidebar et contenu restent figés/vides pendant les
  // premiers appels Drive (chargement du registre de dashboards), avant même que
  // loadAccountData démarre — ça donnait une impression de chargement incohérent.
  renderMainView();
  renderSidebar({ ownerName, partagesRecus, activeJournalId: currentJournalId, dashboards, activeDashboardId });

  try {
    dashboards = await loadDashboards();
  } catch (error) {
    dashboards = [{ id: 'default', nom: 'Mon journal de bord', dossierNom: 'logbook', creeLe: new Date().toISOString() }];
    // Le dossier connecté a pu être supprimé/déplacé entre-temps sur le Drive :
    // getAppFolderId (drive.js) l'a alors détecté et déjà retiré du lien local
    // (localStorage) — ne pas attendre un prochain rechargement de page pour
    // reproposer la connexion, la rouvrir tout de suite.
    if (error.message === LOGBOOK_FOLDER_NOT_CONNECTED) {
      await openLogbookFolderModal();
    } else {
      sidebarDashboardsError.textContent = `Échec du chargement des tableaux de bord : ${error.message}`;
    }
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
  renderTableLoading(entryTableBody, 7);
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
  const dossierNom = expectedDossierNom({ id, nom: nom.trim() });
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
    if (!isLogbookFolderConnected()) await openLogbookFolderModal();
    await loadAccountAndDashboards();
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
