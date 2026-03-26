import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useBranches(clubId) {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!clubId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('club_id', clubId)
      .order('name')
    setBranches(data ?? [])
    setLoading(false)
  }, [clubId])

  useEffect(() => { fetch() }, [fetch])

  return { branches, loading, refetch: fetch }
}
