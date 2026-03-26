import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18']

export default function InviteCoachModal({ branches, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [email, setEmail] = useState('')
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '')
  const [ageGroup, setAgeGroup] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  async function handleSend() {
    if (!email.trim() || !branchId) return
    setSaving(true)
    setError('')

    const token = crypto.randomUUID()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // 7-day expiry

    const { error: err } = await supabase.from('coach_invites').insert({
      invited_email: email.trim().toLowerCase(),
      branch_id: branchId,
      age_group: ageGroup || null,
      invited_by: user.id,
      token,
      expires_at: expires.toISOString(),
    })

    setSaving(false)
    if (err) { setError(t('admin.error_generic')); return }

    const link = `${window.location.origin}/invite/${token}`
    setInviteLink(link)
    onSaved()
  }

  function handleCopy() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="admin-modal">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__box">
        <h2 className="admin-modal__title">{t('admin.invite_coach')}</h2>

        {!inviteLink ? (
          <>
            <div className="form-group">
              <label className="form-label">{t('admin.invite_email')}</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.invite_branch')}</label>
              <select
                className="form-input"
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('admin.invite_age_group')}</label>
              <select
                className="form-input"
                value={ageGroup}
                onChange={e => setAgeGroup(e.target.value)}
              >
                <option value="">{t('admin.invite_all_groups')}</option>
                {AGE_GROUPS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {error && <p className="admin-modal__error">{error}</p>}

            <div className="admin-modal__footer">
              <button className="btn" onClick={onClose}>{t('admin.cancel')}</button>
              <button className="btn btn--gold" onClick={handleSend} disabled={saving}>
                {t('admin.invite_send')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="admin-modal__hint">{t('admin.invite_sent')}</p>
            <div className="invite-link-row">
              <input className="form-input invite-link-row__input" readOnly value={inviteLink} />
              <button className="btn btn--gold btn--sm" onClick={handleCopy}>
                {copied ? t('admin.copied') : t('admin.copy_link')}
              </button>
            </div>
            <div className="admin-modal__footer">
              <button className="btn btn--gold" onClick={onClose}>{t('admin.done')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
