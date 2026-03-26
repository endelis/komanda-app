import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches events + attendance records for a branch/season.
 * Returns a helper to get a player's attendance ratio.
 */
export function useAttendance(branchId, seasonId) {
  const [events, setEvents] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!branchId || !seasonId) { setLoading(false); return }

    async function fetch() {
      const [eventsRes, attendanceRes] = await Promise.all([
        supabase
          .from('events')
          .select('id, type, cancelled')
          .eq('branch_id', branchId)
          .eq('season_id', seasonId),
        supabase
          .from('attendance')
          .select('event_id, player_id, status'),
      ])
      setEvents(eventsRes.data ?? [])
      setRecords(attendanceRes.data ?? [])
      setLoading(false)
    }

    fetch()
  }, [branchId, seasonId])

  function getRatio(playerId) {
    const held = events.filter(e =>
      !e.cancelled && (e.type === 'training' || e.type === 'match')
    )
    if (held.length === 0) return null
    const heldIds = new Set(held.map(e => e.id))
    const present = records.filter(r =>
      r.player_id === playerId && r.status === 'present' && heldIds.has(r.event_id)
    ).length
    return Math.round((present / held.length) * 100)
  }

  return { events, records, loading, getRatio }
}
