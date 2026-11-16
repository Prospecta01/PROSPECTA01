export const APP_NAME = 'PROSPECTA │ RTM'
export const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true'

export const ROLES = {
  PROSPECTOR: 'Prospector',
  SUPERVISOR: 'Supervisor',
  REGIONAL_COORDINATOR: 'Coordinador Regional',
  ADMIN: 'Administrador',
  VALIDATOR: 'Validador',
}

export const SUBCHANNELS = [
  'Bodegas',
  'Licorerías',
  'Restaurantes',
  'Minimarkets',
  'Panaderías',
  'Pescador y mariscos',
  'Criollo/Picanterías',
  'Boticas',
  'Gimnasios',
]

export const VIA_TYPES = [
  'Ampliación','Asentamiento Humano','Asociación','Asociación propietarios vivienda','Avenida','Barrio','Bloque','Calle','Callejón','Carretera','Centro comercial','Centro poblado','Cooperativa','Fundo','Jirón','Malecón','Mercado','Panamericana','Pasaje','Plaza','Prolongación','Pueblo Joven','Residencia','Sector','Terminal terrestre','Unidad comunal vecinal','Unidad vecinal','Urbanización','Urbanización Populares de Interés Social','Zona',
]

export const SEGMENTS = [
  '011 Lunes','012 Martes','013 Miércoles','014 Jueves','015 Viernes','016 Sábado','017 Domingo',
]

export const ACD_SEGMENTS = [
  '001 Lunes – Jueves','002 Martes – Viernes','003 Miércoles – Sábado','004 Lunes – Miércoles – Viernes','005 Martes – Jueves – Sábado','011 Lunes','012 Martes','013 Miércoles','014 Jueves','015 Viernes','016 Sábado','017 Domingo','021 Lunes – Miércoles','022 Lunes – Viernes','023 Martes - Jueves','024 Martes – Sábado','025 Miércoles – Viernes','026 Jueves - Sábado',
]

export const FAILED_VISIT_REASONS = [
  'Cliente cerrado','Cliente no interesado','No se encontró al responsable','Dirección no ubicada','Cliente ya registrado','Fuera de perfil','Otro',
]

export const COLLECTIONS = {
  USERS: 'USUARIOS',
  CONTACTS: 'CONTACTOS',
  START_DAY: 'BBDD_INICIO_JORNADA',
  END_DAY: 'BBDD_FIN_JORNADA',
  VISITS: 'BBDD_VISITAS',
  PRODUCTIVITY: 'BBDD_PRODUCTIVIDAD_PROSPECTOR',
  SUPERVISOR_VISIT_VALIDATION: 'BBDD_VALIDACION_VISITA_SUPERVISOR',
  ROUTES_BY_LOCATION: 'RUTAS_LOCACION',
  VALIDATOR_REGISTRATION: 'BBDD_REGISTRO_VALIDADOR',
  ZERO_PURCHASE_CLIENTS: 'CLIENTES_COMPRA_CERO',
  ZERO_PURCHASE_MANAGEMENT: 'BBDD_GESTION_COMPRA_CERO',
  VALIDATOR_START_DAY: 'BBDD_INICIO_JORNADA_DESARROLLADOR',
  VALIDATOR_END_DAY: 'BBDD_FIN_JORNADA_DESARROLLADOR',
  // Las tablas históricas conservan su nombre físico para no perder datos durante el cambio de rol.
}
