export const NIVEAUX_ACCES = ['N1', 'N2', 'N3', 'N4', 'N5'];
export const STATUTS = ['A Valider', 'A Compléter', 'Complete', 'Bilan'];
export const THEMES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];
export const TYPES_JOURNEE = ['Ordinaire', 'Centrée sur le sujet', 'Exceptionnelle'];
export const DELAI_RESSENTI_A_FROID_JOURS = 2;
export const FIXED_BLOCK_KEYS = ['themes', 'niveau', 'statut', 'typeJournee', 'energie', 'ressenti'];

export function createTexteBlock(titre = 'Texte') {
  return { id: crypto.randomUUID(), type: 'texte', titre };
}

export function createTableauBlock(titre = 'Tableau de mesures') {
  return {
    id: crypto.randomUUID(),
    type: 'tableau',
    titre,
    colonnes: [{ id: crypto.randomUUID(), nom: 'Valeur' }],
    lignes: [],
  };
}

export function blankContenuSchema() {
  const block = createTexteBlock();
  return { blocks: [block], order: [block.id] };
}

function legacyContenuSchema() {
  const blockId = 'legacy-texte';
  return { blocks: [{ id: blockId, type: 'texte', titre: 'Texte' }], order: [blockId] };
}

// Les entrées/modèles créés avant l'introduction du Contenu structuré en
// blocs n'ont qu'un champ `texte` plat : on le présente comme un unique
// bloc texte, sans réécrire les données existantes sur Drive.
export function migrateEntryContenu(entry) {
  if (entry.contenuSchema) return entry;
  return {
    ...entry,
    modeleId: entry.modeleId ?? null,
    contenuSchema: legacyContenuSchema(),
    contenuValeurs: { 'legacy-texte': entry.texte ?? '' },
  };
}

export function migrateModeleContenu(modele) {
  if (modele.contenuSchema) return modele;
  return {
    ...modele,
    contenuSchema: legacyContenuSchema(),
    contenuValeursParDefaut: { 'legacy-texte': modele.texte ?? '' },
  };
}

export function previewContenuTexte(entry) {
  const texteBlockId = entry.contenuSchema.order.find(
    (id) => entry.contenuSchema.blocks.find((b) => b.id === id)?.type === 'texte',
  );
  return texteBlockId ? (entry.contenuValeurs[texteBlockId] ?? '') : '';
}

export function createEntry({
  titre,
  date,
  themes,
  niveauAcces,
  statut,
  typeJournee,
  energie,
  ressenti,
  champsPersonnalises = {},
  champsSchema = { fields: [], order: [...FIXED_BLOCK_KEYS] },
  modeleId = null,
  contenuSchema = blankContenuSchema(),
  contenuValeurs = {},
}) {
  return {
    id: crypto.randomUUID(),
    titre,
    date,
    themes,
    niveauAcces,
    statut,
    typeJournee,
    mesuresSoir: { energie, ressenti },
    ressentiAFroid: null,
    champsPersonnalises,
    champsSchema,
    modeleId,
    contenuSchema,
    contenuValeurs,
    creeLe: new Date().toISOString(),
  };
}

export function updateEntry(
  entry,
  { titre, themes, niveauAcces, statut, typeJournee, energie, ressenti, champsPersonnalises, champsSchema, contenuSchema, contenuValeurs },
) {
  return {
    ...entry,
    titre,
    themes,
    niveauAcces,
    statut,
    typeJournee,
    mesuresSoir: { energie, ressenti },
    champsPersonnalises,
    champsSchema,
    contenuSchema,
    contenuValeurs,
  };
}

export function peutRemplirRessentiAFroid(entry, maintenant = new Date()) {
  if (entry.ressentiAFroid != null) return false;
  const seuil = new Date(entry.date);
  seuil.setDate(seuil.getDate() + DELAI_RESSENTI_A_FROID_JOURS);
  return maintenant >= seuil;
}

export function filtrerEntreesPartage(entries, regles) {
  return entries
    .filter((entry) => entry.themes.some((theme) => regles[theme]?.includes(entry.niveauAcces)))
    .map(({ champsPersonnalises, champsSchema, ...rest }) => rest);
}
