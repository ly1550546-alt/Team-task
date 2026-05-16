// ── API Client ────────────────────────────────────────────
const BASE_URL = 'https://team-task-production-fe0a.up.railway.app/api';;

const Api = (() => {
  function getToken() { return localStorage.getItem('token'); }

  async function request(method, path, body = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) { const t = getToken(); if (t) headers['Authorization'] = `Bearer ${t}`; }

    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);

    if (res.status === 204) return null;

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, message: data.detail || 'Request failed' };
    return data;
  }

  return {
    // Auth
    signup: (d) => request('POST', '/auth/signup', d, false),
    login: (d) => request('POST', '/auth/login', d, false),
    me: () => request('GET', '/auth/me'),

    // Users
    getUsers: () => request('GET', '/users/'),
    updateUser: (id, d) => request('PUT', `/users/${id}`, d),
    deleteUser: (id) => request('DELETE', `/users/${id}`),

    // Projects
    getProjects: () => request('GET', '/projects/'),
    createProject: (d) => request('POST', '/projects/', d),
    getProject: (id) => request('GET', `/projects/${id}`),
    updateProject: (id, d) => request('PUT', `/projects/${id}`, d),
    deleteProject: (id) => request('DELETE', `/projects/${id}`),
    addMember: (id, d) => request('POST', `/projects/${id}/members`, d),
    removeMember: (pid, uid) => request('DELETE', `/projects/${pid}/members/${uid}`),
    projectDashboard: (id) => request('GET', `/projects/${id}/dashboard`),

    // Tasks
    getTasks: (params = {}) => {
      const q = new URLSearchParams(Object.entries(params).filter(([,v]) => v != null)).toString();
      return request('GET', `/tasks/${q ? '?' + q : ''}`);
    },
    createTask: (d) => request('POST', '/tasks/', d),
    getTask: (id) => request('GET', `/tasks/${id}`),
    updateTask: (id, d) => request('PUT', `/tasks/${id}`, d),
    deleteTask: (id) => request('DELETE', `/tasks/${id}`),
    myTasks: () => request('GET', '/tasks/my'),
    overdueTasks: () => request('GET', '/tasks/overdue'),
  };
})();
