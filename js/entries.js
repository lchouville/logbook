export const NIVEAUX_ACCES = ['N1', 'N2', 'N3', 'N4', 'N5'];
export const STATUTS = ['A Valider', 'A Compléter', 'Complete', 'Bilan'];
export const THEMES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];
export const TYPES_JOURNEE = ['Ordinaire', 'Centrée sur le sujet', 'Exceptionnelle'];

export function createEntry({ date, themes, niveauAcces, statut, typeJournee, energie, ressenti, texte }) {
  return {
    id: crypto.randomUUID(),
    date,
    themes,
    niveauAcces,
    statut,
    typeJournee,
    mesuresSoir: { energie, ressenti },
    ressentiAFroid: null,
    texte,
    creeLe: new Date().toISOString(),
  };
}
