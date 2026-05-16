// ── Router ────────────────────────────────────────────────
const Router = (() => {
  let currentPage = null;
  let currentParams = {};

  const routes = {
    login: () => LoginPage.render(),
    signup: () => SignupPage.render(),
    dashboard: () => DashboardPage.render(),
    projects: () => ProjectsPage.render(),
    'project-detail': (p) => ProjectDetailPage.render(p),
    tasks: () => TasksPage.render(),
  };

  function navigate(page, params = {}) {
    currentPage = page;
    currentParams = params;

    // Guard: redirect to login if not authed (for protected routes)
    const publicRoutes = ['login', 'signup'];
    if (!publicRoutes.includes(page) && !Auth.isLoggedIn()) {
      navigate('login');
      return;
    }
    if (publicRoutes.includes(page) && Auth.isLoggedIn()) {
      navigate('dashboard');
      return;
    }

    const handler = routes[page];
    if (handler) handler(params);
    else navigate('dashboard');
  }

  // Init
  function init() {
    // Parse hash-based routing: #dashboard, #project-detail?id=3
    function parseHash() {
      const hash = location.hash.replace('#', '') || '';
      const [page, qs] = hash.split('?');
      const params = {};
      if (qs) qs.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[k] = decodeURIComponent(v || '');
      });
      return { page: page || '', params };
    }

    // Override navigate to update hash
    const _navigate = navigate;
    window.navigate = navigate;

    Router.navigate = (page, params = {}) => {
      const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
      location.hash = page + (qs ? '?' + qs : '');
    };

    window.addEventListener('hashchange', () => {
      const { page, params } = parseHash();
      _navigate(page || 'dashboard', params);
    });

    // Initial load
    const { page, params } = parseHash();
    _navigate(page || (Auth.isLoggedIn() ? 'dashboard' : 'login'), params);
  }

  return { navigate, init };
})();

// Boot
Router.init();
