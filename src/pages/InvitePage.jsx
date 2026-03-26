import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AuthPage.css'

const ROLE_ROUTES = {
  superadmin: '/admin',
  coach:      '/team',
  parent:     '/home',
  player:     '/home',
}

export default function InvitePage() {
  const { t } = useTranslation()
  const { token } = useParams()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)       // invite record from DB
  const [inviteType, setInviteType] = useState(null) // 'player' | 'coach'
  const [status, setStatus] = useState('loading')  // 'loading' | 'ready' | 'invalid' | 'used'
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadInvite() {
      // Check player/parent invites first
      const { data: playerInvite } = await supabase
        .from('invites')
        .select('id, invited_email, role, player_id, accepted_at, expires_at')
        .eq('token', token)
        .single()

      if (playerInvite) {
        if (playerInvite.accepted_at) { setStatus('used'); return }
        if (new Date(playerInvite.expires_at) < new Date()) { setStatus('invalid'); return }
        setInvite(playerInvite)
        setInviteType('player')
        setStatus('ready')
        return
      }

      // Check coach invites
      const { data: coachInvite } = await supabase
        .from('coach_invites')
        .select('id, invited_email, branch_id, age_group, accepted_at, expires_at')
        .eq('token', token)
        .single()

      if (coachInvite) {
        if (coachInvite.accepted_at) { setStatus('used'); return }
        if (new Date(coachInvite.expires_at) < new Date()) { setStatus('invalid'); return }
        setInvite(coachInvite)
        setInviteType('coach')
        setStatus('ready')
        return
      }

      setStatus('invalid')
    }

    loadInvite()
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) { setError(t('invite.password_short')); return }
    if (password !== confirm) { setError(t('invite.password_mismatch')); return }

    setSubmitting(true)

    const role = inviteType === 'coach' ? 'coach' : invite.role

    // Sign up — triggers handle_new_user to insert users row
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite.invited_email,
      password,
      options: { data: { role } },
    })

    if (signUpError || !signUpData.user?.id) {
      setSubmitting(false)
      setError(t('invite.error_generic'))
      return
    }

    const userId = signUpData.user.id

    if (inviteType === 'player') {
      // Link user to player record
      await supabase.from('player_users').insert({
        player_id: invite.player_id,
        user_id: userId,
        relationship: invite.role,
      })
      await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
    } else {
      // Create coach_access entry
      if (invite.branch_id) {
        await supabase.from('coach_access').insert({
          user_id: userId,
          branch_id: invite.branch_id,
          age_group: invite.age_group ?? null,
        })
      }
      await supabase
        .from('coach_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
    }

    setSubmitting(false)
    setTimeout(() => navigate(ROLE_ROUTES[role] ?? '/'), 1200)
  }

  if (status === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="auth-card__subtitle">{t('app.loading')}</p>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__logo">
            <span className="auth-card__mark">K</span>
            <span className="auth-card__wordmark">KOMANDA</span>
          </div>
          <p className="auth-card__error">{t('invite.invalid_token')}</p>
        </div>
      </div>
    )
  }

  if (status === 'used') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__logo">
            <span className="auth-card__mark">K</span>
            <span className="auth-card__wordmark">KOMANDA</span>
          </div>
          <p className="auth-card__error">{t('invite.already_accepted')}</p>
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
        <h1 className="auth-card__title">{t('invite.title')}</h1>
        <p className="auth-card__subtitle">{t('invite.subtitle')}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('invite.email')}</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={invite.invited_email}
              readOnly
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('invite.password')}</label>
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
            <label className="form-label" htmlFor="confirm">{t('invite.password_confirm')}</label>
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
              {submitting ? '…' : t('invite.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
