import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { tasksApi } from '../api/tasksApi.js';
import { formatDateKey, normalizeDate } from '../utils/date.js';

export default function CalendarPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('month');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const loadTasks = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await tasksApi.list({});
      setTasks(res?.data?.tasks || []);
    } catch {
      setTasks([]);
      setError('Failed to load scheduled tasks.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const monthLabel = useMemo(() => {
    const d = anchorDate;
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [anchorDate]);

  const days = useMemo(() => {
    const startOfAnchor = new Date(anchorDate);
    if (!Number.isFinite(startOfAnchor.getTime())) return [];


    if (view === 'week') {
      // Start from Monday for stable weekly layout
      const day = startOfAnchor.getDay(); // 0 Sun - 6 Sat
      const diffToMonday = (day + 6) % 7;
      const start = new Date(startOfAnchor);
      start.setDate(start.getDate() - diffToMonday);

      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
      });
    }

    // Month grid (6 weeks) to avoid layout jump
    const year = startOfAnchor.getFullYear();
    const month = startOfAnchor.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const firstDay = firstOfMonth.getDay(); // 0..6
    const diffToMonday = (firstDay + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - diffToMonday);

    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [anchorDate, view]);

  const tasksByDateKey = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(tasks)) return map;

    for (const t of tasks || []) {
      if (!t?.dueDate) continue;
      const d = normalizeDate(t.dueDate);
      const key = formatDateKey(d);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(t);
    }
    return map;
  }, [tasks]);

  const onPrev = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() - 7);
      else d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const onNext = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      if (view === 'week') d.setDate(d.getDate() + 7);
      else d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const selectedDateKey = selectedDay ? formatDateKey(selectedDay) : null;
  const selectedTasks = selectedDateKey ? tasksByDateKey.get(selectedDateKey) || [] : [];

  const toggleTask = async (taskId) => {
    setUpdatingTaskId(taskId);
    setError(null);
    try {
      await tasksApi.toggle(taskId);
      await loadTasks({ silent: true });
    } catch {
      setError('Could not update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 28 }}>Calendar</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Scheduled tasks by date.
          </div>
        </div>

        <div style={{ display: 'grid', justifyItems: 'end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btnGhost" onClick={onPrev} aria-label="Previous">
              &lt;
            </button>
            <div className="badge">{view === 'week' ? 'Week' : monthLabel}</div>
            <button className="btn btnGhost" onClick={onNext} aria-label="Next">
              &gt;
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btnGhost" onClick={() => setView('week')} aria-pressed={view === 'week'}>
              Week
            </button>
            <button
              className="btn btnGhost"
              onClick={() => setView('month')}
              aria-pressed={view === 'month'}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      {loading ? <div className="muted">Loading calendar…</div> : null}
      {error ? (
        <div className="badge" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.35)' }} role="alert">
          {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 10
          }}
        >
          {days.map((day) => {
            const key = formatDateKey(day);
            if (!key) return null;

            const dayTasks = key ? tasksByDateKey.get(key) || [] : [];
            const isInMonth = view === 'month' ? day.getMonth() === anchorDate.getMonth() : true;

            return (
              <Card
                key={day.toISOString()}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDay(day)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedDay(day);
                  }
                }}
                style={{
                  padding: 12,
                  minHeight: 130,
                  opacity: isInMonth ? 1 : 0.55,
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontWeight: 900 }}>{day.getDate()}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {day.toLocaleDateString(undefined, { weekday: 'short' })}
                </div>

                <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                  {dayTasks.length ? (
                    dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className="badge"
                        style={{ justifyContent: 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis' }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))
                  ) : (
                    <div className="muted" style={{ fontSize: 12 }}>
                      No tasks
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className="muted">No scheduled tasks yet.</div>
      ) : null}

      {selectedDay ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tasks for selected day"
          onClick={() => setSelectedDay(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(15,23,42,.34)',
            display: 'grid',
            placeItems: 'center',
            padding: 18
          }}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(620px, 100%)',
              maxHeight: 'min(720px, 90vh)',
              overflow: 'auto',
              padding: 18,
              background: 'var(--panelSolid)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'start' }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 22 }}>
                  {selectedDay.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {selectedTasks.length ? `${selectedTasks.length} scheduled task(s)` : 'No scheduled tasks for this date.'}
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedDay(null)}>
                Close
              </Button>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {selectedTasks.length ? (
                selectedTasks.map((task) => {
                  const due = normalizeDate(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 12,
                        alignItems: 'center',
                        padding: 12,
                        border: '1px solid var(--border)',
                        borderRadius: 12
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 900,
                            textDecoration: task.completed ? 'line-through' : 'none'
                          }}
                        >
                          {task.title}
                        </div>
                        <div className="muted" style={{ marginTop: 5, fontSize: 13 }}>
                          {task.description || 'No description'}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="badge">{task.priority || 'Medium'}</span>
                          <span className="badge">{task.category || 'Work'}</span>
                          <span className="badge">
                            {due ? due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => toggleTask(task.id)}
                        disabled={updatingTaskId === task.id}
                      >
                        {updatingTaskId === task.id ? 'Saving...' : task.completed ? 'Mark pending' : 'Complete'}
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="muted" style={{ padding: 12 }}>
                  Create a task with this due date from the Tasks page to see it here.
                </div>
              )}
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
