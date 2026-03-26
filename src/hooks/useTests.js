import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTests(branchId, seasonId) {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!branchId || !seasonId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('tests')
      .select('id, name, date, metrics, created_by')
      .eq('branch_id', branchId)
      .eq('season_id', seasonId)
      .order('date', { ascending: false })
    setTests(data ?? [])
    setLoading(false)
  }, [branchId, seasonId])

  useEffect(() => { fetch() }, [fetch])

  return { tests, loading, refetch: fetch }
}
