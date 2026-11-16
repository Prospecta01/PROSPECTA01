import { peruDateKey } from './date'

export const MONTHS = [
  ['01','Enero'],['02','Febrero'],['03','Marzo'],['04','Abril'],['05','Mayo'],['06','Junio'],
  ['07','Julio'],['08','Agosto'],['09','Septiembre'],['10','Octubre'],['11','Noviembre'],['12','Diciembre'],
]

const pad=(value)=>String(value).padStart(2,'0')
const lastDay=(year,month)=>new Date(Number(year),Number(month),0).getDate()

export function defaultDashboardFilters(){
  const date=peruDateKey()
  return {year:date.slice(0,4),month:date.slice(5,7),date,region:'TODAS',location:'TODAS'}
}

export function dateRangeFromFilters(filters={}){
  if(filters.dateFrom||filters.dateTo){return {from:filters.dateFrom||null,to:filters.dateTo||null,mode:'range'}}
  if(filters.date){return {from:filters.date,to:filters.date,mode:'day'}}
  const year=filters.year||''
  const month=filters.month||''
  if(year&&month){return {from:`${year}-${month}-01`,to:`${year}-${month}-${pad(lastDay(year,month))}`,mode:'month'}}
  if(year){return {from:`${year}-01-01`,to:`${year}-12-31`,mode:'year'}}
  return {from:null,to:null,mode:'all'}
}

export function syncFilters(next,changed){
  const value={...next}
  if(changed==='date'&&value.date){value.year=value.date.slice(0,4);value.month=value.date.slice(5,7)}
  if((changed==='year'||changed==='month')&&value.date){
    const y=value.date.slice(0,4),m=value.date.slice(5,7)
    if((changed==='year'&&value.year!==y)||(changed==='month'&&value.month!==m))value.date=''
  }
  if(changed==='region')value.location='TODAS'
  return value
}

export function periodLabel(filters={}){
  const range=dateRangeFromFilters(filters)
  if(range.mode==='range')return `Desde ${range.from||'inicio'} hasta ${range.to||'hoy'}`
  if(range.mode==='day')return `Fecha: ${range.from.split('-').reverse().join('/')}`
  if(range.mode==='month'){
    const month=MONTHS.find(([id])=>id===filters.month)?.[1]||filters.month
    return `${month} ${filters.year}`
  }
  if(range.mode==='year')return `Año ${filters.year}`
  return 'Todo el histórico disponible'
}

export function mergeScopeOptions(current={regions:[],locationsByRegion:{}},team=[]){
  const regions=new Set(current.regions||[])
  const locationsByRegion={...(current.locationsByRegion||{})}
  team.forEach((row)=>{
    const region=String(row.region||'').trim(),location=String(row.locacion||'').trim()
    if(!region)return
    regions.add(region)
    const set=new Set(locationsByRegion[region]||[])
    if(location)set.add(location)
    locationsByRegion[region]=Array.from(set).sort((a,b)=>a.localeCompare(b,'es'))
  })
  return {regions:Array.from(regions).sort((a,b)=>a.localeCompare(b,'es')),locationsByRegion}
}
