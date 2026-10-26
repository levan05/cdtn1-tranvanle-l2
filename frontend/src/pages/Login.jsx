import { useState } from 'react';
import { api } from '../api/client.js';

export default function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, user } = await api.login(username, password);
      onLoggedIn(token, user);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <div className="brand-mark">M</div>
        <h1>Mekong Mobile</h1>
        <p className="muted">Đăng nhập để tiếp nhận và theo dõi yêu cầu bảo hành</p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error.message}
          </div>
        )}

        <label className="field">
          <span>Tên đăng nhập</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            className={error?.fields?.username ? 'invalid' : ''}
          />
          {error?.fields?.username && <small className="field-error">{error.fields.username}</small>}
        </label>

        <label className="field">
          <span>Mật khẩu</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={error?.fields?.password ? 'invalid' : ''}
          />
          {error?.fields?.password && <small className="field-error">{error.fields.password}</small>}
        </label>

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
    </main>
  );
}
