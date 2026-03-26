import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import '../../components/auth/LoginModal.css'

export default function AddPlayerModal({ branchId, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [form, setForm] = useState({
    fname: '', lname: '', dob: '',
    guardian_name: '', guardian_phone: '',
    player_phone: '', medical_notes: '', notes: '',
  })
  const [gdpr, setGdpr] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    // GDPR gate — mandatory, non-negotiable
    if (!gdpr) {
      setError(t('player.error_gdpr'))
      return
    }

    setSubmitting(true)

    const { error: insertError } = await supabase.from('players').insert({
      fname: form.fname.trim(),
      lname: form.lname.trim(),
      dob: form.dob,
      branch_id: branchId,
      guardian_name:   form.guardian_name.trim()   || null,
      guardian_phone:  form.guardian_phone.trim()  || null,
      player_phone:    form.player_phone.trim()     || null,
      medical_notes:   form.medical_notes.trim()    || null,
      notes:           form.notes.trim()            || null,
      gdpr_consent_confirmed: true,
      gdpr_consent_date: new Date().toISOString(),
      created_by: user.id,
    })

    setSubmitting(false)

    if (insertError) {
      setError(t('player.error_generic'))
      return
    }

    onSaved()
    onClose()
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal" style={{ maxWidth: 520 }} role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose}>✕</button>
        <h2 className="modal__title">{t('player.add_title')}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="fname">{t('player.fname')}</label>
              <input id="fname" type="text" className="form-input" value={form.fname}
                onChange={e => set('fname', e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="lname">{t('player.lname')}</label>
              <input id="lname" type="text" className="form-input" value={form.lname}
                onChange={e => set('lname', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dob">{t('player.dob')}</label>
            <input id="dob" type="date" className="form-input" value={form.dob}
              onChange={e => set('dob', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="guardian_name">{t('player.guardian_name')}</label>
            <input id="guardian_name" type="text" className="form-input" value={form.guardian_name}
              onChange={e => set('guardian_name', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="guardian_phone">{t('player.guardian_phone')}</label>
              <input id="guardian_phone" type="tel" className="form-input" value={form.guardian_phone}
                onChange={e => set('guardian_phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="player_phone">{t('player.player_phone')}</label>
              <input id="player_phone" type="tel" className="form-input" value={form.player_phone}
                onChange={e => set('player_phone', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="medical_notes">{t('player.medical_notes')}</label>
            <textarea id="medical_notes" className="form-input" value={form.medical_notes}
              onChange={e => set('medical_notes', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notes">{t('player.notes')}</label>
            <textarea id="notes" className="form-input" value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          {/* GDPR gate — mandatory */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', margin: '0.5rem 0 1.25rem' }}>
            <input
              id="gdpr"
              type="checkbox"
              checked={gdpr}
              onChange={e => setGdpr(e.target.checked)}
              style={{ width: 20, height: 20, marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
            />
            <label htmlFor="gdpr" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', cursor: 'pointer', maxWidth: 'none' }}>
              {t('player.gdpr_label')}
            </label>
          </div>

          {error && <p className="modal__error">{error}</p>}

          <div className="modal__footer">
            <button type="button" className="modal__forgot" onClick={onClose}>
              {t('player.cancel')}
            </button>
            <button type="submit" className="btn btn--gold" disabled={submitting}>
              {submitting ? '…' : t('player.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
