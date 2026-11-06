const modalRoot = document.getElementById('modal-root');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalPanel = document.getElementById('modal-panel');
const modalClose = document.getElementById('modal-close');

const SECTION_IDS = ['entry-form-modal', 'settings', 'partages', 'partages-recus', 'modeles'];
const WIDE_SECTION_IDS = ['entry-form-modal'];
const closeListeners = [];

export function onModalClose(callback) {
  closeListeners.push(callback);
}

export function closeModal() {
  modalRoot.hidden = true;
  for (const callback of closeListeners) callback();
}

export function openModal(sectionId) {
  for (const id of SECTION_IDS) {
    document.getElementById(id).hidden = id !== sectionId;
  }
  modalPanel.classList.toggle('modal-panel--wide', WIDE_SECTION_IDS.includes(sectionId));
  modalRoot.hidden = false;
}

modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modalRoot.hidden) closeModal();
});
