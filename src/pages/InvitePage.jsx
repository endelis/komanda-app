import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getAgeGroup } from '../lib/ageGroup'
import './AuthPage.css'
import './InvitePage.css'

const MAX_CHILDREN = 3

// ─── Status machine ────────────────────────────────────────────
// 'loading' → check both invite tables
// 'invalid' → token not found or expired
// 'used'    → already accepted
// 'parent_step1' → create account (parent flow)
// 'parent_step2' → claim children (parent flow)
// 'coach_step1'  → set password (coach flow, existing behaviour)

export default function InvitePage() {
  const { t }      = useTranslation()
  const { token }  = useParams()
  const navigate   = useNavigate()

  const [status,    setStatus]    = useState('loading')
  const [invite,    setInvite]    = useState(null)    // record from DB
  const [inviteType, setInviteType] = useState(null)  // 'parent' | 'coach'
  const [newUserId, setNewUserId] = useState(null)

  useEffect(() => {
    async function load() {
      // Check parent invites table first
      const { data: parentInvite } = await supabase
        .from('invites')
        .select('id, invited_email, role, club_id, accepted_at, expires_at')
        .eq('token', token)
        .single()

      if (parentInvite) {
        if (parentInvite.accepted_at)                        { setStatus('used');    return }
        if (new Date(parentInvite.expires_at) < new Date())  { setStatus('invalid'); return }
        setInvite(parentInvite)
        setInviteType('parent')
        setStatus('parent_step1')
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
        setStatus('coach_step1')
        return
      }

      setStatus('invalid')
    }

    load()
  }, [token])

  // ── Render ──────────────────────────────────────────────────
  if (status === 'loading') return <LoadingView />
  if (status === 'invalid') return <ErrorView msg={t('invite.invalid_token')} />
  if (status === 'used')    return <ErrorView msg={t('invite.already_accepted')} />

  if (status === 'parent_step1') {
    return (
      <ParentStep1
        invite={invite}
        onComplete={uid => { setNewUserId(uid); setStatus('parent_step2') }}
      />
    )
  }

  if (status === 'parent_step2') {
    return (
      <ParentStep2
        invite={invite}
        userId={newUserId}
        onComplete={() => navigate('/home')}
      />
    )
  }

  if (status === 'coach_step1') {
    return (
      <CoachSetPassword
        invite={invite}
        onComplete={role => navigate(role === 'superadmin' ? '/admin' : '/team')}
      />
    )
  }

  return null
}

// ─── Shared UI atoms ───────────────────────────────────────────
function Logo() {
  return (
    <div className="auth-card__logo">
      <span className="auth-card__mark">K</span>
      <span className="auth-card__wordmark">KOMANDA</span>
    </div>
  )
}

function StepDots({ step }) {
  return (
    <div className="invite-steps">
      <span className={`invite-steps__step${step > 1 ? ' invite-steps__step--done' : ' invite-steps__step--active'}`}>
        {step > 1 ? '✓' : '1'}
      </span>
      <span className="invite-steps__line" />
      <span className={`invite-steps__step${step === 2 ? ' invite-steps__step--active' : ''}`}>
        2
      </span>
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

// ─── Step 1 (Parent): create account ──────────────────────────
function ParentStep1({ invite, onComplete }) {
  const { t } = useTranslation()

  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [error,       setError]       = useState(null)
  const [submitting,  setSubmitting]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (password.length < 8)    { setError(t('invite.password_short'));    return }
    if (password !== confirm)   { setError(t('invite.password_mismatch')); return }

    setSubmitting(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    invite.invited_email,
      password,
      options:  { data: { role: 'parent' } },
    })

    if (signUpError || !data.user) {
      setSubmitting(false)
      setError(t('invite.error_generic'))
      return
    }

    const uid = data.user.id

    // Set club_id on the user row so the parent_see_club_roster
    // RLS policy can filter the player list in step 2.
    // The handle_new_user trigger creates the row; we update club_id.
    if (invite.club_id) {
      await supabase
        .from('users')
        .update({ club_id: invite.club_id })
        .eq('id', uid)
    }

    setSubmitting(false)
    onComplete(uid)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Logo />
        <h1 className="auth-card__title">{t('invite.step1_title')}</h1>
        <p className="auth-card__subtitle">{t('invite.step1_subtitle')}</p>
        <StepDots step={1} />

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
              {submitting ? '…' : t('invite.step1_submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Step 2 (Parent): claim children ──────────────────────────
function ParentStep2({ invite, userId, onComplete }) {
  const { t } = useTranslation()

  const [players,    setPlayers]    = useState([])
  const [loadingP,   setLoadingP]   = useState(true)
  const [selected,   setSelected]   = useState(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  useEffect(() => {
    // Query players in the parent's club.
    // The parent_see_club_roster RLS policy filters by users.club_id
    // which we set in step 1. Only public fields are requested —
    // no phone numbers or medical notes are ever fetched here.
    supabase
      .from('players')
      .select('id, fname, lname, dob')
      .is('archived_at', null)
      .order('lname')
      .then(({ data }) => {
        setPlayers(data ?? [])
        setLoadingP(false)
      })
  }, [])

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_CHILDREN) {
        next.add(id)
      }
      return next
    })
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)

    // Insert player_users for each selected player
    if (selected.size > 0) {
      const rows = [...selected].map(pid => ({
        player_id:    pid,
        user_id:      userId,
        relationship: 'parent',
      }))

      const { error: linkErr } = await supabase
        .from('player_users')
        .insert(rows)

      if (linkErr) {
        setSubmitting(false)
        setError(t('invite.error_generic'))
        return
      }
    }

    // Mark invite as accepted
    await supabase
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    onComplete()
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <Logo />
        <h1 className="auth-card__title">{t('invite.step2_title')}</h1>
        <p className="auth-card__subtitle">{t('invite.step2_subtitle')}</p>
        <StepDots step={2} />

        {loadingP ? (
          <div>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="skeleton"
                style={{ height: '52px', borderRadius: '8px', marginBottom: '8px' }}
              />
            ))}
          </div>
        ) : players.length === 0 ? (
          <p className="auth-card__subtitle">{t('invite.step2_empty')}</p>
        ) : (
          <>
            {selected.size >= MAX_CHILDREN && (
              <p className="invite-max-notice">{t('invite.max_children')}</p>
            )}
            <div className="invite-player-list">
              {players.map(p => {
                const isSel  = selected.has(p.id)
                const maxed  = !isSel && selected.size >= MAX_CHILDREN
                const ag     = getAgeGroup(p.dob)
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`invite-player-row${isSel ? ' invite-player-row--selected' : ''}`}
                    onClick={() => toggle(p.id)}
                    disabled={maxed}
                  >
                    <span className="invite-player-row__check">
                      {isSel ? '✓' : null}
                    </span>
                    <div className="invite-player-row__info">
                      <span className="invite-player-row__name">
                        {p.fname} {p.lname}
                      </span>
                      <span className="tag tag-gold">{ag}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {error && <p className="auth-card__error">{error}</p>}

        <div className="invite-step2-footer">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {t('invite.step2_skip')}
          </button>
          <button
            type="button"
            className="btn btn--gold"
            onClick={handleConfirm}
            disabled={submitting || selected.size === 0}
          >
            {submitting
              ? '…'
              : t('invite.step2_confirm', { count: selected.size })}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Coach: set password (existing flow, preserved) ───────────
function CoachSetPassword({ invite, onComplete }) {
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

    const { data, error: signUpError } = await supabase.auth.signUp({
      email:    invite.invited_email,
      password,
      options:  { data: { role: 'coach' } },
    })

    if (signUpError || !data.user?.id) {
      setSubmitting(false)
      setError(t('invite.error_generic'))
      return
    }

    const uid = data.user.id

    // Create coach_access entry
    if (invite.branch_id) {
      await supabase.from('coach_access').insert({
        user_id:    uid,
        branch_id:  invite.branch_id,
        age_group:  invite.age_group ?? null,
      })
    }

    // Mark coach invite accepted
    await supabase
      .from('coach_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    setSubmitting(false)
    onComplete('coach')
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
            <label className="form-label" htmlFor="c-pw">{t('invite.password')}</label>
            <input
              id="c-pw"
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
