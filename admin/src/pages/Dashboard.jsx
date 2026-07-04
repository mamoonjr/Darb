import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    Promise.all([api.stats(), api.activeDrivers()])
      .then(([s, d]) => {
        setStats(s);
        setDrivers(d);
      })
      .catch(console.error);
  }, []);

  if (!stats) return <p>جاري التحميل...</p>;

  const cards = [
    { label: 'الركاب', value: stats.totalUsers },
    { label: 'السائقون', value: stats.totalDrivers },
    { label: 'إجمالي الرحلات', value: stats.totalRides },
    { label: 'رحلات نشطة', value: stats.activeRides },
    { label: 'رحلات مكتملة', value: stats.completedRides },
    { label: 'الإيرادات (ر.س)', value: stats.totalRevenue.toFixed(2) },
  ];

  return (
    <div>
      <h2>لوحة المعلومات</h2>
      <div className="stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 32 }}>السائقون المتصلون ({drivers.length})</h3>
      <table className="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>الجوال</th>
            <th>التقييم</th>
            <th>الموقع</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map((d) => (
            <tr key={d.id}>
              <td>{d.user.name}</td>
              <td>{d.user.phone}</td>
              <td>★ {d.rating}</td>
              <td>{d.lat?.toFixed(4)}, {d.lng?.toFixed(4)}</td>
            </tr>
          ))}
          {drivers.length === 0 && (
            <tr><td colSpan={4} className="empty">لا يوجد سائقون متصلون</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
