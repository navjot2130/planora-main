import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiCheckSquare,
  FiThumbsUp,
  FiMessageCircle,
  FiBarChart2,
  FiActivity,
  FiBell,
  FiCalendar,
  FiUser,
  FiShield,
  FiX
} from 'react-icons/fi';

const items = [
  { to: '/app/dashboard', label: 'Dashboard', icon: <FiGrid /> },
  { to: '/app/tasks', label: 'Tasks', icon: <FiCheckSquare /> },
  { to: '/app/planner', label: 'AI Planner', icon: <FiActivity /> },
  { to: '/app/chat', label: 'Chat Assistant', icon: <FiMessageCircle /> },
  { to: '/app/analytics', label: 'Analytics', icon: <FiBarChart2 /> },
  { to: '/app/calendar', label: 'Calendar', icon: <FiCalendar /> },
  { to: '/app/notifications', label: 'Notifications', icon: <FiBell /> },
  { to: '/app/profile', label: 'Profile', icon: <FiUser /> },
  { to: '/app/admin', label: 'Admin', icon: <FiShield /> }
];

export function Sidebar({ open, onClose }) {
  return (
    <aside
      style={{
        width: 280,
        position: 'fixed',
        top: 64,
        left: 0,
        bottom: 0,
        zIndex: 60,
        transform: open ? 'translateX(0)' : 'translateX(-104%)',
        transition: 'transform .18s ease',
        padding: 16
      }}
      className="sidebar"
    >
      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 64 + 'px 0 0 0',
            background: 'rgba(0,0,0,.18)',
            zIndex: -1
          }}
        />
      )}

      <div
        className="card"
        style={{
          height: '100%',
          padding: 14,
          borderRadius: 20,
          background: 'var(--sidebar)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 900, letterSpacing: '.2px' }}>Planora</div>
          <button className="btn btnGhost" onClick={onClose} style={{ display: 'inline-flex' }}>
            <FiX />
          </button>
        </div>

        <nav style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 14,
                border: '1px solid transparent',
                background: isActive ? 'rgba(59,130,246,.14)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text)',
                fontWeight: isActive ? 800 : 650
              })}
            >
              <span style={{ display: 'inline-flex', fontSize: 16 }}>{it.icon}</span>
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 16 }} className="muted">
          Minimal productivity • AI-ready UX
        </div>
      </div>

      <style>{`
        @media (min-width: 980px){
          .sidebar{ transform: translateX(0) !important; }
        }
      `}</style>
    </aside>
  );
}

