import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function CreateTestModal({ branchId, seasonId, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [metrics, setMetrics] = useState([{ name: '', unit: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addMetric() {
    setMetrics(prev => [...prev, { name: '', unit: '' }])
  }

  function removeMetric(i) {
    setMetrics(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateMetric(i, field, value) {
    setMetrics(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  async function handleSave() {
    if (!name.trim()) return
    const validMetrics = metrics.filter(m => m.name.trim())
    if (validMetrics.length === 0) return
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('tests').insert({
      branch_id: branchId,
      season_id: seasonId,
      name: name.trim(),
      date,
      metrics: validMetrics,
      created_by: user.id,
    })
    setSaving(false)
    if (err) { setError(t('performance.error_generic')); return }
    onSaved()
  }

  return (
    <div className="perf-modal">
      <div className="perf-modal__backdrop" onClick={onClose} />
      <div className="perf-modal__box">
        <h2 className="perf-modal__title">{t('performance.create_test')}</h2>

        <div className="form-group">
          <label className="form-label">{t('performance.test_name')}</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('performance.test_date')}</label>
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t('performance.metrics')}</label>
          <div className="metrics-list">
            {metrics.map((m, i) => (
              <div key={i} className="metric-row">
                <input
                  className="form-input"
                  placeholder={t('performance.metric_name')}
                  value={m.name}
                  onChange={e => updateMetric(i, 'name', e.target.value)}
                />
                <input
                  className="form-input"
                  placeholder={t('performance.metric_unit')}
                  value={m.unit}
                  onChange={e => updateMetric(i, 'unit', e.target.value)}
                  style={{ maxWidth: '96px' }}
                />
                {metrics.length > 1 && (
                  <button className="metric-row__remove" onClick={() => removeMetric(i)}>×</button>
                )}
              </div>
            ))}
          </div>
          <button className="add-metric-btn" onClick={addMetric}>
            {t('performance.add_metric')}
          </button>
        </div>

        {error && <p className="perf-modal__error">{error}</p>}

        <div className="perf-modal__footer">
          <button className="btn" onClick={onClose}>{t('performance.cancel')}</button>
          <button className="btn btn--gold" onClick={handleSave} disabled={saving}>
            {t('performance.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
