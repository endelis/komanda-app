import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCoaches(clubId) {
  const [coaches, setCoaches] = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!clubId) { setLoading(false); return }
    setLoading(true)

    const [coachesRes, invitesRes] = await Promise.all([
      supabase
        .from('users')
        .select('id, email, display_name, coach_access(id, branch_id, age_group, branches(name))')
        .eq('role', 'coach')
        .eq('club_id', clubId),
      supabase
        .from('coach_invites')
        .select('id, invited_email, branch_id, age_group, expires_at, created_at, branches(name)')
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
    ])

    setCoaches(coachesRes.data ?? [])
    // Filter out expired invites
    const now = new Date()
    setPendingInvites(
      (invitesRes.data ?? []).filter(inv => new Date(inv.expires_at) > now)
    )
    setLoading(false)
  }, [clubId])

  useEffect(() => { fetch() }, [fetch])

  return { coaches, pendingInvites, loading, refetch: fetch }
}
