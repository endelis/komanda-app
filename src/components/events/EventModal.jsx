import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import '../../components/auth/LoginModal.css'
import './EventModal.css'

const EVENT_TYPES = ['training', 'match', 'tournament', 'measurement']

export default function EventModal({ event, branchId, seasonId, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isEdit = !!event

  const [form, setForm] = useState({
    type:             event?.type             ?? 'training',
    name:             event?.name             ?? '',
    date:             event?.date             ?? '',
    end_date:         event?.end_date         ?? '',
    time:             event?.time             ?? '',
    duration_minutes: event?.duration_minutes ?? '',
    location:         event?.location         ?? '',
  })
  const [showCancel, setShowCancel] = useState(false)
  const [cancelNote, setCancelNote] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const payload = {
      type:     form.type,
      name:     form.name.trim(),
      date:     form.date,
      end_date: form.type === 'tournament' && form.end_date ? form.end_date : null,
      time:     form.time || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      location: form.location.trim() || null,
    }

    let err
    if (isEdit) {
      const { error: e } = await supabase
        .from('events').update(payload).eq('id', event.id)
      err = e
    } else {
      const { error: e } = await supabase
        .from('events').insert({ ...payload, branch_id: branchId, season_id: seasonId, created_by: user.id })
      err = e
    }

    setSubmitting(false)
    if (err) { setError(t('calendar.error_generic')); return }
    onSaved()
    onClose()
  }

  async function handleCancelEvent() {
    setError(null)
    setSubmitting(true)
    const { error: err } = await supabase
      .from('events')
      .update({ cancelled: true, cancellation_note: cancelNote.trim() || null })
      .eq('id', event.id)
    setSubmitting(false)
    if (err) { setError(t('calendar.error_generic')); return }
    onSaved()
    onClose()
  }

  function handleOverlay(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal" style={{ maxWidth: 480 }} role="dialog" aria-modal="true">
        <button className="modal__close" onClick={onClose}>✕</button>
        <h2 className="modal__title">
          {isEdit ? t('calendar.edit_title') : t('calendar.add_title')}
        </h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* Type selector */}
          <div className="form-group">
            <label className="form-label">{t('calendar.type')}</label>
            <div className="event-type-selector">
              {EVENT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`event-type-btn event-type-btn--${type}${form.type === type ? ' active' : ''}`}
                  onClick={() => set('type', type)}
                >
                  {t(`calendar.type_${type}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ev-name">{t('calendar.name')}</label>
            <input id="ev-name" type="text" className="form-input" value={form.name}
              onChange={e => set('name', e.target.value)} required autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ev-date">{t('calendar.date')}</label>
              <input id="ev-date" type="date" className="form-input" value={form.date}
                onChange={e => set('date', e.target.value)} required />
            </div>
            {form.type === 'tournament' && (
              <div className="form-group">
                <label className="form-label" htmlFor="ev-end">{t('calendar.end_date')}</label>
                <input id="ev-end" type="date" className="form-input" value={form.end_date}
                  onChange={e => set('end_date', e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ev-time">{t('calendar.time')}</label>
              <input id="ev-time" type="time" className="form-input" value={form.time}
                onChange={e => set('time', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ev-dur">{t('calendar.duration')}</label>
              <input id="ev-dur" type="number" className="form-input" value={form.duration_minutes}
                onChange={e => set('duration_minutes', e.target.value)} min="1" max="480" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ev-loc">{t('calendar.location')}</label>
            <input id="ev-loc" type="text" className="form-input" value={form.location}
              onChange={e => set('location', e.target.value)} />
          </div>

          {error && <p className="modal__error">{error}</p>}

          <div className="modal__footer">
            <button type="button" className="modal__forgot" onClick={onClose}>
              {t('calendar.cancel_btn')}
            </button>
            <button type="submit" className="btn btn--gold" disabled={submitting}>
              {submitting ? '…' : t('calendar.save')}
            </button>
          </div>
        </form>

        {/* Cancel event section — edit mode only, not already cancelled */}
        {isEdit && !event.cancelled && (
          <div className="event-cancel-section">
            {!showCancel ? (
              <button className="event-cancel-trigger" onClick={() => setShowCancel(true)}>
                {t('calendar.cancel_event')}
              </button>
            ) : (
              <div className="event-cancel-form">
                <textarea
                  className="form-input"
                  placeholder={t('calendar.cancel_note')}
                  value={cancelNote}
                  onChange={e => setCancelNote(e.target.value)}
                  rows={2}
                />
                <button
                  className="btn btn--danger btn--sm"
                  onClick={handleCancelEvent}
                  disabled={submitting}
                >
                  {t('calendar.cancel_confirm')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
