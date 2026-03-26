import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

export default function SeasonModal({ branchId, onClose, onSaved }) {
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!name.trim() || !startDate || !endDate) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('seasons').insert({
      branch_id: branchId,
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      is_current: false,
    })
    setSaving(false)
    if (err) { setError(t('admin.error_generic')); return }
    onSaved()
  }

  return (
    <div className="admin-modal">
      <div className="admin-modal__backdrop" onClick={onClose} />
      <div className="admin-modal__box">
        <h2 className="admin-modal__title">{t('admin.add_season')}</h2>

        <div className="form-group">
          <label className="form-label">{t('admin.season_name')}</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="2025/2026"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('admin.season_start')}</label>
          <input
            className="form-input"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('admin.season_end')}</label>
          <input
            className="form-input"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
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
