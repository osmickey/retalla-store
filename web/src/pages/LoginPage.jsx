import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { auth } from '../lib/auth';
import Icon from '../icons/Icon';

export default function LoginPage() {
  useDocumentTitle('Login — Retalla');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/auth/login', { email: email.trim(), password });
      auth.setSession(data.user, data.token);
      // Real browser navigation, not React Router's navigate() — the redirect
      // target is almost always outside this app's route table (e.g.
      // /index.html, /cart.html), which navigate() can't reach.
      window.location.href = searchParams.get('redirect') || '/index.html';
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <div className="auth-wrap">
        <h2>Welcome Back</h2>
        <p className="sub">Login to continue shopping</p>
        {error && (
          <div id="login-form-error" role="alert" className="form-message error">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <div className="password-field">
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} />
              </button>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <a href="/forgot-password.html" className="forgot-link">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            aria-describedby={error ? 'login-form-error' : undefined}
          >
            {submitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-switch">
          New to Retalla? <a href="/register.html">Create an account</a>
        </div>
      </div>
    </main>
  );
}
