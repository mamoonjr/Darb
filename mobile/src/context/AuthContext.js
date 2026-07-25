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
        try {
          const profile = await api.me();
          setUser(profile);
        } catch {
          await api.refreshSession();
          const profile = await api.me();
          setUser(profile);
        }
        await connectSocket();
        registerForPushNotifications();
      }
    } catch {
      await api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(phone, password) {
    const session = await api.login({ phone, password });
    await api.setSession(session);
    setUser(session.user);
    await connectSocket();
    registerForPushNotifications();
    return session.user;
  }

  async function loginWithOtp(phone, code) {
    const session = await api.verifyOtp(phone, code);
    await api.setSession(session);
    setUser(session.user);
    await connectSocket();
    registerForPushNotifications();
    return session.user;
  }

  async function register(data) {
    const session = await api.register(data);
    await api.setSession(session);
    setUser(session.user);
    await connectSocket();
    registerForPushNotifications();
    return session.user;
  }

  async function logout() {
    disconnectSocket();
    await api.logout();
    setUser(null);
  }

  async function switchRole(role) {
    const session = await api.switchRole(role);
    await api.setSession(session);
    setUser(session.user);
    disconnectSocket();
    await connectSocket();
    return session.user;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithOtp,
        register,
        logout,
        setUser,
        switchRole,
        requestOtp: api.requestOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
