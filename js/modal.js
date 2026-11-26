const modalRoot = document.getElementById('modal-root');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalPanel = document.getElementById('modal-panel');
const modalClose = document.getElementById('modal-close');

const SECTION_IDS = [
  'logbook-folder-modal',
  'entry-form-modal',
  'modele-form-modal',
  'integration-progress-modal',
  'mapping-correction-modal',
  'inspection-fiche-modal',
  'entry-move-modal',
  'entry-modele-change-modal',
  'profile-consent-modal',
  'profile-question-modal',
  'profile-result-modal',
  'profile-export-modal',
];
const WIDE_SECTION_IDS = ['entry-form-modal', 'modele-form-modal'];
const closeListeners = [];
let returnFocusEl = null;
// À false pendant un traitement en cours (ex. intégration groupée) : empêche de
// fermer la popup par la croix/le fond/Échap, pour ne pas laisser l'utilisateur
// croire qu'il peut modifier les mêmes données pendant que le traitement tourne.
let dismissable = true;

function getFocusable() {
  return Array.from(
    modalPanel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter((el) => !el.disabled && el.getClientRects().length > 0);
}

export function onModalClose(callback) {
  closeListeners.push(callback);
}

export function closeModal() {
  modalRoot.hidden = true;
  for (const callback of closeListeners) callback();
  returnFocusEl?.focus();
  returnFocusEl = null;
}

export function openModal(sectionId, { dismissable: canDismiss = true } = {}) {
  for (const id of SECTION_IDS) {
    document.getElementById(id).hidden = id !== sectionId;
  }
  modalPanel.classList.toggle('modal-panel--wide', WIDE_SECTION_IDS.includes(sectionId));
  // Associe la modale à son titre pour les lecteurs d'écran (chaque section a
  // son propre <h2>, le dialog générique n'a pas de libellé fixe).
  const titleEl = document.querySelector(`#${sectionId} h2`);
  if (titleEl) modalPanel.setAttribute('aria-labelledby', titleEl.id);
  dismissable = canDismiss;
  modalClose.hidden = !canDismiss;
  returnFocusEl = document.activeElement;
  modalRoot.hidden = false;
  const focusable = getFocusable().filter((el) => el !== modalClose);
  (focusable[0] ?? modalClose).focus();
}

modalBackdrop.addEventListener('click', () => dismissable && closeModal());
modalClose.addEventListener('click', () => dismissable && closeModal());
document.addEventListener('keydown', (event) => {
  if (modalRoot.hidden) return;
  if (event.key === 'Escape') {
    if (dismissable) closeModal();
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = getFocusable();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
