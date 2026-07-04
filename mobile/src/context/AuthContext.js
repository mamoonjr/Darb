import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { registerForPushNotifications } from '../services/notifications';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      const token = await api.getToken();
      if (token) {
        const profile = await api.me();
        setUser(profile);
        await connectSocket();
        registerForPushNotifications();
      }
    } catch {
      await api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const { user: profile, token } = await api.login({ email, password });
    await api.setToken(token);
    setUser(profile);
    await connectSocket();
    registerForPushNotifications();
    return profile;
  }

  async function register(data) {
    const { user: profile, token } = await api.register(data);
    await api.setToken(token);
    setUser(profile);
    await connectSocket();
    registerForPushNotifications();
    return profile;
  }

  async function logout() {
    disconnectSocket();
    await api.clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
