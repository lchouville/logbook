// Définitions statiques des 4 tests de la fiche personnelle : questions à
// choix fixes (non éditables) et calcul pur de la tendance affichée. Rien
// ici n'est un diagnostic clinique, seulement des mappings réponses → texte
// indicatif (voir docs/design/personality-sheet*.md).

// Échelle d'accord à 5 points (façon instruments publics type IPIP), réutilisée par les
// questions formulées comme des affirmations plutôt que des choix binaires opposés.
const LIKERT_SCALE = [
  { value: '1', label: 'Pas du tout d’accord' },
  { value: '2', label: 'Plutôt pas d’accord' },
  { value: '3', label: 'Neutre' },
  { value: '4', label: 'Plutôt d’accord' },
  { value: '5', label: 'Tout à fait d’accord' },
];

export const TEST_DEFINITIONS = {
  // S'inspire du principe public des 4 axes de la typologie jungienne (énergie,
  // perception, décision, mode de vie) : ce n'est PAS le test officiel MBTI/16Personalities
  // (marques déposées, questions et noms de types protégés) — questions et titres
  // originaux, écrits pour ce projet. 4 questions par axe pour limiter l'effet d'une
  // réponse isolée, voir computePersonality pour le calcul.
  personality: {
    label: 'Type de personnalité',
    consent:
      "Ce test est indicatif, pas un diagnostic psychologique. Il s'inspire du principe des 4 axes de la typologie jungienne (énergie, perception, décision, mode de vie) avec des questions originales — ce n'est pas le test officiel MBTI/16Personalities. 16 questions, résultat stocké dans ton Drive personnel.",
    questions: [
      {
        id: 'ei1',
        text: 'En groupe, tu te sens plutôt…',
        choices: [
          { value: 'I', label: 'Rechargé·e par des moments seul·e' },
          { value: 'E', label: 'Rechargé·e par les interactions' },
        ],
      },
      {
        id: 'ei2',
        text: 'Après une longue journée sociale, tu as plutôt envie de…',
        choices: [
          { value: 'E', label: 'Prolonger la soirée avec d’autres' },
          { value: 'I', label: 'Te retrouver seul·e pour recharger' },
        ],
      },
      {
        id: 'ei3',
        text: 'Face à une personne que tu ne connais pas, tu as tendance à…',
        choices: [
          { value: 'E', label: 'Engager facilement la conversation' },
          { value: 'I', label: 'Observer avant de te lancer' },
        ],
      },
      {
        id: 'ei4',
        text: 'Tu préfères résoudre un problème…',
        choices: [
          { value: 'E', label: 'En en parlant à voix haute avec d’autres' },
          { value: 'I', label: 'En y réfléchissant seul·e d’abord' },
        ],
      },
      {
        id: 'sn1',
        text: 'Quand on te raconte quelque chose, tu retiens surtout…',
        choices: [
          { value: 'S', label: 'Les faits concrets et les détails' },
          { value: 'N', label: 'Les idées générales et les possibles' },
        ],
      },
      {
        id: 'sn2',
        text: 'Tu fais plutôt confiance à…',
        choices: [
          { value: 'S', label: 'Ce que tu as déjà vécu et observé' },
          { value: 'N', label: 'Ton intuition et les connexions que tu perçois' },
        ],
      },
      {
        id: 'sn3',
        text: 'Un nouveau projet t’attire d’abord par…',
        choices: [
          { value: 'S', label: 'Sa faisabilité concrète' },
          { value: 'N', label: 'Son potentiel et ses possibilités' },
        ],
      },
      {
        id: 'sn4',
        text: 'Tu préfères des instructions…',
        choices: [
          { value: 'S', label: 'Précises, étape par étape' },
          { value: 'N', label: 'Ouvertes, qui laissent de la place à l’interprétation' },
        ],
      },
      {
        id: 'tf1',
        text: 'Pour décider, tu te fies plutôt à…',
        choices: [
          { value: 'T', label: 'La logique et l’analyse' },
          { value: 'F', label: 'Tes valeurs et ton ressenti' },
        ],
      },
      {
        id: 'tf2',
        text: 'Face à un désaccord, tu cherches d’abord…',
        choices: [
          { value: 'T', label: 'Qui a raison sur les faits' },
          { value: 'F', label: 'Comment chacun se sent dans la situation' },
        ],
      },
      {
        id: 'tf3',
        text: 'Donner un retour franc à quelqu’un, pour toi c’est…',
        choices: [
          { value: 'T', label: 'Important, même si ça peut piquer' },
          { value: 'F', label: 'À faire avec beaucoup de délicatesse' },
        ],
      },
      {
        id: 'tf4',
        text: 'Une bonne décision est avant tout…',
        choices: [
          { value: 'T', label: 'Cohérente et justifiable' },
          { value: 'F', label: 'Alignée avec ce qui compte pour les gens concernés' },
        ],
      },
      {
        id: 'jp1',
        text: 'Ton quotidien est plutôt…',
        choices: [
          { value: 'J', label: 'Planifié, avec des repères fixes' },
          { value: 'P', label: 'Spontané, ouvert à l’imprévu' },
        ],
      },
      {
        id: 'jp2',
        text: 'Avant un voyage, tu préfères…',
        choices: [
          { value: 'J', label: 'Avoir un itinéraire détaillé' },
          { value: 'P', label: 'Improviser sur place' },
        ],
      },
      {
        id: 'jp3',
        text: 'Une échéance qui approche te pousse à…',
        choices: [
          { value: 'J', label: 'Finir largement en avance' },
          { value: 'P', label: 'Accélérer à la dernière minute' },
        ],
      },
      {
        id: 'jp4',
        text: 'Ton espace de travail est plutôt…',
        choices: [
          { value: 'J', label: 'Rangé, organisé selon un système' },
          { value: 'P', label: 'Vivant, avec plusieurs choses en cours' },
        ],
      },
    ],
  },
  // Contrairement à la personnalité, une identité de genre ne se "déduit" pas vraiment
  // d'un quiz à choix forcé (c'est auto-déclaré) : on demande le genre assigné à la
  // naissance (question factuelle) puis 4 axes de ressenti (alignement, binaire/non-binaire,
  // stable/fluide, et un axe "envie" via le format informel du "test du bouton" popularisé
  // dans les communautés trans/questionnement — un indicateur indirect, pas une affirmation
  // notée en accord comme les 3 premiers axes), voir computeGenderIdentity.
  genderIdentity: {
    label: 'Identité de genre',
    consent:
      "Ce test est indicatif, pas un diagnostic. Il propose une tendance de ressenti sur ton identité de genre à partir d'affirmations notées en accord et de deux questions hypothétiques (le « test du bouton »), pas d'un verdict figé — si aucun des résultats possibles ne te correspond, c'est normal, une identité ne se résume pas à un quiz. Le résultat sera stocké dans ton Drive personnel.",
    questions: [
      {
        id: 'assignedSex',
        text: 'Le genre qui t’a été assigné à la naissance est…',
        choices: [
          { value: 'homme', label: 'Homme' },
          { value: 'femme', label: 'Femme' },
          { value: 'autre', label: 'Autre (intersexe, etc.)' },
        ],
      },
      { id: 'al1', text: 'Je ne me reconnais pas vraiment dans le genre qui m’a été assigné à la naissance.', choices: LIKERT_SCALE },
      { id: 'al2', text: 'Me projeter dans le genre qui m’a été assigné à la naissance me semble inconfortable ou décalé.', choices: LIKERT_SCALE },
      { id: 'al3', text: 'Si on me décrivait avec le genre assigné à la naissance, je trouverais ça globalement faux.', choices: LIKERT_SCALE },
      { id: 'bi1', text: 'Me définir uniquement comme homme ou femme me semble trop restrictif pour moi.', choices: LIKERT_SCALE },
      { id: 'bi2', text: 'Je me sens à l’aise avec l’idée d’être entre ou en dehors des cases homme/femme.', choices: LIKERT_SCALE },
      { id: 'bi3', text: 'Devoir choisir entre seulement homme ou femme serait difficile ou artificiel pour moi.', choices: LIKERT_SCALE },
      { id: 'fl1', text: 'Mon ressenti sur mon genre varie selon les périodes.', choices: LIKERT_SCALE },
      { id: 'fl2', text: 'D’une semaine à l’autre, ce que je ressens par rapport à mon genre peut changer.', choices: LIKERT_SCALE },
      { id: 'fl3', text: 'Je dirais que mon rapport à mon genre est plutôt en mouvement que figé.', choices: LIKERT_SCALE },
      {
        id: 'ds1',
        text: 'Un bouton magique peut changer ton genre instantanément. Chaque appui sauve aussi des chats et chiens abandonnés. À partir de quelle quantité appuierais-tu ?',
        choices: [
          { value: '0', label: 'Jamais, même pour 1 million d’animaux sauvés' },
          { value: '1', label: 'Seulement pour un très grand nombre (environ 1 million)' },
          { value: '2', label: 'Pour un nombre moyen (une centaine)' },
          { value: '3', label: 'Pour peu d’animaux (une dizaine)' },
          { value: '4', label: 'Même sans aucune raison, j’appuierais' },
        ],
      },
      {
        id: 'ds2',
        text: 'Un bouton te rapporte 1€ à chaque appui, mais à un moment aléatoire il change ton genre et s’arrête de fonctionner. Tu appuies…',
        choices: [
          { value: '0', label: 'Jamais, je n’appuie pas du tout' },
          { value: '1', label: 'Une ou deux fois, par curiosité' },
          { value: '2', label: 'Un moment, puis je m’arrête par précaution' },
          { value: '3', label: 'Longtemps, tant qu’il fonctionne' },
          { value: '4', label: 'Autant que possible, le résultat ne me dérangerait pas' },
        ],
      },
    ],
  },
  orientation: {
    label: 'Orientation (relationnelle et sexuelle)',
    consent:
      "Ce test est indicatif, pas un diagnostic. Il propose une tendance sur ton orientation relationnelle et sexuelle. Le résultat sera stocké dans ton Drive personnel.",
    questions: [
      {
        id: 'attirance',
        text: 'Tu te sens attiré·e plutôt par…',
        choices: [
          { value: 'meme-genre', label: 'Des personnes du même genre' },
          { value: 'autre-genre', label: "Des personnes d'un autre genre" },
          { value: 'tous-genres', label: 'Des personnes sans distinction de genre' },
          { value: 'peu-importe', label: 'L’attirance ne dépend pas beaucoup du genre pour toi' },
        ],
      },
      {
        id: 'relations',
        text: 'Tu te projettes plutôt dans…',
        choices: [
          { value: 'exclusive', label: 'Une relation exclusive à la fois' },
          { value: 'non-exclusive', label: 'Plusieurs relations en parallèle' },
          { value: 'incertain', label: 'Tu ne sais pas encore' },
        ],
      },
    ],
  },
  political: {
    label: 'Politique',
    consent:
      "Ce test est indicatif, pas un diagnostic. Il situe grossièrement tes positions sur deux axes classiques. Le résultat sera stocké dans ton Drive personnel.",
    questions: [
      {
        id: 'economie',
        text: 'Sur le plan économique, tu es plutôt favorable…',
        choices: [
          { value: 'intervention', label: 'À une intervention forte de l’État' },
          { value: 'liberal', label: 'À plus de liberté de marché' },
          { value: 'mixte', label: 'À un équilibre entre les deux' },
        ],
      },
      {
        id: 'social',
        text: 'Sur les questions de société, tu te sens plutôt…',
        choices: [
          { value: 'progressiste', label: 'Progressiste' },
          { value: 'conservateur', label: 'Conservateur·rice' },
          { value: 'modere', label: 'Modéré·e' },
        ],
      },
    ],
  },
};

// Titres originaux (pas ceux de 16Personalities/MBTI, qui sont protégés), un par
// combinaison des 4 axes, à tonalité "fiche de personnage" cohérente avec l'onglet
// Aperçu — posent la base texte d'un futur système d'avatar (voir conversation).
const PERSONALITY_TITLES = {
  ISTJ: 'Le Gardien des Archives',
  ISFJ: 'Le Protecteur du Foyer',
  INFJ: 'Le Visionnaire Silencieux',
  INTJ: 'Le Stratège de l’Ombre',
  ISTP: 'L’Artisan Itinérant',
  ISFP: 'Le Troubadour Discret',
  INFP: 'Le Rêveur Idéaliste',
  INTP: 'Le Chercheur Solitaire',
  ESTP: 'L’Aventurier Audacieux',
  ESFP: 'Le Bouffon du Royaume',
  ENFP: 'Le Héraut Enthousiaste',
  ENTP: 'Le Provocateur Astucieux',
  ESTJ: 'Le Commandant de Garnison',
  ESFJ: 'L’Intendant du Village',
  ENFJ: 'Le Meneur Inspirant',
  ENTJ: 'Le Seigneur Stratège',
};

const PERSONALITY_AXIS_FRAGMENTS = {
  E: 'tourné·e vers les autres et l’action',
  I: 'plutôt réservé·e, qui puise son énergie dans la solitude',
  S: 'attentif·ve au concret et aux détails',
  N: 'attiré·e par les idées et les possibles',
  T: 'qui tranche avec la logique',
  F: 'qui décide avec ses valeurs et son ressenti',
  J: 'qui aime la structure et anticiper',
  P: 'qui préfère s’adapter au fil de l’eau',
};

// Majorité sur les 4 questions de l'axe ; égalité 2-2 tranchée par la 1re question de
// l'axe (choix arbitraire mais déterministe, pas de biais caché vers une lettre).
function resolveAxis(answers, ids, poleA, poleB) {
  let countA = 0;
  let countB = 0;
  for (const id of ids) {
    if (answers[id] === poleA) countA++;
    else if (answers[id] === poleB) countB++;
  }
  if (countA === countB) return answers[ids[0]];
  return countA > countB ? poleA : poleB;
}

function computePersonality(answers) {
  const energie = resolveAxis(answers, ['ei1', 'ei2', 'ei3', 'ei4'], 'E', 'I');
  const perception = resolveAxis(answers, ['sn1', 'sn2', 'sn3', 'sn4'], 'S', 'N');
  const decision = resolveAxis(answers, ['tf1', 'tf2', 'tf3', 'tf4'], 'T', 'F');
  const modeDeVie = resolveAxis(answers, ['jp1', 'jp2', 'jp3', 'jp4'], 'J', 'P');
  const code = `${energie}${perception}${decision}${modeDeVie}`;
  const tendances = [energie, perception, decision, modeDeVie].map((pole) => PERSONALITY_AXIS_FRAGMENTS[pole]).join(', ');
  return `${PERSONALITY_TITLES[code]} (${code}). Tendance : ${tendances}.`;
}

const GENDER_ASSIGNED_LABELS = { homme: 'Homme', femme: 'Femme', autre: 'Autre' };

const GENDER_AXIS_FRAGMENTS = {
  A: 'un genre ressenti aligné avec celui assigné à la naissance',
  N: 'un genre ressenti différent de celui assigné à la naissance',
  B: 'une identification binaire (homme ou femme)',
  X: 'une identification en dehors du binaire homme/femme',
  S: 'un ressenti stable dans le temps',
  F: 'un ressenti qui varie dans le temps',
  low: 'peu d’envie de changer de genre, même dans l’hypothétique',
  high: 'une certaine envie de changer de genre, révélée par les questions du « bouton »',
};

// Chaque affirmation est formulée vers un seul pôle (ex. "non-aligné") ; la somme des 3
// notes (1 à 5) sur un axe est comparée au neutre strict (3×3=9) pour trancher le pôle.
// Égalité exacte à 9 tranchée vers le pôle "par défaut" (aligné/binaire/stable), choix
// arbitraire mais déterministe et documenté, pas une affirmation que ce pôle est "normal".
function likertAxisPole(answers, ids, defaultPole, otherPole) {
  const sum = ids.reduce((total, id) => total + Number(answers[id] ?? 3), 0);
  return sum > ids.length * 3 ? otherPole : defaultPole;
}

// Les 2 questions du "bouton" vont de 0 (résistance maximale) à 4 (aucune résistance) ;
// seuil au-dessus de la moyenne stricte (2 points chacune, soit 4 sur 8) pour pencher "high".
function desirePole(answers) {
  const sum = Number(answers.ds1 ?? 0) + Number(answers.ds2 ?? 0);
  return sum > 4 ? 'high' : 'low';
}

function computeGenderIdentity(answers) {
  const alignment = likertAxisPole(answers, ['al1', 'al2', 'al3'], 'A', 'N');
  const binary = likertAxisPole(answers, ['bi1', 'bi2', 'bi3'], 'B', 'X');
  const stability = likertAxisPole(answers, ['fl1', 'fl2', 'fl3'], 'S', 'F');
  const desire = desirePole(answers);

  // Le "bouton" ne sert qu'à nuancer un profil par ailleurs aligné/binaire/stable (signal
  // indirect d'un questionnement pas forcément exprimé dans les affirmations directes) —
  // il ne renverse jamais une tendance déjà claire sur les 3 premiers axes.
  let label;
  if (stability === 'F') label = 'Genderfluide';
  else if (binary === 'X') label = 'Non-binaire';
  else if (alignment === 'N') label = 'Transgenre';
  else if (desire === 'high') label = 'Questionnement';
  else label = 'Cisgenre';

  const assignedLabel = GENDER_ASSIGNED_LABELS[answers.assignedSex] ?? 'Non précisé';
  const fragments = [alignment, binary, stability, desire].map((pole) => GENDER_AXIS_FRAGMENTS[pole]).join(', ');
  return `${label}. Genre assigné à la naissance : ${assignedLabel}. Ressenti : ${fragments}.`;
}

function computeOrientation(answers) {
  const attirance = {
    'meme-genre': 'une attirance plutôt pour les personnes du même genre',
    'autre-genre': "une attirance plutôt pour les personnes d'un autre genre",
    'tous-genres': 'une attirance peu liée au genre de l’autre personne',
    'peu-importe': 'une attirance peu liée au genre de l’autre personne',
  }[answers.attirance];
  const relations = {
    exclusive: 'une tendance plutôt monogame',
    'non-exclusive': 'une tendance plutôt non-exclusive',
    incertain: 'pas encore de tendance claire sur ce point',
  }[answers.relations];
  return `Tendance vers ${attirance}, et ${relations}.`;
}

function computePolitical(answers) {
  const economie = { intervention: 'plutôt favorable à l’intervention de l’État', liberal: 'plutôt favorable au marché libre', mixte: 'plutôt équilibré sur le plan économique' }[
    answers.economie
  ];
  const social = { progressiste: 'plutôt progressiste', conservateur: 'plutôt conservateur·rice', modere: 'plutôt modéré·e' }[answers.social];
  return `Tendance ${economie} et ${social} sur les questions de société.`;
}

const RESULT_COMPUTERS = {
  personality: computePersonality,
  genderIdentity: computeGenderIdentity,
  orientation: computeOrientation,
  political: computePolitical,
};

// Pure : mêmes réponses -> même tendance, pas d'effet de bord, pas de score chiffré.
export function computeResult(testKey, answers) {
  const compute = RESULT_COMPUTERS[testKey];
  if (!compute) throw new Error(`Test inconnu : ${testKey}`);
  return compute(answers);
}
