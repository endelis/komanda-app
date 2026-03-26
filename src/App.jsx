import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/layout/AppShell'

// Eagerly load auth-critical pages
import LandingPage from './pages/LandingPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import InvitePage from './pages/InvitePage'

// Lazy load app pages
const AdminPage         = lazy(() => import('./pages/AdminPage'))
const TeamPage          = lazy(() => import('./pages/TeamPage'))
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage'))
const CalendarPage      = lazy(() => import('./pages/CalendarPage'))
const AttendancePage    = lazy(() => import('./pages/AttendancePage'))
const PerformancePage   = lazy(() => import('./pages/PerformancePage'))
const HomePage          = lazy(() => import('./pages/HomePage'))

function PageLoader() {
  return (
    <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Loading...
    </div>
  )
}

function Protected({ roles, children }) {
  return (
    <ProtectedRoute allowedRoles={roles}>
      <AppShell>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/invite/:token" element={<InvitePage />} />

          {/* Protected — wrapped in AppShell */}
          <Route path="/admin" element={
            <Protected roles={['superadmin']}>
              <AdminPage />
            </Protected>
          } />
          <Route path="/team" element={
            <Protected roles={['superadmin', 'coach']}>
              <TeamPage />
            </Protected>
          } />
          <Route path="/team/:id" element={
            <Protected roles={['superadmin', 'coach']}>
              <PlayerProfilePage />
            </Protected>
          } />
          <Route path="/calendar" element={
            <Protected roles={['superadmin', 'coach']}>
              <CalendarPage />
            </Protected>
          } />
          <Route path="/attendance" element={
            <Protected roles={['superadmin', 'coach']}>
              <AttendancePage />
            </Protected>
          } />
          <Route path="/performance" element={
            <Protected roles={['superadmin', 'coach']}>
              <PerformancePage />
            </Protected>
          } />
          <Route path="/home" element={
            <Protected roles={['superadmin', 'coach', 'parent', 'player']}>
              <HomePage />
            </Protected>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
