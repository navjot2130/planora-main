import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';

import { tasksApi } from '../api/tasksApi.js';
import { analyticsApi } from '../api/analyticsApi.js';
import { normalizeDate } from '../utils/date.js';


function ProgressBar({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        height: 12,
        borderRadius: 999,
        background: 'rgba(59,130,246,.10)',
        border: '1px solid rgba(59,130,246,.18)'
      }}
      aria-label="Productivity score"
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 999,
          background: 'linear-gradient(90deg, rgba(59,130,246,.98), rgba(96,165,250,.85), rgba(34,197,94,.75))',
          transition: 'width .35s ease'
        }}
      />
    </div>
  );
}

function StatCard({ label, value, hint, tone = 'primary' }) {
  const color =
    tone === 'success'
      ? 'rgba(34,197,94,.95)'
      : tone === 'warning'
        ? 'rgba(245,158,11,.95)'
        : 'rgba(59,130,246,.98)';

  return (
    <Card style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, color: 'var(--muted)' }}>{label}</div>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 0 4px ${color.replace(',.95', ',.18').replace(',.98', ',.18')}`
          }}
          aria-hidden="true"
        />
      </div>
      <div style={{ fontWeight: 950, fontSize: 26 }}>{value}</div>
      {hint ? <div className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>{hint}</div> : null}
    </Card>
  );
}

export default function DashboardPage() {
  const [todayTasks, setTodayTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [tasksRes, analyticsRes] = await Promise.all([
          tasksApi.getToday(),
          analyticsApi.today()
        ]);

        const mapped = (tasksRes?.data?.tasks || []).map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
          // dashboard UI expects a time string; backend returns dueDate.
          time: normalizeDate(t.dueDate)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''
        }));

        if (cancelled) return;
        setTodayTasks(mapped);
        setAnalytics(analyticsRes?.data || null);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const completed = analytics?.stats?.completed ?? analytics?.productivity?.completed ?? analytics?.completed ?? 0;
  const pending = analytics?.stats?.pending ?? analytics?.productivity?.pending ?? analytics?.pending ?? 0;
  const productivity = analytics?.productivity ?? analytics?.productivityScore ?? analytics?.score ?? 0;

  const safeCompleted = Number.isFinite(Number(completed)) ? Number(completed) : 0;
  const safePending = Number.isFinite(Number(pending)) ? Number(pending) : 0;
  const safeProductivity = Number.isFinite(Number(productivity)) ? Number(productivity) : 0;

  return (

    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 28, letterSpacing: '-.4px' }}>Dashboard</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Minimal overview—maximum momentum.
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            // mock action
            window.location.href = '/app/planner';
          }}
          style={{ padding: '11px 14px' }}
        >
          <span style={{ fontWeight: 850 }}>AI Daily Planner</span>
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900 }}>Today’s tasks</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                Focus on what moves the needle.
              </div>
            </div>
            <div className="badge">{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            {loading ? (
              <div className="muted" style={{ padding: 14, textAlign: 'center' }}>Loading…</div>
            ) : error ? (
              <div
                className="badge"
                style={{
                  background: 'rgba(239,68,68,.10)',
                  borderColor: 'rgba(239,68,68,.30)',
                  color: 'rgba(239,68,68,.95)',
                  padding: 14,
                  borderRadius: 14,
                  textAlign: 'center'
                }}
                role="alert"
              >
                {error}
              </div>
            ) : todayTasks.length ? (
              todayTasks.map((t) => (
                <div
                  key={t.id || t.title}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 10,
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: 14,
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,.35)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 850 }}>{t.title}</div>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.2 }}>
                      {t.priority} priority
                    </div>
                  </div>
                  <div className="badge" style={{ background: 'rgba(59,130,246,.08)' }}>
                    {t.time || '—'}
                  </div>
                </div>
              ))
            ) : (
              <div className="muted" style={{ padding: 14, textAlign: 'center' }}>
                No tasks due today.
              </div>
            )}
          </div>

        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 900 }}>Productivity score</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                Progress based on completion + consistency.
              </div>
            </div>
            <div style={{ fontWeight: 950, fontSize: 26 }}>{safeProductivity}%</div>

          </div>

          <div style={{ marginTop: 14 }}>
            <ProgressBar value={safeProductivity} />

          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatCard label="Completed" value={safeCompleted} tone="success" hint="Keep going—momentum builds." />
            <StatCard label="Pending" value={safePending} tone="warning" hint="Pick one next action." />

          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900 }}>Quick stats</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                A glance at your day.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(255,255,255,.25)' }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>Streak</div>
              <div style={{ marginTop: 6, fontWeight: 950, fontSize: 22 }}>{analytics?.streak ?? 0} days</div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(255,255,255,.25)' }}>
              <div className="muted" style={{ fontSize: 12, fontWeight: 800 }}>Focus blocks</div>
              <div style={{ marginTop: 6, fontWeight: 950, fontSize: 22 }}>{analytics?.focusTimeHours ?? 0}h</div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Motivational AI message</div>
          <div className="muted" style={{ marginTop: 8, lineHeight: 1.65 }}>
            {analytics?.motivationalMessage || 'Choose the smallest task that creates forward motion.'}
            <br />
            <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Start with one win—then ride the wave.</span>
          </div>

          <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <span className="badge">Focus</span>
            <span className="badge">Consistency</span>
            <span className="badge">Clarity</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

