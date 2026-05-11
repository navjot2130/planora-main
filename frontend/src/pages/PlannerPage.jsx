import React, { useMemo, useState } from 'react';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { plannerApi } from '../api/plannerApi.js';

const DEFAULT_TIMES = ['09:00', '10:30', '12:30', '14:30', '16:00', '17:30'];

function TimelineItem({ time, text, tone }) {
  const dotBg =
    tone === 'success'
      ? 'rgba(34,197,94,.95)'
      : tone === 'warning'
        ? 'rgba(245,158,11,.95)'
        : 'rgba(59,130,246,.95)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'start' }}>
      <div style={{ fontWeight: 900, color: 'var(--muted)', fontSize: 13 }}>{time}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ marginTop: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: dotBg,
              boxShadow: `0 0 0 5px ${dotBg.replace(',.95', ',.18').replace(',.98', ',.18')}`
            }}
          />
        </div>
        <div style={{ padding: 12, borderRadius: 14, border: '1px solid var(--border)', background: 'rgba(255,255,255,.25)' }}>
          <div style={{ fontWeight: 900 }}>{text}</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.4 }}>
            AI-suggested focus block
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlannerPage() {
  const [goals, setGoals] = useState('Finish sprint tasks, stay focused, and take a short walk.');
  const [items, setItems] = useState([]);
  const [acceptedPlan, setAcceptedPlan] = useState(null);
  const [error, setError] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const tones = useMemo(() => ['primary', 'success', 'warning', 'primary', 'success', 'primary'], []);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await plannerApi.generate({ goals, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const plan = res?.data?.plan;

      if (!plan || !Array.isArray(plan.timeline)) {
        throw new Error('Planner returned invalid plan');
      }

      const next = plan.timeline.map((b, idx) => {
        const time = b.time || DEFAULT_TIMES[idx] || '';
        const tone = b.tone || tones[idx % tones.length];
        const task = (b.task || '').toString().trim();
        const focus = (b.focus || '').toString().trim();
        const text = task || focus || 'AI-suggested focus block';
        return { time, text, tone };
      });

      setAcceptedPlan(plan);
      setItems(next);
    } catch (e) {
      setAcceptedPlan(null);
      setItems([]);
      setError(e?.message || 'Could not generate plan. Please check backend and Gemini configuration.');
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptPlan = async () => {
    if (!acceptedPlan || isAccepting) return;
    setIsAccepting(true);
    setError(null);
    try {
      await plannerApi.accept(acceptedPlan);
      window.location.href = '/app/tasks';
    } catch (e) {
      setError(e?.message || 'Could not accept plan.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 950, fontSize: 28, letterSpacing: '-.4px' }}>AI Daily Planner</div>
          <div className="muted" style={{ marginTop: 6 }}>
            Turn goals into a clean timeline you can follow.
          </div>
        </div>
        <Button
          variant="primary"
          onClick={generate}
          disabled={isGenerating}
          style={{ padding: '11px 14px', opacity: isGenerating ? 0.75 : 1 }}
        >
          {isGenerating ? 'Generating…' : 'Generate Plan'}
        </Button>
      </div>

      {error ? (
        <div
          className="badge"
          style={{
            background: 'rgba(239,68,68,.10)',
            borderColor: 'rgba(239,68,68,.30)',
            color: 'rgba(239,68,68,.95)'
          }}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 900 }}>Your goals</div>
          <div className="muted" style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5 }}>
            Write what matters today. Separate by commas or new lines.
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
            <label htmlFor="planner-goals">
              <div className="muted" style={{ fontWeight: 800, fontSize: 12, marginBottom: 8 }}>Goals</div>
              <textarea
                id="planner-goals"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={9}
                className="input"
                style={{ resize: 'vertical', paddingTop: 12, lineHeight: 1.5 }}
                placeholder="e.g. Finish report, call client, and go for a walk"
              />
            </label>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="ghost"
                onClick={() => setGoals('Finish sprint tasks, stay focused, and take a short walk.')}
              >
                Example
              </Button>
              <Button variant="ghost" onClick={() => {
                setItems([]);
                setAcceptedPlan(null);
              }}>
                Clear output
              </Button>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900 }}>Schedule</div>
              <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                A timeline view you can follow block-by-block.
              </div>
            </div>
            <div className="badge">AI timeline</div>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 14 }}>
            {items.length ? (
              items.map((it, idx) => <TimelineItem key={idx} time={it.time} text={it.text} tone={it.tone} />)
            ) : (
              <div className="muted" style={{ padding: 14, lineHeight: 1.6 }}>
                Click <b>Generate Plan</b> to create your daily schedule.
              </div>
            )}
          </div>

          {items.length ? (
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button
                variant="primary"
                onClick={() => {
                  // copy to clipboard
                  const text = items.map((i) => `${i.time} - ${i.text}`).join('\n');
                  navigator.clipboard?.writeText?.(text);
                }}
                style={{ padding: '10px 12px' }}
              >
                Copy timeline
              </Button>
              <Button
                variant="primary"
                onClick={acceptPlan}
                style={{ padding: '10px 12px' }}
                disabled={!acceptedPlan || isAccepting}
              >
                {isAccepting ? 'Accepting…' : 'Accept plan'}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

