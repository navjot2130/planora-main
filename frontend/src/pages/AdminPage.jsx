import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { adminApi } from '../api/adminApi.js';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const [usersRes, statsRes] = await Promise.all([adminApi.users(), adminApi.stats()]);
      setUsers(usersRes?.data?.users || []);
      setStats(statsRes?.data?.stats || null);
    } catch (e) {
      setError(e?.message || 'Admin access required.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleDisabled = async (user) => {
    await adminApi.updateUser(user.uid, { disabled: !user.disabled });
    await load();
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <div style={{ fontWeight: 950, fontSize: 28 }}>Admin</div>
        <div className="muted" style={{ marginTop: 6 }}>Users, system activity, and reports.</div>
      </div>
      {error ? <div className="badge" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.35)' }}>{error}</div> : null}
      {stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {Object.entries(stats).map(([key, value]) => <Card key={key} style={{ padding: 16 }}><div className="muted">{key}</div><div style={{ fontWeight: 950, fontSize: 26 }}>{value}</div></Card>)}
        </div>
      ) : null}
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Users</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {users.map((u) => (
            <div key={u.uid} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 850 }}>{u.email || u.uid}</div>
                <div className="muted" style={{ fontSize: 12 }}>{u.admin ? 'Admin' : 'User'} | {u.disabled ? 'Disabled' : 'Active'}</div>
              </div>
              <Button variant="ghost" onClick={() => toggleDisabled(u)}>{u.disabled ? 'Enable' : 'Disable'}</Button>
            </div>
          ))}
          {!users.length ? <div className="muted">No users visible.</div> : null}
        </div>
      </Card>
    </div>
  );
}
