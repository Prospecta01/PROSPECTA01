import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { DEMO_MODE, SUBCHANNELS } from '../lib/constants'
const clean=v=>String(v??'').trim()
export async function listActiveSubchannels(){
  if(DEMO_MODE)return SUBCHANNELS
  const {data,error}=await supabase.from('CATALOGO_SUBCANALES').select('SUBCANAL').eq('ACTIVO',true).order('ORDEN',{ascending:true})
  if(error)throw error
  return (data||[]).map(r=>r.SUBCANAL)
}
export async function parseSubchannelsExcel(file){
  const wb=XLSX.read(await file.arrayBuffer(),{type:'array'})
  const sheet=wb.Sheets.Subcanales||wb.Sheets[wb.SheetNames[0]]
  const raw=XLSX.utils.sheet_to_json(sheet,{defval:''})
  const values=raw.map(r=>clean(Object.entries(r).find(([k])=>k.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z]/g,'')==='subcanal')?.[1])).filter(Boolean)
  if(!values.length)throw new Error('La plantilla debe contener una columna Subcanal con al menos un registro.')
  if(new Set(values.map(x=>x.toLocaleLowerCase('es'))).size!==values.length)throw new Error('Existen subcanales duplicados.')
  return values
}
export function downloadSubchannelsTemplate(){const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['Subcanal'],...SUBCHANNELS.map(x=>[x])]),'Subcanales');XLSX.writeFile(wb,'PLANTILLA_SUBCANALES.xlsx')}
export async function replaceSubchannels(values){
  if(DEMO_MODE)return values.length
  const {error}=await supabase.rpc('reemplazar_catalogo_subcanales',{p_subcanales:values})
  if(error)throw error
  return values.length
}
