// ── Auth State ────────────────────────────────────────────
const Auth = (() => {
  let _user = null;

  function setSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    _user = user;
  }

  function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    _user = null;
  }

  function getUser() {
    if (_user) return _user;
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  }

  function isLoggedIn() { return !!localStorage.getItem('token'); }
  function isAdmin() { return getUser()?.role === 'admin'; }

  async function refresh() {
    try {
      const u = await Api.me();
      localStorage.setItem('user', JSON.stringify(u));
      _user = u;
      return u;
    } catch {
      clearSession();
      return null;
    }
  }

  return { setSession, clearSession, getUser, isLoggedIn, isAdmin, refresh };
})();
