// ── Project Detail Page ───────────────────────────────────
const ProjectDetailPage = {
  project: null,
  allUsers: [],

  async render(params = {}) {
    const id = params.id;
    UI.renderLayout('projects');
    document.getElementById('page-body').innerHTML = UI.spinnerDark();

    try {
      const [project, users] = await Promise.all([Api.getProject(id), Api.getUsers()]);
      this.project = project;
      this.allUsers = users;

      document.getElementById('page-title').innerHTML = `
        <span style="cursor:pointer;color:var(--text-muted)" onclick="Router.navigate('projects')">Projects</span>
        <span style="color:var(--text-muted)"> / </span>${project.name}`;

      const user = Auth.getUser();
      const isOwnerOrAdmin = project.owner_id === user.id || Auth.isAdmin();

      document.getElementById('topbar-actions').innerHTML = `
        <button class="btn btn-primary btn-sm" id="btn-new-task">+ Add Task</button>
        ${isOwnerOrAdmin ? `<button class="btn btn-outline btn-sm" id="btn-add-member">+ Member</button>` : ''}`;

      document.getElementById('btn-new-task').addEventListener('click', () => this.openTaskModal());
      document.getElementById('btn-add-member')?.addEventListener('click', () => this.openAddMemberModal());

      await this.renderBody();

    } catch (err) {
      document.getElementById('page-body').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  async renderBody() {
    const p = this.project;
    const user = Auth.getUser();
    const isOwnerOrAdmin = p.owner_id === user.id || Auth.isAdmin();

    const tasks = await Api.getTasks({ project_id: p.id });
    const todo = tasks.filter(t => t.status === 'todo');
    const inProgress = tasks.filter(t => t.status === 'in_progress');
    const done = tasks.filter(t => t.status === 'done');

    document.getElementById('page-body').innerHTML = `
      <!-- Stats -->
      <div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
        <div class="stat-card"><div class="value">${tasks.length}</div><div class="label">Total Tasks</div></div>
        <div class="stat-card warning"><div class="value">${inProgress.length}</div><div class="label">In Progress</div></div>
        <div class="stat-card success"><div class="value">${done.length}</div><div class="label">Done</div></div>
        <div class="stat-card info"><div class="value">${(p.members?.length || 0) + 1}</div><div class="label">Members</div></div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start" class="detail-grid">
        <!-- Tasks -->
        <div>
          <div class="tabs">
            <button class="tab active" data-tab="all">All (${tasks.length})</button>
            <button class="tab" data-tab="todo">To Do (${todo.length})</button>
            <button class="tab" data-tab="in_progress">In Progress (${inProgress.length})</button>
            <button class="tab" data-tab="done">Done (${done.length})</button>
          </div>
          <div id="task-panel"></div>
        </div>

        <!-- Members -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Team Members</div>
          </div>
          <div id="members-list"></div>
        </div>
      </div>`;

    this._tasks = tasks;
    this._renderTasks('all');
    this._renderMembers(isOwnerOrAdmin);

    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderTasks(tab.dataset.tab);
      });
    });
  },

  _renderTasks(filter) {
    const tasks = filter === 'all' ? this._tasks : this._tasks.filter(t => t.status === filter);
    const panel = document.getElementById('task-panel');
    if (!tasks.length) {
      panel.innerHTML = UI.emptyState('📋', 'No tasks here', 'Add a task to get started');
      return;
    }
    panel.innerHTML = `<div class="task-list">${tasks.map(t => this._taskCard(t)).join('')}</div>`;

    panel.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const task = this._tasks.find(t => t.id == btn.dataset.id);
        if (task) this.openTaskModal(task);
      });
    });

    panel.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this task?')) return;
        try {
          await Api.deleteTask(btn.dataset.id);
          this.project = await Api.getProject(this.project.id);
          await this.renderBody();
        } catch (err) { alert(err.message); }
      });
    });

    panel.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        try {
          await Api.updateTask(sel.dataset.id, { status: sel.value });
          this.project = await Api.getProject(this.project.id);
          await this.renderBody();
        } catch (err) { alert(err.message); }
      });
    });
  },

  _taskCard(t) {
    const over = UI.isOverdue(t.due_date, t.status);
    return `
      <div class="task-item${over ? ' overdue' : ''}">
        <div class="task-body">
          <div class="task-title">${t.title}</div>
          ${t.description ? `<div class="text-sm text-muted" style="margin-bottom:6px">${t.description}</div>` : ''}
          <div class="task-meta">
            <select class="badge status-select" data-id="${t.id}" style="border:none;cursor:pointer;font-size:.72rem;font-weight:600;padding:3px 6px;border-radius:99px;background:transparent">
              <option value="todo"${t.status==='todo'?' selected':''}>○ To Do</option>
              <option value="in_progress"${t.status==='in_progress'?' selected':''}>◑ In Progress</option>
              <option value="done"${t.status==='done'?' selected':''}>● Done</option>
            </select>
            ${UI.priorityBadge(t.priority)}
            ${t.assignee ? `<span>👤 ${t.assignee.name}</span>` : '<span style="color:var(--text-light)">Unassigned</span>'}
            ${t.due_date ? `<span${over?' style="color:var(--danger)"':''}>📅 ${UI.formatDate(t.due_date)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-ghost btn-icon btn-sm btn-edit-task" data-id="${t.id}" title="Edit">✏️</button>
          <button class="btn btn-ghost btn-icon btn-sm btn-delete-task" data-id="${t.id}" title="Delete">🗑</button>
        </div>
      </div>`;
  },

  _renderMembers(isOwnerOrAdmin) {
    const p = this.project;
    const allMembers = [
      { user: p.owner, role: 'admin', isOwner: true },
      ...(p.members || []).map(m => ({ user: m.user, role: m.role, memberId: m.id, userId: m.user_id }))
    ];

    const el = document.getElementById('members-list');
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${allMembers.map(m => `
          <div style="display:flex;align-items:center;gap:10px">
            ${UI.avatar(m.user?.name)}
            <div style="flex:1">
              <div style="font-weight:600;font-size:.875rem">${m.user?.name || 'Unknown'}</div>
              <div style="font-size:.75rem;color:var(--text-muted)">${m.user?.email || ''}</div>
            </div>
            ${UI.roleBadge(m.isOwner ? 'admin' : m.role)}
            ${isOwnerOrAdmin && !m.isOwner ? `<button class="btn btn-ghost btn-icon btn-sm btn-remove-member" data-uid="${m.userId}" title="Remove">✕</button>` : ''}
          </div>`).join('')}
      </div>`;

    el.querySelectorAll('.btn-remove-member').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this member?')) return;
        try {
          await Api.removeMember(p.id, btn.dataset.uid);
          this.project = await Api.getProject(p.id);
          this._renderMembers(isOwnerOrAdmin);
        } catch (err) { alert(err.message); }
      });
    });
  },

  openTaskModal(task = null) {
    const p = this.project;
    const memberOptions = [
      { id: p.owner_id, name: p.owner.name },
      ...(p.members || []).map(m => ({ id: m.user_id, name: m.user?.name || 'User' }))
    ];

    const overlay = UI.openModal(`
      <div class="modal-header">
        <div class="modal-title">${task ? 'Edit Task' : 'New Task'}</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div id="modal-alert"></div>
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-input" id="t-title" value="${task?.title || ''}" placeholder="Task title" />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="t-desc">${task?.description || ''}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-select" id="t-status">
            <option value="todo"${task?.status==='todo'?' selected':''}>To Do</option>
            <option value="in_progress"${task?.status==='in_progress'?' selected':''}>In Progress</option>
            <option value="done"${task?.status==='done'?' selected':''}>Done</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select class="form-select" id="t-priority">
            <option value="low"${task?.priority==='low'?' selected':''}>Low</option>
            <option value="medium"${task?.priority==='medium'?' selected':''}>Medium</option>
            <option value="high"${task?.priority==='high'?' selected':''}>High</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-select" id="t-assignee">
            <option value="">— Unassigned —</option>
            ${memberOptions.map(u => `<option value="${u.id}"${task?.assignee_id==u.id?' selected':''}>${u.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Due Date</label>
          <input class="form-input" id="t-due" type="datetime-local" value="${task?.due_date ? new Date(task.due_date).toISOString().slice(0,16) : ''}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-primary" id="btn-save-task">${task ? 'Save Changes' : 'Create Task'}</button>
      </div>`);

    overlay.querySelector('#btn-save-task').addEventListener('click', async () => {
      const title = document.getElementById('t-title').value.trim();
      if (!title) { UI.showAlert(document.getElementById('modal-alert'), 'Title is required'); return; }

      const btn = overlay.querySelector('#btn-save-task');
      btn.disabled = true; btn.innerHTML = `${UI.spinner()} Saving…`;

      const payload = {
        title,
        description: document.getElementById('t-desc').value.trim() || null,
        status: document.getElementById('t-status').value,
        priority: document.getElementById('t-priority').value,
        assignee_id: document.getElementById('t-assignee').value ? parseInt(document.getElementById('t-assignee').value) : null,
        due_date: document.getElementById('t-due').value ? new Date(document.getElementById('t-due').value).toISOString() : null,
        ...(!task && { project_id: p.id }),
      };

      try {
        if (task) await Api.updateTask(task.id, payload);
        else await Api.createTask(payload);
        UI.closeModal();
        this.project = await Api.getProject(p.id);
        await this.renderBody();
      } catch (err) {
        UI.showAlert(document.getElementById('modal-alert'), err.message);
        btn.disabled = false; btn.textContent = task ? 'Save Changes' : 'Create Task';
      }
    });
  },

  openAddMemberModal() {
    const existingIds = new Set([
      this.project.owner_id,
      ...(this.project.members || []).map(m => m.user_id)
    ]);
    const available = this.allUsers.filter(u => !existingIds.has(u.id));

    const overlay = UI.openModal(`
      <div class="modal-header">
        <div class="modal-title">Add Team Member</div>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div id="modal-alert"></div>
      <div class="form-group">
        <label class="form-label">Select User</label>
        <select class="form-select" id="m-user">
          <option value="">Choose a user…</option>
          ${available.map(u => `<option value="${u.id}">${u.name} (${u.email})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Role</label>
        <select class="form-select" id="m-role">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-primary" id="btn-add">Add Member</button>
      </div>`);

    overlay.querySelector('#btn-add').addEventListener('click', async () => {
      const user_id = parseInt(document.getElementById('m-user').value);
      const role = document.getElementById('m-role').value;
      if (!user_id) { UI.showAlert(document.getElementById('modal-alert'), 'Please select a user'); return; }

      const btn = overlay.querySelector('#btn-add');
      btn.disabled = true; btn.innerHTML = `${UI.spinner()} Adding…`;

      try {
        await Api.addMember(this.project.id, { user_id, role });
        this.project = await Api.getProject(this.project.id);
        UI.closeModal();
        await this.renderBody();
      } catch (err) {
        UI.showAlert(document.getElementById('modal-alert'), err.message);
        btn.disabled = false; btn.textContent = 'Add Member';
      }
    });
  }
};
