const TZ = 'America/Lima'

export const peruDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

export const peruTime = (date = new Date()) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)

export const shortTime = (date = new Date()) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)

export const humanDate = (date = new Date()) =>
  new Intl.DateTimeFormat('es-PE', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)

const timeToMinutes = (hhmm) => {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export const classifyArrival = (region, hhmm) => {
  const north = String(region || '').toLowerCase().includes('norte')
  const target = north ? 7 * 60 : 8 * 60
  const grace = target + 15
  const actual = timeToMinutes(hhmm)
  if (actual < target) return 'Ingreso Anticipado'
  if (actual <= grace) return 'Ingreso Puntual'
  return 'Ingreso Tardío'
}


export const classifyDeparture = (hhmm) => {
  const actual = timeToMinutes(hhmm)
  if (actual < 17 * 60) return 'Salida Anticipada'
  if (actual <= 17 * 60 + 15) return 'Salida Puntual'
  return 'Salida Tardía'
}

export const minutesBetween = (startIso, end = new Date()) => {
  const start = new Date(startIso)
  const endDate = end instanceof Date ? end : new Date(end)
  return Math.max(0, Math.round((endDate.getTime() - start.getTime()) / 60000))
}

export const durationLabel = (minutes = 0) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return `${h} h ${m} min`
}
