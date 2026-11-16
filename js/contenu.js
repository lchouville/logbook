import { createTexteBlock, createTableauBlock } from './entries.js';

function buildTexteBlockContent(block, value, idPrefix) {
  const textarea = document.createElement('textarea');
  textarea.id = `${idPrefix}-${block.id}`;
  textarea.rows = 6;
  textarea.value = value ?? '';
  return textarea;
}

function buildTableauBlockContent(block, value, idPrefix, locked, onMutate) {
  const table = document.createElement('table');
  table.className = 'contenu-tableau';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.appendChild(document.createElement('th'));
  for (const colonne of block.colonnes) {
    const th = document.createElement('th');
    th.scope = 'col';
    if (locked) {
      th.textContent = colonne.nom;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = colonne.nom;
      input.addEventListener('change', () =>
        onMutate((b) => ({
          ...b,
          colonnes: b.colonnes.map((c) => (c.id === colonne.id ? { ...c, nom: input.value } : c)),
        })),
      );
      th.appendChild(input);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'contenu-cell-delete';
      deleteButton.setAttribute('aria-label', `Supprimer la colonne ${colonne.nom}`);
      deleteButton.textContent = '×';
      deleteButton.addEventListener('click', () =>
        onMutate((b) => ({ ...b, colonnes: b.colonnes.filter((c) => c.id !== colonne.id) })),
      );
      th.appendChild(deleteButton);
    }
    headRow.appendChild(th);
  }
  if (!locked) {
    const addColTh = document.createElement('th');
    const addColButton = document.createElement('button');
    addColButton.type = 'button';
    addColButton.textContent = '+ Colonne';
    addColButton.addEventListener('click', () =>
      onMutate((b) => ({ ...b, colonnes: [...b.colonnes, { id: crypto.randomUUID(), nom: 'Colonne' }] })),
    );
    addColTh.appendChild(addColButton);
    headRow.appendChild(addColTh);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const ligne of block.lignes) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    if (locked) {
      th.textContent = ligne.nom;
    } else {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = ligne.nom;
      input.addEventListener('change', () =>
        onMutate((b) => ({
          ...b,
          lignes: b.lignes.map((l) => (l.id === ligne.id ? { ...l, nom: input.value } : l)),
        })),
      );
      th.appendChild(input);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'contenu-cell-delete';
      deleteButton.setAttribute('aria-label', `Supprimer la ligne ${ligne.nom}`);
      deleteButton.textContent = '×';
      deleteButton.addEventListener('click', () =>
        onMutate((b) => ({ ...b, lignes: b.lignes.filter((l) => l.id !== ligne.id) })),
      );
      th.appendChild(deleteButton);
    }
    tr.appendChild(th);
    for (const colonne of block.colonnes) {
      const td = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'text';
      input.id = `${idPrefix}-${block.id}-${ligne.id}-${colonne.id}`;
      input.value = value?.[ligne.id]?.[colonne.id] ?? '';
      td.appendChild(input);
      tr.appendChild(td);
    }
    if (!locked) tr.appendChild(document.createElement('td'));
    tbody.appendChild(tr);
  }
  if (!locked) {
    const addRowTr = document.createElement('tr');
    const addRowTd = document.createElement('td');
    addRowTd.colSpan = block.colonnes.length + 2;
    const addRowButton = document.createElement('button');
    addRowButton.type = 'button';
    addRowButton.textContent = '+ Ligne';
    addRowButton.addEventListener('click', () =>
      onMutate((b) => ({ ...b, lignes: [...b.lignes, { id: crypto.randomUUID(), nom: 'Nouvelle ligne' }] })),
    );
    addRowTd.appendChild(addRowButton);
    addRowTr.appendChild(addRowTd);
    tbody.appendChild(addRowTr);
  }
  table.appendChild(tbody);
  return table;
}

function readBlockValue(listEl, block, idPrefix) {
  if (block.type === 'texte') {
    return listEl.querySelector(`#${idPrefix}-${block.id}`)?.value ?? '';
  }
  const blockValues = {};
  for (const ligne of block.lignes) {
    blockValues[ligne.id] = {};
    for (const colonne of block.colonnes) {
      const input = listEl.querySelector(`#${idPrefix}-${block.id}-${ligne.id}-${colonne.id}`);
      blockValues[ligne.id][colonne.id] = input?.value ?? '';
    }
  }
  return blockValues;
}

// Éditeur de la page « Contenu » d'une entrée ou d'un modèle : une liste de
// blocs (texte, tableau de mesures). En mode verrouillé (entrée créée à
// partir d'un modèle), seules les valeurs sont éditables, jamais la
// structure (titres, lignes, colonnes, ajout/suppression de bloc).
export function createContentEditor({ listEl, addTexteButtonEl, addTableauButtonEl, idPrefix }) {
  let schema = { blocks: [], order: [] };
  let values = {};
  let locked = false;

  function readValues() {
    const result = {};
    for (const block of schema.blocks) {
      result[block.id] = readBlockValue(listEl, block, idPrefix);
    }
    return result;
  }

  function buildBlockCard(block) {
    const card = document.createElement('div');
    card.className = 'contenu-block';

    const header = document.createElement('div');
    header.className = 'contenu-block-header';

    if (locked) {
      const titre = document.createElement('span');
      titre.className = 'contenu-block-titre';
      titre.textContent = block.titre;
      header.appendChild(titre);
    } else {
      const titreInput = document.createElement('input');
      titreInput.type = 'text';
      titreInput.className = 'contenu-block-titre-input';
      titreInput.value = block.titre;
      titreInput.addEventListener('change', () => mutateBlock(block.id, (b) => ({ ...b, titre: titreInput.value })));
      header.appendChild(titreInput);

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.textContent = 'Supprimer le bloc';
      deleteButton.addEventListener('click', () => deleteBlock(block.id));
      header.appendChild(deleteButton);
    }
    card.appendChild(header);

    const onMutate = (updater) => mutateBlock(block.id, updater);
    if (block.type === 'texte') {
      card.appendChild(buildTexteBlockContent(block, values[block.id], idPrefix));
    } else if (block.type === 'tableau') {
      card.appendChild(buildTableauBlockContent(block, values[block.id], idPrefix, locked, onMutate));
    }
    return card;
  }

  function render(newSchema, newValues = {}, isLocked = false) {
    schema = newSchema;
    values = newValues;
    locked = isLocked;
    addTexteButtonEl.hidden = locked;
    addTableauButtonEl.hidden = locked;
    listEl.innerHTML = '';
    for (const blockId of schema.order) {
      const block = schema.blocks.find((b) => b.id === blockId);
      if (!block) continue;
      listEl.appendChild(buildBlockCard(block));
    }
  }

  // Recapture d'abord les valeurs tapées dans le DOM avant de reconstruire,
  // pour ne jamais perdre une saisie en cours sur un autre bloc.
  function mutateBlock(blockId, updater) {
    values = { ...values, ...readValues() };
    schema = { ...schema, blocks: schema.blocks.map((b) => (b.id === blockId ? updater(b) : b)) };
    render(schema, values, locked);
  }

  function deleteBlock(blockId) {
    values = { ...values, ...readValues() };
    schema = {
      blocks: schema.blocks.filter((b) => b.id !== blockId),
      order: schema.order.filter((id) => id !== blockId),
    };
    render(schema, values, locked);
  }

  function addBlock(block) {
    values = { ...values, ...readValues() };
    schema = { blocks: [...schema.blocks, block], order: [...schema.order, block.id] };
    render(schema, values, locked);
  }

  addTexteButtonEl.addEventListener('click', () => addBlock(createTexteBlock('Texte')));
  addTableauButtonEl.addEventListener('click', () => addBlock(createTableauBlock('Tableau de mesures')));

  return {
    render,
    getSchema: () => schema,
    getValues: () => readValues(),
  };
}
