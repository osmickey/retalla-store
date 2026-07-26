async function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const msg = document.getElementById('admin-login-message');
  const btn = document.getElementById('admin-login-submit');

  btn.disabled = true;
  btn.textContent = 'Logging in...';
  msg.style.display = 'none';

  try {
    const data = await adminApi.post('/auth/login', { email, password });
    if (!data.user.isAdmin) {
      throw new Error('This account does not have admin access');
    }
    adminAuth.setSession(data.user, data.token);
    window.location.href = '/admin/index.html';
  } catch (err) {
    msg.textContent = err.message;
    msg.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Login to Dashboard';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const user = adminAuth.getUser();
  if (adminAuth.getToken() && user && user.isAdmin) {
    window.location.href = '/admin/index.html';
  }
});
