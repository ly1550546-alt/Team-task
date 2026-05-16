// ── Dashboard Page ────────────────────────────────────────
const DashboardPage = {
  async render() {
    UI.renderLayout('dashboard');
    document.getElementById('page-title').textContent = 'Dashboard';
    document.getElementById('page-body').innerHTML = UI.spinnerDark();

    try {
      const [projects, myTasks, overdue] = await Promise.all([
        Api.getProjects(),
        Api.myTasks(),
        Api.overdueTasks(),
      ]);

      const total = myTasks.length;
      const todo = myTasks.filter(t => t.status === 'todo').length;
      const inProgress = myTasks.filter(t => t.status === 'in_progress').length;
      const done = myTasks.filter(t => t.status === 'done').length;

      const recentTasks = [...myTasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

      document.getElementById('page-body').innerHTML = `
        <div class="stats-grid">
          <div class="stat-card info">
            <div class="value">${projects.length}</div>
            <div class="label">📁 My Projects</div>
          </div>
          <div class="stat-card primary">
            <div class="value">${total}</div>
            <div class="label">✅ Total Tasks</div>
          </div>
          <div class="stat-card warning">
            <div class="value">${inProgress}</div>
            <div class="label">◑ In Progress</div>
          </div>
          <div class="stat-card success">
            <div class="value">${done}</div>
            <div class="label">● Completed</div>
          </div>
          <div class="stat-card danger">
            <div class="value">${overdue.length}</div>
            <div class="label">⚠ Overdue</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px" class="dash-grid">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Tasks</div>
              <button class="btn btn-sm btn-outline" id="btn-all-tasks">View All</button>
            </div>
            <div id="recent-tasks-list"></div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">⚠ Overdue Tasks</div>
            </div>
            <div id="overdue-list"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">My Projects</div>
            <button class="btn btn-sm btn-outline" id="btn-all-projects">View All</button>
          </div>
          <div id="project-list"></div>
        </div>`;

      // Recent tasks
      const rtEl = document.getElementById('recent-tasks-list');
      if (recentTasks.length === 0) {
        rtEl.innerHTML = UI.emptyState('📋', 'No tasks yet', 'Tasks assigned to you will appear here');
      } else {
        rtEl.innerHTML = `<div class="task-list">${recentTasks.map(t => DashboardPage.taskRow(t)).join('')}</div>`;
      }

      // Overdue tasks
      const odEl = document.getElementById('overdue-list');
      if (overdue.length === 0) {
        odEl.innerHTML = UI.emptyState('✅', 'No overdue tasks', 'Great job staying on schedule!');
      } else {
        odEl.innerHTML = `<div class="task-list">${overdue.map(t => DashboardPage.taskRow(t, true)).join('')}</div>`;
      }

      // Projects
      const plEl = document.getElementById('project-list');
      if (projects.length === 0) {
        plEl.innerHTML = UI.emptyState('📁', 'No projects', 'Create a project to get started');
      } else {
        plEl.innerHTML = `
          <div class="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Tasks</th><th>Members</th><th>Created</th></tr></thead>
            <tbody>${projects.map(p => `
              <tr style="cursor:pointer" data-pid="${p.id}">
                <td><strong>${p.name}</strong><br><small class="text-muted">${p.description || ''}</small></td>
                <td>${p.tasks?.length || 0}</td>
                <td>${(p.members?.length || 0) + 1}</td>
                <td>${UI.formatDate(p.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>`;

        document.querySelectorAll('tr[data-pid]').forEach(el => {
          el.addEventListener('click', () => Router.navigate('project-detail', { id: el.dataset.pid }));
        });
      }

      document.getElementById('btn-all-tasks')?.addEventListener('click', () => Router.navigate('tasks'));
      document.getElementById('btn-all-projects')?.addEventListener('click', () => Router.navigate('projects'));

    } catch (err) {
      document.getElementById('page-body').innerHTML = `<div class="alert alert-error">Failed to load dashboard: ${err.message}</div>`;
    }
  },

  taskRow(t, isOverdue = false) {
    const over = UI.isOverdue(t.due_date, t.status);
    return `
      <div class="task-item${over ? ' overdue' : ''}">
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          <div class="task-meta">
            ${UI.statusBadge(t.status)}
            ${UI.priorityBadge(t.priority)}
            ${t.project ? `<span>📁 ${t.project.name}</span>` : ''}
            ${t.due_date ? `<span${over ? ' style="color:var(--danger)"' : ''}>📅 ${UI.formatDate(t.due_date)}</span>` : ''}
          </div>
        </div>
      </div>`;
  }
};
