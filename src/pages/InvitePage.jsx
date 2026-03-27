import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AuthPage.css'
import './InvitePage.css'

// ─── Status machine ─────────────────────────────────────────
// 'loading' → check both invite tables
// 'invalid' → token not found or expired
// 'used'    → already accepted
// 'parent'  → parent invite (one step: set password)
// 'coach'   → coach invite (one step: set password + display name)

export default function InvitePage() {
  const { t }     = useTranslation()
  const { token } = useParams()
  const navigate  = useNavigate()

  const [status,     setStatus]     = useState('loading')
  const [invite,     setInvite]     = useState(null)
  const [inviteType, setInviteType] = useState(null) // 'parent' | 'coach'

  useEffect(() => {
    async function load() {
      // Check parent invites table first
      const { data: parentInvite } = await supabase
        .from('invites')
        .select('id, invited_email, player_id, role, accepted_at, expires_at')
        .eq('token', token)
        .single()

      if (parentInvite) {
        if (parentInvite.accepted_at)                        { setStatus('used');    return }
        if (new Date(parentInvite.expires_at) < new Date())  { setStatus('invalid'); return }
        setInvite(parentInvite)
        setInviteType('parent')
        setStatus('parent')
        return
      }

      // Fall back to coach_invites table
      const { data: coachInvite } = await supabase
        .from('coach_invites')
        .select('id, invited_email, branch_id, age_group, accepted_at, expires_at')
        .eq('token', token)
        .single()

      if (coachInvite) {
        if (coachInvite.accepted_at)                        { setStatus('used');    return }
        if (new Date(coachInvite.expires_at) < new Date())  { setStatus('invalid'); return }
        setInvite(coachInvite)
        setInviteType('coach')
        setStatus('coach')
        return
      }

      setStatus('invalid')
    }
    load()
  }, [token])

  if (status === 'loading') return <LoadingView />
  if (status === 'invalid') return <ErrorView msg={t('invite.invalid_token')} />
  if (status === 'used')    return <ErrorView msg={t('invite.already_accepted')} />

  if (status === 'parent') {
    return (
      <ParentSetPassword
        invite={invite}
        onComplete={() => navigate('/home')}
      />
    )
  }

  if (status === 'coach') {
    return (
      <CoachSetPassword
        invite={invite}
        onComplete={() => navigate('/team')}
      />
    )
  }

  return null
}

// ─── Shared UI atoms ──────────────────────────────────────────
function Logo() {
  return (
    <div className="auth-card__logo">
      <span className="auth-card__mark">K</span>
      <span className="auth-card__wordmark">KOMANDA</span>
    </div>
  )
}

function LoadingView() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <div className="skeleton" style={{ height: '16px', width: '60%', borderRadius: '4px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '44px', borderRadius: '6px', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '44px', borderRadius: '6px' }} />
      </div>
    </div>
  )
}

function ErrorView({ msg }) {
  const { t } = useTranslation()
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <p className="auth-card__error">{msg}</p>
        <Link to="/" className="invite-back-link">{t('invite.back_home')}</Link>
      </div>
    </div>
  )
}

// ─── Parent: set password + auto-link to player ───────────────
// The player_id is on the invite record — the parent never
// sees or selects a player from a roster.
function ParentSetPassword({ invite, onComplete }) {
  const { t } = useTranslation()

  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [error,      setError]      = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8)   { setError(t('invite.password_short'));    return }
    if (password !== confirm)  { setError(t('invite.password_mismatch')); return }

    setSubmitting(true)

    // 1. Create auth account (trigger assigns role='player' by default)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    invite.invited_email,
      password,
    })

    if (signUpError || !data.user) {
      setSubmitting(false)
      setError(t('invite.error_generic'))
      return
    }

    const uid = data.user.id

    // 2. Set role to 'parent' — invite flow owns role assignment, not the trigger
    await supabase.from('users').update({ role: 'parent' }).eq('id', uid)

    // 3. Link this account to the specific player on the invite
    await supabase.from('player_users').insert({
      player_id:    invite.player_id,
      user_id:      uid,
      relationship: 'parent',
    })

    // 4. Mark invite accepted
    await supabase
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    setSubmitting(false)
    onComplete()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-card__title">{t('invite.step1_title')}</h1>
        <p className="auth-card__subtitle">{t('invite.step1_subtitle')}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="inv-email">{t('invite.email')}</label>
            <input
              id="inv-email"
              type="email"
              className="form-input"
              value={invite.invited_email}
              readOnly
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="inv-pw">{t('invite.password')}</label>
            <input
              id="inv-pw"
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
            <label className="form-label" htmlFor="inv-pw2">{t('invite.password_confirm')}</label>
            <input
              id="inv-pw2"
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
            <button
              type="submit"
              className="btn btn--gold"
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? '…' : t('invite.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Coach: set password + display name ───────────────────────
function CoachSetPassword({ invite, onComplete }) {
  const { t } = useTranslation()

  const [displayName, setDisplayName] = useState('')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [error,       setError]       = useState(null)
  const [submitting,  setSubmitting]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8)  { setError(t('invite.password_short'));    return }
    if (password !== confirm) { setError(t('invite.password_mismatch')); return }

    setSubmitting(true)

    // 1. Create auth account (trigger assigns role='player' by default)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    invite.invited_email,
      password,
    })

    if (signUpError || !data.user?.id) {
      setSubmitting(false)
      setError(t('invite.error_generic'))
      return
    }

    const uid = data.user.id

    // 2. Set role='coach' + display_name — invite flow owns role assignment
    await supabase.from('users').update({
      role:         'coach',
      display_name: displayName.trim() || null,
    }).eq('id', uid)

    // 3. Create coach_access entry scoped to the invited branch
    if (invite.branch_id) {
      await supabase.from('coach_access').insert({
        user_id:   uid,
        branch_id: invite.branch_id,
        age_group: invite.age_group ?? null,
      })

      // 4. Derive club_id from the branch and set it on the user record.
      //    After inserting coach_access, the coach can now read that branch
      //    via the users_read_branches RLS policy.
      const { data: ca } = await supabase
        .from('coach_access')
        .select('branches(club_id)')
        .eq('user_id', uid)
        .limit(1)
        .single()

      if (ca?.branches?.club_id) {
        await supabase.from('users').update({ club_id: ca.branches.club_id }).eq('id', uid)
      }
    }

    // 5. Mark coach invite accepted
    await supabase
      .from('coach_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    setSubmitting(false)
    onComplete()
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-card__title">{t('invite.title')}</h1>
        <p className="auth-card__subtitle">{t('invite.subtitle')}</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="c-email">{t('invite.email')}</label>
            <input
              id="c-email"
              type="email"
              className="form-input"
              value={invite.invited_email}
              readOnly
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-name">{t('invite.display_name_label')}</label>
            <input
              id="c-name"
              type="text"
              className="form-input"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoFocus
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-pw">{t('invite.password')}</label>
            <input
              id="c-pw"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="c-pw2">{t('invite.password_confirm')}</label>
            <input
              id="c-pw2"
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
            <button
              type="submit"
              className="btn btn--gold"
              disabled={submitting}
            >
              {submitting ? '…' : t('invite.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
