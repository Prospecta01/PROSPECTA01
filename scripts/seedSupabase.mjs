import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
const require=createRequire(import.meta.url)
const XLSX=require('xlsx')
import { createClient } from '@supabase/supabase-js'

const url=process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
if(!url || !serviceKey){console.error('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en .env');process.exit(1)}

const input=process.argv[2] || 'data/Base_App_Prospeccion.xlsx'
const file=path.resolve(input)
if(!fs.existsSync(file)){console.error(`No existe el archivo: ${file}`);process.exit(1)}

const client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
const text=(v)=>String(v??'').trim()
const key=(v)=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')
const val=(row,names)=>{const e=Object.entries(row);for(const name of names){const f=e.find(([k])=>key(k)===key(name));if(f)return f[1]}return''}
const normRole=(v)=>{const x=text(v).toLowerCase();return x.startsWith('admin')?'Administrador':x.startsWith('coord')?'Coordinador Regional':x.startsWith('super')?'Supervisor':(x.startsWith('valid')||x.startsWith('desarr')||x.startsWith('dev'))?'Validador':'Prospector'}
const normStatus=(v)=>text(v).toUpperCase()==='ACTIVO'?'ACTIVO':'INACTIVO'
const emailFor=(u)=>`${text(u).toLowerCase()}@prospecta-rtm.app`

const wb=XLSX.readFile(file)
const sheet=wb.Sheets['Usuario&Contraseña']
if(!sheet){console.error('El Excel no contiene la hoja Usuario&Contraseña');process.exit(1)}
const rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:true}).map(r=>({
  usuario:text(val(r,['Usuario'])), password:text(val(r,['Contraseña','Contrasena','Password'])),
  nombre:text(val(r,['Nombre'])), apellido:text(val(r,['Apellido'])), region:text(val(r,['Región','Region'])),
  locacion:text(val(r,['Locación','Locacion'])), rol:normRole(val(r,['Rol'])), status:normStatus(val(r,['Status','Estado']))
})).filter(r=>r.usuario)

const {data:profiles,error:profileError}=await client.from('USUARIOS').select('*')
if(profileError){console.error('No se pudo leer USUARIOS. ¿Ejecutaste primero supabase/01_schema_y_seguridad.sql?',profileError.message);process.exit(1)}
const profileMap=new Map((profiles||[]).map(p=>[String(p.USUARIO),p]))
const {data:listData,error:listError}=await client.auth.admin.listUsers({page:1,perPage:1000})
if(listError){console.error(listError.message);process.exit(1)}
const authByEmail=new Map((listData.users||[]).map(u=>[u.email,u]))

let created=0,updated=0,failed=0
for(const row of rows){
  try{
    if(!row.nombre||!row.apellido||!row.region||!row.locacion)throw new Error('Faltan Nombre, Apellido, Región o Locación')
    const existing=profileMap.get(row.usuario)
    const email=existing?.EMAIL_AUTH || emailFor(row.usuario)
    let uid=existing?.UID_AUTH || authByEmail.get(email)?.id || ''
    if(!uid){
      if(row.password.length<6)throw new Error('Contraseña menor a 6 caracteres')
      const {data,error}=await client.auth.admin.createUser({email,password:row.password,email_confirm:true,user_metadata:{usuario:row.usuario,nombre:row.nombre,apellido:row.apellido}})
      if(error)throw error
      uid=data.user.id;created++
    }else{
      const changes={email,user_metadata:{usuario:row.usuario,nombre:row.nombre,apellido:row.apellido}}
      if(row.password){if(row.password.length<6)throw new Error('Contraseña menor a 6 caracteres');changes.password=row.password}
      const {error}=await client.auth.admin.updateUserById(uid,changes)
      if(error)throw error
      updated++
    }
    const {error}=await client.from('USUARIOS').upsert({USUARIO:row.usuario,UID_AUTH:uid,NOMBRE:row.nombre,APELLIDO:row.apellido,REGION:row.region,LOCACION:row.locacion,ROL:row.rol,STATUS:row.status,EMAIL_AUTH:email,UPDATED_AT:new Date().toISOString()},{onConflict:'USUARIO'})
    if(error)throw error
    console.log(`OK ${row.usuario} | ${row.nombre} ${row.apellido} | ${row.rol} | ${row.status}`)
  }catch(error){failed++;console.error(`ERROR ${row.usuario}: ${error.message}`)}
}
console.log(`\nTerminado. Creados: ${created} | Actualizados: ${updated} | Errores: ${failed}`)
if(failed)process.exitCode=2
