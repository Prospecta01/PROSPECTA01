import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEMO_MODE, ROLES } from '../lib/constants'
import { DEMO_USERS } from '../data/demoData'
import { supabase } from '../lib/supabase'
import { getProfileByAuthUser, loginWithUserPassword, logout as serviceLogout, normalizeProfile } from '../services/authService'

const AuthContext = createContext(null)
const SESSION_KEY = 'prospecta-session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (DEMO_MODE) {
      try {
        const saved = sessionStorage.getItem(SESSION_KEY)
        if (saved) setUser(JSON.parse(saved))
      } catch { sessionStorage.removeItem(SESSION_KEY) }
      setLoading(false)
      return
    }

    let alive = true
    const hydrate = async (session) => {
      if (!alive) return
      if (!session?.user) { setUser(null); setLoading(false); return }
      try {
        const profile = await getProfileByAuthUser(session.user)
        if (!profile || profile.status !== 'ACTIVO') {
          await supabase.auth.signOut()
          if (alive) setUser(null)
        } else if (alive) setUser(profile)
      } catch {
        if (alive) setUser(null)
      } finally { if (alive) setLoading(false) }
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => hydrate(session), 0)
    })
    return () => { alive = false; listener.subscription.unsubscribe() }
  }, [])

  const login = async (usuario, password) => {
    const profile = await loginWithUserPassword(usuario, password)
    setUser(profile)
    if (DEMO_MODE) sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile))
    return profile
  }

  const logout = async () => {
    await serviceLogout()
    setUser(null)
    sessionStorage.removeItem(SESSION_KEY)
  }

  const demoLoginByRole = async (role) => {
    if (!DEMO_MODE) return null
    const normalized = String(role || '').toLowerCase()
    const wanted = normalized.startsWith('admin') ? ROLES.ADMIN : normalized.startsWith('coord') ? ROLES.REGIONAL_COORDINATOR : normalized.startsWith('super') ? ROLES.SUPERVISOR : (normalized.startsWith('valid') || normalized.startsWith('desarr') || normalized.startsWith('dev')) ? ROLES.VALIDATOR : ROLES.PROSPECTOR
    const profile = normalizeProfile(DEMO_USERS.find((x) => x.rol === wanted))
    setUser(profile)
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile))
    return profile
  }

  const value = useMemo(() => ({ user, loading, login, logout, demoLoginByRole }), [user, loading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
