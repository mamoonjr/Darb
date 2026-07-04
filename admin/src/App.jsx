import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api, clearToken, getToken, setToken } from './api';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Rides from './pages/Rides';
import Users from './pages/Users';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      if (getToken()) {
        const profile = await api.me();
        if (profile.role !== 'ADMIN') throw new Error('Not admin');
        setUser(profile);
      }
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { user: profile, token } = await api.login({ email, password });
    if (profile.role !== 'ADMIN') throw new Error('حساب غير مصرح — يجب أن تكون مديراً');
    setToken(token);
    setUser(profile);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  if (loading) return <div className="loading">جاري التحميل...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={login} />} />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user} onLogout={logout}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/rides" element={<Rides />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
