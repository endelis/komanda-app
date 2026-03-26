import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useSeason(branchId) {
  const [season, setSeason] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!branchId) { setLoading(false); return }

    async function fetch() {
      const { data } = await supabase
        .from('seasons')
        .select('id, name, start_date, end_date')
        .eq('branch_id', branchId)
        .eq('is_current', true)
        .single()
      setSeason(data ?? null)
      setLoading(false)
    }

    fetch()
  }, [branchId])

  return { season, loading }
}
