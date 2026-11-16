import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../lib/constants'
import { DEMO_USERS } from '../data/demoData'

const DEMO_KEY='prospecta-admin-users-demo'
const text=(value)=>String(value??'').trim()
const normalizeRole=(value)=>{const role=text(value).toLowerCase();if(role.startsWith('admin'))return'Administrador';if(role.startsWith('coord'))return'Coordinador Regional';if(role.startsWith('super'))return'Supervisor';if(role.startsWith('valid')||role.startsWith('desarr')||role.startsWith('dev'))return'Validador';return'Prospector'}
const normalizeStatus=(value)=>text(value).toUpperCase()==='ACTIVO'?'ACTIVO':'INACTIVO'
const normalizeProfile=(raw={})=>({usuario:text(raw.usuario??raw.Usuario??raw.USUARIO),nombre:text(raw.nombre??raw.Nombre??raw.NOMBRE),apellido:text(raw.apellido??raw.Apellido??raw.APELLIDO),celular:text(raw.celular??raw.Celular??raw.CELULAR),region:text(raw.region??raw['Región']??raw.Region??raw.REGION),locacion:text(raw.locacion??raw['Locación']??raw.Locacion??raw.LOCACION),rol:normalizeRole(raw.rol??raw.Rol??raw.ROL),status:normalizeStatus(raw.status??raw.Status??raw.STATUS),vigente:raw.vigente??raw.EN_PLANTILLA_VIGENTE??true,uid:text(raw.uid??raw.UID_AUTH),email:text(raw.email??raw.EMAIL_AUTH)})

function demoUsers(){const base=DEMO_USERS.map(({password,...user})=>normalizeProfile(user));try{const saved=JSON.parse(localStorage.getItem(DEMO_KEY)||'[]');return saved.length?saved:base}catch{return base}}

export async function listUsers(){
  if(DEMO_MODE)return demoUsers().sort((a,b)=>`${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`))
  const {data,error}=await supabase.from('USUARIOS').select('*').eq('EN_PLANTILLA_VIGENTE',true).order('NOMBRE').order('APELLIDO')
  if(error)throw error
  return (data||[]).map(normalizeProfile)
}

async function adminRequest(body){
  const getFreshSession=async(forceRefresh=false)=>{
    if(forceRefresh){
      const {data,error}=await supabase.auth.refreshSession()
      if(error)throw new Error('No se pudo renovar tu sesión. Cierra sesión e ingresa nuevamente.')
      return data?.session||null
    }
    const {data:{session}}=await supabase.auth.getSession()
    if(!session)return null
    const expiresAt=(session.expires_at||0)*1000
    if(expiresAt && expiresAt-Date.now()<120000){
      const {data,error}=await supabase.auth.refreshSession()
      if(error)return session
      return data?.session||session
    }
    return session
  }
  const send=async(session)=>{
    try {
      return await fetch('/.netlify/functions/admin-users-snapshot',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`},body:JSON.stringify(body)})
    } catch {
      throw new Error('No se pudo conectar con la función de gestión de usuarios. Revisa el despliegue de Netlify.')
    }
  }
  let session=await getFreshSession(false)
  if(!session?.access_token)throw new Error('Tu sesión expiró. Cierra sesión e ingresa nuevamente.')
  let res=await send(session)
  if(res.status===401){
    session=await getFreshSession(true)
    if(!session?.access_token)throw new Error('Tu sesión expiró. Cierra sesión e ingresa nuevamente.')
    res=await send(session)
  }
  const raw=await res.text()
  let json={}
  try { json=raw?JSON.parse(raw):{} } catch { json={} }
  if(!res.ok){
    if(res.status===404) throw new Error('La función admin-users-snapshot no está desplegada en Netlify. Publica el proyecto completo con Netlify CLI; no solo la carpeta dist.')
    if(res.status===401) throw new Error(json.message||'Tu sesión no pudo validarse. Cierra sesión e ingresa nuevamente.')
    if(res.status===403) throw new Error(json.message||'No tienes permisos de Administrador para realizar esta acción.')
    throw new Error(json.message||`No fue posible procesar la solicitud de usuarios (HTTP ${res.status}).`)
  }
  return json
}

export async function saveUser(user){
  if(DEMO_MODE){const arr=demoUsers(),normalized=normalizeProfile(user),i=arr.findIndex(x=>x.usuario===normalized.usuario);if(i>=0)arr[i]=normalized;else arr.push(normalized);localStorage.setItem(DEMO_KEY,JSON.stringify(arr));return{...normalized,action:i>=0?'ACTUALIZADO':'CREADO'}}
  const result=await adminRequest({action:'upsert',user})
  return result.result
}

export async function deleteUser(usuario){
  if(DEMO_MODE){const arr=demoUsers().map(u=>u.usuario===usuario?{...u,status:'INACTIVO',uid:'',email:''}:u);localStorage.setItem(DEMO_KEY,JSON.stringify(arr));return{ok:true}}
  const result=await adminRequest({action:'delete',usuario})
  return result.result
}

export async function bulkSaveUsers(users,onProgress){
  if(DEMO_MODE){const current=demoUsers(),results=[];for(const row of users){const n=normalizeProfile(row),i=current.findIndex(x=>x.usuario===n.usuario);if(i>=0)current[i]=n;else current.push(n);results.push({ok:true,...n,action:i>=0?'ACTUALIZADO':'CREADO'})}localStorage.setItem(DEMO_KEY,JSON.stringify(current));onProgress?.(users.length,users.length);return results}
  const size=25,results=[]
  for(let start=0;start<users.length;start+=size){const chunk=users.slice(start,start+size);const response=await adminRequest({action:'bulk',users:chunk});results.push(...(response.results||[]));onProgress?.(Math.min(start+chunk.length,users.length),users.length)}
  return results
}

export async function finalizeUsersSnapshot(usuarios){
  if(DEMO_MODE){const keep=new Set(usuarios.map(text));const current=demoUsers().filter(u=>keep.has(u.usuario));localStorage.setItem(DEMO_KEY,JSON.stringify(current));return current.length}
  const result=await adminRequest({action:'finalize_snapshot',usuarios})
  return result.result
}

export async function syncUsersFromTemplate(users,onProgress){
  if(DEMO_MODE){
    const results=await bulkSaveUsers(users,onProgress)
    if(results.some(r=>!r.ok))return results
    await finalizeUsersSnapshot(users.map(u=>u.usuario))
    return results
  }
  const result=await adminRequest({action:'sync_snapshot',users})
  const results=result.results||[]
  onProgress?.(users.length,users.length)
  return results
}

export async function uploadLatestBaseFile(baseKey,file){
  if(DEMO_MODE){return {baseKey,fileName:file.name,uploadedAt:new Date().toISOString()}}
  const ext=(file.name.split('.').pop()||'xlsx').toLowerCase()
  const path=`${baseKey}/vigente.${ext}`
  const {error:uploadError}=await supabase.storage.from('admin-maestros').upload(path,file,{upsert:true,contentType:file.type||'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})
  if(uploadError)throw uploadError
  const {error}=await supabase.from('ADMIN_BASE_FILES').upsert({BASE_KEY:baseKey,FILE_NAME:file.name,STORAGE_PATH:path,UPDATED_AT:new Date().toISOString()},{onConflict:'BASE_KEY'})
  if(error)throw error
  return {baseKey,fileName:file.name,path}
}

export async function getLatestBaseFile(baseKey){
  if(DEMO_MODE)return null
  const {data,error}=await supabase.from('ADMIN_BASE_FILES').select('*').eq('BASE_KEY',baseKey).maybeSingle()
  if(error)throw error
  return data
}

export async function downloadLatestBaseFile(baseKey){
  const meta=await getLatestBaseFile(baseKey)
  if(!meta)throw new Error('Aún no hay un archivo vigente cargado para esta base.')
  const {data,error}=await supabase.storage.from('admin-maestros').download(meta.STORAGE_PATH)
  if(error)throw error
  const url=URL.createObjectURL(data);const a=document.createElement('a');a.href=url;a.download=meta.FILE_NAME||`${baseKey}.xlsx`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)
}

const headerKey=(value)=>text(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
function valueByHeader(row,aliases){const entries=Object.entries(row);for(const alias of aliases){const wanted=headerKey(alias),found=entries.find(([key])=>headerKey(key)===wanted);if(found)return found[1]}return''}

export async function parseUsersExcel(file){
  const buffer=await file.arrayBuffer(),workbook=XLSX.read(buffer,{type:'array',cellDates:false}),sheet=workbook.Sheets['Usuario&Contraseña']
  if(!sheet)throw new Error('El Excel debe contener una hoja llamada "Usuario&Contraseña".')
  const rawRows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:true})
  const rows=rawRows.map(row=>{const rol=normalizeRole(valueByHeader(row,['Rol']));return{usuario:text(valueByHeader(row,['Usuario'])),password:text(valueByHeader(row,['Contraseña','Contrasena','Password'])),nombre:text(valueByHeader(row,['Nombre'])),apellido:text(valueByHeader(row,['Apellido'])),celular:text(valueByHeader(row,['Celular','Teléfono','Telefono'])),region:text(valueByHeader(row,['Región','Region'])),locacion:['Supervisor','Coordinador Regional'].includes(rol)?'':text(valueByHeader(row,['Locación','Locacion'])),rol,status:normalizeStatus(valueByHeader(row,['Status','Estado']))}}).filter(r=>r.usuario)
  if(!rows.length)throw new Error('No se encontraron usuarios en la hoja "Usuario&Contraseña".')
  const missing=rows.filter(r=>!r.nombre||!r.apellido||!r.celular||!r.region||(!['Supervisor','Coordinador Regional'].includes(r.rol)&&!r.locacion))
  if(missing.length)throw new Error(`Hay ${missing.length} fila(s) con Nombre, Apellido, Celular, Región o Locación incompletos (Locación no aplica a Supervisor ni Coordinador Regional).`)
  return rows
}

export function downloadUsersTemplate(){
  const workbook=XLSX.utils.book_new()
  const sheet=XLSX.utils.aoa_to_sheet([['Usuario','Contraseña','Nombre','Apellido','Celular','Región','Locación','Rol','Status'],['12345678','Clave123','Nombre','Apellido','999999999','Lima','Lima Centro','Prospector','ACTIVO']])
  XLSX.utils.book_append_sheet(workbook,sheet,'Usuario&Contraseña')
  XLSX.writeFile(workbook,'PLANTILLA_USUARIOS_PROSPECTA_RTM.xlsx',{compression:true})
}
