import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'

const text=(v)=>String(v??'').trim()
const headerKey=(v)=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const getByHeader=(row,aliases)=>{for(const [k,v] of Object.entries(row)){if(aliases.some(a=>headerKey(a)===headerKey(k)))return v}return''}
const normalizeRoute=(v)=>{const s=text(v);return /^\d+$/.test(s)?s.padStart(2,'0'):s}

export async function getRouteCatalog(){
  if(DEMO_MODE){
    try{
      const r=await fetch('/Rutas_por_Locacion.xlsx')
      const buffer=await r.arrayBuffer()
      const wb=XLSX.read(buffer,{type:'array'})
      const ws=wb.Sheets[wb.SheetNames[0]]
      return XLSX.utils.sheet_to_json(ws,{defval:'',raw:false}).map(x=>({locacion:text(getByHeader(x,['Locación Comercial','Locacion Comercial'])),ruta:normalizeRoute(getByHeader(x,['Ruta']))})).filter(x=>x.locacion&&x.ruta)
    }catch{return[]}
  }
  const {data,error}=await supabase.from(COLLECTIONS.ROUTES_BY_LOCATION).select('LOCACION_COMERCIAL,RUTA').eq('ACTIVO',true).order('LOCACION_COMERCIAL').order('RUTA')
  if(error)throw error
  return (data||[]).map(x=>({locacion:text(x.LOCACION_COMERCIAL),ruta:normalizeRoute(x.RUTA)}))
}

export async function parseRoutesExcel(file){
  const buffer=await file.arrayBuffer()
  const wb=XLSX.read(buffer,{type:'array',cellDates:false})
  const ws=wb.Sheets[wb.SheetNames[0]]
  if(!ws)throw new Error('El Excel no contiene una hoja válida.')
  const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false})
  const rows=raw.map(r=>({locacion:text(getByHeader(r,['Locación Comercial','Locacion Comercial','Locación'])),ruta:normalizeRoute(getByHeader(r,['Ruta']))})).filter(x=>x.locacion&&x.ruta)
  if(!rows.length)throw new Error('No se encontraron registros. La plantilla debe incluir las columnas Locación Comercial y Ruta.')
  const unique=[];const seen=new Set()
  for(const row of rows){const key=`${row.locacion}|${row.ruta}`;if(!seen.has(key)){seen.add(key);unique.push(row)}}
  return unique
}

export async function replaceRoutesCatalog(rows){
  if(DEMO_MODE)return rows.length
  const {data,error}=await supabase.rpc('replace_rutas_locacion',{p_rows:rows})
  if(error)throw error
  return Number(data)||rows.length
}

export function downloadRoutesTemplate(){
  const wb=XLSX.utils.book_new()
  const ws=XLSX.utils.aoa_to_sheet([['Locación Comercial','Ruta'],['EJEMPLO LOCACIÓN','01']])
  XLSX.utils.book_append_sheet(wb,ws,'Ruta por Locacion')
  XLSX.writeFile(wb,'PLANTILLA_RUTAS_POR_LOCACION.xlsx',{compression:true})
}
