// Fiche personnelle : page isolée du reste de l'app (JDB, modèles, dashboards).
// Rien ici n'est lu ni écrit par un autre module ; voir docs/design/personality-sheet*.md.
import { loadProfileSheet, saveProfileSheet, deleteProfileSheet } from './drive.js';
import { createFieldsEditor } from './schema.js';
import { openModal, closeModal } from './modal.js';
import { TEST_DEFINITIONS, computeResult } from './profile-tests.js';

const profileIdentityList = document.getElementById('profile-identity-list');
const profileIdentityAddButton = document.getElementById('profile-identity-add-button');
const profileIdentitySaveButton = document.getElementById('profile-identity-save-button');
const profileIdentityError = document.getElementById('profile-identity-error');
const profileTestList = document.getElementById('profile-test-list');
const profileSheetBanner = document.getElementById('profile-sheet-banner');
const profileSheetIdentity = document.getElementById('profile-sheet-identity');
const profileSheetResults = document.getElementById('profile-sheet-results');
const profileError = document.getElementById('profile-error');
const profileDeleteSheetButton = document.getElementById('profile-delete-sheet-button');
const profileExportButton = document.getElementById('profile-export-button');

const tabApercuButton = document.getElementById('profile-tab-apercu-button');
const tabTestsButton = document.getElementById('profile-tab-tests-button');
const panelApercu = document.getElementById('profile-panel-apercu');
const panelTests = document.getElementById('profile-panel-tests');

function selectTab(tab) {
  const isApercu = tab === 'apercu';
  panelApercu.hidden = !isApercu;
  panelTests.hidden = isApercu;
  tabApercuButton.setAttribute('aria-selected', String(isApercu));
  tabTestsButton.setAttribute('aria-selected', String(!isApercu));
}

tabApercuButton.addEventListener('click', () => selectTab('apercu'));
tabTestsButton.addEventListener('click', () => selectTab('tests'));

const consentTitle = document.getElementById('profile-consent-title');
const consentText = document.getElementById('profile-consent-text');
const consentStart = document.getElementById('profile-consent-start');
const consentCancel = document.getElementById('profile-consent-cancel');

const questionTitle = document.getElementById('profile-question-title');
const questionProgress = document.getElementById('profile-question-progress');
const questionProgressFill = document.getElementById('profile-question-progress-fill');
const questionForm = document.getElementById('profile-question-form');
const questionText = document.getElementById('profile-question-text');
const questionChoices = document.getElementById('profile-question-choices');
const questionPrevious = document.getElementById('profile-question-previous');
const questionNext = document.getElementById('profile-question-next');

const resultText = document.getElementById('profile-result-text');
const resultRedo = document.getElementById('profile-result-redo');
const resultClose = document.getElementById('profile-result-close');

const exportSectionsFieldset = document.getElementById('profile-export-sections');
const exportError = document.getElementById('profile-export-error');
const exportPdfButton = document.getElementById('profile-export-pdf-button');
const exportPngButton = document.getElementById('profile-export-png-button');

const printExportEl = document.getElementById('profile-print-export');

function blankProfile() {
  return { identity: { schema: { fields: [], order: [] }, values: {} }, tests: { personality: null, genderIdentity: null, orientation: null, political: null } };
}

let profile = blankProfile();
let loaded = false;
let currentTestKey = null;
let currentAnswers = {};
let currentQuestionIndex = 0;

const identityEditor = createFieldsEditor({
  listEl: profileIdentityList,
  addButtonEl: profileIdentityAddButton,
  idPrefix: 'profile-identity',
});

function statusLabel(testKey) {
  const result = profile.tests[testKey];
  return result ? result.result : 'Non commencé';
}

function renderTestCards() {
  profileTestList.innerHTML = '';
  for (const [key, def] of Object.entries(TEST_DEFINITIONS)) {
    const li = document.createElement('li');

    const nom = document.createElement('p');
    nom.textContent = def.label;
    li.appendChild(nom);

    const statut = document.createElement('p');
    statut.textContent = statusLabel(key);
    li.appendChild(statut);

    const actions = document.createElement('div');
    actions.className = 'partage-actions';

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.textContent = profile.tests[key] ? 'Refaire' : 'Faire';
    startButton.addEventListener('click', () => openConsent(key));
    actions.appendChild(startButton);

    if (profile.tests[key]) {
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button-danger';
      deleteButton.textContent = 'Supprimer';
      deleteButton.setAttribute('aria-label', `Supprimer le résultat du test ${def.label}`);
      deleteButton.addEventListener('click', () => deleteTest(key));
      actions.appendChild(deleteButton);
    }

    li.appendChild(actions);
    profileTestList.appendChild(li);
  }
}

function buildSheetEmptyMessage(text) {
  const p = document.createElement('p');
  p.className = 'profile-sheet-empty';
  p.textContent = text;
  return p;
}

function formatIdentityValue(field, value) {
  if (field.type === 'case') return value ? 'Oui' : 'Non';
  if (field.type === 'photo') return value ? 'Photo ajoutée' : '—';
  return value || '—';
}

function buildIdentityRow(label, value) {
  const row = document.createElement('div');
  row.className = 'profile-sheet-identity-row';
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  row.append(dt, dd);
  return row;
}

function getPersonalityRole() {
  const result = profile.tests.personality;
  if (!result) return null;
  const idx = result.result.indexOf(' (');
  return idx === -1 ? result.result : result.result.slice(0, idx);
}

// Le premier champ d'identité (ordre choisi par l'utilisateur·rice) sert de "nom" mis en
// avant dans la bannière, façon en-tête de fiche de personnage ; les suivants restent en
// lignes classiques. Choix arbitraire mais stable, pas de notion de "champ nom" dans le schéma.
function renderIdentityPanel() {
  profileSheetBanner.innerHTML = '';
  profileSheetIdentity.innerHTML = '';
  const { schema, values } = profile.identity;
  const fields = schema.order.map((key) => schema.fields.find((f) => f.id === key)).filter(Boolean);

  if (fields.length === 0) {
    profileSheetIdentity.appendChild(buildSheetEmptyMessage('Aucune info d\'identité renseignée — onglet « Tests ».'));
    return;
  }

  const [primary, ...rest] = fields;
  const primaryValue = formatIdentityValue(primary, values[primary.id]);
  const avatar = document.createElement('span');
  avatar.className = 'profile-sheet-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = primaryValue.charAt(0).toUpperCase() || '?';
  const text = document.createElement('div');
  const name = document.createElement('p');
  name.className = 'profile-sheet-banner-name';
  name.textContent = primaryValue;
  const tagline = document.createElement('p');
  tagline.className = 'profile-sheet-banner-tagline';
  tagline.textContent = primary.nom;
  text.append(name, tagline);

  // Base texte du futur système d'avatar : le titre tiré du test de personnalité (ex.
  // "Le Stratège de l'Ombre") sert de rôle affiché, avant qu'une vraie illustration existe.
  const role = getPersonalityRole();
  if (role) {
    const roleEl = document.createElement('p');
    roleEl.className = 'profile-sheet-banner-role';
    roleEl.textContent = role;
    text.appendChild(roleEl);
  }

  profileSheetBanner.append(avatar, text);

  for (const field of rest) {
    profileSheetIdentity.appendChild(buildIdentityRow(field.nom, formatIdentityValue(field, values[field.id])));
  }
}

function buildTraitCard(label, value, isEmpty) {
  const card = document.createElement('article');
  card.className = isEmpty ? 'profile-sheet-trait-card empty' : 'profile-sheet-trait-card';
  const name = document.createElement('span');
  name.className = 'profile-sheet-trait-name';
  name.textContent = label;
  const text = document.createElement('p');
  text.className = isEmpty ? 'profile-sheet-trait-value placeholder' : 'profile-sheet-trait-value';
  text.textContent = value;
  card.append(name, text);
  return card;
}

function renderResultsPanel() {
  profileSheetResults.innerHTML = '';
  for (const [key, def] of Object.entries(TEST_DEFINITIONS)) {
    const result = profile.tests[key];
    profileSheetResults.appendChild(buildTraitCard(def.label, result ? result.result : 'Test non commencé', !result));
  }
}

// Vue en lecture seule façon « fiche de personnage » : l'édition de l'identité et le
// lancement des tests vivent dans l'onglet Tests, cet onglet-ci n'affiche que l'état courant.
function renderSheetView() {
  renderIdentityPanel();
  renderResultsPanel();
}

function renderProfilePage() {
  renderTestCards();
  renderSheetView();
}

async function persistProfile() {
  await saveProfileSheet(profile);
}

async function deleteTest(key) {
  profileError.textContent = '';
  if (!window.confirm(`Supprimer définitivement le résultat du test « ${TEST_DEFINITIONS[key].label} » ?`)) return;
  const previous = profile;
  profile = { ...profile, tests: { ...profile.tests, [key]: null } };
  renderProfilePage();
  try {
    await persistProfile();
  } catch (error) {
    profile = previous;
    renderProfilePage();
    profileError.textContent = `Échec de la suppression : ${error.message}`;
  }
}

function openConsent(key) {
  currentTestKey = key;
  const def = TEST_DEFINITIONS[key];
  consentTitle.textContent = def.label;
  consentText.textContent = def.consent;
  openModal('profile-consent-modal');
}

consentCancel.addEventListener('click', closeModal);

consentStart.addEventListener('click', () => {
  currentAnswers = {};
  currentQuestionIndex = 0;
  renderQuestion();
  openModal('profile-question-modal');
});

function renderQuestion() {
  const def = TEST_DEFINITIONS[currentTestKey];
  const question = def.questions[currentQuestionIndex];
  questionTitle.textContent = def.label;
  questionProgress.textContent = `Question ${currentQuestionIndex + 1}/${def.questions.length}`;
  questionProgressFill.style.width = `${((currentQuestionIndex + 1) / def.questions.length) * 100}%`;
  questionText.textContent = question.text;
  questionChoices.innerHTML = '';
  for (const choice of question.choices) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'profile-question-choice';
    input.value = choice.value;
    input.checked = currentAnswers[question.id] === choice.value;
    input.required = true;
    label.appendChild(input);
    label.appendChild(document.createTextNode(choice.label));
    questionChoices.appendChild(label);
  }
  questionPrevious.hidden = currentQuestionIndex === 0;
  questionNext.textContent = currentQuestionIndex === def.questions.length - 1 ? 'Voir le résultat' : 'Suivant';
}

questionPrevious.addEventListener('click', () => {
  const def = TEST_DEFINITIONS[currentTestKey];
  const question = def.questions[currentQuestionIndex];
  const checked = questionChoices.querySelector('input:checked');
  if (checked) currentAnswers[question.id] = checked.value;
  currentQuestionIndex = Math.max(0, currentQuestionIndex - 1);
  renderQuestion();
});

questionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const def = TEST_DEFINITIONS[currentTestKey];
  const question = def.questions[currentQuestionIndex];
  const checked = questionChoices.querySelector('input:checked');
  if (!checked) return;
  currentAnswers[question.id] = checked.value;
  if (currentQuestionIndex < def.questions.length - 1) {
    currentQuestionIndex += 1;
    renderQuestion();
    return;
  }
  await finishTest();
});

async function finishTest() {
  const key = currentTestKey;
  const result = computeResult(key, currentAnswers);
  const previous = profile;
  profile = { ...profile, tests: { ...profile.tests, [key]: { completedAt: new Date().toISOString(), answers: { ...currentAnswers }, result } } };
  try {
    await persistProfile();
    renderProfilePage();
    resultText.textContent = result;
    openModal('profile-result-modal');
  } catch (error) {
    profile = previous;
    profileError.textContent = `Échec de l'enregistrement du résultat : ${error.message}`;
    closeModal();
  }
}

resultRedo.addEventListener('click', () => openConsent(currentTestKey));
resultClose.addEventListener('click', closeModal);

profileIdentitySaveButton.addEventListener('click', async () => {
  profileIdentityError.textContent = '';
  const previous = profile;
  profile = { ...profile, identity: { schema: identityEditor.getSchema(), values: identityEditor.getValues() } };
  try {
    await persistProfile();
    renderSheetView();
  } catch (error) {
    profile = previous;
    profileIdentityError.textContent = `Échec de l'enregistrement : ${error.message}`;
  }
});

profileDeleteSheetButton.addEventListener('click', async () => {
  profileError.textContent = '';
  if (!window.confirm('Supprimer définitivement toute la fiche personnelle (identité et résultats des tests) ? Cette action est irréversible.')) return;
  try {
    await deleteProfileSheet();
    profile = blankProfile();
    identityEditor.render(profile.identity.schema, profile.identity.values);
    renderProfilePage();
  } catch (error) {
    profileError.textContent = `Échec de la suppression : ${error.message}`;
  }
});

// --- Export PDF/PNG, entièrement côté client (voir cahier des charges RGPD) ---

function getExportableSections() {
  const sections = [];
  const { schema, values } = profile.identity;
  const identityLines = schema.order
    .map((key) => schema.fields.find((f) => f.id === key))
    .filter(Boolean)
    .map((field) => `${field.nom} : ${field.type === 'case' ? (values[field.id] ? 'Oui' : 'Non') : values[field.id] ?? ''}`);
  if (identityLines.length) sections.push({ id: 'identity', title: 'Identité', lines: identityLines });
  for (const [key, def] of Object.entries(TEST_DEFINITIONS)) {
    const result = profile.tests[key];
    if (!result) continue;
    sections.push({ id: key, title: def.label, lines: [result.result] });
  }
  return sections;
}

profileExportButton.addEventListener('click', () => {
  exportError.textContent = '';
  const sections = getExportableSections();
  exportSectionsFieldset.innerHTML = '';
  const legend = document.createElement('legend');
  legend.textContent = 'Sections à inclure';
  exportSectionsFieldset.appendChild(legend);
  if (sections.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = "Rien à exporter : remplis l'identité ou fais au moins un test.";
    exportSectionsFieldset.appendChild(empty);
  }
  for (const section of sections) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.value = section.id;
    label.appendChild(input);
    label.appendChild(document.createTextNode(section.title));
    exportSectionsFieldset.appendChild(label);
  }
  openModal('profile-export-modal');
});

function getSelectedSections() {
  const sections = getExportableSections();
  const selectedIds = new Set(
    Array.from(exportSectionsFieldset.querySelectorAll('input:checked')).map((input) => input.value),
  );
  return sections.filter((section) => selectedIds.has(section.id));
}

function onAfterPrint() {
  document.body.classList.remove('profile-printing');
  printExportEl.hidden = true;
  window.removeEventListener('afterprint', onAfterPrint);
}

exportPdfButton.addEventListener('click', () => {
  const selected = getSelectedSections();
  if (selected.length === 0) {
    exportError.textContent = 'Choisis au moins une section.';
    return;
  }
  printExportEl.innerHTML = '';
  const title = document.createElement('h1');
  title.textContent = 'Fiche personnelle';
  printExportEl.appendChild(title);
  for (const section of selected) {
    const h2 = document.createElement('h2');
    h2.textContent = section.title;
    printExportEl.appendChild(h2);
    for (const line of section.lines) {
      const p = document.createElement('p');
      p.textContent = line;
      printExportEl.appendChild(p);
    }
  }
  printExportEl.hidden = false;
  document.body.classList.add('profile-printing');
  window.addEventListener('afterprint', onAfterPrint);
  closeModal();
  window.print();
});

exportPngButton.addEventListener('click', () => {
  const selected = getSelectedSections();
  if (selected.length === 0) {
    exportError.textContent = 'Choisis au moins une section.';
    return;
  }
  const width = 800;
  const lineHeight = 26;
  const padding = 32;
  let height = padding * 2 + 48;
  for (const section of selected) height += 40 + section.lines.length * lineHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#111111';

  let y = padding;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Fiche personnelle', padding, y + 24);
  y += 48;

  for (const section of selected) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(section.title, padding, y + 18);
    y += 32;
    ctx.font = '16px sans-serif';
    for (const line of section.lines) {
      ctx.fillText(line, padding, y + 16);
      y += lineHeight;
    }
    y += 8;
  }

  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `logbook-profile-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
  closeModal();
});

export async function openProfilePage() {
  if (!loaded) {
    profileError.textContent = '';
    try {
      profile = (await loadProfileSheet()) ?? blankProfile();
    } catch (error) {
      profileError.textContent = `Échec du chargement de la fiche : ${error.message}`;
      profile = blankProfile();
    }
    loaded = true;
  }
  identityEditor.render(profile.identity.schema, profile.identity.values);
  renderProfilePage();
  selectTab('apercu');
}
