import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Layout({ user, onLogout, children }) {
  const { pathname } = useLocation();

  const links = [
    { to: '/', label: 'لوحة المعلومات' },
    { to: '/users', label: 'المستخدمون' },
    { to: '/rides', label: 'الرحلات' },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1 className="logo">درب Admin</h1>
        <nav>
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? 'nav active' : 'nav'}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>{user.name}</p>
          <button type="button" onClick={onLogout}>خروج</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
