export const NIVEAUX_ACCES = ['N1', 'N2', 'N3', 'N4', 'N5'];
export const STATUTS = ['A Valider', 'A Compléter', 'Complete', 'Bilan'];
export const THEMES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];
export const TYPES_JOURNEE = ['Ordinaire', 'Centrée sur le sujet', 'Exceptionnelle'];
export const DELAI_RESSENTI_A_FROID_JOURS = 2;

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

export function peutRemplirRessentiAFroid(entry, maintenant = new Date()) {
  if (entry.ressentiAFroid != null) return false;
  const seuil = new Date(entry.date);
  seuil.setDate(seuil.getDate() + DELAI_RESSENTI_A_FROID_JOURS);
  return maintenant >= seuil;
}

export function filtrerEntreesPartage(entries, regles) {
  return entries.filter((entry) => entry.themes.some((theme) => regles[theme]?.includes(entry.niveauAcces)));
}
