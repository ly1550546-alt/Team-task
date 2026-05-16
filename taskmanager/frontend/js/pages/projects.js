// ── Projects Page ─────────────────────────────────────────
const ProjectsPage = {
  async render() {
    UI.renderLayout('projects');
    document.getElementById('page-title').textContent = 'Projects';
    document.getElementById('topbar-actions').innerHTML = `<button class="btn btn-primary btn-sm" id="btn-new-project">+ New Project</button>`;
    document.getElementById('page-body').innerHTML = UI.spinnerDark();
    document.getElementById('btn-new-project').addEventListener('click', () => ProjectsPage.openCreateModal());
    await ProjectsPage.load();
  },

  async load() {
    try {
      const projects = await Api.getProjects();
      const body = document.getElementById('page-body');

      if (projects.length === 0) {
        body.innerHTML = UI.emptyState('📁', 'No projects yet', 'Create your first project to get started.');
        return;
      }

      body.innerHTML = `
        <div class="projects-grid" id="projects-grid">
          ${projects.map(p => ProjectsPage.projectCard(p)).join('')}
        </div>`;

      document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.card-btn')) return;
          Router.navigate('project-detail', { id: card.dataset.id });
        });
      });

      document.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          if (!confirm('Delete this project and all its tasks?')) return;
          try {
            await Api.deleteProject(btn.dataset.id);
            await ProjectsPage.load();
          } catch (err) { alert(err.message); }
        });
      });

    } catch (err) {
      document.getElementById('page-body').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  projectCard(p) {
    const user = Auth.getUser();
    const isOwner = p.owner_id === user.id || Auth.isAdmin();
    const memberCount = (p.members?.length || 0) + 1;

    return `
      <div class="project-card" data-id="${p.id}">
        <div class="project-card-header">
          <div class="project-name">${p.name}</div>
          ${isOwner ? `<button class="btn btn-sm btn-ghost btn-icon card-btn btn-delete-project" data-id="${p.id}" title="Delete">🗑</button>` : ''}
        </div>
        <div class="project-desc">${p.description || '<span style="color:var(--text-light)">No description</span>'}</div>
        <div class="project-meta">
          <span class="meta-item">👤 ${memberCount} member${memberCount !== 1 ? 's' : ''}</span>
          <span class="meta-item">📅 ${UI.formatDate(p.created_at)}</span>
          <span class="meta-item">👑 ${p.owner?.name || 'Unknown'}</span>
        </div>
      </div>`;
  },

  openCreateModal() {
    const overlay = UI.openModal(`
      <div class="modal-header">
        <div class="modal-title">Create New Project</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div id="modal-alert"></div>
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input class="form-input" id="proj-name" type="text" placeholder="e.g. Website Redesign" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="proj-desc" placeholder="What's this project about?"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-primary" id="btn-create">Create Project</button>
      </div>`);

    overlay.querySelector('#btn-create').addEventListener('click', async () => {
      const name = document.getElementById('proj-name').value.trim();
      const description = document.getElementById('proj-desc').value.trim();
      if (!name) { UI.showAlert(document.getElementById('modal-alert'), 'Project name is required'); return; }

      const btn = overlay.querySelector('#btn-create');
      btn.disabled = true; btn.innerHTML = `${UI.spinner()} Creating…`;

      try {
        await Api.createProject({ name, description });
        UI.closeModal();
        await ProjectsPage.load();
      } catch (err) {
        UI.showAlert(document.getElementById('modal-alert'), err.message);
        btn.disabled = false; btn.textContent = 'Create Project';
      }
    });
  }
};
