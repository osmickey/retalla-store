function getRedirectTarget() {
  return new URLSearchParams(window.location.search).get('redirect') || '/index.html';
}

function showFormMessage(elId, message, type = 'error') {
  const el = document.getElementById(elId);
  el.textContent = message;
  el.className = `form-message ${type}`;
  el.style.display = 'block';
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-submit');
  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const data = await api.post('/auth/login', { email, password });
    auth.setSession(data.user, data.token);
    window.location.href = getRedirectTarget();
  } catch (err) {
    showFormMessage('login-message', err.message);
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const btn = document.getElementById('register-submit');
  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const data = await api.post('/auth/register', { name, email, phone, password });
    auth.setSession(data.user, data.token);
    window.location.href = getRedirectTarget();
  } catch (err) {
    showFormMessage('register-message', err.message);
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
}
