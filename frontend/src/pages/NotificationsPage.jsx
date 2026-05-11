import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { normalizeDate } from '../utils/date.js';
import { remindersApi } from '../api/remindersApi.js';
import { tasksApi } from '../api/tasksApi.js';
import { profileApi } from '../api/profileApi.js';

const DEFAULT_PROFILE = {
  preferences: { reminderLeadMinutes: 15 }
};

export default function NotificationsPage() {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const firedRemindersRef = useRef(new Set());
  const remindAtInputRef = useRef(null);

  const load = async () => {
    const [remRes, taskRes, profileRes] = await Promise.all([
      remindersApi.list(),
      tasksApi.list({ status: 'pending' }),
      profileApi.get().catch(() => null)
    ]);
    setReminders(remRes?.data?.reminders || []);
    setTasks(taskRes?.data?.tasks || []);
    setProfile(profileRes?.data?.profile || DEFAULT_PROFILE);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const now = Date.now();
      const leadMinutes = Number(profile?.preferences?.reminderLeadMinutes ?? 15);
      const leadMs = Math.max(0, Number.isFinite(leadMinutes) ? leadMinutes : 15) * 60 * 1000;

      reminders.forEach((r) => {
        const remindDate = normalizeDate(r.remindAt);
        if (!remindDate) return;

        const remindAtMs = remindDate.getTime();
        const triggerAtMs = remindAtMs - leadMs;
        const firedKey = `${r.id || r.title}:${triggerAtMs}`;
        const triggerWindowEnded = remindAtMs + 60 * 1000;

        if (now >= triggerAtMs && now <= triggerWindowEnded && !firedRemindersRef.current.has(firedKey)) {
          firedRemindersRef.current.add(firedKey);
          toast(r.title);
        }
      });
    }, 15000);
    return () => window.clearInterval(id);
  }, [profile, reminders]);

  const overdue = useMemo(() => tasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = normalizeDate(t.dueDate);
    if (!d) return false;
    return d < new Date();
  }), [tasks]);

  const add = async () => {
    setMessage('');
    const rawRemindAt = remindAt || remindAtInputRef.current?.value || '';
    if (!title.trim() || !rawRemindAt) {
      setMessage('Reminder title and time are required.');
      return;
    }

    const remindAtDate = new Date(rawRemindAt);
    if (Number.isNaN(remindAtDate.getTime())) {
      setMessage('Reminder time is invalid.');
      return;
    }

    setSaving(true);
    try {
      await remindersApi.create({ title: title.trim(), remindAt: remindAtDate.toISOString() });
      setTitle('');
      setRemindAt('');
      setMessage('Reminder saved.');
      await load();
    } catch (e) {
      setMessage(e?.message || 'Reminder could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setMessage('');
    try {
      await remindersApi.remove(id);
      setMessage('Reminder deleted.');
      await load();
    } catch (e) {
      setMessage(e?.message || 'Reminder could not be deleted.');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Toaster />
      <div>
        <div style={{ fontWeight: 950, fontSize: 28 }}>Notifications</div>
        <div className="muted" style={{ marginTop: 6 }}>Reminders, alerts, and overdue tasks.</div>
      </div>
      {message ? <div className="badge">{message}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card style={{ padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Create reminder</div>
          <Input placeholder="Reminder title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input
            ref={remindAtInputRef}
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            onInput={(e) => setRemindAt(e.currentTarget.value)}
          />
          <Button variant="primary" onClick={add} disabled={saving}>{saving ? 'Saving...' : 'Add reminder'}</Button>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Overdue</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            {overdue.length ? overdue.map((t) => <div key={t.id} className="badge">{t.title}</div>) : <div className="muted">No overdue tasks.</div>}
          </div>
        </Card>
      </div>
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 900 }}>Scheduled alerts</div>
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {reminders.map((r) => (
            <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <span>{r.title}</span>
              <Button variant="ghost" onClick={() => remove(r.id)}>Delete</Button>
            </div>
          ))}
          {!reminders.length ? <div className="muted">No reminders yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
