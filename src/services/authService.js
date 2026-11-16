import { supabase } from '../lib/supabase'
import { DEMO_MODE, ROLES } from '../lib/constants'
import { DEMO_USERS } from '../data/demoData'

const normalizeRole = (role = '') => {
  const r = String(role).trim().toLowerCase()
  if (r.startsWith('admin')) return ROLES.ADMIN
  if (r.startsWith('coord')) return ROLES.REGIONAL_COORDINATOR
  if (r.startsWith('super')) return ROLES.SUPERVISOR
  if (r.startsWith('valid') || r.startsWith('desarr') || r.startsWith('dev')) return ROLES.VALIDATOR
  return ROLES.PROSPECTOR
}

export const normalizeProfile = (raw = {}) => ({
  usuario: String(raw.usuario ?? raw.Usuario ?? raw.USUARIO ?? ''),
  nombre: raw.nombre ?? raw.Nombre ?? raw.NOMBRE ?? '',
  apellido: raw.apellido ?? raw.Apellido ?? raw.APELLIDO ?? '',
  region: raw.region ?? raw['Región'] ?? raw.Region ?? raw.REGION ?? '',
  locacion: raw.locacion ?? raw['Locación'] ?? raw.Locacion ?? raw.LOCACION ?? '',
  rol: normalizeRole(raw.rol ?? raw.Rol ?? raw.ROL),
  status: String(raw.status ?? raw.Status ?? raw.STATUS ?? '').toUpperCase(),
  uid: String(raw.uid ?? raw.UID_AUTH ?? ''),
})

export const authEmailForUsername = (usuario) => `${String(usuario || '').trim().toLowerCase()}@prospecta-rtm.app`

export async function getProfileByAuthUser(authUser) {
  if (!authUser || !supabase) return null
  const { data, error } = await supabase
    .from('USUARIOS')
    .select('*')
    .eq('UID_AUTH', authUser.id)
    .maybeSingle()
  if (error) throw error
  return data ? normalizeProfile(data) : null
}

export async function loginWithUserPassword(usuario, password) {
  const cleanUser = String(usuario || '').trim()
  if (!cleanUser || !password) throw new Error('Ingresa tu usuario y contraseña.')

  if (DEMO_MODE) {
    const found = DEMO_USERS.find((u) => u.usuario === cleanUser && u.password === password)
    if (!found) throw new Error('Usuario o contraseña incorrectos.')
    if (String(found.status).toUpperCase() !== 'ACTIVO') throw new Error('Tu usuario no se encuentra ACTIVO.')
    return normalizeProfile(found)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: authEmailForUsername(cleanUser),
    password,
  })
  if (error) {
    if (/invalid login credentials/i.test(error.message || '')) throw new Error('Usuario o contraseña incorrectos.')
    throw new Error(error.message || 'No fue posible iniciar sesión.')
  }

  const profile = await getProfileByAuthUser(data.user)
  if (!profile) {
    await supabase.auth.signOut()
    throw new Error('Tu usuario no está provisionado en PROSPECTA RTM.')
  }
  if (profile.status !== 'ACTIVO') {
    await supabase.auth.signOut()
    throw new Error('Tu usuario no se encuentra ACTIVO.')
  }
  return profile
}

export async function logout() {
  if (!DEMO_MODE && supabase) await supabase.auth.signOut()
}
