import React from 'react';
import { FiMenu, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../theme/useTheme.js';

export function Topbar({ onMenu }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        background: 'rgba(255,255,255,.45)',
        borderBottom: '1px solid var(--border)'
      }}
      className=""
    >
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px'
        }}
      >
        <button
          className="btn btnGhost"
          onClick={onMenu}
          style={{ display: 'inline-flex' }}
          aria-label="Open menu"
        >
          <FiMenu />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="muted" style={{ fontWeight: 700, letterSpacing: '.2px' }}>
            Planora
          </div>
          <button
            className="btn btnGhost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{ padding: 10, borderRadius: 12 }}
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </div>
    </header>
  );
}

