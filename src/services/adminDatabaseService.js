import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { peruDateKey } from '../lib/date'
import { getFacadePublicUrl } from './storageService'
import { resolvePhotoLinks, setPhotoColumnWidths, addPhotoHyperlinks } from './photoExcelExport'

const text=(value)=>String(value??'').trim()
const demoDate=peruDateKey()

const DEMO={
  jornadas:[
    {FECHA:demoDate,USUARIO:'43572700',NOMBRE_APELLIDO:'Fiorella Natali Rossi Huanqui',HORA_INICIO:'07:52',CLASIFICACION_INGRESO:'Ingreso Anticipado',REGION:'Lima',LOCACION:'Lima Centro',HORA_FIN:'17:08',CLASIFICACION_FIN:'Salida Puntual'},
    {FECHA:demoDate,USUARIO:'76078600',NOMBRE_APELLIDO:'Luis Angel Del Carpio Cornejo',HORA_INICIO:'08:07',CLASIFICACION_INGRESO:'Ingreso Puntual',REGION:'Lima',LOCACION:'Lima Centro',HORA_FIN:'17:14',CLASIFICACION_FIN:'Salida Puntual'},
  ],
  visitas:[
    {FECHA:demoDate,USUARIO:'43572700',NOMBRE_APELLIDO:'Fiorella Natali Rossi Huanqui',HORA_INICIO_VISITA:'09:08',HORA_FIN_VISITA:'09:22',CLIENTE_EXITOSO:'SI',MOTIVO:'',DNI_CLIENTE:'74851236',SUBCANAL:'Bodegas',CODIGO_CLIENTE_SAP:'10004567',FOTO_FACHADA_URL:'https://placehold.co/640x480/png?text=Fachada',DURACION_VISITA:14,LATITUD:-12.09655,LONGITUD:-77.03662,REGION:'Lima',LOCACION:'Lima Centro'},
  ],
  validacion:[
    {FECHA:demoDate,SUPERVISOR_USUARIO:'sup.lima',PROSPECTOR_USUARIO:'43572700',DNI_CLIENTE:'74851236',SUBCANAL:'Bodegas',SUBCANAL_CORRECTO:'SI',UBICACION_CORRECTA:'SI'},
    {FECHA:demoDate,SUPERVISOR_USUARIO:'sup.lima',PROSPECTOR_USUARIO:'76078600',DNI_CLIENTE:'70112233',SUBCANAL:'Licorerías',SUBCANAL_CORRECTO:'NO',UBICACION_CORRECTA:'SI'},
  ],
}

export const DATABASE_CONFIG={
  jornadas:{title:'Jornada Prospectores',sheet:'JORNADA_PROSPECTORES',columns:[['FECHA','Fecha'],['USUARIO','Usuario'],['NOMBRE_APELLIDO','Nombre y Apellido'],['HORA_INICIO','Hora Inicio'],['CLASIFICACION_INGRESO','Clasificación de ingreso'],['REGION','Región'],['LOCACION','Locación'],['HORA_FIN','Hora Fin'],['CLASIFICACION_FIN','Clasificación de fin']]},
  visitas:{title:'Visitas exitosas (Altas)',sheet:'VISITAS_EXITOSAS',columns:[['USUARIO','DNI'],['NOMBRE_APELLIDO','Nombre y Apellido (Prospector)'],['REGION','Región'],['LOCACION','Locación'],['SUBCANAL','Subcanal'],['DNI_CLIENTE','DNI Cliente'],['RAZON_SOCIAL','Razón Cliente'],['LOCACION_COMERCIAL','Locación Comercial'],['RUTA','Ruta'],['SEGMENTO','Segmento'],['ESTADO_REGISTRO','Estado de registro'],['GEOLOCALIZADO_TEXTO','¿Geolocalizado?'],['ENVIO_WHATSAPP_TEXTO','¿Envío de WhatsApp?'],['FECHA_HORA_PROSPECTOR','Fecha y hora Prospector'],['FECHA_PROSPECTOR','Fecha Prospector'],['FECHA_APROBADOR','Fecha Aprobador'],['CODIGO_CLIENTE_SAP','Código cliente SAP'],['CODIGO_ENLACE','Código Enlace'],['VALIDADOR_ASIGNADO','Validador'],['FOTO_FACHADA','Foto de Fachada'],['FOTO_INTERIOR','Foto interior']]},
  validacion:{title:'Validación de visita supervisor',sheet:'VALIDACION_SUPERVISOR',columns:[['DNI_CLIENTE','DNI Cliente'],['SUBCANAL','Subcanal'],['SUBCANAL_CORRECTO','¿Subcanal correcto?'],['UBICACION_CORRECTA','¿Ubicación correcta?']]},
}

const ALL_TYPES=['jornadas','visitas','validacion']

async function profilesMap(){
  const {data,error}=await supabase.from(COLLECTIONS.USERS).select('USUARIO,NOMBRE,APELLIDO')
  if(error)throw error
  return new Map((data||[]).map(u=>[String(u.USUARIO),`${u.NOMBRE||''} ${u.APELLIDO||''}`.trim()]))
}
function applyRange(q,{startDate='',endDate=''}){if(startDate)q=q.gte('FECHA',startDate);if(endDate)q=q.lte('FECHA',endDate);return q}

export async function loadDatabase(type,dateFilters={}){
  if(!DATABASE_CONFIG[type])throw new Error('Base de datos no reconocida.')
  if(DEMO_MODE)return DEMO[type]||[]
  const names=await profilesMap()
  if(type==='jornadas'){
    let qi=applyRange(supabase.from(COLLECTIONS.START_DAY).select('*').order('FECHA',{ascending:false}),dateFilters)
    let qf=applyRange(supabase.from(COLLECTIONS.END_DAY).select('*').order('FECHA',{ascending:false}),dateFilters)
    const [{data:starts,error:se},{data:ends,error:ee}]=await Promise.all([qi,qf]);if(se)throw se;if(ee)throw ee
    const endMap=new Map((ends||[]).map(r=>[`${r.FECHA}|${r.USUARIO}`,r]))
    return (starts||[]).map(s=>{const e=endMap.get(`${s.FECHA}|${s.USUARIO}`)||{};return {...s,NOMBRE_APELLIDO:names.get(String(s.USUARIO))||'',HORA_FIN:e.HORA_FIN||'',CLASIFICACION_FIN:e.CLASIFICACION_FIN||''}})
  }
  if(type==='visitas'){
    let q=applyRange(supabase.from(COLLECTIONS.VISITS).select('*').eq('ESTADO','FINALIZADA').eq('CLIENTE_EXITOSO','SI').order('FECHA',{ascending:false}),dateFilters)
    const {data,error}=await q;if(error)throw error
    const visits=data||[]
    if(!visits.length)return []
    const ids=visits.map(v=>v.id)
    const {data:registrations,error:re}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).select('*').in('VISITA_ID',ids)
    if(re)throw re
    const regMap=new Map((registrations||[]).map(x=>[String(x.VISITA_ID),x]))
    return visits.map(r=>{const v=regMap.get(String(r.id))||{};const region=text(r.REGION).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();return {...r,NOMBRE_APELLIDO:names.get(String(r.USUARIO))||'',ESTADO_REGISTRO:v.ESTADO_REGISTRO||(v.REGISTRADO?'COMPLETADO':'PENDIENTE'),GEOLOCALIZADO_TEXTO:v.GEOLOCALIZADO===true?'SI':'NO',ENVIO_WHATSAPP_TEXTO:v.ENVIO_WHATSAPP===true?'SI':'NO',FECHA_HORA_PROSPECTOR:r.FIN_ISO?new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',dateStyle:'short',timeStyle:'short'}).format(new Date(r.FIN_ISO)):'',FECHA_PROSPECTOR:r.FIN_ISO?new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.FIN_ISO)):(r.FECHA||''),FECHA_APROBADOR:v.FECHA_APROBADOR||'',CODIGO_CLIENTE_SAP:v.CODIGO_CLIENTE_SAP||'',CODIGO_ENLACE:v.CODIGO_ENLACE||'',VALIDADOR_ASIGNADO:region.includes('LIMA')||region.includes('NORTE')?'Validador 2':region.includes('SUR')||region.includes('CENTRO')||region.includes('ORIENTE')?'Validador 1':''}})
  }
  let q=applyRange(supabase.from(COLLECTIONS.SUPERVISOR_VISIT_VALIDATION).select('*').order('FECHA',{ascending:false}),dateFilters)
  const {data,error}=await q;if(error)throw error
  return data||[]
}

export async function loadAllDatabases(filters={}){const entries=await Promise.all(ALL_TYPES.map(async type=>[type,await loadDatabase(type,filters)]));return Object.fromEntries(entries)}

export function filterDatabaseRows(rows,{usuario='',region='TODAS',locacion='TODAS',visita='TODAS',subcanal='TODOS'}={}){
  return rows.filter(r=>{
    const user=text(r.USUARIO||r.SUPERVISOR_USUARIO||r.PROSPECTOR_USUARIO)
    if(usuario&&!user.toLowerCase().includes(usuario.toLowerCase()))return false
    if(region!=='TODAS'&&text(r.REGION)!==region)return false
    if(locacion!=='TODAS'&&text(r.LOCACION)!==locacion)return false
    if(visita!=='TODAS'&&text(r.CLIENTE_EXITOSO)!==visita)return false
    if(subcanal!=='TODOS'&&text(r.SUBCANAL)!==subcanal)return false
    return true
  })
}
function rowsForExport(type,rows){const c=DATABASE_CONFIG[type];return rows.map(row=>Object.fromEntries(c.columns.map(([key,label])=>[label,row[key]??''])))}
export async function exportDatabaseExcel(type,rows){
 const c=DATABASE_CONFIG[type],wb=XLSX.utils.book_new()
 const data=rowsForExport(type,rows)
 const resolved=type==='visitas'?await resolvePhotoLinks(data,['Foto de Fachada','Foto interior']):data
 const ws=XLSX.utils.json_to_sheet(resolved)
 setPhotoColumnWidths(ws,c.columns.map(([,label])=>label))
 if(type==='visitas')addPhotoHyperlinks(ws,c.columns.map(([,label])=>label),resolved)
 XLSX.utils.book_append_sheet(wb,ws,c.sheet)
 XLSX.writeFile(wb,`${c.sheet}_${peruDateKey()}.xlsx`,{compression:true})
}
export async function exportAllDatabasesExcel(data){
 const wb=XLSX.utils.book_new()
 for(const type of ALL_TYPES){
  const c=DATABASE_CONFIG[type]
  const raw=rowsForExport(type,data[type]||[])
  const resolved=type==='visitas'?await resolvePhotoLinks(raw,['Foto de Fachada','Foto interior']):raw
  const ws=XLSX.utils.json_to_sheet(resolved)
  setPhotoColumnWidths(ws,c.columns.map(([,label])=>label))
 if(type==='visitas')addPhotoHyperlinks(ws,c.columns.map(([,label])=>label),resolved)
  XLSX.utils.book_append_sheet(wb,ws,c.sheet)
 }
 XLSX.writeFile(wb,`PROSPECTA_RTM_3_BBDD_${peruDateKey()}.xlsx`,{compression:true})
}
