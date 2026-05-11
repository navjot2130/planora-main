import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { profileApi } from '../api/profileApi.js';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    displayName: '',
    role: '',
    preferences: { focusStyle: 'Balanced', dailyGoal: '', reminderLeadMinutes: 15 },
    workHours: { start: '09:00', end: '17:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }
  });
  const [streak, setStreak] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    profileApi.get().then((res) => {
      setProfile((prev) => ({ ...prev, ...(res?.data?.profile || {}) }));
      setStreak(res?.data?.streak || 0);
    }).catch(() => setMessage('Profile could not be loaded.'));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await profileApi.update(profile);
      setProfile(res?.data?.profile || profile);
      setMessage('Profile saved.');
    } catch (e) {
      setMessage(e?.message || 'Profile could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day) => {
    const selected = profile.workHours.days || [];
    setProfile({
      ...profile,
      workHours: {
        ...profile.workHours,
        days: selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day]
      }
    });
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <div style={{ fontWeight: 950, fontSize: 28 }}>Profile</div>
        <div className="muted" style={{ marginTop: 6 }}>Preferences, work hours, and productivity streaks.</div>
      </div>
      {message ? <div className="badge">{message}</div> : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card style={{ padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Details</div>
          <Input placeholder="Display name" value={profile.displayName || ''} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
          <Input placeholder="Role, e.g. Student or Developer" value={profile.role || ''} onChange={(e) => setProfile({ ...profile, role: e.target.value })} />
          <Input placeholder="Daily goal" value={profile.preferences?.dailyGoal || ''} onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, dailyGoal: e.target.value } })} />
          <select className="input" value={profile.preferences?.focusStyle || 'Balanced'} onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, focusStyle: e.target.value } })}>
            <option>Balanced</option>
            <option>Deep work</option>
            <option>Study sprint</option>
            <option>Flexible</option>
          </select>
        </Card>
        <Card style={{ padding: 18, display: 'grid', gap: 12 }}>
          <div style={{ fontWeight: 900 }}>Work and study hours</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input type="time" value={profile.workHours?.start || '09:00'} onChange={(e) => setProfile({ ...profile, workHours: { ...profile.workHours, start: e.target.value } })} />
            <Input type="time" value={profile.workHours?.end || '17:00'} onChange={(e) => setProfile({ ...profile, workHours: { ...profile.workHours, end: e.target.value } })} />
          </div>
          <Input type="number" min="0" max="240" value={profile.preferences?.reminderLeadMinutes ?? 15} onChange={(e) => setProfile({ ...profile, preferences: { ...profile.preferences, reminderLeadMinutes: Number(e.target.value) } })} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {days.map((day) => (
              <button key={day} className="btn btnGhost" onClick={() => toggleDay(day)} style={{ background: profile.workHours?.days?.includes(day) ? 'var(--chip)' : undefined }}>
                {day}
              </button>
            ))}
          </div>
          <div className="badge">Current streak: {streak} day(s)</div>
        </Card>
      </div>
      <Button variant="primary" onClick={save} disabled={saving} style={{ width: 160 }}>{saving ? 'Saving...' : 'Save profile'}</Button>
    </div>
  );
}
