import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { tasksApi } from '../api/tasksApi.js';
import { normalizeDate } from '../utils/date.js';

const PRIORITIES = ['High', 'Medium', 'Low'];
const CATEGORIES = ['Work', 'Personal', 'Health', 'Learning'];
const emptyForm = {
  title: '',
  description: '',
  priority: 'Medium',
  category: 'Work',
  dueDate: '',
  completed: false
};

function toInputDate(value) {
  const d = normalizeDate(value);
  if (!d) return '';
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 16);
}

function toPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
    completed: Boolean(form.completed)
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tasksApi.list({
        priority: priorityFilter === 'All' ? undefined : priorityFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase()
      });
      setTasks(res?.data?.tasks || []);
    } catch (e) {
      setError(e?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityFilter, categoryFilter, statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) =>
      [t.title, t.description, t.category, t.priority].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submitTask = async () => {
    const payload = toPayload(form);
    if (!payload.title) {
      setError('Task title is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (editingId) await tasksApi.update(editingId, payload);
      else await tasksApi.create(payload);
      resetForm();
      await loadTasks();
    } catch (e) {
      setError(e?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const editTask = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      category: task.category || 'Work',
      dueDate: toInputDate(task.dueDate),
      completed: Boolean(task.completed)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteTask = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setLoading(true);
    try {
      await tasksApi.remove(task.id);
      await loadTasks();
    } catch (e) {
      setError(e?.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const toggleDone = async (task) => {
    try {
      await tasksApi.toggle(task.id);
      await loadTasks();
    } catch (e) {
      setError(e?.message || 'Failed to update task');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 28 }}>Tasks</div>
          <div className="muted" style={{ marginTop: 6 }}>Create, schedule, filter, and finish work.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge">Completed: {completedCount}</span>
          <span className="badge">Pending: {pendingCount}</span>
        </div>
      </div>

      {error ? <div className="badge" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,.35)' }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>{editingId ? 'Edit task' : 'Add task'}</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <Input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea
              className="input"
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={form.completed} onChange={(e) => setForm({ ...form, completed: e.target.checked })} />
              <span className="muted">Completed</span>
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button variant="primary" onClick={submitTask} disabled={loading}>{editingId ? 'Save changes' : 'Add task'}</Button>
              {editingId ? <Button variant="ghost" onClick={resetForm}>Cancel</Button> : null}
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Filters</div>
          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <Input placeholder="Search tasks" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All</option>
                <option>Pending</option>
                <option>Completed</option>
              </select>
              <select className="input" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option>All</option>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
              <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option>All</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Task list</div>
        <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
          {loading ? <div className="muted">Loading tasks...</div> : null}
          {!loading && !filtered.length ? <div className="muted">No tasks found.</div> : null}
          {filtered.map((task) => (
            <div key={task.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 14 }}>
              <div>
                <div style={{ fontWeight: 900, textDecoration: task.completed ? 'line-through' : 'none' }}>{task.title}</div>
                <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{task.description || 'No description'}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge">{task.priority}</span>
                  <span className="badge">{task.category}</span>
                  <span className="badge">{normalizeDate(task.dueDate)?.toLocaleString() || 'No due date'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button variant="ghost" onClick={() => toggleDone(task)}>{task.completed ? 'Pending' : 'Complete'}</Button>
                <Button variant="ghost" onClick={() => editTask(task)}>Edit</Button>
                <Button variant="ghost" onClick={() => deleteTask(task)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
