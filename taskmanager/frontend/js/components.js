// ── UI Components ─────────────────────────────────────────

const UI = {
  // Status badge
  statusBadge(status) {
    const labels = { todo: '○ To Do', in_progress: '◑ In Progress', done: '● Done' };
    return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
  },

  // Priority badge
  priorityBadge(priority) {
    const icons = { low: '↓', medium: '→', high: '↑' };
    return `<span class="badge badge-${priority}">${icons[priority] || ''} ${priority}</span>`;
  },

  // Role badge
  roleBadge(role) {
    return `<span class="badge badge-${role}">${role}</span>`;
  },

  // Avatar initials
  avatar(name, size = '') {
    const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    return `<div class="avatar${size ? ' ' + size : ''}">${initials}</div>`;
  },

  // Format date
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  // Format datetime
  formatDatetime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  },

  // Is overdue?
  isOverdue(due_date, status) {
    if (!due_date || status === 'done') return false;
    return new Date(due_date) < new Date();
  },

  // Show alert
  showAlert(container, msg, type = 'error') {
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    container.prepend(el);
    setTimeout(() => el.remove(), 5000);
  },

  // Loading spinner
  spinner() { return `<span class="spinner"></span>`; },
  spinnerDark() { return `<div class="loading-page"><span class="spinner spinner-dark" style="width:32px;height:32px"></span></div>`; },

  // Empty state
  emptyState(icon, title, desc = '') {
    return `<div class="empty-state"><div class="icon">${icon}</div><h3>${title}</h3>${desc ? `<p>${desc}</p>` : ''}</div>`;
  },

  // Modal
  openModal(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    overlay.querySelector('[data-close]')?.addEventListener('click', () => overlay.remove());
    return overlay;
  },

  closeModal() {
    document.querySelector('.modal-overlay')?.remove();
  },

  // Build layout shell
  renderLayout(pageId) {
    const user = Auth.getUser();
    const nav = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'projects', icon: '📁', label: 'Projects' },
      { id: 'tasks', icon: '✅', label: 'My Tasks' },
    ];

    if (Auth.isAdmin()) {
      nav.push({ id: 'admin', icon: '⚙️', label: 'Admin' });
    }

    const navItems = nav.map(n => `
      <div class="nav-item${pageId === n.id ? ' active' : ''}" data-page="${n.id}">
        <span class="icon">${n.icon}</span> ${n.label}
      </div>`).join('');

    document.getElementById('app').innerHTML = `
      <div class="layout">
        <aside class="sidebar" id="sidebar">
          <div class="sidebar-brand"><span class="logo">✅</span> TaskFlow</div>
          <nav class="sidebar-nav">
            <div class="nav-section">Menu</div>
            ${navItems}
          </nav>
          <div class="sidebar-footer">
            <div class="user-card">
              ${UI.avatar(user?.name)}
              <div class="user-info">
                <div class="name">${user?.name || 'User'}</div>
                <div class="role-badge">${user?.role || ''}</div>
              </div>
              <button class="btn-logout" id="btn-logout" title="Logout">⏏</button>
            </div>
          </div>
        </aside>
        <div class="main-content" id="main-content">
          <header class="topbar">
            <button class="menu-toggle" id="menu-toggle">☰</button>
            <h1 id="page-title">Dashboard</h1>
            <div id="topbar-actions"></div>
          </header>
          <main class="page-body" id="page-body"></main>
        </div>
      </div>`;

    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => {
        UI.closeModal();
        Router.navigate(el.dataset.page);
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      Auth.clearSession();
      Router.navigate('login');
    });

    // Mobile toggle
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('open');
    });
  },
};
