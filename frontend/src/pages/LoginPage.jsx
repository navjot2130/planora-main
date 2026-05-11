import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { login, register, loginWithGoogle, loading } = useAuth();

  const onSubmit = async () => {
    if (submitting || loading) return;
    setError(null);

    const e = email.trim();
    const p = password;
    if (!e || !p) {
      setError('Email and password are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'login') {
        await login(e, p);
      } else {
        await register(e, p);
      }
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.message || (err?.code ? String(err.code) : null) ||
        'Authentication failed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    if (submitting || loading) return;
    setError(null);
    try {
      setSubmitting(true);
      await loginWithGoogle();
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Google login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18
      }}
    >
      <div className="container" style={{ width: 'min(980px, 100%)' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.05fr .95fr',
            gap: 18,
            alignItems: 'stretch'
          }}
        >
          <Card solid className="cardSolid" style={{ padding: 22 }}>
            <div style={{ padding: '6px 2px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 6,
                    background: 'linear-gradient(180deg, rgba(59,130,246,1), rgba(34,197,94,.85))'
                  }}
                />
                <div style={{ fontWeight: 950, fontSize: 20 }}>Planora</div>
              </div>
              <div className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>
                AI-powered smart productivity and life assistant.
                <br />
                Minimal UI. Maximum momentum.
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span className="badge">Notion-like layout</span>
              <span className="badge">Todoist vibes</span>
              <span className="badge">AI-ready</span>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>What you’ll get</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--muted)', lineHeight: 1.75 }}>
                <li>Task management with clean filters</li>
                <li>AI daily planner timeline</li>
                <li>Chat assistant for focus + clarity</li>
                <li>Analytics for continuous improvement</li>
              </ul>
            </div>
          </Card>

          <Card style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 950, fontSize: 18 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
                <div className="muted" style={{ marginTop: 6 }}>
                  {mode === 'login'
                    ? 'Log in to continue planning.'
                    : 'Register to start organizing your day.'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btnGhost"
                  onClick={() => setMode('login')}
                  disabled={submitting}
                  style={{
                    borderColor: mode === 'login' ? 'rgba(59,130,246,.35)' : 'var(--border)',
                    background: mode === 'login' ? 'rgba(59,130,246,.12)' : 'transparent',
                    opacity: submitting ? 0.75 : 1
                  }}
                >
                  Login
                </button>
                <button
                  className="btn btnGhost"
                  onClick={() => setMode('signup')}
                  disabled={submitting}
                  style={{
                    borderColor: mode === 'signup' ? 'rgba(59,130,246,.35)' : 'var(--border)',
                    background: mode === 'signup' ? 'rgba(59,130,246,.12)' : 'transparent',
                    opacity: submitting ? 0.75 : 1
                  }}
                >
                  Register
                </button>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
              <div>
                <div className="muted" style={{ fontWeight: 750, fontSize: 13, marginBottom: 8 }}>
                  Email
                </div>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div>
                <div className="muted" style={{ fontWeight: 750, fontSize: 13, marginBottom: 8 }}>
                  Password
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
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

              <Button
                variant="primary"
                onClick={onSubmit}
                disabled={submitting}
                style={{ width: '100%', padding: '12px 14px', opacity: submitting ? 0.75 : 1 }}
              >
                {submitting ? (mode === 'login' ? 'Logging in…' : 'Creating account…') : mode === 'login' ? 'Login' : 'Register'}
              </Button>

              <Button
                variant="ghost"
                onClick={onGoogle}
                disabled={submitting}
                style={{ width: '100%', padding: '12px 14px', opacity: submitting ? 0.75 : 1 }}
              >
                Continue with Google
              </Button>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                By continuing, you agree to the Terms & Privacy.
              </div>
            </div>
          </Card>
        </div>

        <style>{`
          @media (max-width: 920px){
            div.container > div{ grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  );
}


