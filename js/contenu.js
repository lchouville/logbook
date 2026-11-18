import { createTexteBlock, createTableauBlock, formatDateFrCourt } from './entries.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
// Palette catégorielle validée (voir skill dataviz) : ordre fixe, jamais cyclé
// au hasard — 5 créneaux suffisent pour les mesures numériques du rituel.
const GRAPHIQUE_SERIES = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5'];

function buildGraphiqueBlockContent(value) {
  const series = (value?.series ?? []).filter((s) => s.points.some((p) => p.valeur != null));
  if (series.length === 0) {
    const p = document.createElement('p');
    p.className = 'contenu-graphique-vide';
    p.textContent = 'Pas encore de données pour cette période.';
    return p;
  }

  const width = 560;
  const height = 220;
  const padding = { top: 12, right: 24, bottom: 24, left: 24 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const dates = series[0].points.map((p) => p.date);
  const maxValeur = Math.max(10, ...series.flatMap((s) => s.points.map((p) => p.valeur ?? 0)));
  const x = (i) => padding.left + (dates.length === 1 ? plotW / 2 : (i * plotW) / (dates.length - 1));
  const y = (v) => padding.top + plotH - (v / maxValeur) * plotH;

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'contenu-graphique-svg');

  const axeX = document.createElementNS(SVG_NS, 'line');
  axeX.setAttribute('x1', padding.left);
  axeX.setAttribute('x2', width - padding.right);
  axeX.setAttribute('y1', height - padding.bottom);
  axeX.setAttribute('y2', height - padding.bottom);
  axeX.setAttribute('class', 'contenu-graphique-axe');
  svg.appendChild(axeX);

  // Au-delà d'une poignée de points (ex. les ~30 jours d'un bilan mensuel),
  // étiqueter chaque date les ferait toutes se chevaucher. Répartir les
  // étiquettes à intervalles réguliers sur tout l'axe (plutôt qu'un pas fixe
  // avec le dernier point forcé en plus) garantit premier et dernier jour
  // inclus sans jamais coller deux étiquettes l'une à l'autre.
  const maxLabels = 8;
  const labelCount = Math.min(maxLabels, dates.length);
  const labelIndexes = new Set(
    Array.from({ length: labelCount }, (_, k) =>
      Math.round((k * (dates.length - 1)) / Math.max(1, labelCount - 1)),
    ),
  );
  dates.forEach((date, i) => {
    if (!labelIndexes.has(i)) return;
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', x(i));
    label.setAttribute('y', height - 6);
    // Ancrage aux bords pour que les étiquettes des deux extrémités ne
    // débordent pas hors du viewBox (sinon le premier caractère se fait
    // couper, ex. « 11 nov. » affiché « 1 nov. »).
    const ancrage = i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle';
    label.setAttribute('text-anchor', ancrage);
    label.setAttribute('class', 'contenu-graphique-label');
    label.textContent = formatDateFrCourt(date);
    svg.appendChild(label);
  });

  series.forEach((serie, idx) => {
    const colorVar = `var(${GRAPHIQUE_SERIES[idx % GRAPHIQUE_SERIES.length]})`;
    const pointsAttr = serie.points
      .map((p, i) => (p.valeur == null ? null : `${x(i)},${y(p.valeur)}`))
      .filter(Boolean)
      .join(' ');
    const polyline = document.createElementNS(SVG_NS, 'polyline');
    polyline.setAttribute('points', pointsAttr);
    polyline.setAttribute('class', 'contenu-graphique-ligne');
    polyline.style.stroke = colorVar;
    svg.appendChild(polyline);

    for (const [i, p] of serie.points.entries()) {
      if (p.valeur == null) continue;
      const cercle = document.createElementNS(SVG_NS, 'circle');
      cercle.setAttribute('cx', x(i));
      cercle.setAttribute('cy', y(p.valeur));
      cercle.setAttribute('r', '4');
      cercle.setAttribute('class', 'contenu-graphique-point');
      cercle.style.fill = colorVar;
      svg.appendChild(cercle);
    }
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'contenu-graphique';
  wrapper.appendChild(svg);

  const legende = document.createElement('ul');
  legende.className = 'contenu-graphique-legende';
  series.forEach((serie, idx) => {
    const li = document.createElement('li');
    const puce = document.createElement('span');
    puce.className = 'contenu-graphique-puce';
    puce.style.background = `var(${GRAPHIQUE_SERIES[idx % GRAPHIQUE_SERIES.length]})`;
    li.appendChild(puce);
    li.appendChild(document.createTextNode(serie.nom));
    legende.appendChild(li);
  });
  wrapper.appendChild(legende);

  return wrapper;
}

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

  // Scroll horizontal dédié : un bilan mensuel a ~31 colonnes, bien plus que
  // les tableaux de mesures habituels (1-7) — sans ça le tableau se tasse
  // dans la largeur de la carte et les chiffres deviennent illisibles.
  const wrapper = document.createElement('div');
  wrapper.className = 'contenu-tableau-scroll';
  wrapper.appendChild(table);
  return wrapper;
}

function readBlockValue(listEl, block, idPrefix, currentValue) {
  if (block.type === 'texte') {
    return listEl.querySelector(`#${idPrefix}-${block.id}`)?.value ?? '';
  }
  // Bloc calculé automatiquement (ex. graphique de bilan) : aucune saisie,
  // on renvoie sa valeur telle quelle.
  if (block.type === 'graphique') {
    return currentValue;
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
      result[block.id] = readBlockValue(listEl, block, idPrefix, values[block.id]);
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
    } else if (block.type === 'graphique') {
      card.appendChild(buildGraphiqueBlockContent(values[block.id]));
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
