// Génère test-fixtures/entries-to-import-sample.json : ~20 fiches couvrant les cas
// d'intégration (groupage par titre, remap vers un modèle, erreurs de validation,
// id déjà existant). Usage ponctuel : node test-fixtures/generate-entries-to-import-sample.js
// Ne pas committer le JSON généré s'il contient un id réel tiré du journal de l'utilisateur
// (voir DUPLICATE_ID ci-dessous, à adapter à un id réel de votre tableau de test).
const fs = require('fs');
const path = require('path');

const THEMES_VALIDES = ['Relation', 'Santé', 'Travail', 'Trauma', 'Moral', 'Identité de genre', 'Rêves', 'Projet'];

function baseEntry({ titre, date, niveauAcces = 'N2', statut = 'Complete', themes = ['Identité de genre'] }) {
  return {
    id: crypto.randomUUID(),
    titre,
    date,
    themes,
    niveauAcces,
    statut,
    ressentiAFroid: null,
    champsPersonnalises: {},
    champsSchema: { fields: [], order: ['themes', 'niveau', 'statut'] },
    modeleId: null,
    creeLe: new Date(`${date}T20:00:00.000Z`).toISOString(),
  };
}

function texteEntry(opts, texte) {
  const blockId = crypto.randomUUID();
  return {
    ...baseEntry(opts),
    contenuSchema: { blocks: [{ id: blockId, type: 'texte', titre: 'Texte' }], order: [blockId] },
    contenuValeurs: { [blockId]: texte },
  };
}

// lignes : { nom: valeur }. deuxColonnes : ajoute une colonne "Commentaire" vide (comme le modèle).
function tableauEntry(opts, lignes, { deuxColonnes = false } = {}) {
  const tableId = crypto.randomUUID();
  const colValeur = crypto.randomUUID();
  const colonnes = [{ id: colValeur, nom: 'Valeur' }];
  if (deuxColonnes) colonnes.push({ id: crypto.randomUUID(), nom: 'Commentaire' });
  const ligneDefs = Object.keys(lignes).map((nom) => ({ id: crypto.randomUUID(), nom }));
  const valeurs = {};
  for (const l of ligneDefs) {
    valeurs[l.id] = { [colValeur]: String(lignes[l.nom]) };
    if (deuxColonnes) valeurs[l.id][colonnes[1].id] = '';
  }
  return {
    ...baseEntry(opts),
    contenuSchema: {
      blocks: [{ id: tableId, type: 'tableau', titre: 'Mesures du soir', colonnes, lignes: ligneDefs }],
      order: [tableId],
    },
    contenuValeurs: { [tableId]: valeurs },
  };
}

const RITUEL_COMPLET = {
  'Ressenti Masculin': 4,
  'Ressenti Féminin': 7,
  'Energie Journée': 6,
  'Energie Soir': 5,
  "Envie d'entamer une transition": 8,
  'Type de Journée': 1,
};

const items = [];
function add(name, data) {
  items.push({ name, data });
}

// --- Groupe "Rituel du soir — {date}" : fidélité variable au modèle réel ---
add('rituel-01-complet.json', tableauEntry({ titre: 'Rituel du soir — 16/12/2026', date: '2026-12-16' }, RITUEL_COMPLET));
add(
  'rituel-02-sans-type-journee.json',
  tableauEntry({ titre: 'Rituel du soir — 17/12/2026', date: '2026-12-17' }, {
    'Ressenti Masculin': 5, 'Ressenti Féminin': 8, 'Energie Journée': 7, 'Energie Soir': 4, "Envie d'entamer une transition": 9,
  }),
);
add(
  'rituel-03-ligne-en-plus.json',
  tableauEntry({ titre: 'Rituel du soir — 18/12/2026', date: '2026-12-18' }, {
    'Ressenti Masculin': 3, 'Ressenti Féminin': 6, 'Energie Journée': 5, 'Energie Soir': 6, "Envie d'entamer une transition": 7,
    'Décalage avec mon corps': 5,
  }),
);
add(
  'rituel-04-ligne-peur.json',
  tableauEntry({ titre: 'Rituel du soir — 19/12/2026', date: '2026-12-19' }, {
    'Ressenti Masculin': 4, 'Ressenti Féminin': 7, 'Energie Journée': 6, 'Energie Soir': 6, "Envie d'entamer une transition": 8, Peur: 2,
  }),
);
add(
  'rituel-05-structure-identique-modele.json',
  tableauEntry({ titre: 'Rituel du soir — 20/12/2026', date: '2026-12-20' }, RITUEL_COMPLET, { deuxColonnes: true }),
);
const rituelAvecModele = tableauEntry({ titre: 'Rituel du soir — 21/12/2026', date: '2026-12-21' }, RITUEL_COMPLET, { deuxColonnes: true });
rituelAvecModele.modeleId = '5b362f05-992d-47ed-87ac-6a183981ba5c'; // id réel du modèle "Rituel du soir" (pré-sélection du menu déroulant)
add('rituel-06-modele-deja-lie.json', rituelAvecModele);

// --- Groupe "Bilan du rituel du soir du {date}" : statut Bilan, tableau + graphique ---
function bilanEntry(dateIso) {
  const tableId = crypto.randomUUID();
  const graphId = crypto.randomUUID();
  return {
    ...baseEntry({ titre: `Bilan du rituel du soir du ${dateIso}`, date: dateIso, niveauAcces: 'N3', statut: 'Bilan' }),
    contenuSchema: {
      blocks: [
        { id: tableId, type: 'tableau', titre: 'Tableau de la semaine', colonnes: [], lignes: [] },
        { id: graphId, type: 'graphique', titre: 'Évolution sur la semaine' },
      ],
      order: [tableId, graphId],
    },
    contenuValeurs: { [tableId]: {}, [graphId]: { series: [] } },
  };
}
add('bilan-01.json', bilanEntry('2026-11-16'));
add('bilan-02.json', bilanEntry('2026-11-23'));

// --- Groupe "Test import — {id}" : texte libre ---
add('test-import-01.json', texteEntry({ titre: 'Test import — 1', date: '2026-12-22' }, 'Fiche de test (1/3).'));
add('test-import-02.json', texteEntry({ titre: 'Test import — 2', date: '2026-12-23' }, 'Fiche de test (2/3).'));
add('test-import-03.json', texteEntry({ titre: 'Test import — 3', date: '2026-12-24' }, 'Fiche de test (3/3).'));

// --- Titres uniques (pas de groupe, singleton) ---
add('singleton-01-notes-voyage.json', texteEntry({ titre: 'Notes de voyage', date: '2026-12-25' }, 'Texte libre sans pattern commun.'));
add('singleton-02-reflexion-matin.json', texteEntry({ titre: 'Réflexion du matin', date: '2026-12-26' }, 'Autre texte libre.'));
add(
  'singleton-03-journal-libre.json',
  texteEntry({ titre: 'Journal libre — 27/12', date: '2026-12-27', niveauAcces: 'N5', themes: ['Moral', 'Travail'] }, 'Entrée avec plusieurs thèmes et niveau N5.'),
);

// --- Cas d'erreur (doivent atterrir dans le groupe "Fichiers en erreur") ---
add('erreur-01-niveau-invalide.json', texteEntry({ titre: 'Erreur niveauAcces', date: '2026-12-28', niveauAcces: 'N9' }, 'x'));
add('erreur-02-statut-invalide.json', texteEntry({ titre: 'Erreur statut', date: '2026-12-29', statut: 'Inconnu' }, 'x'));
{
  const e = texteEntry({ titre: 'Erreur titre manquant', date: '2026-12-30' }, 'x');
  delete e.titre;
  add('erreur-03-titre-manquant.json', e);
}
{
  const e = texteEntry({ titre: 'Erreur contenuSchema', date: '2026-12-31' }, 'x');
  e.contenuSchema = { blocks: 'pas-un-tableau', order: [] };
  add('erreur-04-contenu-schema-invalide.json', e);
}
add('erreur-05-theme-invalide.json', texteEntry({ titre: 'Erreur thème', date: '2027-01-01', themes: ['Carrière'] }, 'x'));

// id volontairement dupliqué avec une entrée déjà présente dans le tableau "test" (dashboard
// de test de l'utilisateur) — valide niveau schéma, mais doit échouer à l'intégration avec
// "Une entrée avec ce id existe déjà". Remplacer par un id réel avant usage si besoin.
const DUPLICATE_ID = '94a0c7b1-a274-4cb6-8a0b-948cff8894c3';
const dup = texteEntry({ titre: 'Erreur id déjà existant', date: '2027-01-02' }, 'x');
dup.id = DUPLICATE_ID;
add('erreur-06-id-duplique.json', dup);

fs.writeFileSync(path.join(__dirname, 'entries-to-import-sample.json'), JSON.stringify(items, null, 2));
console.log(`${items.length} fiches générées.`);
