const COLLAPSED_KEY = 'logbook_sidebar_collapsed';

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOwnerAvatar = document.getElementById('sidebar-owner-avatar');
const sidebarOwnerName = document.getElementById('sidebar-owner-name');
const sidebarProfileButton = document.getElementById('sidebar-profile-button');
const sidebarProfileMenu = document.getElementById('sidebar-profile-menu');
const sidebarSettingsButton = document.getElementById('sidebar-settings-button');
const sidebarDashboards = document.getElementById('sidebar-dashboards');
const sidebarDashboardsArchivedToggle = document.getElementById('sidebar-dashboards-archived-toggle');
const sidebarDashboardsArchived = document.getElementById('sidebar-dashboards-archived');
const sidebarJournaux = document.getElementById('sidebar-journaux');
const sidebarJournauxPlus = document.getElementById('sidebar-journaux-plus');
const sidebarPartageButton = document.getElementById('sidebar-partage-button');
const sidebarModelesButton = document.getElementById('sidebar-modeles-button');
const sidebarIntegrationButton = document.getElementById('sidebar-integration-button');

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

export function initSidebar({
  onSelectJournal,
  onOpenSettings,
  onOpenPartages,
  onOpenAcces,
  onOpenModeles,
  onOpenIntegration,
  onSelectDashboard,
  onCreateDashboard,
  onRenameDashboard,
  onArchiveDashboard,
  onUnarchiveDashboard,
  onDeleteDashboard,
}) {
  sidebarSettingsButton.addEventListener('click', onOpenSettings);
  sidebarPartageButton.addEventListener('click', onOpenPartages);
  sidebarModelesButton.addEventListener('click', onOpenModeles);
  sidebarIntegrationButton.addEventListener('click', onOpenIntegration);
  sidebarJournauxPlus.addEventListener('click', onOpenAcces);
  sidebarJournaux.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    onSelectJournal(button.dataset.journalId || null);
  });
  sidebarDashboards.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.action === 'create') {
      onCreateDashboard();
      return;
    }
    if (button.dataset.action === 'archive') {
      onArchiveDashboard(button.dataset.dashboardId);
      return;
    }
    if (button.dataset.action === 'delete') {
      onDeleteDashboard(button.dataset.dashboardId);
      return;
    }
    if (button.dataset.dashboardId) onSelectDashboard(button.dataset.dashboardId);
  });
  sidebarDashboards.addEventListener('dblclick', (event) => {
    const button = event.target.closest('button[data-dashboard-id]:not([data-action])');
    if (button) onRenameDashboard(button.dataset.dashboardId);
  });
  sidebarDashboardsArchivedToggle.addEventListener('click', () => {
    sidebarDashboardsArchived.hidden = !sidebarDashboardsArchived.hidden;
  });
  sidebarDashboardsArchived.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.action === 'unarchive') {
      onUnarchiveDashboard(button.dataset.dashboardId);
      return;
    }
    if (button.dataset.action === 'delete') {
      onDeleteDashboard(button.dataset.dashboardId);
      return;
    }
    if (button.dataset.dashboardId) onSelectDashboard(button.dataset.dashboardId);
  });
}

const AVATAR_COLOR_COUNT = 6;

function avatarColorClass(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return `avatar-color-${Math.abs(hash) % AVATAR_COLOR_COUNT}`;
}

export function renderSidebar({ ownerName, partagesRecus, activeJournalId, dashboards, activeDashboardId }) {
  const name = ownerName ?? 'Logbook';
  sidebarOwnerName.textContent = name;
  sidebarOwnerAvatar.textContent = name.trim().charAt(0).toUpperCase();
  sidebarOwnerAvatar.className = avatarColorClass(name);

  const activeDashboards = (dashboards ?? []).filter((d) => !d.archive);
  const archivedDashboards = (dashboards ?? []).filter((d) => d.archive);

  sidebarDashboards.innerHTML = '';
  for (const dashboard of activeDashboards) {
    const li = document.createElement('li');
    li.className = 'sidebar-dashboard-item';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sidebar-dashboard-name';
    button.textContent = dashboard.nom;
    button.dataset.dashboardId = dashboard.id;
    button.title = 'Double-clic pour renommer';
    button.setAttribute('aria-current', dashboard.id === activeDashboardId ? 'true' : 'false');
    li.appendChild(button);

    const actions = document.createElement('span');
    actions.className = 'sidebar-dashboard-actions';
    const archiveButton = document.createElement('button');
    archiveButton.type = 'button';
    archiveButton.className = 'sidebar-dashboard-action';
    archiveButton.dataset.action = 'archive';
    archiveButton.dataset.dashboardId = dashboard.id;
    archiveButton.title = 'Archiver ce tableau de bord';
    archiveButton.setAttribute('aria-label', `Archiver ${dashboard.nom}`);
    archiveButton.textContent = '📦';
    actions.appendChild(archiveButton);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'sidebar-dashboard-action';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.dashboardId = dashboard.id;
    deleteButton.title = 'Supprimer définitivement ce tableau de bord';
    deleteButton.setAttribute('aria-label', `Supprimer ${dashboard.nom}`);
    deleteButton.textContent = '🗑';
    actions.appendChild(deleteButton);
    li.appendChild(actions);

    sidebarDashboards.appendChild(li);
  }
  const createLi = document.createElement('li');
  const createButton = document.createElement('button');
  createButton.type = 'button';
  createButton.dataset.action = 'create';
  createButton.textContent = '+ Nouveau tableau de bord';
  createLi.appendChild(createButton);
  sidebarDashboards.appendChild(createLi);

  sidebarDashboardsArchivedToggle.hidden = archivedDashboards.length === 0;
  if (archivedDashboards.length === 0) sidebarDashboardsArchived.hidden = true;
  sidebarDashboardsArchived.innerHTML = '';
  for (const dashboard of archivedDashboards) {
    const li = document.createElement('li');
    li.className = 'sidebar-dashboard-item';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sidebar-dashboard-name';
    button.textContent = dashboard.nom;
    button.dataset.dashboardId = dashboard.id;
    button.setAttribute('aria-current', dashboard.id === activeDashboardId ? 'true' : 'false');
    li.appendChild(button);

    const actions = document.createElement('span');
    actions.className = 'sidebar-dashboard-actions';
    const unarchiveButton = document.createElement('button');
    unarchiveButton.type = 'button';
    unarchiveButton.className = 'sidebar-dashboard-action';
    unarchiveButton.dataset.action = 'unarchive';
    unarchiveButton.dataset.dashboardId = dashboard.id;
    unarchiveButton.title = 'Désarchiver ce tableau de bord';
    unarchiveButton.setAttribute('aria-label', `Désarchiver ${dashboard.nom}`);
    unarchiveButton.textContent = '↩';
    actions.appendChild(unarchiveButton);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'sidebar-dashboard-action';
    deleteButton.dataset.action = 'delete';
    deleteButton.dataset.dashboardId = dashboard.id;
    deleteButton.title = 'Supprimer définitivement ce tableau de bord';
    deleteButton.setAttribute('aria-label', `Supprimer ${dashboard.nom}`);
    deleteButton.textContent = '🗑';
    actions.appendChild(deleteButton);
    li.appendChild(actions);

    sidebarDashboardsArchived.appendChild(li);
  }

  sidebarJournaux.innerHTML = '';

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
