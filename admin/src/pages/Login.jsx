import React, { useState } from 'react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('admin@darb.app');
  const [password, setPassword] = useState('12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>درب — لوحة التحكم</h1>
        {error && <p className="error">{error}</p>}
        <label>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          كلمة المرور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? '...' : 'دخول'}</button>
      </form>
    </div>
  );
}
