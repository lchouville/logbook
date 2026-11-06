export const NIVEAUX_ACCES = ['N1', 'N2', 'N3', 'N4', 'N5'];
export const STATUTS = ['A Valider', 'A Compléter', 'Complete', 'Bilan'];
export const THEMES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];
export const TYPES_JOURNEE = ['Ordinaire', 'Centrée sur le sujet', 'Exceptionnelle'];
export const DELAI_RESSENTI_A_FROID_JOURS = 2;
export const FIXED_BLOCK_KEYS = ['themes', 'niveau', 'statut', 'typeJournee', 'energie', 'ressenti'];

export function createEntry({
  titre,
  date,
  themes,
  niveauAcces,
  statut,
  typeJournee,
  energie,
  ressenti,
  texte,
  champsPersonnalises = {},
  champsSchema = { fields: [], order: [...FIXED_BLOCK_KEYS] },
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
    texte,
    champsPersonnalises,
    champsSchema,
    creeLe: new Date().toISOString(),
  };
}

export function updateEntry(
  entry,
  { titre, themes, niveauAcces, statut, typeJournee, energie, ressenti, texte, champsPersonnalises, champsSchema },
) {
  return {
    ...entry,
    titre,
    themes,
    niveauAcces,
    statut,
    typeJournee,
    mesuresSoir: { energie, ressenti },
    texte,
    champsPersonnalises,
    champsSchema,
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
