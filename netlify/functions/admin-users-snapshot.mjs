import { createClient } from '@supabase/supabase-js'

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
})
const text = (v) => String(v ?? '').trim()
const role = (v) => { const x=text(v).toLowerCase(); return x.startsWith('admin')?'Administrador':x.startsWith('coord')?'Coordinador Regional':x.startsWith('super')?'Supervisor':(x.startsWith('valid')||x.startsWith('desarr')||x.startsWith('dev'))?'Validador':'Prospector' }
const status = (v) => text(v).toUpperCase()==='ACTIVO'?'ACTIVO':'INACTIVO'
const emailFor = (usuario) => `${text(usuario).toLowerCase()}@prospecta-rtm.app`
const clean = (raw={}) => ({
  usuario:text(raw.usuario ?? raw.USUARIO), password:text(raw.password ?? raw.CONTRASENA),
  nombre:text(raw.nombre ?? raw.NOMBRE), apellido:text(raw.apellido ?? raw.APELLIDO), celular:text(raw.celular ?? raw.CELULAR),
  region:text(raw.region ?? raw.REGION), locacion:text(raw.locacion ?? raw.LOCACION),
  rol:role(raw.rol ?? raw.ROL), status:status(raw.status ?? raw.STATUS),
})

async function assertAdmin(client, token) {
  const { data: authData, error: authError } = await client.auth.getUser(token)
  if (authError || !authData?.user) throw Object.assign(new Error('No se pudo validar la sesión con la configuración privada de Supabase en Netlify. Verifica que SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY pertenezca al mismo proyecto que VITE_SUPABASE_URL.'), { statusCode: 401 })
  const { data: profile, error } = await client.from('USUARIOS').select('*').eq('UID_AUTH', authData.user.id).maybeSingle()
  if (error || !profile || profile.ROL !== 'Administrador' || profile.STATUS !== 'ACTIVO') {
    throw Object.assign(new Error('Solo un Administrador ACTIVO puede gestionar usuarios.'), { statusCode: 403 })
  }
  return { authUser: authData.user, profile }
}

async function upsertOne(client, requester, raw) {
  const user=clean(raw)
  if (!user.usuario || !user.nombre || !user.apellido || !user.celular || !user.region || (!['Supervisor','Coordinador Regional'].includes(user.rol)&&!user.locacion)) throw new Error('Usuario, Nombres, Apellido, Celular y Región son obligatorios; Locación no aplica a Supervisor ni Coordinador Regional.')
  const { data: existing, error: findError } = await client.from('USUARIOS').select('*').eq('USUARIO', user.usuario).maybeSingle()
  if (findError) throw findError
  if (existing?.UID_AUTH === requester.authUser.id && (user.rol !== 'Administrador' || user.status !== 'ACTIVO')) {
    throw new Error('No puedes quitarte tu propio rol Administrador ni desactivarte desde esta sesión.')
  }

  let uid = existing?.UID_AUTH || ''
  let action = existing ? 'ACTUALIZADO' : 'CREADO'
  const email = existing?.EMAIL_AUTH || emailFor(user.usuario)

  if (!uid) {
    if (user.password.length < 6) throw new Error('Para crear un usuario nuevo la contraseña debe tener al menos 6 caracteres.')
    const { data, error } = await client.auth.admin.createUser({
      email, password:user.password, email_confirm:true,
      user_metadata:{ usuario:user.usuario, nombre:user.nombre, apellido:user.apellido },
      app_metadata:{ prospecta_status:user.status, prospecta_role:user.rol },
    })
    if (error) throw error
    uid=data.user.id
  } else {
    const updates={
      email,
      user_metadata:{ usuario:user.usuario, nombre:user.nombre, apellido:user.apellido },
      app_metadata:{ prospecta_status:user.status, prospecta_role:user.rol },
    }
    if (user.password) {
      if (user.password.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres.')
      updates.password=user.password
    }
    const { error } = await client.auth.admin.updateUserById(uid, updates)
    if (error) throw error
  }

  const profile={
    USUARIO:user.usuario, UID_AUTH:uid, NOMBRE:user.nombre, APELLIDO:user.apellido, CELULAR:user.celular, EN_PLANTILLA_VIGENTE:true,
    REGION:user.region, LOCACION:['Supervisor','Coordinador Regional'].includes(user.rol)?null:user.locacion, ROL:user.rol, STATUS:user.status,
    EMAIL_AUTH:email, UPDATED_AT:new Date().toISOString(),
  }
  const { error: upsertError } = await client.from('USUARIOS').upsert(profile,{onConflict:'USUARIO'})
  if (upsertError) throw upsertError
  return { ok:true, usuario:user.usuario, nombre:user.nombre, apellido:user.apellido, celular:user.celular, region:user.region, locacion:['Supervisor','Coordinador Regional'].includes(user.rol)?'':user.locacion, rol:user.rol, status:user.status, uid, email, action }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405,{message:'Método no permitido.'})
  const configuredUrl=process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!configuredUrl || !serviceKey) return json(500,{message:'Faltan VITE_SUPABASE_URL/SUPABASE_URL o SUPABASE_SECRET_KEY en Netlify.'})
  const token=(event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i,'')
  if (!token) return json(401,{message:'Falta la sesión de Supabase.'})

  let tokenProjectUrl=''
  try {
    const payload=JSON.parse(Buffer.from(token.split('.')[1]||'', 'base64url').toString('utf8'))
    const iss=String(payload?.iss||'')
    tokenProjectUrl=iss.replace(/\/auth\/v1\/?$/,'')
  } catch {}
  const norm=(v)=>String(v||'').replace(/\/$/,'').toLowerCase()
  if(tokenProjectUrl && norm(tokenProjectUrl)!==norm(configuredUrl)){
    return json(401,{message:'La sesión pertenece a un proyecto Supabase distinto al configurado en Netlify. Revisa VITE_SUPABASE_URL/SUPABASE_URL y la clave privada del mismo proyecto.'})
  }
  const url=tokenProjectUrl || configuredUrl
  const client=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}})
  try {
    const requester=await assertAdmin(client,token)
    const body=JSON.parse(event.body || '{}')
    if (body.action==='upsert') {
      const result=await upsertOne(client,requester,body.user)
      return json(200,{result})
    }
    if (body.action==='bulk') {
      const rows=Array.isArray(body.users)?body.users.slice(0,50):[]
      const results=[]
      for (const row of rows) {
        try { results.push(await upsertOne(client,requester,row)) }
        catch (error) { results.push({ok:false,usuario:text(row?.usuario),message:error.message||'Error al procesar usuario.'}) }
      }
      return json(200,{results})
    }
    if (body.action==='sync_snapshot') {
      const rows=Array.isArray(body.users)?body.users:[]
      if(!rows.length) return json(400,{message:'La plantilla vigente no contiene usuarios.'})
      const results=[]
      for (const row of rows) {
        try { results.push(await upsertOne(client,requester,row)) }
        catch (error) { results.push({ok:false,usuario:text(row?.usuario),message:error.message||'Error al procesar usuario.'}) }
      }
      const failed=results.filter(r=>!r.ok)
      if(failed.length) return json(400,{message:`${failed.length} usuario(s) presentaron error. La plantilla vigente no fue reemplazada.`,results})
      const usuarios=[...new Set(rows.map(r=>text(r?.usuario)).filter(Boolean))]
      const now=new Date().toISOString()
      const {error:hideError}=await client.from('USUARIOS').update({EN_PLANTILLA_VIGENTE:false,UPDATED_AT:now}).neq('USUARIO','')
      if(hideError) throw hideError
      const {error:showError}=await client.from('USUARIOS').update({EN_PLANTILLA_VIGENTE:true,UPDATED_AT:now}).in('USUARIO',usuarios)
      if(showError) throw showError

      const {data:visible,error:verifyError}=await client.from('USUARIOS').select('USUARIO').eq('EN_PLANTILLA_VIGENTE',true)
      if(verifyError) throw verifyError
      const allowed=new Set(usuarios)
      const extras=(visible||[]).map(r=>text(r.USUARIO)).filter(u=>u && !allowed.has(u))
      if(extras.length){
        const {error:forceHideError}=await client.from('USUARIOS').update({EN_PLANTILLA_VIGENTE:false,UPDATED_AT:new Date().toISOString()}).in('USUARIO',extras)
        if(forceHideError) throw forceHideError
      }
      const {data:finalVisible,error:finalVerifyError}=await client.from('USUARIOS').select('USUARIO').eq('EN_PLANTILLA_VIGENTE',true)
      if(finalVerifyError) throw finalVerifyError
      const finalUsers=(finalVisible||[]).map(r=>text(r.USUARIO)).filter(Boolean)
      const finalExtras=finalUsers.filter(u=>!allowed.has(u))
      if(finalExtras.length) throw new Error(`No se pudo cerrar la plantilla vigente. Usuarios fuera del Excel aún visibles: ${finalExtras.join(', ')}`)
      return json(200,{results,result:{ok:true,usuariosVigentes:finalUsers.length,ocultados:extras.length}})
    }
    if (body.action==='finalize_snapshot') {
      const usuarios=Array.isArray(body.usuarios)?body.usuarios.map(text).filter(Boolean):[]
      if(!usuarios.length) return json(400,{message:'La plantilla vigente no contiene usuarios.'})
      const now=new Date().toISOString()
      const {error:hideError}=await client.from('USUARIOS').update({EN_PLANTILLA_VIGENTE:false,UPDATED_AT:now}).neq('USUARIO','')
      if(hideError) throw hideError
      const {error:showError}=await client.from('USUARIOS').update({EN_PLANTILLA_VIGENTE:true,UPDATED_AT:now}).in('USUARIO',usuarios)
      if(showError) throw showError
      return json(200,{result:{ok:true,usuariosVigentes:usuarios.length}})
    }
    if (body.action==='delete') {
      const usuario=text(body.usuario)
      if(!usuario) return json(400,{message:'Selecciona un usuario.'})
      const {data:target,error:targetError}=await client.from('USUARIOS').select('*').eq('USUARIO',usuario).maybeSingle()
      if(targetError) throw targetError
      if(!target) return json(404,{message:'Usuario no encontrado.'})
      if(target.UID_AUTH===requester.authUser.id) return json(400,{message:'No puedes eliminar tu propio usuario desde esta sesión.'})
      if(target.UID_AUTH){
        const {error:deleteError}=await client.auth.admin.deleteUser(target.UID_AUTH)
        if(deleteError)throw deleteError
      }
      const {error:archiveError}=await client.from('USUARIOS').update({UID_AUTH:null,EMAIL_AUTH:null,STATUS:'INACTIVO',EN_PLANTILLA_VIGENTE:false,UPDATED_AT:new Date().toISOString()}).eq('USUARIO',usuario)
      if(archiveError)throw archiveError
      return json(200,{result:{ok:true,usuario,status:'INACTIVO',action:'ELIMINADO_ACCESO'}})
    }
    return json(400,{message:'Acción no reconocida.'})
  } catch (error) {
    return json(error.statusCode || 400,{message:error.message || 'No fue posible procesar la solicitud.'})
  }
}
