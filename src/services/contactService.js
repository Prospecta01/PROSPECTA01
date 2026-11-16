import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { demoGetContacts } from '../lib/demoStore'

export async function getContacts(user) {
  if (DEMO_MODE) {
    const rows = await demoGetContacts()
    const byLocation = rows.filter((r) => r.locacion === user.locacion)
    return byLocation.length ? byLocation : rows.filter((r) => r.region === user.region)
  }
  let { data, error } = await supabase.from(COLLECTIONS.CONTACTS).select('*').eq('LOCACION', user.locacion).eq('ACTIVO', true).order('ORDEN')
  if (error) throw error
  if (!data?.length) {
    const result = await supabase.from(COLLECTIONS.CONTACTS).select('*').eq('REGION', user.region).eq('ACTIVO', true).order('ORDEN')
    if (result.error) throw result.error
    data = result.data
  }
  if (!data?.length) {
    const result = await supabase.from(COLLECTIONS.CONTACTS).select('*').is('REGION', null).eq('ACTIVO', true).order('ORDEN')
    if (result.error) throw result.error
    data = result.data
  }
  return data || []
}
