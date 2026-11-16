import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { dateRangeFromFilters } from '../lib/dashboardFilters'
import { peruDateKey } from '../lib/date'

export const VALIDATOR_COLUMNS=[
  {key:'CANAL_PRINCIPAL',label:'Canal Principal'},
  {key:'SUBCANAL',label:'Subcanal'},
  {key:'RUC_CLIENTE',label:'RUC'},
  {key:'DNI_CLIENTE',label:'DNI Cliente'},
  {key:'RAZON_SOCIAL',label:'Razón Social'},
  {key:'CORREO_ELECTRONICO',label:'Correo electrónico'},
  {key:'TELEFONO_CELULAR_1',label:'Teléfono Celular 1'},
  {key:'TELEFONO_CELULAR_2',label:'Teléfono Celular 2'},
  {key:'VIA_TIPO',label:'Vía Tipo'},
  {key:'DIRECCION_CLIENTE',label:'Dirección'},
  {key:'NUMERO_DIRECCION',label:'Número'},
  {key:'MANZANA',label:'Manzana'},
  {key:'LOTE',label:'Lote'},
  {key:'SECCION',label:'Sección'},
  {key:'INTERIOR',label:'Interior'},
  {key:'DEPARTAMENTO',label:'Departamento'},
  {key:'PROVINCIA',label:'Provincia'},
  {key:'DISTRITO',label:'Distrito'},
  {key:'UBIGEO',label:'Ubigeo'},
  {key:'UBICACION_REFERENCIA',label:'Ubicación'},
  {key:'LOCACION_COMERCIAL',label:'Locación Comercial'},
  {key:'RUTA',label:'Ruta'},
  {key:'SEGMENTO',label:'Segmento'},
  {key:'REPRESENTANTE_LEGAL',label:'Representante Legal'},
  {key:'NOMBRE_VENDEDOR',label:'Nombre del vendedor'},
  {key:'CODIGO_VENDEDOR',label:'Código de vendedor'},
  {key:'SEGMENTO_ACD',label:'Segmento ACD'},
  {key:'UBICACION_ALTA',label:'Ubicación'},
  {key:'DOC_DNI_CE_FRENTE',label:'DNI – CE (Frente)',document:true},
  {key:'DOC_DNI_CE_ATRAS',label:'DNI – CE (Atrás)',document:true},
  {key:'DOC_RUC',label:'RUC documento',document:true},
  {key:'DOC_RECIBO_SERVICIOS',label:'Recibo Servicios / Renta',document:true},
  {key:'DOC_FICHA_CARACTERIZACION',label:'Ficha Caracterización',document:true},
  {key:'DOC_FOTO_LOCAL',label:'Foto de Fachada',document:true,publicFacade:true},
  {key:'FOTO_INTERIOR',label:'Foto interior',document:true},
]

const demoRows=[{
  id:'demo-v4-2',USUARIO:'43572700',NOMBRE_PROSPECTOR:'Fiorella Natali Rossi Huanqui',REGION:'Lima',LOCACION:'Lima Centro',FECHA:peruDateKey(),CANAL_PRINCIPAL:'Tradicional',SUBCANAL:'Bodegas',DNI_CLIENTE:'74851236',RAZON_SOCIAL:'Bodega Central',TELEFONO_CELULAR_1:'999888777',DIRECCION_CLIENTE:'Av. Principal 123',LOCACION_COMERCIAL:'24 IMPERIOS HUACHO',RUTA:'01',SEGMENTO:'011 Lunes',SEGMENTO_ACD:'001 Lunes – Jueves',UBICACION_CAPTURADA:'Av. Principal 123, Lima',UBICACION_CAPTURADA_LAT:-12.09,UBICACION_CAPTURADA_LONG:-77.03,REGISTRADO:false,ESTADO_REGISTRO:'PENDIENTE',GEOLOCALIZADO:false,ENVIO_WHATSAPP:false,FECHA_APROBADOR:null,FIN_ISO:new Date().toISOString(),
}]

export async function getValidatorRows(filters={}){
  if(DEMO_MODE)return demoRows.map(r=>({...r,UBICACION_ALTA:`${r.UBICACION_CAPTURADA} · ${r.UBICACION_CAPTURADA_LAT}, ${r.UBICACION_CAPTURADA_LONG}`}))
  const range=dateRangeFromFilters(filters)
  let q=supabase.from(COLLECTIONS.VISITS).select('*').eq('ESTADO','FINALIZADA').eq('CLIENTE_EXITOSO','SI').order('FECHA',{ascending:false}).order('HORA_FIN_VISITA',{ascending:false})
  if(range.from)q=q.gte('FECHA',range.from)
  if(range.to)q=q.lte('FECHA',range.to)
  if(Array.isArray(filters.regions)&&filters.regions.length)q=q.in('REGION',filters.regions)
  else if(filters.region&&filters.region!=='TODAS')q=q.eq('REGION',filters.region)
  if(Array.isArray(filters.locations)&&filters.locations.length)q=q.in('LOCACION',filters.locations)
  else if(filters.location&&filters.location!=='TODAS')q=q.eq('LOCACION',filters.location)
  const rows=[]
  for(let offset=0;;offset+=750){
    const {data:page,error}=await q.range(offset,offset+749)
    if(error)throw error
    rows.push(...(page||[]))
    if(!page||page.length<750)break
  }
  if(!rows.length)return []
  // Consultas IN por lotes para evitar HTTP 400 por URL excesivamente larga.
  const ids=rows.map(x=>x.id)
  const users=[...new Set(rows.map(x=>String(x.USUARIO)).filter(Boolean))]
  const batch=async (table,columns,key,values)=>{
    const all=[]
    for(let i=0;i<values.length;i+=80){
      const {data,error}=await supabase.from(table).select(columns).in(key,values.slice(i,i+80))
      if(error)throw new Error(`Error al consultar ${table}: ${error.message}`)
      all.push(...(data||[]))
    }
    return all
  }
  const [registrations,profiles]=await Promise.all([
    batch(COLLECTIONS.VALIDATOR_REGISTRATION,'*','VISITA_ID',ids),
    batch(COLLECTIONS.USERS,'USUARIO,NOMBRE,APELLIDO','USUARIO',users),
  ])
  const regMap=new Map((registrations||[]).map(x=>[String(x.VISITA_ID),x]))
  const names=new Map((profiles||[]).map(x=>[String(x.USUARIO),`${x.NOMBRE||''} ${x.APELLIDO||''}`.trim()]))
  return rows.map(v=>({
    ...v,
    NOMBRE_PROSPECTOR:names.get(String(v.USUARIO))||'',
    UBICACION_ALTA:[v.UBICACION_CAPTURADA,[v.UBICACION_CAPTURADA_LAT,v.UBICACION_CAPTURADA_LONG].every(x=>x!==null&&x!==undefined)?`${Number(v.UBICACION_CAPTURADA_LAT).toFixed(6)}, ${Number(v.UBICACION_CAPTURADA_LONG).toFixed(6)}`:''].filter(Boolean).join(' · '),
    REGISTRADO:regMap.get(String(v.id))?.REGISTRADO===true,
    ESTADO_REGISTRO:regMap.get(String(v.id))?.ESTADO_REGISTRO||(regMap.get(String(v.id))?.REGISTRADO===true?'COMPLETADO':'PENDIENTE'),
    GEOLOCALIZADO:regMap.get(String(v.id))?.GEOLOCALIZADO===true,
    ENVIO_WHATSAPP:regMap.get(String(v.id))?.ENVIO_WHATSAPP===true,
    FECHA_APROBADOR:regMap.get(String(v.id))?.FECHA_APROBADOR||null,
    VALIDADOR_USUARIO:regMap.get(String(v.id))?.VALIDADOR_USUARIO||'',
    CODIGO_CLIENTE_SAP:regMap.get(String(v.id))?.CODIGO_CLIENTE_SAP||'',
    CODIGO_ENLACE:regMap.get(String(v.id))?.CODIGO_ENLACE||'',
  }))
}

export async function setValidatorStatus(user,row,status){
  const normalized=String(status||'PENDIENTE').toUpperCase()
  if(!['PENDIENTE','COMPLETADO','RECHAZADO'].includes(normalized))throw new Error('Estado de registro inválido.')
  if(DEMO_MODE)return {...row,ESTADO_REGISTRO:normalized,REGISTRADO:normalized==='COMPLETADO',VALIDADOR_USUARIO:user.usuario}
  const processed=normalized!=='PENDIENTE'
  const payload={VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,ESTADO_REGISTRO:normalized,REGISTRADO:normalized==='COMPLETADO',FECHA_REGISTRO:processed?new Date().toISOString():null,UPDATED_AT:new Date().toISOString()}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert(payload,{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,ESTADO_REGISTRO:data.ESTADO_REGISTRO||normalized,REGISTRADO:data.REGISTRADO===true,VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}

export async function setValidatorRegistered(user,row,registered){
  return setValidatorStatus(user,row,registered?'COMPLETADO':'PENDIENTE')
}

export async function setValidatorGeolocated(user,row,checked){
  if(DEMO_MODE)return {...row,GEOLOCALIZADO:Boolean(checked),VALIDADOR_USUARIO:user.usuario}
  const payload={VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,GEOLOCALIZADO:Boolean(checked),UPDATED_AT:new Date().toISOString()}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert(payload,{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,GEOLOCALIZADO:data.GEOLOCALIZADO===true,VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}


export async function setValidatorWhatsAppSent(user,row,checked){
  if(DEMO_MODE)return {...row,ENVIO_WHATSAPP:Boolean(checked),VALIDADOR_USUARIO:user.usuario}
  const payload={VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,ENVIO_WHATSAPP:Boolean(checked),UPDATED_AT:new Date().toISOString()}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert(payload,{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,ENVIO_WHATSAPP:data.ENVIO_WHATSAPP===true,VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}

export async function setValidatorApprovalDate(user,row,dateValue){
  const value=String(dateValue||'').trim()||null
  if(DEMO_MODE)return {...row,FECHA_APROBADOR:value,VALIDADOR_USUARIO:user.usuario}
  const payload={VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,FECHA_APROBADOR:value,UPDATED_AT:new Date().toISOString()}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert(payload,{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,FECHA_APROBADOR:data.FECHA_APROBADOR||null,VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}

export async function setValidatorSapCode(user,row,codigoSap){
  const code=String(codigoSap??'').trim()
  if(DEMO_MODE)return {...row,CODIGO_CLIENTE_SAP:code,VALIDADOR_USUARIO:user.usuario}
  const payload={VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,CODIGO_CLIENTE_SAP:code,UPDATED_AT:new Date().toISOString()}
  const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert(payload,{onConflict:'VISITA_ID'}).select().single()
  if(error)throw error
  return {...row,CODIGO_CLIENTE_SAP:data.CODIGO_CLIENTE_SAP||'',REGISTRADO:data.REGISTRADO===true,ESTADO_REGISTRO:data.ESTADO_REGISTRO||(data.REGISTRADO===true?'COMPLETADO':'PENDIENTE'),GEOLOCALIZADO:data.GEOLOCALIZADO===true,ENVIO_WHATSAPP:data.ENVIO_WHATSAPP===true,FECHA_APROBADOR:data.FECHA_APROBADOR||null,VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}

export async function setValidatorEnlaceCode(user,row,codigoEnlace){
 const code=String(codigoEnlace??'').trim()
 if(DEMO_MODE)return {...row,CODIGO_ENLACE:code,VALIDADOR_USUARIO:user.usuario}
 const {data,error}=await supabase.from(COLLECTIONS.VALIDATOR_REGISTRATION).upsert({VISITA_ID:row.id,VALIDADOR_USUARIO:user.usuario,CODIGO_ENLACE:code,UPDATED_AT:new Date().toISOString()},{onConflict:'VISITA_ID'}).select().single()
 if(error)throw error
 return {...row,CODIGO_ENLACE:data.CODIGO_ENLACE||'',VALIDADOR_USUARIO:data.VALIDADOR_USUARIO}
}
