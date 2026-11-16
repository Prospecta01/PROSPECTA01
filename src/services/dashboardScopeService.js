import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../lib/constants'
import { DEMO_USERS } from '../data/demoData'

const clean=(value)=>String(value??'').trim()
const isActive=(value)=>clean(value).toUpperCase()==='ACTIVO'
const isVisibleLocation=(value)=>clean(value).toLocaleLowerCase('es')!=='la molina'

function buildOptions(rows=[],viewer={}){
  const viewerRole=clean(viewer?.rol)
  const viewerRegion=clean(viewer?.region)
  const scoped=rows.filter((row)=>{
    const status=row.STATUS??row.status
    const region=clean(row.REGION??row.region)
    const location=clean(row.LOCACION??row.locacion)
    if(!isActive(status)||!region||!location||!isVisibleLocation(location))return false
    if((viewerRole==='Supervisor'||viewerRole==='Coordinador Regional')&&viewerRegion&&region!==viewerRegion)return false
    return true
  })
  const map={}
  scoped.forEach((row)=>{
    const region=clean(row.REGION??row.region)
    const location=clean(row.LOCACION??row.locacion)
    if(!map[region])map[region]=new Set()
    map[region].add(location)
  })
  const regions=Object.keys(map).sort((a,b)=>a.localeCompare(b,'es'))
  const locationsByRegion={}
  regions.forEach((region)=>{locationsByRegion[region]=Array.from(map[region]).sort((a,b)=>a.localeCompare(b,'es'))})
  return {regions,locationsByRegion}
}

export async function getDashboardScopeOptions(viewer={}){
  if(DEMO_MODE)return buildOptions(DEMO_USERS,viewer)
  const {data,error}=await supabase.rpc('get_active_dashboard_scope_options')
  if(error)throw error
  return buildOptions((data||[]).map((row)=>({REGION:row.region,LOCACION:row.locacion,STATUS:'ACTIVO'})),viewer)
}
