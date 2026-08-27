import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { api } from '../lib/api';
import { auth } from '../lib/auth';

export default function RegisterPage() {
  useDocumentTitle('Create Account — Retalla');
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await api.post('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      auth.setSession(data.user, data.token);
      window.location.href = searchParams.get('redirect') || '/index.html';
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="container">
      <div className="auth-wrap">
        <h2>Create Account</h2>
        <p className="sub">Join Retalla for exclusive deals</p>
        {error && (
          <div id="register-form-error" role="alert" className="form-message error">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="register-name">Full Name</label>
            <input id="register-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-email">Email</label>
            <input id="register-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="register-phone">Phone Number</label>
            <input
              id="register-phone"
              pattern="[0-9]{10}"
              title="10 digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            aria-describedby={error ? 'register-form-error' : undefined}
          >
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <a href="/login.html">Login</a>
        </div>
      </div>
    </main>
  );
}
