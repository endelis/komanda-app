import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { usePlayers } from '../hooks/usePlayers'
import { useSeason } from '../hooks/useSeason'
import { useEvents } from '../hooks/useEvents'
import { getAgeGroup } from '../lib/ageGroup'
import './AttendancePage.css'

const STATUS_OPTS = [
  { value: 'present',      short: 'P', color: 'green' },
  { value: 'absent',       short: 'A', color: 'red'   },
  { value: 'injured_sick', short: 'I', color: 'amber' },
  { value: 'excused',      short: 'E', color: 'blue'  },
]

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// ─── Per-session expandable row ───────────────────────────────────────────────
function SessionRow({ event, players, user, t, locale, canWrite }) {
  const [open, setOpen]       = useState(false)
  const [records, setRecords] = useState({}) // playerId → { status, note }
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState({}) // playerId → bool

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('attendance')
      .select('player_id, status, note')
      .eq('event_id', event.id)
      .then(({ data }) => {
        const map = {}
        ;(data ?? []).forEach(r => { map[r.player_id] = { status: r.status, note: r.note ?? '' } })
        setRecords(map)
        setLoading(false)
      })
  }, [open, event.id])

  async function markStatus(playerId, status) {
    if (!canWrite) return
    // Optimistic update
    setRecords(r => ({ ...r, [playerId]: { ...r[playerId], status } }))
    setSaving(s => ({ ...s, [playerId]: true }))
    await supabase.from('attendance').upsert(
      { event_id: event.id, player_id: playerId, status, marked_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    )
    setSaving(s => ({ ...s, [playerId]: false }))
  }

  async function saveNote(playerId, note) {
    if (!canWrite) return
    setRecords(r => ({ ...r, [playerId]: { ...r[playerId], note } }))
    const status = records[playerId]?.status ?? 'absent'
    await supabase.from('attendance').upsert(
      { event_id: event.id, player_id: playerId, status, note, marked_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,player_id' }
    )
  }

  const presentCount = Object.values(records).filter(r => r.status === 'present').length
  const markedCount  = Object.keys(records).length

  return (
    <div className={`session-card card${open ? ' session-card--open' : ''}`}>
      <button
        className="session-card__header"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="session-card__left">
          <span className={`tag ${event.type === 'match' ? 'tag-red' : 'tag-gold'}`}>
            {t(`calendar.type_${event.type}`)}
          </span>
          <span className="session-card__name">{event.name}</span>
          {event.location && (
            <span className="session-card__location">{event.location}</span>
          )}
        </div>
        <div className="session-card__right">
          <span className="session-card__date">
            {formatDate(event.date, locale)}
            {event.time && <> · {event.time.slice(0, 5)}</>}
          </span>
          <span className="session-card__summary">
            {markedCount > 0
              ? `${presentCount}/${players.length}`
              : `—/${players.length}`}
          </span>
          <span className={`session-card__chevron${open ? ' open' : ''}`}>›</span>
        </div>
      </button>

      {open && (
        <div className="session-players">
          {loading ? (
            <p className="session-players__loading">{t('app.loading')}</p>
          ) : players.length === 0 ? (
            <p className="session-players__loading">{t('attendance.no_players')}</p>
          ) : (
            players.map(p => {
              const rec = records[p.id] ?? {}
              const isSaving = saving[p.id]
              return (
                <div key={p.id} className="att-row">
                  <div className="att-row__info">
                    <div className="avatar">{p.fname[0]}{p.lname[0]}</div>
                    <div className="att-row__name-wrap">
                      <span className="att-row__name">{p.fname} {p.lname}</span>
                      <span className="tag tag-gold">{getAgeGroup(p.dob)}</span>
                    </div>
                  </div>

                  <div className="att-row__controls">
                    <div className="att-buttons">
                      {STATUS_OPTS.map(opt => (
                        <button
                          key={opt.value}
                          className={`att-btn att-btn--${opt.color}${rec.status === opt.value ? ' active' : ''}`}
                          onClick={() => markStatus(p.id, opt.value)}
                          disabled={isSaving || !canWrite}
                          title={t(`attendance.${opt.value === 'injured_sick' ? 'injured' : opt.value}`)}
                        >
                          {opt.short}
                        </button>
                      ))}
                    </div>

                    {canWrite && rec.status && (
                      <input
                        type="text"
                        className="att-note"
                        placeholder={t('attendance.note_placeholder')}
                        value={rec.note ?? ''}
                        onChange={e => setRecords(r => ({ ...r, [p.id]: { ...r[p.id], note: e.target.value } }))}
                        onBlur={e => saveNote(p.id, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { t, i18n } = useTranslation()
  const { branchId, role, user } = useAuth()
  const { season }  = useSeason(branchId)
  const { events, loading: evLoading } = useEvents(branchId, season?.id)
  const { players, loading: plLoading } = usePlayers(branchId)

  const canWrite = role === 'coach' || role === 'superadmin'
  const locale   = i18n.language

  // Only training + match events, newest first
  const sessions = events
    .filter(e => !e.cancelled && (e.type === 'training' || e.type === 'match'))
    .slice()
    .reverse()

  const loading = evLoading || plLoading

  return (
    <div className="attendance-page fade-up">
      <div className="attendance-page__header">
        <h1 className="attendance-page__title">{t('attendance.title')}</h1>
        {season && (
          <span className="attendance-page__season">{season.name}</span>
        )}
      </div>

      {loading ? (
        <div>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton" style={{height:'56px',borderRadius:'10px',marginBottom:'10px'}} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <p className="empty-title">{t('attendance.empty')}</p>
        </div>
      ) : (
        <div className="session-list">
          {sessions.map(ev => (
            <SessionRow
              key={ev.id}
              event={ev}
              players={players}
              user={user}
              t={t}
              locale={locale}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}
    </div>
  )
}
