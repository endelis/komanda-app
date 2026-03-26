import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useSeason } from '../hooks/useSeason'
import { useEvents } from '../hooks/useEvents'
import EventModal from '../components/events/EventModal'
import './CalendarPage.css'

const TYPE_TAG = {
  training:    'tag-gold',
  match:       'tag-red',
  tournament:  'tag-blue',
  measurement: 'tag-green',
}

function formatTime(time) {
  if (!time) return null
  return time.slice(0, 5) // "HH:MM"
}

function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function monthLabel(key, locale) {
  const [year, month] = key.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    month: 'long', year: 'numeric',
  })
}

function groupByMonth(events) {
  const groups = {}
  events.forEach(e => {
    const key = e.date.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

export default function CalendarPage() {
  const { t, i18n } = useTranslation()
  const { branchId, role } = useAuth()
  const { season } = useSeason(branchId)
  const { events, loading, refetch } = useEvents(branchId, season?.id)

  const [modalEvent, setModalEvent] = useState(undefined) // undefined=closed, null=add, obj=edit
  const canWrite = role === 'coach' || role === 'superadmin'
  const locale = i18n.language

  const grouped = groupByMonth(events)

  return (
    <div className="calendar-page fade-up">
      <div className="calendar-page__header">
        <h1 className="calendar-page__title">{t('calendar.title')}</h1>
        {canWrite && (
          <button className="btn btn--gold btn--sm" onClick={() => setModalEvent(null)}>
            + {t('calendar.add_event')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="skeleton" style={{height:'52px',borderRadius:'10px',marginBottom:'8px'}} />
          <div className="skeleton" style={{height:'52px',borderRadius:'10px',marginBottom:'8px'}} />
          <div className="skeleton" style={{height:'52px',borderRadius:'10px'}} />
        </div>
      ) : grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" />
          <p className="empty-title">{t('calendar.empty')}</p>
        </div>
      ) : (
        grouped.map(([monthKey, monthEvents]) => (
          <section key={monthKey} className="calendar-month">
            <h2 className="calendar-month__label">{monthLabel(monthKey, locale)}</h2>
            <ul className="event-list card">
              {monthEvents.map((ev, i) => (
                <li
                  key={ev.id}
                  className={`event-row event-row--${ev.type}${ev.cancelled ? ' event-row--cancelled' : ''}${i < monthEvents.length - 1 ? ' event-row--bordered' : ''}`}
                >

                  <div className="event-row__main">
                    <div className="event-row__top">
                      <span className={`tag ${TYPE_TAG[ev.type]}`}>
                        {t(`calendar.type_${ev.type}`)}
                      </span>
                      {ev.cancelled && (
                        <span className="tag tag-red">{t('calendar.cancelled_label')}</span>
                      )}
                    </div>
                    <p className={`event-row__name${ev.cancelled ? ' event-row__name--cancelled' : ''}`}>
                      {ev.name}
                    </p>
                    <p className="event-row__meta">
                      {formatDate(ev.date, locale)}
                      {ev.end_date && ev.end_date !== ev.date && (
                        <> — {formatDate(ev.end_date, locale)}</>
                      )}
                      {formatTime(ev.time) && (
                        <> · {formatTime(ev.time)}</>
                      )}
                      {ev.duration_minutes && (
                        <> · {ev.duration_minutes} min</>
                      )}
                      {ev.location && (
                        <> · {ev.location}</>
                      )}
                    </p>
                    {ev.cancelled && ev.cancellation_note && (
                      <p className="event-row__cancel-note">{ev.cancellation_note}</p>
                    )}
                  </div>

                  {canWrite && !ev.cancelled && (
                    <button
                      className="btn btn--ghost btn--sm event-row__edit"
                      onClick={() => setModalEvent(ev)}
                    >
                      {t('calendar.edit')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {modalEvent !== undefined && (
        <EventModal
          event={modalEvent}
          branchId={branchId}
          seasonId={season?.id}
          onClose={() => setModalEvent(undefined)}
          onSaved={refetch}
        />
      )}
    </div>
  )
}
