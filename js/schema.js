const CHAMP_TYPE_LABELS = {
  texte: 'Texte',
  nombre: 'Nombre',
  date: 'Date',
  select: 'Liste',
  case: 'Case à cocher',
};

const entryTableHeadRow = document.getElementById('entry-table-head-row');
const entryTableWrapper = document.getElementById('entry-table-wrapper');
const fieldPopover = document.getElementById('schema-field-popover');
const fieldForm = document.getElementById('schema-field-form');
const fieldNom = document.getElementById('schema-field-nom');
const fieldTypeSelect = document.getElementById('schema-field-type');
const fieldTypeLabel = document.querySelector('label[for="schema-field-type"]');
const fieldTypeReadonly = document.getElementById('schema-field-type-readonly');
const fieldOptions = document.getElementById('schema-field-options');
const fieldOptionsLabel = document.querySelector('label[for="schema-field-options"]');
const fieldDelete = document.getElementById('schema-field-delete');

let currentSchema = [];
let editingFieldId = null;
let saveFieldCallback = null;
let deleteFieldCallback = null;

function parseOptions(raw) {
  return raw
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

export function closeFieldEditor() {
  fieldPopover.hidden = true;
  editingFieldId = null;
}

function openFieldEditor(field, anchorEl) {
  fieldForm.reset();
  editingFieldId = field?.id ?? null;

  if (field) {
    fieldNom.value = field.nom;
    fieldTypeReadonly.hidden = false;
    fieldTypeReadonly.textContent = `Type : ${CHAMP_TYPE_LABELS[field.type]}`;
    fieldTypeSelect.hidden = true;
    fieldTypeLabel.hidden = true;
    fieldOptions.hidden = field.type !== 'select';
    fieldOptionsLabel.hidden = field.type !== 'select';
    if (field.type === 'select') fieldOptions.value = (field.options ?? []).join(', ');
    fieldDelete.hidden = false;
  } else {
    fieldTypeReadonly.hidden = true;
    fieldTypeSelect.hidden = false;
    fieldTypeLabel.hidden = false;
    fieldTypeSelect.value = 'texte';
    fieldOptions.hidden = true;
    fieldOptionsLabel.hidden = true;
    fieldDelete.hidden = true;
  }

  const rect = anchorEl.getBoundingClientRect();
  fieldPopover.style.top = `${rect.bottom + 4}px`;
  fieldPopover.style.left = `${rect.left}px`;
  fieldPopover.hidden = false;
}

export function initSchemaUI({ onSaveField, onDeleteField }) {
  saveFieldCallback = onSaveField;
  deleteFieldCallback = onDeleteField;

  entryTableHeadRow.addEventListener('click', (event) => {
    const addTh = event.target.closest('th[data-add-field]');
    if (addTh) {
      event.stopPropagation();
      openFieldEditor(null, addTh);
      return;
    }
    const fieldTh = event.target.closest('th[data-field-id]');
    if (fieldTh) {
      event.stopPropagation();
      const field = currentSchema.find((f) => f.id === fieldTh.dataset.fieldId);
      if (field) openFieldEditor(field, fieldTh);
    }
  });

  fieldTypeSelect.addEventListener('change', () => {
    const isSelect = fieldTypeSelect.value === 'select';
    fieldOptions.hidden = !isSelect;
    fieldOptionsLabel.hidden = !isSelect;
  });

  fieldForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nom = fieldNom.value.trim();
    const type = editingFieldId ? currentSchema.find((f) => f.id === editingFieldId)?.type : fieldTypeSelect.value;
    const options = type === 'select' ? parseOptions(fieldOptions.value) : undefined;
    saveFieldCallback?.(editingFieldId, { nom, type, options });
  });

  fieldDelete.addEventListener('click', () => {
    if (editingFieldId) deleteFieldCallback?.(editingFieldId);
  });

  document.addEventListener('click', (event) => {
    if (fieldPopover.hidden) return;
    if (event.target.closest('#schema-field-popover') || event.target.closest('#entry-table-head-row')) return;
    closeFieldEditor();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !fieldPopover.hidden) closeFieldEditor();
  });

  entryTableWrapper.addEventListener('scroll', closeFieldEditor);
}

export function renderSchemaColumns(schema) {
  currentSchema = schema;

  for (const th of [...entryTableHeadRow.querySelectorAll('th[data-field-id], th[data-add-field]')]) {
    th.remove();
  }

  for (const field of schema) {
    const th = document.createElement('th');
    th.textContent = field.nom;
    th.dataset.fieldId = field.id;
    entryTableHeadRow.appendChild(th);
  }

  const addTh = document.createElement('th');
  addTh.dataset.addField = '';
  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = '+';
  addButton.setAttribute('aria-label', 'Ajouter un champ');
  addTh.appendChild(addButton);
  entryTableHeadRow.appendChild(addTh);
}

export function formatCustomValue(field, value) {
  if (field.type === 'case') return value ? '✓' : '';
  return value === undefined || value === null || value === '' ? '—' : value;
}

export function renderCustomCells(row, entry, schema) {
  for (const field of schema) {
    const td = document.createElement('td');
    td.textContent = formatCustomValue(field, entry.champsPersonnalises?.[field.id]);
    row.appendChild(td);
  }
}

export function renderCustomFormFields(container, schema, values = {}) {
  container.innerHTML = '';
  for (const field of schema) {
    const label = document.createElement('label');
    label.setAttribute('for', `custom-field-${field.id}`);
    label.textContent = field.nom;
    container.appendChild(label);

    const value = values[field.id];
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      const empty = document.createElement('option');
      empty.value = '';
      empty.textContent = 'Choisir…';
      input.appendChild(empty);
      for (const option of field.options ?? []) {
        const el = document.createElement('option');
        el.value = option;
        el.textContent = option;
        input.appendChild(el);
      }
      input.value = value ?? '';
    } else if (field.type === 'case') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(value);
    } else {
      input = document.createElement('input');
      input.type = field.type === 'nombre' ? 'number' : field.type === 'date' ? 'date' : 'text';
      if (value !== undefined && value !== null) input.value = value;
    }
    input.id = `custom-field-${field.id}`;
    input.dataset.fieldId = field.id;
    container.appendChild(input);
  }
}

export function readCustomFormValues(container, schema) {
  const values = {};
  for (const field of schema) {
    const input = container.querySelector(`#custom-field-${field.id}`);
    if (!input) continue;
    if (field.type === 'nombre') {
      values[field.id] = input.valueAsNumber;
    } else if (field.type === 'case') {
      values[field.id] = input.checked;
    } else {
      values[field.id] = input.value;
    }
  }
  return values;
}
