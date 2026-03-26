import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import './AuthPage.css'

const ROLE_ROUTES = {
  superadmin: '/admin',
  coach: '/team',
  parent: '/home',
  player: '/home',
}

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const navigate = useNavigate()

  const [ready, setReady] = useState(false)       // true once PASSWORD_RECOVERY fires
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError(t('reset.password_short'))
      return
    }
    if (password !== confirm) {
      setError(t('reset.password_mismatch'))
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (updateError) {
      setError(t('auth.error_generic'))
      return
    }

    setSuccess(true)
    setTimeout(() => navigate(ROLE_ROUTES[role] ?? '/'), 1500)
  }

  if (!ready) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__logo">
            <span className="auth-card__mark">K</span>
            <span className="auth-card__wordmark">KOMANDA</span>
          </div>
          <p className="auth-card__subtitle">{t('reset.invalid_link')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__logo">
          <span className="auth-card__mark">K</span>
          <span className="auth-card__wordmark">KOMANDA</span>
        </div>
        <h1 className="auth-card__title">{t('reset.title')}</h1>
        <p className="auth-card__subtitle">{t('reset.subtitle')}</p>

        {success ? (
          <p className="auth-card__success">{t('reset.success')}</p>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="password">{t('reset.password')}</label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="confirm">{t('reset.password_confirm')}</label>
              <input
                id="confirm"
                type="password"
                className="form-input"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="auth-card__error">{error}</p>}
            <div className="auth-card__footer">
              <button type="submit" className="btn btn--gold" disabled={submitting}>
                {submitting ? '…' : t('reset.submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
