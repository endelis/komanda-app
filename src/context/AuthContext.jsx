import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [clubId, setClubId] = useState(null)
  const [clubName, setClubName] = useState(null)
  const [branchId, setBranchId] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    // Join clubs so we get club_name in one query
    const { data } = await supabase
      .from('users')
      .select('role, club_id, clubs(name)')
      .eq('id', userId)
      .single()

    setRole(data?.role ?? null)
    setClubId(data?.club_id ?? null)
    setClubName(data?.clubs?.name ?? null)

    // Fetch primary branch from coach_access (first assigned branch)
    if (data?.role === 'coach') {
      const { data: access } = await supabase
        .from('coach_access')
        .select('branch_id')
        .eq('user_id', userId)
        .limit(1)
        .single()
      setBranchId(access?.branch_id ?? null)
    }

    // For parent/player: resolve linked player + branch
    if (data?.role === 'parent' || data?.role === 'player') {
      const { data: pu } = await supabase
        .from('player_users')
        .select('player_id, players(branch_id)')
        .eq('user_id', userId)
        .limit(1)
        .single()
      setPlayerId(pu?.player_id ?? null)
      setBranchId(pu?.players?.branch_id ?? null)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setRole(null)
        setClubId(null)
        setClubName(null)
        setBranchId(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Re-fetch profile without full reload — used after club setup
  async function refreshProfile() {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (currentUser) await fetchProfile(currentUser.id)
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error, role: null }

    const { data: profile } = await supabase
      .from('users')
      .select('role, club_id, clubs(name)')
      .eq('id', data.user.id)
      .single()

    const userRole = profile?.role ?? null
    setRole(userRole)
    setClubId(profile?.club_id ?? null)
    setClubName(profile?.clubs?.name ?? null)
    return { error: null, role: userRole }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
    setClubId(null)
    setClubName(null)
    setBranchId(null)
    setPlayerId(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, clubId, clubName, branchId, playerId, loading, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
