import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

export default function TestResultsModal({ test, players, allTests, onClose, onSaved }) {
  const { t } = useTranslation()
  const { user } = useAuth()

  // values[playerId][metricName] = string
  const [values, setValues] = useState({})
  const [prevResults, setPrevResults] = useState({}) // playerId → { metricName → value }
  const [existing, setExisting] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const metrics = test.metrics || []

  // Find the previous test (earlier date, same branch)
  const prevTest = allTests
    .filter(t2 => t2.id !== test.id && t2.date < test.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  useEffect(() => {
    async function load() {
      // Load existing results for this test
      const { data } = await supabase
        .from('test_results')
        .select('player_id, results')
        .eq('test_id', test.id)
      if (data) {
        setExisting(data)
        const init = {}
        data.forEach(row => {
          init[row.player_id] = {}
          metrics.forEach(m => {
            init[row.player_id][m.name] = row.results?.[m.name] ?? ''
          })
        })
        // Fill blanks for players without existing results
        players.forEach(p => {
          if (!init[p.id]) {
            init[p.id] = {}
            metrics.forEach(m => { init[p.id][m.name] = '' })
          }
        })
        setValues(init)
      } else {
        const init = {}
        players.forEach(p => {
          init[p.id] = {}
          metrics.forEach(m => { init[p.id][m.name] = '' })
        })
        setValues(init)
      }

      // Load previous test results for delta
      if (prevTest) {
        const { data: prevData } = await supabase
          .from('test_results')
          .select('player_id, results')
          .eq('test_id', prevTest.id)
        if (prevData) {
          const prev = {}
          prevData.forEach(row => {
            prev[row.player_id] = row.results || {}
          })
          setPrevResults(prev)
        }
      }
    }
    load()
  }, [test.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function setValue(playerId, metricName, val) {
    setValues(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [metricName]: val },
    }))
  }

  function delta(playerId, metricName) {
    const cur = parseFloat(values[playerId]?.[metricName])
    const prev = parseFloat(prevResults[playerId]?.[metricName])
    if (isNaN(cur) || isNaN(prev)) return null
    return cur - prev
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    const rows = players
      .filter(p => {
        const playerVals = values[p.id] || {}
        return metrics.some(m => playerVals[m.name] !== '' && playerVals[m.name] != null)
      })
      .map(p => ({
        test_id: test.id,
        player_id: p.id,
        results: values[p.id] || {},
        recorded_by: user.id,
      }))

    const { error: err } = await supabase
      .from('test_results')
      .upsert(rows, { onConflict: 'test_id,player_id' })

    setSaving(false)
    if (err) { setError(t('performance.error_generic')); return }
    onSaved()
  }

  return (
    <div className="perf-modal">
      <div className="perf-modal__backdrop" onClick={onClose} />
      <div className="perf-modal__box" style={{ maxWidth: '720px' }}>
        <h2 className="perf-modal__title">{test.name} — {t('performance.results_title')}</h2>

        <div style={{ overflowX: 'auto' }}>
          <table className="results-table">
            <thead>
              <tr>
                <th>{t('performance.player_col')}</th>
                {metrics.map(m => (
                  <th key={m.name}>{m.name}{m.unit ? ` (${m.unit})` : ''}</th>
                ))}
                {prevTest && metrics.map(m => (
                  <th key={`delta-${m.name}`}>{t('performance.delta_label')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map(p => (
                <tr key={p.id}>
                  <td>{p.fname} {p.lname}</td>
                  {metrics.map(m => (
                    <td key={m.name}>
                      <input
                        type="number"
                        step="any"
                        value={values[p.id]?.[m.name] ?? ''}
                        onChange={e => setValue(p.id, m.name, e.target.value)}
                      />
                    </td>
                  ))}
                  {prevTest && metrics.map(m => {
                    const d = delta(p.id, m.name)
                    if (d === null) return <td key={`delta-${m.name}`}>{t('performance.no_prev')}</td>
                    const cls = d > 0 ? 'delta-positive' : d < 0 ? 'delta-negative' : ''
                    return (
                      <td key={`delta-${m.name}`} className={cls}>
                        {d > 0 ? '+' : ''}{d.toFixed(2)}
                      </td>
                    )
                  })}
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
