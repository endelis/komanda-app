// Returns today's date as 'YYYY-MM-DD' in local time
export function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Formats a 'YYYY-MM-DD' string as e.g. "Mon 5 Mar" / "P, 5. marts"
// Used in calendar and attendance event rows
export function formatDate(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

// Formats a 'YYYY-MM-DD' string as e.g. "5 Mar 2025"
// Used in performance test/measurement lists and player profile
export function formatShort(dateStr) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}

// Formats a 'YYYY-MM-DD' string as e.g. "5 Mar" (no year)
// Used in compact contexts like home page test cards
export function formatCompact(dateStr) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric', month: 'short',
  }).format(new Date(dateStr + 'T00:00:00'))
}

// Formats a 'YYYY-MM' or full 'YYYY-MM-DD' string as e.g. "March 2025"
// Used for calendar month headings
export function formatMonthYear(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(locale === 'lv' ? 'lv-LV' : 'en-GB', {
    month: 'long', year: 'numeric',
  })
}

// Returns 'Today', 'Tomorrow', or a short date label
// Requires the i18n `t` function for the home/today and home/tomorrow keys
export function relativeDay(dateStr, t) {
  const todayStr = today()
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const next = new Date(ty, tm - 1, td + 1)
  const tomorrowStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
  if (dateStr === todayStr) return t('home.today')
  if (dateStr === tomorrowStr) return t('home.tomorrow')
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(dateStr + 'T00:00:00'))
}

// Returns true if dateStr is within `days` days from today (inclusive)
export function isUpcoming(dateStr, days = 30) {
  const todayStr = today()
  const [ty, tm, td] = todayStr.split('-').map(Number)
  const limit = new Date(ty, tm - 1, td + days)
  const limitStr = `${limit.getFullYear()}-${String(limit.getMonth() + 1).padStart(2, '0')}-${String(limit.getDate()).padStart(2, '0')}`
  return dateStr >= todayStr && dateStr <= limitStr
}

// Returns the current season label, e.g. "2024/25"
// Season is assumed to start in August (month 8)
export function getSeasonYear() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  if (m >= 8) return `${y}/${String(y + 1).slice(2)}`
  return `${y - 1}/${String(y).slice(2)}`
}
