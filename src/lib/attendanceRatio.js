/**
 * Calculates attendance ratio as a percentage (0–100).
 * Denominator = held sessions only (not cancelled, type = training or match).
 * Returns null if no held sessions exist.
 */
export function calcAttendanceRatio(records, events) {
  const held = events.filter(e =>
    !e.cancelled && (e.type === 'training' || e.type === 'match')
  )
  if (held.length === 0) return null

  const heldIds = new Set(held.map(e => e.id))
  const present = records.filter(r =>
    r.status === 'present' && heldIds.has(r.event_id)
  ).length

  return Math.round((present / held.length) * 100)
}
