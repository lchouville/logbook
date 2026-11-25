export const NIVEAUX_ACCES = ['N1', 'N2', 'N3', 'N4', 'N5'];
export const STATUTS = ['A Valider', 'A Compléter', 'Complete', 'Bilan'];
export const THEMES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];
export const DELAI_RESSENTI_A_FROID_JOURS = 2;
export const FIXED_BLOCK_KEYS = ['themes', 'niveau', 'statut'];

export function formatDateFr(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// {date} et {id} dans le modèle de titre d'un modèle : {date} est la date du
// jour (affichée en français, stockée en ISO par ailleurs) et {id} le rang de
// l'entrée parmi celles déjà créées via ce même modèle (1 pour la première).
export function resolveTitreModele(pattern, { date, id }) {
  if (!pattern) return '';
  return pattern.replace(/\{date\}/g, formatDateFr(date)).replace(/\{id\}/g, String(id));
}

const MOIS_FR = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre';

// Pour regrouper des titres générés en série (ex. "Rituel du soir — 21/11" et
// "Rituel du soir — 25/09/2026") : les dates sous toutes leurs formes usuelles et
// les nombres isolés sont remplacés par {date}/{id}, pour ne garder que la forme
// commune du titre.
export function titreGroupKey(titre) {
  return (titre || '')
    .replace(/\d{4}-\d{2}-\d{2}/g, '{date}')
    .replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, '{date}')
    .replace(new RegExp(`\\d{1,2}\\s+(?:${MOIS_FR})\\s+\\d{4}`, 'gi'), '{date}')
    .replace(/\d+/g, '{id}');
}

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

export function createGraphiqueBlock(titre = 'Graphique') {
  return { id: crypto.randomUUID(), type: 'graphique', titre };
}

export function formatDateFrCourt(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Construit le Contenu (tableau + graphique) d'un bilan à partir des entrées
// « Rituel du soir » couvrant `jours` (liste de dates ISO). Les jours sont
// toujours tous affichés (tableau et graphique), même sans entrée — ces
// valeurs manquantes sont simplement sautées, pas interpolées. Les noms de
// mesures viennent du tableau de mesures de l'entrée la plus récente trouvée
// dans la période, pour rester cohérent même si l'utilisateur les a
// renommées dans son propre modèle.
function buildBilanRituel(entriesRituel, jours, titreTableau, titreGraphique) {
  const parDate = new Map(entriesRituel.map((e) => [e.date, e]));

  function tableauInfo(entry) {
    const block = entry?.contenuSchema.blocks.find((b) => b.type === 'tableau');
    if (!block) return null;
    const colValeur = block.colonnes.find((c) => c.nom === 'Valeur') ?? block.colonnes[0];
    return { block, colValeur, valeurs: entry.contenuValeurs[block.id] ?? {} };
  }

  const reference = jours.map((j) => tableauInfo(parDate.get(j))).find(Boolean);
  const lignesNoms = reference ? reference.block.lignes.map((l) => l.nom) : [];

  function valeurPour(nom, jour) {
    const info = tableauInfo(parDate.get(jour));
    const ligne = info?.block.lignes.find((l) => l.nom === nom);
    return ligne ? (info.valeurs[ligne.id]?.[info.colValeur.id] ?? '') : '';
  }

  const tableauBlock = {
    id: crypto.randomUUID(),
    type: 'tableau',
    titre: titreTableau,
    colonnes: jours.map((j) => ({ id: crypto.randomUUID(), nom: formatDateFrCourt(j) })),
    lignes: lignesNoms.map((nom) => ({ id: crypto.randomUUID(), nom })),
  };
  const tableauValeurs = {};
  tableauBlock.lignes.forEach((ligne, i) => {
    tableauValeurs[ligne.id] = {};
    tableauBlock.colonnes.forEach((colonne, j) => {
      tableauValeurs[ligne.id][colonne.id] = valeurPour(lignesNoms[i], jours[j]);
    });
  });

  // Une ligne est tracée sur le graphique dès qu'elle a au moins une valeur numérique
  // sur la période — pas de liste figée de noms de mesures, ça vaudrait pour n'importe
  // quel modèle (pas seulement celui de l'utilisateur d'origine).
  const estNumerique = (nom) =>
    jours.some((jour) => {
      const brut = valeurPour(nom, jour);
      return brut !== '' && Number.isFinite(Number(brut));
    });

  const graphiqueBlock = { id: crypto.randomUUID(), type: 'graphique', titre: titreGraphique };
  const series = lignesNoms
    .filter(estNumerique)
    .map((nom) => ({
      nom,
      points: jours.map((jour) => {
        const brut = valeurPour(nom, jour);
        const valeur = brut === '' ? null : Number(brut);
        return { date: jour, valeur: Number.isFinite(valeur) ? valeur : null };
      }),
    }));

  return {
    contenuSchema: { blocks: [tableauBlock, graphiqueBlock], order: [tableauBlock.id, graphiqueBlock.id] },
    contenuValeurs: { [tableauBlock.id]: tableauValeurs, [graphiqueBlock.id]: { series } },
  };
}

// Bilan hebdomadaire : semaine calendaire (lundi à dimanche) contenant `finDateIso`.
export function buildBilanRituelDuSoir(entriesRituel, finDateIso) {
  const fin = new Date(finDateIso);
  const jourSemaineLundi1 = fin.getDay() === 0 ? 7 : fin.getDay(); // 1=lundi … 7=dimanche
  const lundi = new Date(fin);
  lundi.setDate(lundi.getDate() - (jourSemaineLundi1 - 1));
  const jours = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lundi);
    d.setDate(d.getDate() + i);
    jours.push(d.toISOString().slice(0, 10));
  }
  return buildBilanRituel(entriesRituel, jours, 'Tableau de la semaine', 'Évolution sur la semaine');
}

// Bilan mensuel : tous les jours du mois calendaire contenant `finDateIso`.
export function buildBilanMensuelRituelDuSoir(entriesRituel, finDateIso) {
  const fin = new Date(finDateIso);
  // setDate(1) sur une copie de `fin` (pas un nouveau Date(Y,M,1)) : préserve l'heure
  // locale de `fin`, qui compense déjà le décalage UTC introduit par le parsing de
  // finDateIso — reconstruire à minuit local casserait cette compensation et décale
  // chaque jour d'un cran une fois repassé par toISOString() plus bas.
  const premierJour = new Date(fin);
  premierJour.setDate(1);
  const nbJours = new Date(fin.getFullYear(), fin.getMonth() + 1, 0).getDate();
  const jours = [];
  for (let i = 0; i < nbJours; i++) {
    const d = new Date(premierJour);
    d.setDate(d.getDate() + i);
    jours.push(d.toISOString().slice(0, 10));
  }
  return buildBilanRituel(entriesRituel, jours, 'Tableau du mois', 'Évolution sur le mois');
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
  { titre, date, themes, niveauAcces, statut, champsPersonnalises, champsSchema, contenuSchema, contenuValeurs },
) {
  return {
    ...entry,
    titre,
    date,
    themes,
    niveauAcces,
    statut,
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

// Valide la forme d'une entrée venue d'un fichier externe (import IA) avant de
// l'ajouter au journal : un JSON mal formé écrit à la main sur le Drive ne doit
// pas pouvoir casser l'affichage ou planter l'app silencieusement.
export function validateImportedEntry(data) {
  if (!data || typeof data !== 'object') return 'Le fichier ne contient pas un objet JSON.';
  if (typeof data.id !== 'string' || !data.id) return 'Champ "id" manquant.';
  if (typeof data.titre !== 'string') return 'Champ "titre" manquant.';
  if (typeof data.date !== 'string' || !data.date) return 'Champ "date" manquant.';
  if (!Array.isArray(data.themes) || !data.themes.every((t) => THEMES.includes(t))) return 'Champ "themes" invalide.';
  if (!NIVEAUX_ACCES.includes(data.niveauAcces)) return 'Champ "niveauAcces" invalide.';
  if (!STATUTS.includes(data.statut)) return 'Champ "statut" invalide.';
  if (!data.contenuSchema || !Array.isArray(data.contenuSchema.blocks) || !Array.isArray(data.contenuSchema.order)) {
    return 'Champ "contenuSchema" invalide.';
  }
  if (!data.contenuValeurs || typeof data.contenuValeurs !== 'object') return 'Champ "contenuValeurs" invalide.';
  return null;
}

export function filtrerEntreesPartage(entries, regles) {
  return entries
    .filter((entry) => entry.themes.some((theme) => regles[theme]?.includes(entry.niveauAcces)))
    .map(({ champsPersonnalises, champsSchema, ...rest }) => rest);
}
