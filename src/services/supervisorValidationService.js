import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { getCurrentLocation } from '../lib/geo'
import { peruDateKey } from '../lib/date'
import { uploadSupervisorDniPhoto } from './storageService'

const toRad=(x)=>x*Math.PI/180
function distanceMeters(lat1,lon1,lat2,lon2){
  if([lat1,lon1,lat2,lon2].some(v=>v===null||v===undefined||Number.isNaN(Number(v))))return null
  const R=6371000
  const p1=toRad(Number(lat1)),p2=toRad(Number(lat2)),dp=toRad(Number(lat2)-Number(lat1)),dl=toRad(Number(lon2)-Number(lon1))
  const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*10)/10
}

const demoRows=[
  {id:'demo-v1',FECHA:peruDateKey(),USUARIO:'43572700',NOMBRE_PROSPECTOR:'Fiorella Natali Rossi Huanqui',DNI_CLIENTE:'74851236',SUBCANAL:'Bodegas',FOTO_FACHADA:'',LATITUD:-12.09655,LONGITUD:-77.03662,REGION:'Lima',LOCACION:'Lima Centro',VALIDACION_DNI:'SI',FOTO_DNI:'',UBICACION_MARCADA:true,SUPERVISOR_LAT:-12.09660,SUPERVISOR_LONG:-77.03660,SUBCANAL_CORRECTO:'SI',UBICACION_CORRECTA:'SI',DISTANCIA_M:6.2},
  {id:'demo-v2',FECHA:peruDateKey(),USUARIO:'76078600',NOMBRE_PROSPECTOR:'Luis Angel Del Carpio Cornejo',DNI_CLIENTE:'70112233',SUBCANAL:'Licorerías',FOTO_FACHADA:'',LATITUD:-12.09721,LONGITUD:-77.03595,REGION:'Lima',LOCACION:'Lima Centro',VALIDACION_DNI:'',FOTO_DNI:'',UBICACION_MARCADA:false,SUPERVISOR_LAT:null,SUPERVISOR_LONG:null,SUBCANAL_CORRECTO:'',UBICACION_CORRECTA:'',DISTANCIA_M:null},
]

export async function getSupervisorValidationRows(user,{date=peruDateKey(),region='',location=''}={}){
  if(DEMO_MODE)return demoRows.filter(r=>(!date||r.FECHA===date)&&(!region||region==='TODAS'||r.REGION===region)&&(!location||location==='TODAS'||r.LOCACION===location))
  let q=supabase.from(COLLECTIONS.VISITS).select('*').eq('ESTADO','FINALIZADA').eq('CLIENTE_EXITOSO','SI').eq('FECHA',date).order('HORA_FIN_VISITA',{ascending:false})
  if(region&&region!=='TODAS')q=q.eq('REGION',region)
  if(location&&location!=='TODAS')q=q.eq('LOCACION',location)
  const {data:visits,error}=await q
  if(error)throw error
  const visitRows=visits||[]
  if(!visitRows.length)return []
  const ids=visitRows.map(v=>v.id)
  const {data:validations,error:ve}=await supabase.from(COLLECTIONS.SUPERVISOR_VISIT_VALIDATION).select('*').in('VISITA_ID',ids)
  if(ve)throw ve
  const byVisit=new Map((validations||[]).map(v=>[String(v.VISITA_ID),v]))
  const userIds=[...new Set(visitRows.map(v=>String(v.USUARIO)))]
  const {data:profiles,error:pe}=await supabase.from(COLLECTIONS.USERS).select('USUARIO,NOMBRE,APELLIDO').in('USUARIO',userIds)
  if(pe)throw pe
  const names=new Map((profiles||[]).map(p=>[String(p.USUARIO),`${p.NOMBRE||''} ${p.APELLIDO||''}`.trim()]))
  return visitRows.map(v=>({
    ...v,
    NOMBRE_PROSPECTOR:names.get(String(v.USUARIO))||'',
    ...(byVisit.get(String(v.id))||{}),
    id:v.id,
    VISITA_ID:v.id,
  }))
}

async function upsertValidation(user,row,patch){
  if(DEMO_MODE)return {...row,...patch}
  const base={
    VISITA_ID:row.VISITA_ID||row.id,
    FECHA:row.FECHA,
    SUPERVISOR_USUARIO:user.usuario,
    PROSPECTOR_USUARIO:row.USUARIO||row.PROSPECTOR_USUARIO,
    DNI_CLIENTE:row.DNI_CLIENTE||'',
    SUBCANAL:row.SUBCANAL||'',
    FOTO_FACHADA:row.FOTO_FACHADA||'',
    REGION:row.REGION||user.region,
    LOCACION:row.LOCACION||'',
    UPDATED_AT:new Date().toISOString(),
  }
  const {data,error}=await supabase.from(COLLECTIONS.SUPERVISOR_VISIT_VALIDATION).upsert({...base,...patch},{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,...data}
}

export function isValidationComplete(row){
  return ['SI','NO'].includes(row.VALIDACION_DNI)&&Boolean(row.FOTO_DNI)&&row.UBICACION_MARCADA===true&&['SI','NO'].includes(row.SUBCANAL_CORRECTO)
}

export async function saveSupervisorChoice(user,row,key,value){
  return upsertValidation(user,row,{[key]:value})
}

export async function saveSupervisorDniPhoto(user,row,file){
  if(!file)throw new Error('Selecciona una foto del DNI.')
  const path=await uploadSupervisorDniPhoto(user,row.VISITA_ID||row.id,file)
  return upsertValidation(user,row,{FOTO_DNI:path})
}

export async function captureSupervisorLocation(user,row){
  const geo=await getCurrentLocation()
  const distance=distanceMeters(row.LATITUD,row.LONGITUD,geo.latitude,geo.longitude)
  const correct=distance!==null&&distance<=20?'SI':'NO'
  return upsertValidation(user,row,{
    UBICACION_MARCADA:true,
    SUPERVISOR_LAT:geo.latitude,
    SUPERVISOR_LONG:geo.longitude,
    DISTANCIA_M:distance,
    UBICACION_CORRECTA:correct,
  })
}
