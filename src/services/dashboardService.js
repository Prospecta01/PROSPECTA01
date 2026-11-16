import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { DEMO_TEAM, DEMO_WEEK } from '../data/demoData'
import { dateRangeFromFilters } from '../lib/dashboardFilters'
import { DAILY_PRODUCTIVITY_TARGET, productivityPct } from '../lib/productivity'

const unique=(values)=>Array.from(new Set(values.filter(Boolean)))
const toMinutes=(value)=>{const [h,m]=String(value||'').slice(0,5).split(':').map(Number);return Number.isFinite(h)&&Number.isFinite(m)?h*60+m:null}
const avgTime=(records)=>{
  const vals=records.map(r=>toMinutes(r.HORA_INICIO)).filter(v=>v!==null)
  if(!vals.length)return '--:--'
  const total=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
  return `${String(Math.floor(total/60)%24).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`
}

const summarize=(team,visits,starts,activeDays,productivityRows=[])=>{
  const altas=visits.filter(v=>v.CLIENTE_EXITOSO==='SI').length
  const totalVisits=visits.length
  const attendanceDays=unique(starts.map(s=>`${s.USUARIO}|${s.FECHA}`)).length
  const days=Math.max(activeDays,1)
  const attendanceDenominator=team.length*days
  const storedAltas=productivityRows.reduce((a,r)=>a+(Number(r.ALTAS)||0),0)
  const storedMeta=productivityRows.reduce((a,r)=>a+(Number(r.META_ALTAS)||0),0)
  const fallbackMeta=team.length*DAILY_PRODUCTIVITY_TARGET*days
  const metaAltas=storedMeta||fallbackMeta
  const productivityAltas=storedMeta?storedAltas:altas
  return {
    prospectores:team.length,
    asistenciaPct:attendanceDenominator?Math.min(100,Math.round((attendanceDays/attendanceDenominator)*100)):0,
    visitas:totalVisits,
    altas,
    productividad:metaAltas?Math.round((productivityAltas/metaAltas)*100):0,
    diasOperativos:activeDays,
    metaAltas,
  }
}

const demoDashboard=(filters={})=>{
  const range=dateRangeFromFilters(filters)
  let team=DEMO_TEAM.filter(x=>(filters.region==='TODAS'||!filters.region||x.region===filters.region)&&(filters.location==='TODAS'||!filters.location||x.locacion===filters.location))
  const activeDays=range.mode==='year'?22:range.mode==='month'?4:1
  team=team.map(x=>{
    const visitas=x.visitas*activeDays,altas=x.altas*activeDays
    return {...x,visitas,altas,productividad:productivityPct(altas,activeDays),asistencia:range.mode==='day'?x.asistencia:'88%',horaInicio:range.mode==='day'?x.horaInicio:'08:06'}
  })
  const totalVisits=team.reduce((a,x)=>a+x.visitas,0),totalAltas=team.reduce((a,x)=>a+x.altas,0)
  const metaAltas=team.length*DAILY_PRODUCTIVITY_TARGET*activeDays
  return {kpis:{prospectores:team.length,asistenciaPct:team.length?88:0,visitas:totalVisits,altas:totalAltas,productividad:metaAltas?Math.round((totalAltas/metaAltas)*100):0,diasOperativos:activeDays,metaAltas},team,week:DEMO_WEEK.map(x=>({...x,visitas:x.visitas*activeDays,altas:x.altas*activeDays}))}
}

async function fetchAll(factory,pageSize=1000){
  let rows=[],from=0
  while(true){
    const {data=[],error}=await factory().range(from,from+pageSize-1)
    if(error)throw error
    rows=rows.concat(data)
    if(data.length<pageSize)break
    from+=pageSize
  }
  return rows
}

function applyDateRange(query,range){
  if(range.from)query=query.gte('FECHA',range.from)
  if(range.to)query=query.lte('FECHA',range.to)
  return query
}

function trendFromVisits(visits){
  const map=new Map()
  visits.forEach(v=>{
    const key=String(v.FECHA||'')
    if(!key)return
    const row=map.get(key)||{fecha:key,visitas:0,altas:0}
    row.visitas+=1
    if(v.CLIENTE_EXITOSO==='SI')row.altas+=1
    map.set(key,row)
  })
  return Array.from(map.values()).sort((a,b)=>a.fecha.localeCompare(b.fecha)).slice(-14).map(x=>({dia:x.fecha.slice(5).split('-').reverse().join('/'),visitas:x.visitas,altas:x.altas}))
}

export async function getDashboardData(user,filters={}){
  if(DEMO_MODE)return demoDashboard(filters)
  const range=dateRangeFromFilters(filters)
  const selectedRegion=filters.region&&filters.region!=='TODAS'?filters.region:''
  const selectedLocation=filters.location&&filters.location!=='TODAS'?filters.location:''

  const users=await fetchAll(()=>{
    let q=supabase.from(COLLECTIONS.USERS).select('*').eq('ROL','Prospector').eq('STATUS','ACTIVO').eq('EN_PLANTILLA_VIGENTE',true).order('NOMBRE')
    if(user.rol!=='Administrador')q=q.eq('REGION',user.region)
    else if(selectedRegion)q=q.eq('REGION',selectedRegion)
    if(selectedLocation)q=q.eq('LOCACION',selectedLocation)
    return q
  })
  const allowed=new Set(users.map(u=>String(u.USUARIO)))

  const starts=await fetchAll(()=>{
    let q=supabase.from(COLLECTIONS.START_DAY).select('*').order('FECHA',{ascending:true})
    q=applyDateRange(q,range)
    if(user.rol!=='Administrador')q=q.eq('REGION',user.region)
    else if(selectedRegion)q=q.eq('REGION',selectedRegion)
    if(selectedLocation)q=q.eq('LOCACION',selectedLocation)
    return q
  })
  const ends=await fetchAll(()=>{
    let q=supabase.from(COLLECTIONS.END_DAY).select('*').order('FECHA',{ascending:true})
    q=applyDateRange(q,range)
    if(user.rol!=='Administrador')q=q.eq('REGION',user.region)
    else if(selectedRegion)q=q.eq('REGION',selectedRegion)
    if(selectedLocation)q=q.eq('LOCACION',selectedLocation)
    return q
  })
  const visits=await fetchAll(()=>{
    let q=supabase.from(COLLECTIONS.VISITS).select('*').eq('ESTADO','FINALIZADA').order('FECHA',{ascending:true})
    q=applyDateRange(q,range)
    if(user.rol!=='Administrador')q=q.eq('REGION',user.region)
    else if(selectedRegion)q=q.eq('REGION',selectedRegion)
    if(selectedLocation)q=q.eq('LOCACION',selectedLocation)
    return q
  })
  const productivity=await fetchAll(()=>{
    let q=supabase.from(COLLECTIONS.PRODUCTIVITY).select('*').order('FECHA',{ascending:true})
    q=applyDateRange(q,range)
    if(user.rol!=='Administrador')q=q.eq('REGION',user.region)
    else if(selectedRegion)q=q.eq('REGION',selectedRegion)
    if(selectedLocation)q=q.eq('LOCACION',selectedLocation)
    return q
  })

  const scopedStarts=starts.filter(s=>allowed.has(String(s.USUARIO)))
  const scopedEnds=ends.filter(e=>allowed.has(String(e.USUARIO)))
  const scopedVisits=visits.filter(v=>allowed.has(String(v.USUARIO)))
  const scopedProductivity=productivity.filter(r=>allowed.has(String(r.USUARIO)))
  const activeDates=unique([...scopedStarts.map(x=>x.FECHA),...scopedVisits.map(x=>x.FECHA)])
  const activeDays=range.mode==='day'?1:activeDates.length
  const exactDay=range.mode==='day'
  const productivityDays=Math.max(activeDays,1)

  const team=users.map(u=>{
    const ownVisits=scopedVisits.filter(v=>String(v.USUARIO)===String(u.USUARIO))
    const ownStarts=scopedStarts.filter(s=>String(s.USUARIO)===String(u.USUARIO))
    const ownEnds=scopedEnds.filter(e=>String(e.USUARIO)===String(u.USUARIO))
    const altas=ownVisits.filter(v=>v.CLIENTE_EXITOSO==='SI').length
    const ownProductivity=scopedProductivity.filter(r=>String(r.USUARIO)===String(u.USUARIO))
    const storedAltas=ownProductivity.reduce((a,r)=>a+(Number(r.ALTAS)||0),0)
    const storedMeta=ownProductivity.reduce((a,r)=>a+(Number(r.META_ALTAS)||0),0)
    const presentDays=unique(ownStarts.map(s=>s.FECHA)).length
    const firstStart=ownStarts[0]
    const lastEnd=ownEnds[ownEnds.length-1]
    return {
      usuario:u.USUARIO,
      nombre:`${u.NOMBRE||''} ${u.APELLIDO||''}`.trim(),
      region:u.REGION||'',locacion:u.LOCACION||'',
      asistencia:exactDay?(firstStart?.CLASIFICACION_INGRESO||'Sin registro').replace('Ingreso ',''):(activeDays?`${Math.round((presentDays/activeDays)*100)}%`:'0%'),
      horaInicio:exactDay?(firstStart?.HORA_INICIO?.slice(0,5)||'--:--'):avgTime(ownStarts),
      statusIngreso:exactDay?(firstStart?.CLASIFICACION_INGRESO||'Sin registro'):(activeDays?`${Math.round((presentDays/activeDays)*100)}%`:'0%'),
      ingresoLat:firstStart?.LATITUD??null, ingresoLng:firstStart?.LONGITUD??null,
      horaSalida:exactDay?(lastEnd?.HORA_FIN?.slice(0,5)||'--:--'):'--:--',
      statusSalida:exactDay?(lastEnd?.CLASIFICACION_FIN||'Sin registro'):'—',
      salidaLat:lastEnd?.LATITUD??null, salidaLng:lastEnd?.LONGITUD??null,
      visitas:ownVisits.length,
      altas,
      productividad:storedMeta?Math.round((storedAltas/storedMeta)*100):productivityPct(altas,productivityDays),
      metaAltas:storedMeta||DAILY_PRODUCTIVITY_TARGET*productivityDays,
    }
  })

  return {kpis:summarize(team,scopedVisits,scopedStarts,activeDays,scopedProductivity),team,week:trendFromVisits(scopedVisits)}
}
