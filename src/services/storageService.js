import { supabase } from '../lib/supabase'
import { DEMO_MODE } from '../lib/constants'
import { peruDateKey } from '../lib/date'

async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) return file
  if (file.size <= 900 * 1024) return file
  try {
    const bitmap = await createImageBitmap(file)
    const maxSide = 1600
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.78))
    bitmap.close?.()
    return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file
  } catch { return file }
}

async function uploadImage(bucket, user, visitId, file, prefix='foto') {
  if (!file) return ''
  if (file.size > 10 * 1024 * 1024) throw new Error('La foto no debe superar 10 MB.')
  if (DEMO_MODE) return URL.createObjectURL(file)
  const optimized = await compressImage(file)
  const safeName = optimized.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const path = `${user.usuario}/${peruDateKey()}/${visitId}_${prefix}_${Date.now()}_${safeName}`
  const { error } = await supabase.storage.from(bucket).upload(path, optimized, {
    contentType: optimized.type || 'image/jpeg', upsert: false,
  })
  if (error) throw new Error(error.message || 'No fue posible subir la imagen.')
  return path
}

export async function uploadFacadePhoto(user, visitId, file) {
  return uploadImage('fachadas',user,visitId,file,'fachada')
}

export async function uploadInteriorPhoto(user, visitId, file) {
  return uploadImage('fachadas',user,visitId,file,'interior')
}

export function getFacadePublicUrl(path) {
  if (!path) return ''
  if (/^(https?:|blob:|data:)/.test(path)) return path
  if (DEMO_MODE) return path
  return supabase.storage.from('fachadas').getPublicUrl(path)?.data?.publicUrl || ''
}

export async function getFacadeSignedUrl(path, expiresIn = 3600) {
  if (!path) return ''
  if (/^(https?:|blob:|data:)/i.test(String(path))) return String(path)
  if (DEMO_MODE) return String(path)
  // El bucket fachadas es privado: getPublicUrl devuelve una URL aunque el objeto no sea público.
  try {
    const { data, error } = await supabase.storage.from('fachadas').createSignedUrl(String(path).trim(), expiresIn)
    if (error) return ''
    return data?.signedUrl || ''
  } catch { return '' }
}

export async function uploadSupervisorDniPhoto(user, visitId, file) {
  return uploadImage('dni-supervisor',user,visitId,file,'dni')
}

export async function getSupervisorDniSignedUrl(path, expiresIn = 3600) {
  if (!path || DEMO_MODE) return path || ''
  const { data, error } = await supabase.storage.from('dni-supervisor').createSignedUrl(path, expiresIn)
  if (error) return ''
  return data?.signedUrl || ''
}


export async function uploadProspectorDocument(user, visitId, file, kind) {
  return uploadImage('documentos-prospecta',user,visitId,file,kind)
}

export async function getProspectorDocumentSignedUrl(path, expiresIn = 3600) {
  if (!path || DEMO_MODE) return path || ''
  const { data, error } = await supabase.storage.from('documentos-prospecta').createSignedUrl(path, expiresIn)
  if (error) return ''
  return data?.signedUrl || ''
}

// Exportación: un archivo ausente no debe impedir descargar el resto de la base.
export async function getPhotoExportUrl(path, expiresIn = 604800, bucket = 'fachadas') {
  if (!path) return ''
  const value = String(path).trim()
  if (/^https?:\/\//i.test(value)) return value
  if (DEMO_MODE) return ''
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(value, expiresIn)
    if (error) {
      console.warn('Fotografía no disponible en Storage:', value, error.message)
      return ''
    }
    return data?.signedUrl || ''
  } catch (error) {
    console.warn('No se pudo generar enlace de fotografía:', value, error)
    return ''
  }
}
