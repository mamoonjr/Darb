import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Users() {
  const [data, setData] = useState({ users: [] });

  async function load() {
    const result = await api.users();
    setData(result);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(id) {
    await api.toggleUser(id);
    load();
  }

  return (
    <div>
      <h2>المستخدمون ({data.total || 0})</h2>
      <table className="table">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>البريد</th>
            <th>الدور</th>
            <th>الحالة</th>
            <th>إجراء</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((u) => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
              <td>{u.isActive ? 'نشط' : 'موقوف'}</td>
              <td>
                {u.role !== 'ADMIN' && (
                  <button type="button" className="btn-sm" onClick={() => toggle(u.id)}>
                    {u.isActive ? 'إيقاف' : 'تفعيل'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
