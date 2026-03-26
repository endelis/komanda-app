import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function BranchModal({ onClose, onSaved }) {
  const { t } = useTranslation()
  const { clubId } = useAuth()

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('branches').insert({
      club_id: clubId,
      name: name.trim(),
    })
    setSaving(false)
    if (err) { setError(t('admin.error_generic')); return }
    onSaved()
  }

  return (
    <div className="admin-modal">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__box">
        <h2 className="admin-modal__title">{t('admin.add_branch')}</h2>

        <div className="form-group">
          <label className="form-label">{t('admin.branch_name')}</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {error && <p className="admin-modal__error">{error}</p>}

        <div className="admin-modal__footer">
          <button className="btn" onClick={onClose}>{t('admin.cancel')}</button>
          <button className="btn btn--gold" onClick={handleSave} disabled={saving}>
            {t('admin.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
