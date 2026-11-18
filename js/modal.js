const modalRoot = document.getElementById('modal-root');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalPanel = document.getElementById('modal-panel');
const modalClose = document.getElementById('modal-close');

const SECTION_IDS = ['entry-form-modal', 'modele-form-modal'];
const WIDE_SECTION_IDS = ['entry-form-modal', 'modele-form-modal'];
const closeListeners = [];
let returnFocusEl = null;

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

export function openModal(sectionId) {
  for (const id of SECTION_IDS) {
    document.getElementById(id).hidden = id !== sectionId;
  }
  modalPanel.classList.toggle('modal-panel--wide', WIDE_SECTION_IDS.includes(sectionId));
  returnFocusEl = document.activeElement;
  modalRoot.hidden = false;
  const focusable = getFocusable().filter((el) => el !== modalClose);
  (focusable[0] ?? modalClose).focus();
}

modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (modalRoot.hidden) return;
  if (event.key === 'Escape') {
    closeModal();
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
