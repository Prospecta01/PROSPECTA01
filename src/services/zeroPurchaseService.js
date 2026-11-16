import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'

const text=(v)=>String(v??'').trim()
const headerKey=(v)=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const getByHeader=(row,aliases)=>{for(const [k,v] of Object.entries(row)){if(aliases.some(a=>headerKey(a)===headerKey(k)))return v}return''}

export async function parseZeroPurchaseExcel(file){
  const buffer=await file.arrayBuffer()
  const wb=XLSX.read(buffer,{type:'array',cellDates:false})
  const ws=wb.Sheets[wb.SheetNames[0]]
  if(!ws)throw new Error('El Excel no contiene una hoja válida.')
  const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:false})
  const rows=raw.map(r=>({
    codigoSap:text(getByHeader(r,['Código SAP','Codigo SAP','Código cliente SAP','Codigo cliente SAP'])),
    nombreCliente:text(getByHeader(r,['Nombre del cliente','Nombre Cliente','Cliente','Razón Social','Razon Social'])),
    direccion:text(getByHeader(r,['Dirección','Direccion','Dirección exacta','Direccion exacta'])),
    region:text(getByHeader(r,['Región','Region'])),
    locacion:text(getByHeader(r,['Locación','Locacion'])),
  })).filter(r=>r.codigoSap&&r.region)
  if(!rows.length)throw new Error('No se encontraron registros. La plantilla debe incluir Código SAP, Nombre del cliente, Dirección, Región y Locación.')
  const unique=[];const seen=new Set()
  for(const row of rows){const key=`${row.codigoSap}|${row.region}`;if(!seen.has(key)){seen.add(key);unique.push(row)}}
  return unique
}

export async function replaceZeroPurchaseCatalog(rows){
  if(DEMO_MODE)return rows.length
  const {data,error}=await supabase.rpc('replace_clientes_compra_cero',{p_rows:rows})
  if(error)throw error
  return Number(data)||rows.length
}

export function downloadZeroPurchaseTemplate(){
  const wb=XLSX.utils.book_new()
  const ws=XLSX.utils.aoa_to_sheet([
    ['Código SAP','Nombre del cliente','Dirección','Región','Locación'],
    ['10000001','Bodega Ejemplo','Av. Principal 123','Norte','Trujillo'],
  ])
  XLSX.utils.book_append_sheet(wb,ws,'Clientes Compra Cero')
  XLSX.writeFile(wb,'PLANTILLA_CLIENTES_COMPRA_CERO.xlsx',{compression:true})
}

export async function getSupervisorZeroPurchaseData(user){
  if(DEMO_MODE){
    const rows=[
      {id:'z1',CODIGO_SAP:'1001',CLIENTE:'Bodega Central',DIRECCION:'Av. Principal 123',REGION:user.region||'Norte',LOCACION:'Trujillo',VISITA_FISICA:true,REALIZO_COMPRA:true,CANTIDAD_VENDIDA:2,COMENTARIOS:'Compra recuperada'},
      {id:'z2',CODIGO_SAP:'1002',CLIENTE:'Licorería Norte',DIRECCION:'Jr. Comercio 456',REGION:user.region||'Norte',LOCACION:'Chiclayo',VISITA_FISICA:true,REALIZO_COMPRA:false,CANTIDAD_VENDIDA:0,COMENTARIOS:''},
    ]
    return {rows,totalSuccessfulVisits:10}
  }
  const {data:clients,error:ce}=await supabase.from(COLLECTIONS.ZERO_PURCHASE_CLIENTS).select('*').eq('ACTIVO',true).eq('REGION',user.region).order('LOCACION').order('CODIGO_SAP')
  if(ce)throw ce
  const ids=(clients||[]).map(x=>x.id)
  let management=[]
  if(ids.length){
    const {data,error}=await supabase.from(COLLECTIONS.ZERO_PURCHASE_MANAGEMENT).select('*').in('CLIENTE_COMPRA_CERO_ID',ids)
    if(error)throw error
    management=data||[]
  }
  const map=new Map(management.map(x=>[String(x.CLIENTE_COMPRA_CERO_ID),x]))
  const rows=(clients||[]).map(c=>{const g=map.get(String(c.id))||{};return {...c,VISITA_FISICA:g.VISITA_FISICA===true,REALIZO_COMPRA:g.REALIZO_COMPRA===true,CANTIDAD_VENDIDA:Number(g.CANTIDAD_VENDIDA||0),COMENTARIOS:g.COMENTARIOS||'',GESTION_ID:g.id||'',SUPERVISOR_USUARIO:g.SUPERVISOR_USUARIO||''}})
  const {count,error:ve}=await supabase.from(COLLECTIONS.VISITS).select('id',{count:'exact',head:true}).eq('ESTADO','FINALIZADA').eq('CLIENTE_EXITOSO','SI').eq('REGION',user.region)
  if(ve)throw ve
  return {rows,totalSuccessfulVisits:Number(count)||0}
}

export async function saveZeroPurchaseManagement(user,row,patch){
  const next={...row,...patch}
  if(DEMO_MODE)return next
  const payload={
    CLIENTE_COMPRA_CERO_ID:row.id,
    SUPERVISOR_USUARIO:user.usuario,
    VISITA_FISICA:Boolean(next.VISITA_FISICA),
    REALIZO_COMPRA:Boolean(next.REALIZO_COMPRA),
    CANTIDAD_VENDIDA:Math.max(0,Number(next.CANTIDAD_VENDIDA)||0),
    COMENTARIOS:text(next.COMENTARIOS),
    UPDATED_AT:new Date().toISOString(),
  }
  const {data,error}=await supabase.from(COLLECTIONS.ZERO_PURCHASE_MANAGEMENT).upsert(payload,{onConflict:'CLIENTE_COMPRA_CERO_ID'}).select().single()
  if(error)throw error
  return {...row,...data,VISITA_FISICA:data.VISITA_FISICA===true,REALIZO_COMPRA:data.REALIZO_COMPRA===true,CANTIDAD_VENDIDA:Number(data.CANTIDAD_VENDIDA||0),COMENTARIOS:data.COMENTARIOS||'',GESTION_ID:data.id||''}
}
