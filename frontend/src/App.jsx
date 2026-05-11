import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { ThemeProvider } from './components/theme/ThemeProvider.jsx';
import { RequireAuth } from './components/protected/RequireAuth.jsx';
import { useAuth } from './auth/AuthContext.jsx';

function ProtectedRoute({ children }) {
  return (
    <RequireAuth>
      <AppLayout>{children}</AppLayout>
    </RequireAuth>
  );
}

function LoginRedirector() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app/dashboard" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginRedirector />} />

        <Route
          path="/app/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/planner"
          element={
            <ProtectedRoute>
              <PlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* If user lands on /app (or any unknown /app/*), push them to the dashboard.
            This prevents redirect bouncing between /login and nested /app routes. */}
        <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app/*" element={<Navigate to="/app/dashboard" replace />} />

        {/* Global catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

