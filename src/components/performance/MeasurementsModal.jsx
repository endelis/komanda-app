import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function MeasurementsModal({ branchId, seasonId, players, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  // rows[playerId] = { weight: '', height: '' }
  const [rows, setRows] = useState(() => {
    const init = {}
    players.forEach(p => { init[p.id] = { weight: '', height: '' } })
    return init
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(playerId, field, val) {
    setRows(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: val } }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const inserts = players
      .filter(p => rows[p.id]?.weight !== '' || rows[p.id]?.height !== '')
      .map(p => ({
        player_id: p.id,
        season_id: seasonId,
        date,
        weight_kg: rows[p.id]?.weight !== '' ? parseFloat(rows[p.id].weight) : null,
        height_cm: rows[p.id]?.height !== '' ? parseFloat(rows[p.id].height) : null,
        recorded_by: user.id,
      }))

    if (inserts.length === 0) { setSaving(false); onClose(); return }

    const { error: err } = await supabase.from('measurements').insert(inserts)
    setSaving(false)
    if (err) { setError(t('performance.error_generic')); return }
    onSaved()
  }

  return (
    <div className="perf-modal">
      <div className="perf-modal__backdrop" onClick={onClose} />
      <div className="perf-modal__box" style={{ maxWidth: '560px' }}>
        <h2 className="perf-modal__title">{t('performance.record_measurements')}</h2>

        <div className="form-group">
          <label className="form-label">{t('performance.meas_date')}</label>
          <input
            className="form-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="meas-table">
            <thead>
              <tr>
                <th>{t('performance.player_col')}</th>
                <th>{t('performance.weight')}</th>
                <th>{t('performance.height')}</th>
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td>{p.fname} {p.lname}</td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={rows[p.id]?.weight ?? ''}
                      onChange={e => update(p.id, 'weight', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={rows[p.id]?.height ?? ''}
                      onChange={e => update(p.id, 'height', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
