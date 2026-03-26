import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePlayers(branchId) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!branchId) { setLoading(false); return }
    setLoading(true)
    // Never use select('*') on players — list columns explicitly
    const { data, error } = await supabase
      .from('players')
      .select('id, fname, lname, dob, branch_id, assigned_coach_id, guardian_name, notes, archived_at, created_at')
      .eq('branch_id', branchId)
      .is('archived_at', null)
      .order('lname')
    if (error) setError(error)
    else setPlayers(data ?? [])
    setLoading(false)
  }, [branchId])

  useEffect(() => { fetch() }, [fetch])

  return { players, loading, error, refetch: fetch }
}
