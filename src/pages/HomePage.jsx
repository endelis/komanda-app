import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../hooks/useSeason'
import { useHomeData } from '../hooks/useHomeData'
import './HomePage.css'

function formatEventDate(dateStr, t) {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  if (dateStr === today) return t('home.today')
  if (dateStr === tomorrowStr) return t('home.tomorrow')
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(dateStr))
}

function typeLabel(type, t) {
  const map = {
    training:    'home.type_training',
    match:       'home.type_match',
    tournament:  'home.type_tournament',
    measurement: 'home.type_measurement',
  }
  return t(map[type] ?? type)
}

function typeDot(type) {
  const map = {
    training:    'var(--accent)',
    match:       'var(--red)',
    tournament:  'var(--blue)',
    measurement: 'var(--green)',
  }
  return map[type] ?? 'var(--text-muted)'
}

function AttendancePct({ pct }) {
  if (pct === null) return <span className="home-att__pct home-att__pct--none">—</span>
  const cls = pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red'
  return <span className={`home-att__pct home-att__pct--${cls}`}>{pct}%</span>
}

export default function HomePage() {
  const { t } = useTranslation()
  const { branchId, playerId } = useAuth()
  const { season } = useSeason(branchId)
  const { data, loading } = useHomeData(playerId, branchId, season?.id)
  const [tab, setTab] = useState('overview')

  if (loading) {
    return (
      <div className="home-page">
        <div className="skeleton" style={{height:'32px',borderRadius:'4px',marginBottom:'16px',width:'160px'}} />
        <div className="skeleton" style={{height:'96px',borderRadius:'12px',marginBottom:'12px'}} />
        <div className="skeleton" style={{height:'72px',borderRadius:'12px',marginBottom:'12px'}} />
        <div className="skeleton" style={{height:'72px',borderRadius:'12px'}} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="home-page fade-up">
        <div className="empty-state">
          <div className="empty-icon" />
          <p className="empty-title">{t('home.no_children_title')}</p>
          <p className="empty-sub">{t('home.no_children')}</p>
        </div>
      </div>
    )
  }

  const { nextTraining, nextTournament, attendanceRatio, attendanceSessions,
          attendancePresent, measurements, testResults, upcomingEvents } = data

  // Latest two measurement dates for trend
  const measDates = [...new Set(measurements.map(m => m.date))].slice(0, 2)
  const latest = measurements.filter(m => m.date === measDates[0])
  const prev   = measurements.filter(m => m.date === measDates[1])
  const latestWeight = latest[0]?.weight_kg ?? null
  const latestHeight = latest[0]?.height_cm ?? null
  const prevWeight   = prev[0]?.weight_kg ?? null
  const prevHeight   = prev[0]?.height_cm ?? null

  return (
    <div className="home-page fade-up">
      <div className="home-page__tabs">
        {['overview', 'schedule', 'progress'].map(key => (
          <button
            key={key}
            className={`home-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`home.tab_${key}`)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="home-section">

          {/* Next training card */}
          <div className="home-card home-card--hero">
            <p className="home-card__eyebrow">{t('home.next_training')}</p>
            {nextTraining ? (
              <>
                <p className="home-card__title">{nextTraining.name}</p>
                <p className="home-card__sub">
                  {formatEventDate(nextTraining.date, t)}
                  {nextTraining.time ? ` · ${nextTraining.time.slice(0, 5)}` : ''}
                </p>
                {nextTraining.location && (
                  <p className="home-card__loc">{nextTraining.location}</p>
                )}
              </>
            ) : (
              <p className="home-card__title home-card__title--empty">{t('home.no_upcoming')}</p>
            )}
          </div>

          {/* Upcoming tournament */}
          {nextTournament && (
            <div className="home-card home-card--tournament">
              <p className="home-card__eyebrow">{t('home.tournament_soon')}</p>
              <p className="home-card__title">{nextTournament.name}</p>
              <p className="home-card__sub">
                {formatEventDate(nextTournament.date, t)}
                {nextTournament.end_date && nextTournament.end_date !== nextTournament.date
                  ? ` – ${formatEventDate(nextTournament.end_date, t)}`
                  : ''}
              </p>
              {nextTournament.location && (
                <p className="home-card__loc">{nextTournament.location}</p>
              )}
            </div>
          )}

          {/* Attendance */}
          <div className="home-card">
            <p className="home-card__eyebrow">{t('home.attendance_title')}</p>
            <div className="home-att">
              <AttendancePct pct={attendanceRatio} />
              <span className="home-att__sessions">
                {t('home.sessions_label', { count: attendanceSessions })}
              </span>
            </div>
          </div>

          {/* Latest measurements */}
          <div className="home-card">
            <p className="home-card__eyebrow">{t('home.measurements_title')}</p>
            {latestWeight === null && latestHeight === null ? (
              <p className="home-card__empty">{t('home.no_measurements')}</p>
            ) : (
              <div className="home-meas-row">
                {latestWeight !== null && (
                  <div className="home-meas-item">
                    <span className="home-meas-item__label">{t('home.weight_label')}</span>
                    <span className="home-meas-item__val">{latestWeight} {t('performance.kg_unit')}</span>
                    {prevWeight !== null && (
                      <MeasDelta cur={latestWeight} prev={prevWeight} unit={t('performance.kg_unit')} />
                    )}
                  </div>
                )}
                {latestHeight !== null && (
                  <div className="home-meas-item">
                    <span className="home-meas-item__label">{t('home.height_label')}</span>
                    <span className="home-meas-item__val">{latestHeight} {t('performance.cm_unit')}</span>
                    {prevHeight !== null && (
                      <MeasDelta cur={latestHeight} prev={prevHeight} unit={t('performance.cm_unit')} />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── SCHEDULE ── */}
      {tab === 'schedule' && (
        <div className="home-section">
          {upcomingEvents.length === 0 ? (
            <p className="home-empty">{t('home.schedule_empty')}</p>
          ) : (
            <div className="home-event-list">
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="home-event-row">
                  <span
                    className="home-event-row__dot"
                    style={{ background: typeDot(ev.type) }}
                  />
                  <div className="home-event-row__info">
                    <span className="home-event-row__name">{ev.name}</span>
                    <span className="home-event-row__meta">
                      {typeLabel(ev.type, t)} · {formatEventDate(ev.date, t)}
                      {ev.time ? ` · ${ev.time.slice(0, 5)}` : ''}
                    </span>
                    {ev.location && (
                      <span className="home-event-row__loc">{ev.location}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS ── */}
      {tab === 'progress' && (
        <div className="home-section">

          {/* Fitness tests */}
          <p className="home-section__label">{t('home.tests_title')}</p>
          {testResults.length === 0 ? (
            <p className="home-empty">{t('home.no_tests')}</p>
          ) : (
            <div className="home-tests">
              {testResults.slice(0, 3).map((tr, idx) => {
                const prevTr = testResults[idx + 1]
                return (
                  <div key={tr.test_id} className="home-test-card">
                    <div className="home-test-card__header">
                      <span className="home-test-card__name">{tr.tests.name}</span>
                      <span className="home-test-card__date">
                        {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(tr.tests.date))}
                      </span>
                    </div>
                    <div className="home-test-card__metrics">
                      {(tr.tests.metrics || []).map(m => {
                        const cur = parseFloat(tr.results?.[m.name])
                        const prev = prevTr ? parseFloat(prevTr.results?.[m.name]) : NaN
                        const d = !isNaN(cur) && !isNaN(prev) ? cur - prev : null
                        return (
                          <div key={m.name} className="home-metric-row">
                            <span className="home-metric-row__name">{m.name}</span>
                            <span className="home-metric-row__val">
                              {!isNaN(cur) ? `${cur}${m.unit ? ' ' + m.unit : ''}` : '—'}
                            </span>
                            {d !== null && (
                              <span className={`home-metric-row__delta ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}`}>
                                {d > 0 ? '+' : ''}{d.toFixed(2)}
                              </span>
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

          {/* Measurements history */}
          <p className="home-section__label" style={{ marginTop: '1.5rem' }}>{t('home.measurements_title')}</p>
          {measurements.length === 0 ? (
            <p className="home-empty">{t('home.no_measurements')}</p>
          ) : (
            <div className="home-meas-history">
              {measDates.map(d => {
                const row = measurements.find(m => m.date === d)
                return (
                  <div key={d} className="home-meas-hist-row">
                    <span className="home-meas-hist-row__date">
                      {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))}
                    </span>
                    <div className="home-meas-hist-row__vals">
                      {row?.weight_kg != null && (
                        <span>{row.weight_kg} {t('performance.kg_unit')}</span>
                      )}
                      {row?.height_cm != null && (
                        <span>{row.height_cm} {t('performance.cm_unit')}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function MeasDelta({ cur, prev, unit }) {
  const d = parseFloat(cur) - parseFloat(prev)
  if (isNaN(d)) return null
  const cls = d > 0 ? 'pos' : d < 0 ? 'neg' : ''
  return (
    <span className={`home-meas-item__delta ${cls}`}>
      {d > 0 ? '+' : ''}{d.toFixed(1)} {unit}
    </span>
  )
}
