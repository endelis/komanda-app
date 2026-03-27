import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import './InviteParentModal.css'

// playerId is required — parent invites must target a specific player.
// The invite acceptance flow auto-links the parent to that player.
export default function InviteParentModal({ playerId, onClose }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [email,      setEmail]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)
  const [inviteLink, setInviteLink] = useState(null)
  const [copied,     setCopied]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) return

    setSubmitting(true)

    const token     = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('invites').insert({
      player_id:     playerId,
      invited_email: trimmedEmail,
      role:          'parent',
      invited_by:    user.id,
      token,
      expires_at:    expiresAt,
    })

    setSubmitting(false)

    if (insertError) {
      console.error('Invite error full:', insertError)
      console.error('Invite error message:', insertError?.message)
      console.error('Invite error code:', insertError?.code)
      console.error('Invite error details:', insertError?.details)
      setError(insertError?.message || t('invite_parent.error_generic'))
      return
    }

    setInviteLink(`${window.location.origin}/invite/${token}`)
  }

  function handleCopy() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="ipm-wrap">
      <div className="ipm-wrap__backdrop" onClick={onClose} />
      <div className="ipm">
        <div className="ipm__header">
          <h2 className="ipm__title">{t('invite_parent.title')}</h2>
          <button className="ipm__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {!inviteLink ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="ipm-email">
                {t('invite_parent.email_label')}
              </label>
              <input
                id="ipm-email"
                type="email"
                className="form-input"
                placeholder={t('invite_parent.email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="off"
              />
            </div>
            {error && <p className="ipm__error">{error}</p>}
            <div className="ipm__footer">
              <button type="button" className="btn btn--ghost" onClick={onClose}>
                {t('invite_parent.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn--gold"
                disabled={submitting || !email.trim()}
              >
                {submitting ? '…' : t('invite_parent.submit')}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="ipm__hint">{t('invite_parent.hint')}</p>
            <div className="ipm__link-row">
              <input
                type="text"
                className="form-input ipm__link-input"
                value={inviteLink}
                readOnly
                onClick={e => e.target.select()}
              />
              <button className="btn btn--ghost" onClick={handleCopy}>
                {copied ? t('invite_parent.copied') : t('invite_parent.copy')}
              </button>
            </div>
            <p className="ipm__expires">{t('invite_parent.expires')}</p>
            <div className="ipm__footer">
              <button className="btn btn--gold" style={{ flex: 1 }} onClick={onClose}>
                {t('invite_parent.done')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
