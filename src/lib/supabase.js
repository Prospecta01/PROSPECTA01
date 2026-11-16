import { createClient } from '@supabase/supabase-js'
import { DEMO_MODE } from './constants'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!DEMO_MODE && (!url || !anonKey)) {
  console.warn('PROSPECTA RTM: faltan VITE_SUPABASE_URL y/o VITE_SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = DEMO_MODE ? null : createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
