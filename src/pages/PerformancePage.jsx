import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../hooks/useSeason'
import { useTests } from '../hooks/useTests'
import { useMeasurements } from '../hooks/useMeasurements'
import { usePlayers } from '../hooks/usePlayers'
import CreateTestModal from '../components/performance/CreateTestModal'
import TestResultsModal from '../components/performance/TestResultsModal'
import MeasurementsModal from '../components/performance/MeasurementsModal'
import './PerformancePage.css'

export default function PerformancePage() {
  const { t } = useTranslation()
  const { branchId } = useAuth()
  const { season } = useSeason(branchId)
  const { tests, loading: testsLoading, refetch: refetchTests } = useTests(branchId, season?.id)
  const { measurements, loading: measLoading, refetch: refetchMeas } = useMeasurements(branchId, season?.id)
  const { players } = usePlayers(branchId)

  const [tab, setTab] = useState('tests')
  const [showCreateTest, setShowCreateTest] = useState(false)
  const [showResults, setShowResults] = useState(null) // test object
  const [showMeasurements, setShowMeasurements] = useState(false)

  // Group measurements by date
  const measByDate = measurements.reduce((acc, m) => {
    const d = m.date
    if (!acc[d]) acc[d] = []
    acc[d].push(m)
    return acc
  }, {})

  const measDates = Object.keys(measByDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="perf-page">
      <div className="perf-page__header">
        <h1 className="perf-page__title">{t('performance.title')}</h1>
        <div className="perf-page__actions">
          {tab === 'tests' ? (
            <button className="btn btn--gold btn--sm" onClick={() => setShowCreateTest(true)}>
              {t('performance.create_test')}
            </button>
          ) : (
            <button className="btn btn--gold btn--sm" onClick={() => setShowMeasurements(true)}>
              {t('performance.record_measurements')}
            </button>
          )}
        </div>
      </div>

      <div className="perf-page__tabs">
        <button
          className={`perf-tab${tab === 'tests' ? ' active' : ''}`}
          onClick={() => setTab('tests')}
        >
          {t('performance.tab_tests')}
        </button>
        <button
          className={`perf-tab${tab === 'measurements' ? ' active' : ''}`}
          onClick={() => setTab('measurements')}
        >
          {t('performance.tab_measurements')}
        </button>
      </div>

      {tab === 'tests' && (
        <div className="perf-page__content">
          {testsLoading ? (
            <p className="perf-page__empty">{t('app.loading')}</p>
          ) : tests.length === 0 ? (
            <p className="perf-page__empty">{t('performance.tests_empty')}</p>
          ) : (
            <div className="perf-list">
              {tests.map(test => (
                <div key={test.id} className="perf-card">
                  <div className="perf-card__info">
                    <span className="perf-card__name">{test.name}</span>
                    <span className="perf-card__date">
                      {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(test.date))}
                    </span>
                    <span className="perf-card__metrics">
                      {(test.metrics || []).map(m => m.name).join(' · ')}
                    </span>
                  </div>
                  <button
                    className="btn btn--sm"
                    onClick={() => setShowResults(test)}
                  >
                    {t('performance.enter_results')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'measurements' && (
        <div className="perf-page__content">
          {measLoading ? (
            <p className="perf-page__empty">{t('app.loading')}</p>
          ) : measDates.length === 0 ? (
            <p className="perf-page__empty">{t('performance.measurements_empty')}</p>
          ) : (
            <div className="perf-list">
              {measDates.map(date => {
                const rows = measByDate[date]
                return (
                  <div key={date} className="meas-group">
                    <div className="meas-group__date">
                      {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date))}
                    </div>
                    <div className="meas-group__rows">
                      {rows.map(m => {
                        const player = players.find(p => p.id === m.player_id)
                        return (
                          <div key={m.id} className="meas-row">
                            <span className="meas-row__name">
                              {player ? `${player.fname} ${player.lname}` : m.player_id}
                            </span>
                            {m.weight_kg != null && (
                              <span className="meas-row__val">{m.weight_kg} {t('performance.kg_unit')}</span>
                            )}
                            {m.height_cm != null && (
                              <span className="meas-row__val">{m.height_cm} {t('performance.cm_unit')}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showCreateTest && (
        <CreateTestModal
          branchId={branchId}
          seasonId={season?.id}
          onClose={() => setShowCreateTest(false)}
          onSaved={() => { setShowCreateTest(false); refetchTests() }}
        />
      )}

      {showResults && (
        <TestResultsModal
          test={showResults}
          players={players}
          allTests={tests}
          onClose={() => setShowResults(null)}
          onSaved={() => { setShowResults(null); refetchTests() }}
        />
      )}

      {showMeasurements && (
        <MeasurementsModal
          branchId={branchId}
          seasonId={season?.id}
          players={players}
          onClose={() => setShowMeasurements(false)}
          onSaved={() => { setShowMeasurements(false); refetchMeas() }}
        />
      )}
    </div>
  )
}
