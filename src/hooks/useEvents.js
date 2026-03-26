import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEvents(branchId, seasonId) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!branchId || !seasonId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('events')
      .select('id, type, name, date, end_date, time, duration_minutes, location, cancelled, cancellation_note, created_by')
      .eq('branch_id', branchId)
      .eq('season_id', seasonId)
      .order('date')
    setEvents(data ?? [])
    setLoading(false)
  }, [branchId, seasonId])

  useEffect(() => { fetch() }, [fetch])

  return { events, loading, refetch: fetch }
}
