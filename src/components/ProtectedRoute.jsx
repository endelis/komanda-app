import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="loading-screen">
        <span>{t('app.loading')}</span>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}
