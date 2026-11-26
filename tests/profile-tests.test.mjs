// Test ciblé assert-based (aucun framework en place dans le projet) pour la
// seule logique non triviale de ce lot : computeResult. Lancer avec
// `node tests/profile-tests.test.mjs`.
import assert from 'node:assert/strict';
import { computeResult } from '../js/profile-tests.js';

function allAnswers(ei, sn, tf, jp) {
  return {
    ei1: ei, ei2: ei, ei3: ei, ei4: ei,
    sn1: sn, sn2: sn, sn3: sn, sn4: sn,
    tf1: tf, tf2: tf, tf3: tf, tf4: tf,
    jp1: jp, jp2: jp, jp3: jp, jp4: jp,
  };
}

assert.equal(
  computeResult('personality', allAnswers('E', 'S', 'T', 'J')),
  'Le Commandant de Garnison (ESTJ). Tendance : tourné·e vers les autres et l’action, attentif·ve au concret et aux détails, qui tranche avec la logique, qui aime la structure et anticiper.',
);
assert.equal(
  computeResult('personality', allAnswers('I', 'N', 'F', 'P')),
  'Le Rêveur Idéaliste (INFP). Tendance : plutôt réservé·e, qui puise son énergie dans la solitude, attiré·e par les idées et les possibles, qui décide avec ses valeurs et son ressenti, qui préfère s’adapter au fil de l’eau.',
);
// Égalité 2-2 sur l'axe énergie : tranchée par la 1re question de l'axe (ei1 = 'E').
assert.match(
  computeResult('personality', { ei1: 'E', ei2: 'I', ei3: 'E', ei4: 'I', sn1: 'S', sn2: 'S', sn3: 'S', sn4: 'S', tf1: 'T', tf2: 'T', tf3: 'T', tf4: 'T', jp1: 'J', jp2: 'J', jp3: 'J', jp4: 'J' }),
  /^Le Commandant de Garnison \(ESTJ\)/,
);

function genderAnswers(assignedSex, al, bi, fl, ds1 = '0', ds2 = '0') {
  return { assignedSex, al1: al, al2: al, al3: al, bi1: bi, bi2: bi, bi3: bi, fl1: fl, fl2: fl, fl3: fl, ds1, ds2 };
}

assert.equal(
  computeResult('genderIdentity', genderAnswers('homme', '1', '1', '1')),
  'Cisgenre. Genre assigné à la naissance : Homme. Ressenti : un genre ressenti aligné avec celui assigné à la naissance, une identification binaire (homme ou femme), un ressenti stable dans le temps, peu d’envie de changer de genre, même dans l’hypothétique.',
);
assert.equal(
  computeResult('genderIdentity', genderAnswers('homme', '5', '1', '1')),
  'Transgenre. Genre assigné à la naissance : Homme. Ressenti : un genre ressenti différent de celui assigné à la naissance, une identification binaire (homme ou femme), un ressenti stable dans le temps, peu d’envie de changer de genre, même dans l’hypothétique.',
);
assert.match(computeResult('genderIdentity', genderAnswers('femme', '1', '5', '1')), /^Non-binaire\./);
assert.match(computeResult('genderIdentity', genderAnswers('femme', '1', '1', '5')), /^Genderfluide\./);
// Égalité exacte à la neutralité (somme 9 sur 3 items notés 3) : tranchée vers le pôle par défaut.
assert.match(computeResult('genderIdentity', genderAnswers('autre', '3', '3', '3')), /^Cisgenre\./);
// Aligné/binaire/stable sur les affirmations directes, mais "bouton" révélant une envie :
// bascule vers Questionnement plutôt que Cisgenre.
assert.match(computeResult('genderIdentity', genderAnswers('homme', '1', '1', '1', '3', '3')), /^Questionnement\./);

assert.match(computeResult('orientation', { attirance: 'tous-genres', relations: 'non-exclusive' }), /non-exclusive/);

assert.match(computeResult('political', { economie: 'liberal', social: 'conservateur' }), /conservateur/);

assert.throws(() => computeResult('unknown', {}));

console.log('profile-tests.test.mjs: OK');
