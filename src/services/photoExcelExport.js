import { getPhotoExportUrl } from './storageService'

export const PHOTO_LABELS = ["DNI – CE (Frente)", "DNI – CE (Atrás)", "RUC documento", "Recibo Servicios / Renta", "Ficha Caracterización", "Foto de Fachada", "Foto interior"]
export const DOCUMENT_BUCKET = Object.fromEntries(PHOTO_LABELS.map(label => [label, ['Foto de Fachada', 'Foto interior'].includes(label) ? 'fachadas' : 'documentos-prospecta']))

export async function resolvePhotoLinks(rows, columns) {
  const cache = new Map()
  const unique = [...new Set(rows.flatMap(row => columns.map(col => ({col, path:String(row[col] || '').trim()}))).filter(item=>item.path).map(item=>JSON.stringify(item)))]
  // Limitamos concurrencia para evitar sobrecargar Supabase.
  for (let i = 0; i < unique.length; i += 8) {
    await Promise.all(unique.slice(i, i + 8).map(async key => {
      const {col,path}=JSON.parse(key)
      cache.set(key, await getPhotoExportUrl(path, 604800, DOCUMENT_BUCKET[col]).catch(() => ''))
    }))
  }
  return rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) =>
    [key, columns.includes(key) && value ? cache.get(JSON.stringify({col:key,path:String(value).trim()})) || '' : value]
  )))
}

// SheetJS CE conserva texto URL. El usuario puede copiarlo a cualquier navegador
// durante la vigencia del enlace; se evita prometer hipervínculos OOXML no soportados.
export function setPhotoColumnWidths(sheet, headers) {
  sheet['!cols'] = headers.map(h => ({ wch: PHOTO_LABELS.includes(h) ? 85 : Math.min(36, Math.max(14, h.length + 3)) }))
}

// Enlaces reales de Excel, además de la URL visible y copiable en la celda.
export function addPhotoHyperlinks(sheet, headers, rows) {
  for (const header of PHOTO_LABELS) {
    const col = headers.indexOf(header)
    if (col < 0) continue
    rows.forEach((row, i) => {
      const url = String(row[header] || '').trim()
      if (!/^https?:\/\//i.test(url)) return
      const address = `${columnLetter(col)}${i + 2}`
      if (sheet[address]) sheet[address].l = { Target: url, Tooltip: 'Abrir fotografía en navegador (enlace temporal)' }
    })
  }
}
function columnLetter(index) {
  let result = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result
  return result
}
