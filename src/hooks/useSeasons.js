import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useSeasons(branchId) {
  const [seasons, setSeasons] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!branchId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('seasons')
      .select('id, name, start_date, end_date, is_current')
      .eq('branch_id', branchId)
      .order('start_date', { ascending: false })
    setSeasons(data ?? [])
    setLoading(false)
  }, [branchId])

  useEffect(() => { fetch() }, [fetch])

  return { seasons, loading, refetch: fetch }
}
