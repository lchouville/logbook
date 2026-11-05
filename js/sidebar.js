const COLLAPSED_KEY = 'logbook_sidebar_collapsed';

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOwnerAvatar = document.getElementById('sidebar-owner-avatar');
const sidebarOwnerName = document.getElementById('sidebar-owner-name');
const sidebarProfileButton = document.getElementById('sidebar-profile-button');
const sidebarProfileMenu = document.getElementById('sidebar-profile-menu');
const sidebarSettingsButton = document.getElementById('sidebar-settings-button');
const sidebarJournaux = document.getElementById('sidebar-journaux');
const sidebarJournauxPlus = document.getElementById('sidebar-journaux-plus');
const sidebarPartageButton = document.getElementById('sidebar-partage-button');

function closeProfileMenu() {
  sidebarProfileMenu.hidden = true;
  sidebarProfileButton.setAttribute('aria-expanded', 'false');
}

function toggleProfileMenu() {
  const willOpen = sidebarProfileMenu.hidden;
  sidebarProfileMenu.hidden = !willOpen;
  sidebarProfileButton.setAttribute('aria-expanded', String(willOpen));
}

sidebarProfileButton.addEventListener('click', (event) => {
  event.stopPropagation();
  toggleProfileMenu();
});

document.addEventListener('click', (event) => {
  if (!sidebarProfileMenu.hidden && !event.target.closest('#sidebar-profile')) closeProfileMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !sidebarProfileMenu.hidden) closeProfileMenu();
});

sidebarProfileMenu.addEventListener('click', closeProfileMenu);

function getInitialCollapsed() {
  const stored = localStorage.getItem(COLLAPSED_KEY);
  if (stored !== null) return stored === '1';
  return window.matchMedia('(max-width: 768px)').matches;
}

function applyCollapsed(collapsed) {
  sidebar.classList.toggle('collapsed', collapsed);
}

applyCollapsed(getInitialCollapsed());

sidebarToggle.addEventListener('click', () => {
  const collapsed = !sidebar.classList.contains('collapsed');
  applyCollapsed(collapsed);
  localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
});

export function closeSidebarOnMobile() {
  if (window.matchMedia('(max-width: 768px)').matches) {
    applyCollapsed(true);
    localStorage.setItem(COLLAPSED_KEY, '1');
  }
}

export function initSidebar({ onSelectJournal, onOpenSettings, onOpenPartages, onOpenAcces }) {
  sidebarSettingsButton.addEventListener('click', onOpenSettings);
  sidebarPartageButton.addEventListener('click', onOpenPartages);
  sidebarJournauxPlus.addEventListener('click', onOpenAcces);
  sidebarJournaux.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    onSelectJournal(button.dataset.journalId || null);
  });
}

export function renderSidebar({ ownerName, partagesRecus, activeJournalId }) {
  sidebarOwnerName.textContent = ownerName ?? 'Logbook';
  sidebarOwnerAvatar.textContent = (ownerName ?? 'L').trim().charAt(0).toUpperCase();

  sidebarJournaux.innerHTML = '';

  const monJournalLi = document.createElement('li');
  const monJournalButton = document.createElement('button');
  monJournalButton.type = 'button';
  monJournalButton.textContent = 'Mon journal de bord';
  monJournalButton.setAttribute('aria-current', activeJournalId ? 'false' : 'true');
  monJournalLi.appendChild(monJournalButton);
  sidebarJournaux.appendChild(monJournalLi);

  const recents = [...partagesRecus]
    .sort((a, b) => new Date(b.dernierAccesLe ?? b.premierAccesLe) - new Date(a.dernierAccesLe ?? a.premierAccesLe))
    .slice(0, 4);

  for (const partageRecu of recents) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = partageRecu.nom;
    button.dataset.journalId = partageRecu.fichierId;
    button.setAttribute('aria-current', activeJournalId === partageRecu.fichierId ? 'true' : 'false');
    li.appendChild(button);
    sidebarJournaux.appendChild(li);
  }

  sidebarJournauxPlus.hidden = partagesRecus.length === 0;
}
