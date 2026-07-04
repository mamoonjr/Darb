import React, { useEffect, useState } from 'react';
import { api } from '../api';

const STATUS_LABELS = {
  REQUESTED: 'مطلوبة',
  ACCEPTED: 'مقبولة',
  DRIVER_ARRIVED: 'وصل السائق',
  IN_PROGRESS: 'جارية',
  COMPLETED: 'مكتملة',
  CANCELLED: 'ملغاة',
};

export default function Rides() {
  const [data, setData] = useState({ rides: [] });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.rides(filter ? { status: filter } : {}).then(setData);
  }, [filter]);

  return (
    <div>
      <div className="toolbar">
        <h2>الرحلات ({data.total || 0})</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">الكل</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>الراكب</th>
            <th>السائق</th>
            <th>المسار</th>
            <th>الأجرة</th>
            <th>الدفع</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          {data.rides.map((r) => (
            <tr key={r.id}>
              <td>{r.rider.name}</td>
              <td>{r.driver?.name || '—'}</td>
              <td className="route">{r.pickupAddress} → {r.dropoffAddress}</td>
              <td>{r.fare} ر.س</td>
              <td>{r.payment?.status || '—'}</td>
              <td><span className="badge">{STATUS_LABELS[r.status]}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
