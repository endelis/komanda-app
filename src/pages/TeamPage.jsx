import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayers } from '../hooks/usePlayers'
import { useSeason } from '../hooks/useSeason'
import { useAttendance } from '../hooks/useAttendance'
import { getAgeGroup } from '../lib/ageGroup'
import AddPlayerModal from '../components/players/AddPlayerModal'
import './TeamPage.css'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18']

function attClass(pct) {
  if (pct === null) return 'att-none'
  if (pct >= 80) return 'att-high'
  if (pct >= 60) return 'att-mid'
  return 'att-low'
}

export default function TeamPage() {
  const { t } = useTranslation()
  const { branchId, role } = useAuth()
  const navigate = useNavigate()

  const { players, loading: playersLoading, refetch } = usePlayers(branchId)
  const { season } = useSeason(branchId)
  const { getRatio, loading: attLoading } = useAttendance(branchId, season?.id)

  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState(null) // null = all
  const [showAdd, setShowAdd] = useState(false)

  const canWrite = role === 'coach' || role === 'superadmin'

  const filtered = players.filter(p => {
    const name = `${p.fname} ${p.lname}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase())
    const matchAge = !ageFilter || getAgeGroup(p.dob) === ageFilter
    return matchSearch && matchAge
  })

  const loading = playersLoading || attLoading

  return (
    <div className="team-page fade-up">
      <div className="team-page__header">
        <h1 className="team-page__title">{t('team.title')}</h1>
        {canWrite && (
          <button className="btn btn--gold btn--sm" onClick={() => setShowAdd(true)}>
            + {t('team.add_player')}
          </button>
        )}
      </div>

      <div className="team-page__toolbar">
        <input
          type="search"
          className="form-input team-page__search"
          placeholder={t('team.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="team-page__filters">
          <button
            className={`filter-chip${!ageFilter ? ' active' : ''}`}
            onClick={() => setAgeFilter(null)}
          >
            {t('team.filter_all')}
          </button>
          {AGE_GROUPS.map(ag => (
            <button
              key={ag}
              className={`filter-chip${ageFilter === ag ? ' active' : ''}`}
              onClick={() => setAgeFilter(ageFilter === ag ? null : ag)}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{height:'60px',borderRadius:'10px',marginBottom:'8px'}} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <p className="empty-title">
            {search || ageFilter ? t('team.empty_search') : t('team.empty')}
          </p>
        </div>
      ) : (
        <ul className="player-list">
          {filtered.map(p => {
            const ag = getAgeGroup(p.dob)
            const ratio = getRatio(p.id)
            const initials = `${p.fname[0]}${p.lname[0]}`.toUpperCase()

            return (
              <li key={p.id} className="player-row">
                <div className="player-row__avatar avatar">{initials}</div>
                <div className="player-row__info">
                  <span className="player-row__name">{p.fname} {p.lname}</span>
                  <span className={`tag tag-gold player-row__ag`}>{ag}</span>
                </div>
                <span className={`player-row__att ${attClass(ratio)}`}>
                  {ratio !== null ? `${ratio}${t('team.att_label')}` : t('team.no_data')}
                </span>
                <button
                  className="btn btn--ghost btn--sm"
                  onClick={() => navigate(`/team/${p.id}`)}
                >
                  {t('team.view_profile')}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showAdd && canWrite && (
        <AddPlayerModal
          branchId={branchId}
          onClose={() => setShowAdd(false)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
