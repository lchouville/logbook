const modalRoot = document.getElementById('modal-root');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

const SECTION_IDS = ['settings', 'partages', 'partages-recus'];

export function closeModal() {
  modalRoot.hidden = true;
}

export function openModal(sectionId) {
  for (const id of SECTION_IDS) {
    document.getElementById(id).hidden = id !== sectionId;
  }
  modalRoot.hidden = false;
}

modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modalRoot.hidden) closeModal();
});
