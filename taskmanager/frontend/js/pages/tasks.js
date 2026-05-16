// ── Tasks Page ────────────────────────────────────────────
const TasksPage = {
  async render() {
    UI.renderLayout('tasks');
    document.getElementById('page-title').textContent = 'My Tasks';
    document.getElementById('page-body').innerHTML = UI.spinnerDark();
    await this.load();
  },

  async load() {
    try {
      const tasks = await Api.myTasks();
      const body = document.getElementById('page-body');

      const todo = tasks.filter(t => t.status === 'todo');
      const inProgress = tasks.filter(t => t.status === 'in_progress');
      const done = tasks.filter(t => t.status === 'done');
      const overdue = tasks.filter(t => UI.isOverdue(t.due_date, t.status));

      body.innerHTML = `
        <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
          <div class="stat-card"><div class="value">${tasks.length}</div><div class="label">Total</div></div>
          <div class="stat-card warning"><div class="value">${inProgress.length}</div><div class="label">In Progress</div></div>
          <div class="stat-card success"><div class="value">${done.length}</div><div class="label">Done</div></div>
          <div class="stat-card danger"><div class="value">${overdue.length}</div><div class="label">Overdue</div></div>
        </div>

        <!-- Filters -->
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
          <select class="form-select" id="filter-status" style="width:auto">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select class="form-select" id="filter-priority" style="width:auto">
            <option value="">All Priority</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <label style="display:flex;align-items:center;gap:6px;font-size:.875rem;cursor:pointer">
            <input type="checkbox" id="filter-overdue" /> Overdue only
          </label>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Assigned Tasks</div>
          </div>
          <div id="tasks-container"></div>
        </div>`;

      this._allTasks = tasks;
      this._renderFiltered();

      ['filter-status', 'filter-priority', 'filter-overdue'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => this._renderFiltered());
      });

    } catch (err) {
      document.getElementById('page-body').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  _renderFiltered() {
    const status = document.getElementById('filter-status')?.value;
    const priority = document.getElementById('filter-priority')?.value;
    const overdueOnly = document.getElementById('filter-overdue')?.checked;

    let tasks = this._allTasks;
    if (status) tasks = tasks.filter(t => t.status === status);
    if (priority) tasks = tasks.filter(t => t.priority === priority);
    if (overdueOnly) tasks = tasks.filter(t => UI.isOverdue(t.due_date, t.status));

    const container = document.getElementById('tasks-container');

    if (!tasks.length) {
      container.innerHTML = UI.emptyState('✅', 'No tasks found', 'Try adjusting your filters');
      return;
    }

    container.innerHTML = `
      <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => {
            const over = UI.isOverdue(t.due_date, t.status);
            return `
            <tr>
              <td>
                <div style="font-weight:600">${t.title}</div>
                ${t.description ? `<div class="text-sm text-muted">${t.description.slice(0,60)}${t.description.length>60?'…':''}</div>` : ''}
              </td>
              <td>${t.project ? `<span class="badge badge-todo">📁 ${t.project.name}</span>` : '—'}</td>
              <td>
                <select class="badge status-select" data-id="${t.id}" style="border:none;cursor:pointer;font-size:.72rem;font-weight:600;padding:3px 6px;border-radius:99px">
                  <option value="todo"${t.status==='todo'?' selected':''}>○ To Do</option>
                  <option value="in_progress"${t.status==='in_progress'?' selected':''}>◑ In Progress</option>
                  <option value="done"${t.status==='done'?' selected':''}>● Done</option>
                </select>
              </td>
              <td>${UI.priorityBadge(t.priority)}</td>
              <td${over?' style="color:var(--danger);font-weight:600"':''}>${UI.formatDate(t.due_date)}${over?' ⚠':''}</td>
              <td>
                <button class="btn btn-ghost btn-icon btn-sm btn-view-project" data-pid="${t.project_id}" title="View Project">📁</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`;

    container.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        try {
          await Api.updateTask(sel.dataset.id, { status: sel.value });
          await this.load();
        } catch (err) { alert(err.message); }
      });
    });

    container.querySelectorAll('.btn-view-project').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate('project-detail', { id: btn.dataset.pid }));
    });
  }
};
