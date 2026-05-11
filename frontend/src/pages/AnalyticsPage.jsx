import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { analyticsApi } from '../api/analyticsApi.js';

function Stat({ label, value, sub }) {
  return (
    <Card style={{ padding: 16 }}>
      <div className="muted" style={{ fontWeight: 850, fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, fontWeight: 950, fontSize: 26 }}>{value}</div>
      {sub ? <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>{sub}</div> : null}
    </Card>
  );
}

function Bars({ points }) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, alignItems: 'end', height: 220 }}>
      {points.map((value, idx) => (
        <div key={idx} style={{ display: 'grid', gap: 8, alignItems: 'end' }}>
          <div style={{ height: 160, display: 'flex', alignItems: 'end' }}>
            <div
              title={`${value}%`}
              style={{
                width: '100%',
                height: `${Math.max(4, value)}%`,
                borderRadius: 10,
                background: 'linear-gradient(180deg, var(--primary), var(--accent))'
              }}
            />
          </div>
          <div className="muted" style={{ textAlign: 'center', fontWeight: 800, fontSize: 12 }}>{labels[idx]}</div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [weekly, setWeekly] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [weekRes, monthRes] = await Promise.all([analyticsApi.weekly(), analyticsApi.monthly()]);
        if (!cancelled) {
          setWeekly(weekRes?.data || null);
          setMonthly(monthRes?.data || null);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = weekly?.cards || {};
  const weekPoints = weekly?.weekly?.points || [0, 0, 0, 0, 0, 0, 0];

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <div style={{ fontWeight: 950, fontSize: 28 }}>Analytics</div>
        <div className="muted" style={{ marginTop: 6 }}>Weekly and monthly performance from your tasks.</div>
      </div>

      {loading ? <div className="muted">Loading analytics...</div> : null}
      {error ? <div className="badge" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.35)' }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        <Stat label="Task completion rate" value={`${cards.completionRate || 0}%`} sub="All saved tasks" />
        <Stat label="Weekly focus" value={`${cards.focusTimeHours || 0}h`} sub="Estimated from completed tasks" />
        <Stat label="Overdue risk" value={`${cards.overdueRisk || 0}%`} sub="Pending tasks past due" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18, alignItems: 'start' }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Weekly productivity</div>
          <Bars points={weekPoints} />
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Monthly summary</div>
          <div className="muted" style={{ marginTop: 6 }}>{monthly?.month || 'This month'}</div>
          <div style={{ marginTop: 18, fontWeight: 950, fontSize: 42 }}>{monthly?.avgProductivity || 0}%</div>
          <div className="muted" style={{ marginTop: 6 }}>Average productivity across active days.</div>
          <div style={{ marginTop: 16, display: 'grid', gap: 8, maxHeight: 260, overflow: 'auto' }}>
            {(monthly?.points || []).filter((p) => p.completed || p.pending).slice(-10).map((p) => (
              <div key={p.day} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <span>Day {p.day}</span>
                <span className="muted">{p.completed} done, {p.pending} pending</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
