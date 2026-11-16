import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { classifyArrival, peruDateKey, peruTime } from '../lib/date'

const DEMO_START='prospecta-validator-start'
const DEMO_END='prospecta-validator-end'

export async function getValidatorTodayStart(user){
  if(DEMO_MODE){try{return JSON.parse(sessionStorage.getItem(DEMO_START)||'null')}catch{return null}}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_START_DAY).select('*').eq('FECHA',peruDateKey()).eq('USUARIO',user.usuario).maybeSingle()
  if(error)throw error
  return data
}
export async function startValidatorDay(user){
  if(await getValidatorTodayStart(user))throw new Error('Tu inicio de jornada ya fue registrado hoy.')
  const HORA_INICIO=peruTime()
  const payload={FECHA:peruDateKey(),USUARIO:user.usuario,HORA_INICIO,CLASIFICACION_INGRESO:classifyArrival(user.region,HORA_INICIO),REGION:user.region,LOCACION:user.locacion||''}
  if(DEMO_MODE){sessionStorage.setItem(DEMO_START,JSON.stringify(payload));return payload}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_START_DAY).insert(payload).select().single()
  if(error?.code==='23505')throw new Error('Tu inicio de jornada ya fue registrado hoy.')
  if(error)throw error
  return data
}
export async function getValidatorTodayEnd(user){
  if(DEMO_MODE){try{return JSON.parse(sessionStorage.getItem(DEMO_END)||'null')}catch{return null}}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_END_DAY).select('*').eq('FECHA',peruDateKey()).eq('USUARIO',user.usuario).maybeSingle()
  if(error)throw error
  return data
}
const timeMinutes=(value)=>{const [h,m]=String(value||'00:00').slice(0,5).split(':').map(Number);return (Number.isFinite(h)?h:0)*60+(Number.isFinite(m)?m:0)}
export async function endValidatorDay(user){
  const start=await getValidatorTodayStart(user)
  if(!start)throw new Error('Primero registra tu inicio de jornada como Validador.')
  if(await getValidatorTodayEnd(user))throw new Error('Tu fin de jornada ya fue registrado hoy.')
  const HORA_FIN=peruTime(),duration=Math.max(0,timeMinutes(HORA_FIN)-timeMinutes(start.HORA_INICIO))
  const payload={FECHA:peruDateKey(),USUARIO:user.usuario,HORA_INICIO:start.HORA_INICIO,HORA_FIN,DURACION_JORNADA:duration,REGION:user.region,LOCACION:user.locacion||''}
  if(DEMO_MODE){sessionStorage.setItem(DEMO_END,JSON.stringify(payload));return payload}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_END_DAY).insert(payload).select().single()
  if(error?.code==='23505')throw new Error('Tu fin de jornada ya fue registrado hoy.')
  if(error)throw error
  return data
}
