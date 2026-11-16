import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { classifyArrival, classifyDeparture, peruDateKey, peruTime } from '../lib/date'
import { demoEndDay, demoGetEndDay, demoGetStartDay, demoStartDay } from '../lib/demoStore'

export async function getTodayStart(user) {
  if (DEMO_MODE) return demoGetStartDay(user)
  const { data, error } = await supabase.from(COLLECTIONS.START_DAY).select('*').eq('FECHA', peruDateKey()).eq('USUARIO', user.usuario).maybeSingle()
  if (error) throw error
  return data
}

export async function startDay(user, geo={}) {
  if (DEMO_MODE) return demoStartDay(user)
  if (await getTodayStart(user)) throw new Error('Tu inicio de jornada ya fue registrado hoy.')
  const HORA_INICIO = peruTime()
  const payload = {
    FECHA: peruDateKey(), USUARIO: user.usuario, HORA_INICIO,
    CLASIFICACION_INGRESO: classifyArrival(user.region, HORA_INICIO),
    LATITUD: geo.latitude ?? null, LONGITUD: geo.longitude ?? null, ACCURACY_M: geo.accuracy ?? null, STATUS_UBICACION: geo.status ?? '',
    REGION: user.region, LOCACION: user.locacion,
  }
  const { data, error } = await supabase.from(COLLECTIONS.START_DAY).insert(payload).select().single()
  if (error?.code === '23505') throw new Error('Tu inicio de jornada ya fue registrado hoy.')
  if (error) throw error
  return data
}

export async function getTodayEnd(user) {
  if (DEMO_MODE) return demoGetEndDay(user)
  const { data, error } = await supabase.from(COLLECTIONS.END_DAY).select('*').eq('FECHA', peruDateKey()).eq('USUARIO', user.usuario).maybeSingle()
  if (error) throw error
  return data
}

export async function endDay(user, geo={}) {
  if (DEMO_MODE) return demoEndDay(user)
  if (!await getTodayStart(user)) throw new Error('Primero registra el inicio de jornada.')
  const { data: open, error: openError } = await supabase.from(COLLECTIONS.VISITS).select('id').eq('USUARIO', user.usuario).eq('ESTADO', 'EN_CURSO').limit(1)
  if (openError) throw openError
  if (open?.length) throw new Error('Finaliza la visita en curso antes de cerrar tu jornada.')
  if (await getTodayEnd(user)) throw new Error('Tu fin de jornada ya fue registrado hoy.')
  const HORA_FIN=peruTime()
  const payload = {
    FECHA: peruDateKey(), USUARIO: user.usuario, HORA_FIN, CLASIFICACION_FIN: classifyDeparture(HORA_FIN),
    LATITUD: geo.latitude ?? null, LONGITUD: geo.longitude ?? null, ACCURACY_M: geo.accuracy ?? null, STATUS_UBICACION: geo.status ?? '',
    REGION: user.region, LOCACION: user.locacion,
  }
  const { data, error } = await supabase.from(COLLECTIONS.END_DAY).insert(payload).select().single()
  if (error?.code === '23505') throw new Error('Tu fin de jornada ya fue registrado hoy.')
  if (error) throw error
  return data
}
