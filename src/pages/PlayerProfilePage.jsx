import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../hooks/useSeason'
import { useAttendance } from '../hooks/useAttendance'
import { getAgeGroup } from '../lib/ageGroup'
import InviteParentModal from '../components/players/InviteParentModal'
import './PlayerProfilePage.css'

async function fetchPlayerTests(playerId) {
  const { data } = await supabase
    .from('test_results')
    .select('test_id, results, tests(id, name, date, metrics)')
    .eq('player_id', playerId)
    .order('test_id', { ascending: false })
    .limit(10)
  return (data ?? []).filter(r => r.tests).sort((a, b) => b.tests.date.localeCompare(a.tests.date))
}

async function fetchPlayerMeasurements(playerId, seasonId) {
  const { data } = await supabase
    .from('measurements')
    .select('id, date, weight_kg, height_cm')
    .eq('player_id', playerId)
    .eq('season_id', seasonId)
    .order('date', { ascending: false })
    .limit(6)
  return data ?? []
}

function attClass(pct) {
  if (pct === null) return 'att-none'
  if (pct >= 80) return 'att-high'
  if (pct >= 60) return 'att-mid'
  return 'att-low'
}

export default function PlayerProfilePage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { role, user, branchId } = useAuth()

  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState([])
  const [measurements, setMeasurements] = useState([])
  const [showInviteParent, setShowInviteParent] = useState(false)

  const { season } = useSeason(branchId)
  const { getRatio } = useAttendance(branchId, season?.id)

  const isCoach = role === 'coach' || role === 'superadmin'

  useEffect(() => {
    async function fetch() {
      const columns = isCoach
        ? 'id, fname, lname, dob, branch_id, assigned_coach_id, guardian_name, guardian_phone, player_phone, medical_notes, notes, archived_at, created_at'
        : 'id, fname, lname, dob, branch_id, guardian_name, notes, archived_at, created_at'

      const { data, error } = await supabase
        .from('players')
        .select(columns)
        .eq('id', id)
        .single()

      if (error || !data) {
        navigate('/team')
        return
      }
      setPlayer(data)
      setLoading(false)
    }
    fetch()
  }, [id, isCoach, navigate])

  // Load tests + measurements once player + season are known
  useEffect(() => {
    if (!player?.id || !season?.id) return
    fetchPlayerTests(player.id).then(setTestResults)
    fetchPlayerMeasurements(player.id, season.id).then(setMeasurements)
  }, [player?.id, season?.id])

  if (loading) {
    return (
      <div className="profile-page">
        <div className="skeleton" style={{height:'36px',borderRadius:'6px',marginBottom:'16px',width:'80px'}} />
        <div className="skeleton" style={{height:'88px',borderRadius:'10px',marginBottom:'12px'}} />
        <div className="skeleton" style={{height:'120px',borderRadius:'10px',marginBottom:'12px'}} />
        <div className="skeleton" style={{height:'160px',borderRadius:'10px'}} />
      </div>
    )
  }

  const ag = getAgeGroup(player.dob)
  const ratio = getRatio(player.id)
  const initials = `${player.fname[0]}${player.lname[0]}`.toUpperCase()

  return (
    <div className="profile-page fade-up">
      <button className="profile-back btn btn--ghost btn--sm" onClick={() => navigate('/team')}>
        ← {t('nav.team')}
      </button>

      {/* Header */}
      <div className="profile-header card">
        <div className={`avatar avatar--lg profile-header__avatar`}>{initials}</div>
        <div className="profile-header__info">
          <h1 className="profile-header__name">{player.fname} {player.lname}</h1>
          <div className="profile-header__meta">
            <span className="tag tag-gold">{ag}</span>
            <span className={`profile-header__att ${attClass(ratio)}`}>
              {ratio !== null ? `${ratio}% att.` : t('team.no_data')}
            </span>
            {player.archived_at && (
              <span className="tag tag-red">{t('player.archived')}</span>
            )}
          </div>
          {isCoach && (
            <button
              className="btn btn--ghost btn--sm"
              style={{ marginTop: '0.75rem' }}
              onClick={() => setShowInviteParent(true)}
            >
              {t('player.invite_parent')}
            </button>
          )}
        </div>
      </div>

      {/* Contact */}
      <section className="profile-section card">
        <h2 className="profile-section__title">{t('player.contact')}</h2>
        <div className="profile-contact">
          {player.guardian_name && (
            <div className="contact-row">
              <span className="contact-row__label">{t('player.guardian_name')}</span>
              <span className="contact-row__value">{player.guardian_name}</span>
            </div>
          )}
          {isCoach && player.guardian_phone && (
            <div className="contact-row">
              <span className="contact-row__label">{t('player.guardian_phone')}</span>
              <a href={`tel:${player.guardian_phone}`} className="contact-row__phone">
                {player.guardian_phone}
              </a>
            </div>
          )}
          {isCoach && player.player_phone && (
            <div className="contact-row">
              <span className="contact-row__label">{t('player.player_phone')}</span>
              <a href={`tel:${player.player_phone}`} className="contact-row__phone">
                {player.player_phone}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Medical notes — coach only */}
      {isCoach && (
        <section className="profile-section card">
          <div className="profile-section__header">
            <h2 className="profile-section__title">{t('player.medical')}</h2>
            <span className="tag tag-amber">{t('player.medical_hidden')}</span>
          </div>
          <p className="profile-medical">
            {player.medical_notes || <span className="profile-empty">{t('player.no_medical')}</span>}
          </p>
        </section>
      )}

      {/* Fitness tests */}
      <section className="profile-section card">
        <h2 className="profile-section__title">{t('player.tests_title')}</h2>
        {testResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" />
            <p className="empty-title">{t('player.tests_empty')}</p>
          </div>
        ) : (
          <div className="profile-tests">
            {testResults.map((tr, idx) => {
              const prevTr = testResults[idx + 1]
              return (
                <div key={tr.test_id} className="profile-test">
                  <div className="profile-test__header">
                    <span className="profile-test__name">{tr.tests.name}</span>
                    <span className="profile-test__date">
                      {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(tr.tests.date))}
                    </span>
                  </div>
                  {(tr.tests.metrics ?? []).map(m => {
                    const cur = parseFloat(tr.results?.[m.name])
                    const prev = prevTr ? parseFloat(prevTr.results?.[m.name]) : NaN
                    const d = !isNaN(cur) && !isNaN(prev) ? cur - prev : null
                    return (
                      <div key={m.name} className="profile-metric">
                        <span className="profile-metric__name">{m.name}</span>
                        <span className="profile-metric__val">
                          {!isNaN(cur) ? `${cur}${m.unit ? ' ' + m.unit : ''}` : '—'}
                        </span>
                        {d !== null && (
                          <span className={`profile-metric__delta ${d > 0 ? 'pos' : d < 0 ? 'neg' : ''}`}>
                            {d > 0 ? '+' : ''}{d.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Measurements */}
      <section className="profile-section card">
        <h2 className="profile-section__title">{t('player.measurements_title')}</h2>
        {measurements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" />
            <p className="empty-title">{t('player.measurements_empty')}</p>
          </div>
        ) : (
          <div className="profile-measurements">
            {measurements.map(m => (
              <div key={m.id} className="profile-meas-row">
                <span className="profile-meas-row__date">
                  {new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(m.date))}
                </span>
                <div className="profile-meas-row__vals">
                  {m.weight_kg != null && (
                    <span>{m.weight_kg} {t('performance.kg_unit')}</span>
                  )}
                  {m.height_cm != null && (
                    <span>{m.height_cm} {t('performance.cm_unit')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showInviteParent && isCoach && (
        <InviteParentModal onClose={() => setShowInviteParent(false)} />
      )}
    </div>
  )
}
