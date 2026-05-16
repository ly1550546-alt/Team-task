// ── Login Page ────────────────────────────────────────────
const LoginPage = {
  render() {
    document.getElementById('app').innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="brand">✅ TaskFlow</div>
            <div class="tagline">Team Task Manager</div>
          </div>
          <h2 class="auth-title">Welcome back</h2>
          <p class="auth-sub">Sign in to your account</p>
          <div id="alert-area"></div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="email" type="email" placeholder="you@company.com" autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <input class="form-input" id="password" type="password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button class="btn btn-primary btn-block" id="btn-login">Sign In</button>
          <div class="auth-footer">
            Don't have an account? <a href="#" id="link-signup">Sign up</a>
          </div>
        </div>
      </div>`;

    document.getElementById('link-signup').addEventListener('click', e => { e.preventDefault(); Router.navigate('signup'); });

    const doLogin = async () => {
      const btn = document.getElementById('btn-login');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const alertArea = document.getElementById('alert-area');

      if (!email || !password) { UI.showAlert(alertArea, 'Please fill all fields'); return; }

      btn.disabled = true;
      btn.innerHTML = `${UI.spinner()} Signing in…`;

      try {
        const res = await Api.login({ email, password });
        Auth.setSession(res.access_token, res.user);
        Router.navigate('dashboard');
      } catch (err) {
        UI.showAlert(alertArea, err.message || 'Login failed');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    };

    document.getElementById('btn-login').addEventListener('click', doLogin);
    document.getElementById('password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  }
};
