import { onModalClose } from './modal.js';
import { uploadPhoto, deletePhoto, fetchPhotoBlob } from './drive.js';

const CHAMP_TYPE_LABELS = {
  texte: 'Texte',
  nombre: 'Nombre',
  date: 'Date',
  select: 'Liste',
  case: 'Case à cocher',
  photo: 'Photo',
};

const modalPanel = document.getElementById('modal-panel');
const fieldPopover = document.getElementById('schema-field-popover');
const fieldForm = document.getElementById('schema-field-form');
const fieldNom = document.getElementById('schema-field-nom');
const fieldTypeSelect = document.getElementById('schema-field-type');
const fieldTypeLabel = document.querySelector('label[for="schema-field-type"]');
const fieldTypeReadonly = document.getElementById('schema-field-type-readonly');
const fieldOptions = document.getElementById('schema-field-options');
const fieldOptionsLabel = document.querySelector('label[for="schema-field-options"]');
const fieldDelete = document.getElementById('schema-field-delete');

let activeEditor = null;
let editingFieldId = null;

function parseOptions(raw) {
  return raw
    .split(',')
    .map((option) => option.trim())
    .filter(Boolean);
}

function closeFieldEditor() {
  fieldPopover.hidden = true;
  editingFieldId = null;
  activeEditor = null;
}

function openFieldEditor(editor, field, anchorEl) {
  fieldForm.reset();
  activeEditor = editor;
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

function clearDragIndicators(li) {
  li?.classList.remove('drag-over-top', 'drag-over-bottom');
}

function computeReorderedOrder(order, draggedKey, targetKey, before) {
  const without = order.filter((key) => key !== draggedKey);
  if (!order.includes(draggedKey)) return order;
  const targetIndex = without.findIndex((key) => key === targetKey);
  const insertIndex = targetIndex === -1 ? without.length : before ? targetIndex : targetIndex + 1;
  return [...without.slice(0, insertIndex), draggedKey, ...without.slice(insertIndex)];
}

fieldTypeSelect.addEventListener('change', () => {
  const isSelect = fieldTypeSelect.value === 'select';
  fieldOptions.hidden = !isSelect;
  fieldOptionsLabel.hidden = !isSelect;
});

fieldForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const nom = fieldNom.value.trim();
  const type = editingFieldId ? activeEditor?.getField(editingFieldId)?.type : fieldTypeSelect.value;
  const options = type === 'select' ? parseOptions(fieldOptions.value) : undefined;
  activeEditor?.saveField(editingFieldId, { nom, type, options });
  closeFieldEditor();
});

fieldDelete.addEventListener('click', () => {
  if (editingFieldId) activeEditor?.deleteField(editingFieldId);
  closeFieldEditor();
});

document.addEventListener('click', (event) => {
  if (fieldPopover.hidden) return;
  if (event.target.closest('#schema-field-popover') || event.target.closest('.fields-editor-section')) return;
  closeFieldEditor();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !fieldPopover.hidden) closeFieldEditor();
});

modalPanel.addEventListener('scroll', closeFieldEditor);
onModalClose(closeFieldEditor);

// L'id Drive de la photo n'est pas affichable directement dans <img src> (fichier
// privé, nécessite le header Authorization) : on récupère le blob via l'API puis on
// en fait une object URL, révoquée dès que remplacée pour ne pas fuir de mémoire.
async function loadPhotoPreview(fileId, img) {
  const blob = await fetchPhotoBlob(fileId).catch(() => null);
  if (!blob) return;
  if (img.dataset.objectUrl) URL.revokeObjectURL(img.dataset.objectUrl);
  const url = URL.createObjectURL(blob);
  img.dataset.objectUrl = url;
  img.src = url;
  img.hidden = false;
}

function buildFieldInput(field, value, idPrefix) {
  let input;
  if (field.type === 'photo') {
    const wrapper = document.createElement('div');
    wrapper.className = 'champ-photo';
    wrapper.dataset.value = value ?? '';
    const img = document.createElement('img');
    img.className = 'champ-photo-preview';
    img.alt = field.nom;
    img.hidden = true;
    wrapper.appendChild(img);
    if (value) loadPhotoPreview(value, img);
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.id = `${idPrefix}-${field.id}-file`;
    wrapper.appendChild(fileInput);
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const oldValue = wrapper.dataset.value;
      const fileId = await uploadPhoto(file, field.id);
      wrapper.dataset.value = fileId;
      await loadPhotoPreview(fileId, img);
      if (oldValue) deletePhoto(oldValue).catch(() => {});
    });
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.textContent = 'Retirer la photo';
    removeButton.addEventListener('click', () => {
      const oldValue = wrapper.dataset.value;
      wrapper.dataset.value = '';
      img.hidden = true;
      fileInput.value = '';
      if (oldValue) deletePhoto(oldValue).catch(() => {});
    });
    wrapper.appendChild(removeButton);
    input = wrapper;
  } else if (field.type === 'select') {
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
  input.id = `${idPrefix}-${field.id}`;
  input.dataset.fieldId = field.id;
  return input;
}

function buildCustomFieldLi(field, value, idPrefix, readOnly) {
  const li = document.createElement('li');
  li.className = 'entry-block-row';
  li.draggable = !readOnly;
  li.dataset.orderKey = field.id;

  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.setAttribute('aria-hidden', 'true');
  handle.innerHTML =
    '<svg width="10" height="14" viewBox="0 0 10 14" fill="none"><circle cx="2.5" cy="2.5" r="1.2" fill="currentColor"/><circle cx="7.5" cy="2.5" r="1.2" fill="currentColor"/><circle cx="2.5" cy="7" r="1.2" fill="currentColor"/><circle cx="7.5" cy="7" r="1.2" fill="currentColor"/><circle cx="2.5" cy="11.5" r="1.2" fill="currentColor"/><circle cx="7.5" cy="11.5" r="1.2" fill="currentColor"/></svg>';
  li.appendChild(handle);

  const label = document.createElement('label');
  label.setAttribute('for', field.type === 'photo' ? `${idPrefix}-${field.id}-file` : `${idPrefix}-${field.id}`);
  label.textContent = field.nom;
  li.appendChild(label);

  li.appendChild(buildFieldInput(field, value, idPrefix));

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'entry-block-edit-button';
  editButton.textContent = 'Modifier';
  editButton.setAttribute('aria-label', `Modifier le champ ${field.nom}`);
  editButton.hidden = Boolean(readOnly);
  li.appendChild(editButton);

  return li;
}

function readFieldValues(listEl, schema, idPrefix) {
  const values = {};
  for (const field of schema.fields) {
    const input = listEl.querySelector(`#${idPrefix}-${field.id}`);
    if (!input) continue;
    if (field.type === 'nombre') {
      values[field.id] = input.valueAsNumber;
    } else if (field.type === 'case') {
      values[field.id] = input.checked;
    } else if (field.type === 'photo') {
      values[field.id] = input.dataset.value || '';
    } else {
      values[field.id] = input.value;
    }
  }
  return values;
}

// Instancie un éditeur de blocs de champs (liste glisser-déposer + popover
// d'ajout/édition/suppression partagé). Deux instances coexistent (page
// d'entrée, formulaire de modèle) mais ne sont jamais actives en même temps
// puisque leurs sections modales sont mutuellement exclusives.
export function createFieldsEditor({ listEl, addButtonEl, idPrefix, fixedBlockElements = {} }) {
  let schema = { fields: [], order: [] };
  let values = {};
  let draggedOrderKey = null;
  let lastHoverLi = null;
  let readOnly = false;

  function render(newSchema, newValues = {}) {
    schema = newSchema;
    values = newValues;
    listEl.innerHTML = '';
    for (const key of schema.order) {
      if (fixedBlockElements[key]) {
        fixedBlockElements[key].draggable = !readOnly;
        listEl.appendChild(fixedBlockElements[key]);
        continue;
      }
      const field = schema.fields.find((f) => f.id === key);
      if (!field) continue; // défensif : entrée d'ordre obsolète
      listEl.appendChild(buildCustomFieldLi(field, values[key], idPrefix, readOnly));
    }
  }

  // Le <fieldset disabled> englobant désactive les champs natifs mais pas le
  // glisser-déposer (attribut draggable + listeners sur listEl) ni le clic
  // ouvrant le popover d'édition sur un <li> : à bloquer explicitement ici.
  function setReadOnly(value) {
    readOnly = value;
    render(schema, values);
  }

  // Recapture d'abord ce qui est tapé dans le DOM avant de reconstruire la
  // liste, pour ne jamais perdre la saisie en cours sur un autre champ quand
  // on ajoute/supprime/réordonne.
  function mutateSchema(updater) {
    values = { ...values, ...readFieldValues(listEl, schema, idPrefix) };
    schema = updater(schema);
    render(schema, values);
  }

  function getField(fieldId) {
    return schema.fields.find((f) => f.id === fieldId);
  }

  function saveField(existingId, { nom, type, options }) {
    mutateSchema((s) =>
      existingId
        ? { ...s, fields: s.fields.map((f) => (f.id === existingId ? { ...f, nom, ...(f.type === 'select' ? { options } : {}) } : f)) }
        : (() => {
            const newField = { id: crypto.randomUUID(), nom, type, ...(type === 'select' ? { options } : {}) };
            return { fields: [...s.fields, newField], order: [...s.order, newField.id] };
          })(),
    );
  }

  function deleteField(fieldId) {
    mutateSchema((s) => ({
      fields: s.fields.filter((f) => f.id !== fieldId),
      order: s.order.filter((key) => key !== fieldId),
    }));
  }

  function reorderBlocks(newOrder) {
    mutateSchema((s) => ({ ...s, order: newOrder }));
  }

  listEl.addEventListener('click', (event) => {
    if (readOnly) return;
    if (event.target.closest('input, select, .drag-handle')) return;
    const li = event.target.closest('li[data-order-key]');
    if (!li) return;
    const field = schema.fields.find((f) => f.id === li.dataset.orderKey);
    if (field) openFieldEditor(editor, field, li);
  });

  addButtonEl.addEventListener('click', () => {
    if (readOnly) return;
    openFieldEditor(editor, null, addButtonEl);
  });

  listEl.addEventListener('dragstart', (event) => {
    if (readOnly) return;
    const li = event.target.closest('li[data-order-key]');
    if (!li) return;
    draggedOrderKey = li.dataset.orderKey;
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedOrderKey);
    li.classList.add('dragging');
  });

  listEl.addEventListener('dragover', (event) => {
    event.preventDefault();
    const li = event.target.closest('li[data-order-key]');
    if (!li || li.dataset.orderKey === draggedOrderKey) {
      clearDragIndicators(lastHoverLi);
      lastHoverLi = null;
      return;
    }
    if (lastHoverLi && lastHoverLi !== li) clearDragIndicators(lastHoverLi);
    const rect = li.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    li.classList.toggle('drag-over-top', before);
    li.classList.toggle('drag-over-bottom', !before);
    lastHoverLi = li;
  });

  listEl.addEventListener('drop', (event) => {
    event.preventDefault();
    if (!draggedOrderKey) return;
    const li = event.target.closest('li[data-order-key]');
    if (!li) {
      const without = schema.order.filter((key) => key !== draggedOrderKey);
      reorderBlocks([...without, draggedOrderKey]);
      return;
    }
    if (li.dataset.orderKey === draggedOrderKey) return;
    const rect = li.getBoundingClientRect();
    const before = event.clientY < rect.top + rect.height / 2;
    reorderBlocks(computeReorderedOrder(schema.order, draggedOrderKey, li.dataset.orderKey, before));
  });

  listEl.addEventListener('dragend', (event) => {
    const li = event.target.closest('li[data-order-key]');
    li?.classList.remove('dragging');
    clearDragIndicators(lastHoverLi);
    draggedOrderKey = null;
    lastHoverLi = null;
  });

  const editor = {
    render,
    setReadOnly,
    getSchema: () => schema,
    getValues: () => readFieldValues(listEl, schema, idPrefix),
    getField,
    saveField,
    deleteField,
    reorderBlocks,
  };
  return editor;
}
