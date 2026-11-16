import { DEMO_CONTACTS, DEMO_VISITS_TODAY } from '../data/demoData'
import { classifyArrival, peruDateKey, peruTime } from './date'

const KEY = 'prospecta-demo-db-v1'

const base = () => ({
  starts: [],
  ends: [],
  visits: [...DEMO_VISITS_TODAY],
})

const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || base()
  } catch {
    return base()
  }
}
const save = (db) => localStorage.setItem(KEY, JSON.stringify(db))

export const demoStartDay = async (user) => {
  const db = load()
  const FECHA = peruDateKey()
  if (db.starts.some((x) => x.FECHA === FECHA && x.USUARIO === user.usuario)) throw new Error('Tu inicio de jornada ya fue registrado hoy.')
  const HORA_INICIO = peruTime()
  const doc = {
    id: `${FECHA}_${user.usuario}`,
    FECHA,
    USUARIO: user.usuario,
    HORA_INICIO,
    CLASIFICACION_INGRESO: classifyArrival(user.region, HORA_INICIO),
    REGION: user.region,
    LOCACION: user.locacion,
    CREATED_AT_ISO: new Date().toISOString(),
  }
  db.starts.push(doc)
  save(db)
  return doc
}

export const demoGetStartDay = async (user) => load().starts.find((x) => x.FECHA === peruDateKey() && x.USUARIO === user.usuario) || null

export const demoEndDay = async (user) => {
  const db = load()
  const FECHA = peruDateKey()
  if (!db.starts.some((x) => x.FECHA === FECHA && x.USUARIO === user.usuario)) throw new Error('Primero registra el inicio de jornada.')
  if (db.ends.some((x) => x.FECHA === FECHA && x.USUARIO === user.usuario)) throw new Error('Tu fin de jornada ya fue registrado hoy.')
  if (db.visits.some((x) => x.USUARIO === user.usuario && x.ESTADO === 'EN_CURSO')) throw new Error('Finaliza la visita en curso antes de cerrar tu jornada.')
  const doc = { id: `${FECHA}_${user.usuario}`, FECHA, USUARIO: user.usuario, HORA_FIN: peruTime(), CREATED_AT_ISO: new Date().toISOString() }
  db.ends.push(doc)
  save(db)
  return doc
}

export const demoGetEndDay = async (user) => load().ends.find((x) => x.FECHA === peruDateKey() && x.USUARIO === user.usuario) || null

export const demoStartVisit = async (user, geo) => {
  const db = load()
  if (db.visits.some((x) => x.USUARIO === user.usuario && x.ESTADO === 'EN_CURSO')) throw new Error('Ya tienes una visita en curso.')
  const id = `demo_${Date.now()}`
  const doc = {
    id,
    FECHA: peruDateKey(),
    USUARIO: user.usuario,
    HORA_INICIO_VISITA: peruTime(),
    INICIO_ISO: new Date().toISOString(),
    UBICACION_GPS: geo.gps,
    LATITUD: geo.latitude,
    LONGITUD: geo.longitude,
    ACCURACY_M: geo.accuracy,
    STATUS_UBICACION: geo.status,
    CLIENTE_EXITOSO: '',
    MOTIVO: '',
    DNI_CLIENTE: '',
    SUBCANAL: '',
    DIRECCION_CLIENTE: '',
    FOTO_FACHADA: '',
    DURACION_VISITA: null,
    ESTADO: 'EN_CURSO',
  }
  db.visits.push(doc)
  save(db)
  return doc
}

export const demoGetOpenVisit = async (user) => load().visits.find((x) => x.USUARIO === user.usuario && x.ESTADO === 'EN_CURSO') || null

export const demoFinishVisit = async (id, payload) => {
  const db = load()
  const idx = db.visits.findIndex((x) => x.id === id)
  if (idx < 0) throw new Error('No se encontró la visita en curso.')
  db.visits[idx] = { ...db.visits[idx], ...payload, HORA_FIN_VISITA: peruTime(), ESTADO: 'FINALIZADA', FIN_ISO: new Date().toISOString() }
  save(db)
  return db.visits[idx]
}

export const demoGetTodayVisits = async (user) => load().visits.filter((x) => x.USUARIO === user.usuario && x.FECHA === peruDateKey() && x.ESTADO !== 'EN_CURSO')
export const demoGetContacts = async () => DEMO_CONTACTS
