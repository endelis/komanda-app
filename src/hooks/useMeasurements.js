import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useMeasurements(branchId, seasonId) {
  const [measurements, setMeasurements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!branchId || !seasonId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('measurements')
      .select('id, player_id, date, weight_kg, height_cm, recorded_by')
      .eq('season_id', seasonId)
      .order('date', { ascending: false })
    setMeasurements(data ?? [])
    setLoading(false)
  }, [branchId, seasonId])

  useEffect(() => { fetch() }, [fetch])

  return { measurements, loading, refetch: fetch }
}
