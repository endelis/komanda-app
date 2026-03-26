import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './LoginModal.css'

const ROLE_ROUTES = {
  superadmin: '/admin',
  coach: '/team',
  parent: '/home',
  player: '/home',
}

export default function LoginModal({ onClose }) {
  const { t } = useTranslation()
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error: signInError, role } = await signIn(email, password)
    setSubmitting(false)

    if (signInError) {
      const isCredentials = signInError.message?.toLowerCase().includes('invalid')
      setError(isCredentials ? t('auth.error_invalid') : t('auth.error_generic'))
      return
    }

    onClose()
    navigate(ROLE_ROUTES[role] ?? '/')
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSubmitting(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (resetError) {
      setError(t('auth.error_generic'))
      return
    }

    setInfo(t('reset.request_sent'))
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal__close" onClick={onClose} aria-label="Aizvērt">✕</button>

        {view === 'login' ? (
          <>
            <h2 className="modal__title" id="modal-title">{t('auth.title')}</h2>
            <form onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email">{t('auth.email')}</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">{t('auth.password')}</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="modal__error">{error}</p>}
              <div className="modal__footer">
                <button type="button" className="modal__forgot" onClick={() => { setError(null); setView('forgot') }}>
                  {t('auth.forgot_password')}
                </button>
                <button type="submit" className="btn btn--gold" disabled={submitting}>
                  {submitting ? '…' : t('auth.login')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="modal__title" id="modal-title">{t('reset.request_title')}</h2>
            <p className="modal__subtitle">{t('reset.request_subtitle')}</p>
            <form onSubmit={handleForgot} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-email">{t('auth.email')}</label>
                <input
                  id="reset-email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p className="modal__error">{error}</p>}
              {info && <p className="modal__info">{info}</p>}
              <div className="modal__footer">
                <button type="button" className="modal__forgot" onClick={() => { setError(null); setInfo(null); setView('login') }}>
                  {t('auth.back_to_login')}
                </button>
                <button type="submit" className="btn btn--gold" disabled={submitting || !!info}>
                  {submitting ? '…' : t('reset.request_submit')}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
