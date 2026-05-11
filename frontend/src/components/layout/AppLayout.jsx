import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function AppLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar onMenu={() => setSidebarOpen(true)} />
      <div style={{ display: 'flex' }}>
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="appMain" style={{ flex: 1, padding: '84px 18px 26px' }}>
          <div className="container">{children || <Outlet />}</div>
        </main>
      </div>
      <style>{`
        @media (min-width: 980px){
          .appMain{ margin-left: 280px; }
        }
      `}</style>
    </div>
  );
}

