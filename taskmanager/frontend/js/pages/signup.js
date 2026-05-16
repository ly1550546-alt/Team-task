// ── Signup Page ───────────────────────────────────────────
const SignupPage = {
  render() {
    document.getElementById('app').innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <div class="auth-logo">
            <div class="brand">✅ TaskFlow</div>
            <div class="tagline">Create your account</div>
          </div>
          <h2 class="auth-title">Get started</h2>
          <p class="auth-sub">Join your team on TaskFlow</p>
          <div id="alert-area"></div>
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" id="name" type="text" placeholder="Jane Doe" />
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-input" id="email" type="email" placeholder="you@company.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Password <span style="color:var(--text-muted);font-weight:400">(min 6 chars)</span></label>
            <input class="form-input" id="password" type="password" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label">Role</label>
            <select class="form-select" id="role">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button class="btn btn-primary btn-block" id="btn-signup">Create Account</button>
          <div class="auth-footer">
            Already have an account? <a href="#" id="link-login">Sign in</a>
          </div>
        </div>
      </div>`;

    document.getElementById('link-login').addEventListener('click', e => { e.preventDefault(); Router.navigate('login'); });

    document.getElementById('btn-signup').addEventListener('click', async () => {
      const btn = document.getElementById('btn-signup');
      const alertArea = document.getElementById('alert-area');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const role = document.getElementById('role').value;

      if (!name || !email || !password) { UI.showAlert(alertArea, 'Please fill all fields'); return; }
      if (password.length < 6) { UI.showAlert(alertArea, 'Password must be at least 6 characters'); return; }

      btn.disabled = true;
      btn.innerHTML = `${UI.spinner()} Creating account…`;

      try {
        const res = await Api.signup({ name, email, password, role });
        Auth.setSession(res.access_token, res.user);
        Router.navigate('dashboard');
      } catch (err) {
        UI.showAlert(alertArea, err.message || 'Signup failed');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
};
