import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches all data needed for the player/parent home page.
 */
export function useHomeData(playerId, branchId, seasonId) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId || !branchId || !seasonId) { setLoading(false); return }

    async function fetch() {
      const today = new Date().toISOString().slice(0, 10)

      const [eventsRes, attendanceRes, measRes, testResultsRes] = await Promise.all([
        // Upcoming events for this branch (not cancelled, from today)
        supabase
          .from('events')
          .select('id, type, name, date, end_date, time, location, cancelled')
          .eq('branch_id', branchId)
          .eq('season_id', seasonId)
          .eq('cancelled', false)
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(20),

        // All attendance for this player this season
        supabase
          .from('attendance')
          .select('event_id, status'),

        // Latest 4 measurements for this player
        supabase
          .from('measurements')
          .select('id, date, weight_kg, height_cm')
          .eq('player_id', playerId)
          .eq('season_id', seasonId)
          .order('date', { ascending: false })
          .limit(4),

        // Latest test results for this player (join tests for name + date)
        supabase
          .from('test_results')
          .select('test_id, results, tests(id, name, date, metrics)')
          .eq('player_id', playerId)
          .order('test_id', { ascending: false })
          .limit(10),
      ])

      // Also fetch all held events for ratio calculation
      const { data: heldEvents } = await supabase
        .from('events')
        .select('id, type, cancelled')
        .eq('branch_id', branchId)
        .eq('season_id', seasonId)
        .in('type', ['training', 'match'])
        .eq('cancelled', false)

      const held = heldEvents ?? []
      const heldIds = new Set(held.map(e => e.id))
      const records = attendanceRes.data ?? []

      const presentCount = records.filter(
        r => r.status === 'present' && heldIds.has(r.event_id)
      ).length
      const ratio = held.length > 0 ? Math.round((presentCount / held.length) * 100) : null

      const upcomingEvents = eventsRes.data ?? []
      const nextTraining = upcomingEvents.find(e => e.type === 'training' || e.type === 'match') ?? null
      const in30Days = new Date()
      in30Days.setDate(in30Days.getDate() + 30)
      const nextTournament = upcomingEvents.find(e =>
        e.type === 'tournament' && new Date(e.date) <= in30Days
      ) ?? null

      setData({
        upcomingEvents,
        nextTraining,
        nextTournament,
        attendanceRatio: ratio,
        attendanceSessions: held.length,
        attendancePresent: presentCount,
        measurements: measRes.data ?? [],
        testResults: (testResultsRes.data ?? [])
          .filter(r => r.tests)
          .sort((a, b) => b.tests.date.localeCompare(a.tests.date)),
      })
      setLoading(false)
    }

    fetch()
  }, [playerId, branchId, seasonId])

  return { data, loading }
}
