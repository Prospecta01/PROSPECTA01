import { supabase } from '../lib/supabase'
import { COLLECTIONS, DEMO_MODE } from '../lib/constants'
import { minutesBetween, peruDateKey, peruTime } from '../lib/date'
import { demoFinishVisit, demoGetOpenVisit, demoGetTodayVisits, demoStartVisit } from '../lib/demoStore'
import { uploadFacadePhoto, uploadProspectorDocument } from './storageService'
import { getTodayStart } from './jornadaService'

export async function getOpenVisit(user) {
  if (DEMO_MODE) return demoGetOpenVisit(user)
  const { data, error } = await supabase.from(COLLECTIONS.VISITS).select('*').eq('USUARIO', user.usuario).eq('ESTADO', 'EN_CURSO').order('INICIO_ISO', { ascending: false }).limit(1)
  if (error) throw error
  return data?.[0] || null
}

export async function startVisit(user, geo) {
  if (!await getTodayStart(user)) throw new Error('Hola prospector ☺, antes de iniciar tus visitas, registra tu inicio de jornada')
  if (DEMO_MODE) return demoStartVisit(user, geo)
  if (await getOpenVisit(user)) throw new Error('Ya tienes una visita en curso.')
  const now = new Date()
  const payload = {
    FECHA: peruDateKey(now), USUARIO: user.usuario, HORA_INICIO_VISITA: peruTime(now), INICIO_ISO: now.toISOString(),
    UBICACION_GPS: geo.gps, LATITUD: geo.latitude, LONGITUD: geo.longitude, ACCURACY_M: geo.accuracy,
    CLIENTE_EXITOSO: '', MOTIVO: '', DNI_CLIENTE: '', SUBCANAL: '', DIRECCION_CLIENTE: '', FOTO_FACHADA: '', FOTO_INTERIOR:'',
    DURACION_VISITA: null, STATUS_UBICACION: geo.status, ESTADO: 'EN_CURSO', REGION: user.region, LOCACION: user.locacion,
  }
  const { data, error } = await supabase.from(COLLECTIONS.VISITS).insert(payload).select().single()
  if (error) throw error
  return data
}

function validateSuccess(form,documents){
  if(!form.subcanal)throw new Error('Completa Cliente > Subcanal.')
  if(!/^\d{8}$/.test(String(form.dniCliente||'').trim()))throw new Error('Completa Cliente > DNI Cliente con 8 dígitos.')
  if(!String(form.razonSocial||'').trim())throw new Error('Completa Cliente > Razón Social.')
  if(!String(form.telefono1||'').trim())throw new Error('Completa Cliente > Teléfono Celular 1.')
  if(!String(form.direccion||'').trim())throw new Error('Completa Dirección > Dirección.')
  if(!documents.dniFrente)throw new Error('Adjunta Documentos > DNI – CE (Frente).')
  if(!documents.dniAtras)throw new Error('Adjunta Documentos > DNI – CE (Atrás).')
  if(!documents.recibo)throw new Error('Adjunta Documentos > Recibo de Servicios – Contrato de Renta.')
  if(!documents.fotoLocal)throw new Error('Adjunta Documentos > Foto de Fachada.')
  if(!documents.fotoInterior)throw new Error('Adjunta Documentos > Foto interior.')
}

async function uploadSuccessDocuments(user,visitId,documents){
  const [dniFrente,dniAtras,rucDoc,recibo,ficha,fotoLocal,fotoInterior]=await Promise.all([
    uploadProspectorDocument(user,visitId,documents.dniFrente,'dni_frente'),
    uploadProspectorDocument(user,visitId,documents.dniAtras,'dni_atras'),
    documents.rucDoc?uploadProspectorDocument(user,visitId,documents.rucDoc,'ruc'):'',
    uploadProspectorDocument(user,visitId,documents.recibo,'recibo_servicios'),
    documents.ficha?uploadProspectorDocument(user,visitId,documents.ficha,'ficha_caracterizacion'):'',
    uploadFacadePhoto(user,visitId,documents.fotoLocal),
    uploadProspectorDocument(user,visitId,documents.fotoInterior,'foto_interior'),
  ])
  return {dniFrente,dniAtras,rucDoc,recibo,ficha,fotoLocal,fotoInterior}
}

export async function finishVisit(user, visit, form, documents={}) {
  const success = form.clienteExitoso === 'SI'
  const motivo=!success && form.motivo==='Otro' ? String(form.motivoOtro||'').trim() : form.motivo
  if (!success && !form.motivo) throw new Error('Selecciona el motivo de la visita no exitosa.')
  if (!success && form.motivo==='Otro' && !motivo) throw new Error('Escribe el motivo de la visita no exitosa.')
  if(success)validateSuccess(form,documents)

  const end = new Date()
  const duration = minutesBetween(visit.INICIO_ISO, end)
  let docs={dniFrente:'',dniAtras:'',rucDoc:'',recibo:'',ficha:'',fotoLocal:'',fotoInterior:''}
  if(success)docs=await uploadSuccessDocuments(user,visit.id,documents)

  const payload = {
    CLIENTE_EXITOSO: success ? 'SI' : 'NO', MOTIVO: success ? '' : motivo,
    DNI_CLIENTE: success ? String(form.dniCliente).trim() : '',
    SUBCANAL: success ? form.subcanal : '',
    DIRECCION_CLIENTE: success ? String(form.direccion||'').trim() : '',
    FOTO_FACHADA: success ? docs.fotoLocal : '', FOTO_INTERIOR: success ? docs.fotoInterior : '',
    CANAL_PRINCIPAL: success ? 'Tradicional' : 'Tradicional',
    RUC_CLIENTE: success ? String(form.ruc||'').trim() : '',
    RAZON_SOCIAL: success ? String(form.razonSocial||'').trim() : '',
    CORREO_ELECTRONICO: success ? String(form.correo||'').trim() : '',
    TELEFONO_CELULAR_1: success ? String(form.telefono1||'').trim() : '',
    TELEFONO_CELULAR_2: success ? String(form.telefono2||'').trim() : '',
    VIA_TIPO: success ? form.viaTipo||'' : '',
    NUMERO_DIRECCION: success ? String(form.numero||'').trim() : '',
    MANZANA: success ? String(form.manzana||'').trim() : '',
    LOTE: success ? String(form.lote||'').trim() : '',
    SECCION: success ? String(form.seccion||'').trim() : '',
    INTERIOR: success ? String(form.interior||'').trim() : '',
    DEPARTAMENTO: success ? String(form.departamento||'').trim() : '',
    PROVINCIA: success ? String(form.provincia||'').trim() : '',
    DISTRITO: success ? String(form.distrito||'').trim() : '',
    UBIGEO: success ? String(form.ubigeo||'').trim() : '',
    UBICACION_REFERENCIA: success ? String(form.ubicacionReferencia||'').trim() : '',
    LOCACION_COMERCIAL: success ? String(form.locacionComercial||'').trim() : '',
    RUTA: success ? String(form.ruta||'').trim() : '',
    SEGMENTO: success ? String(form.segmento||'').trim() : '',
    REPRESENTANTE_LEGAL: success ? String(form.representanteLegal||'').trim() : '',
    NOMBRE_VENDEDOR: success ? String(form.nombreVendedor||'').trim() : '',
    CODIGO_VENDEDOR: success ? String(form.codigoVendedor||'').trim() : '',
    SEGMENTO_ACD: success ? String(form.segmentoAcd||'').trim() : '',
    UBICACION_CAPTURADA: success ? String(form.ubicacionCapturada||'').trim() : '',
    UBICACION_CAPTURADA_LAT: success && form.ubicacionLat!=='' ? Number(form.ubicacionLat) : null,
    UBICACION_CAPTURADA_LONG: success && form.ubicacionLong!=='' ? Number(form.ubicacionLong) : null,
    DOC_DNI_CE_FRENTE: success ? docs.dniFrente : '',
    DOC_DNI_CE_ATRAS: success ? docs.dniAtras : '',
    DOC_RUC: success ? docs.rucDoc : '',
    DOC_RECIBO_SERVICIOS: success ? docs.recibo : '',
    DOC_FICHA_CARACTERIZACION: success ? docs.ficha : '',
    DOC_FOTO_LOCAL: success ? docs.fotoLocal : '',
    DURACION_VISITA: duration, HORA_FIN_VISITA: peruTime(end), FIN_ISO: end.toISOString(), ESTADO: 'FINALIZADA', UPDATED_AT: end.toISOString(),
  }
  if (DEMO_MODE) return demoFinishVisit(visit.id, payload)
  const { data, error } = await supabase.from(COLLECTIONS.VISITS).update(payload).eq('id', visit.id).eq('USUARIO', user.usuario).select().single()
  if (error) throw error
  return data
}

export async function getTodayVisits(user) {
  if (DEMO_MODE) return demoGetTodayVisits(user)
  const { data, error } = await supabase.from(COLLECTIONS.VISITS).select('*').eq('USUARIO', user.usuario).eq('FECHA', peruDateKey()).eq('ESTADO','FINALIZADA').order('HORA_INICIO_VISITA')
  if (error) throw error
  return data || []
}
