export const DEMO_USERS = [
  {
    usuario: '43572700',
    password: '43572700',
    nombre: 'Fiorella Natali',
    apellido: 'Rossi Huanqui',
    region: 'Sur',
    locacion: 'Arequipa',
    rol: 'Prospector',
    status: 'ACTIVO',
  },
  {
    usuario: '76078600',
    password: '76078600',
    nombre: 'Luis Angel',
    apellido: 'Del Carpio Cornejo',
    region: 'Sur',
    locacion: 'Arequipa',
    rol: 'Prospector',
    status: 'ACTIVO',
  },
  {
    usuario: '74904085',
    password: '74904085',
    nombre: 'Jesús Martín',
    apellido: 'Paredes Salas',
    region: 'Sur',
    locacion: 'Arequipa',
    rol: 'Prospector',
    status: 'ACTIVO',
  },
  {
    usuario: '43694352',
    password: '43694352',
    nombre: 'Claudia',
    apellido: 'Apaza Palma',
    region: 'Sur',
    locacion: 'Arequipa',
    rol: 'Supervisor',
    status: 'ACTIVO',
  },
  {
    usuario: '70000001',
    password: '70000001',
    nombre: 'Validador',
    apellido: 'Demo',
    region: 'Lima',
    locacion: 'Lima Centro',
    rol: 'Validador',
    status: 'ACTIVO',
  },
  {
    usuario: '72188981',
    password: '72188981',
    nombre: 'Pilar',
    apellido: 'Escobal',
    region: 'Lima',
    locacion: 'La Molina',
    rol: 'Administrador',
    status: 'ACTIVO',
  },
]

export const DEMO_CONTACTS = [
  { id: 'c1', region: 'Lima', locacion: 'Lima Centro', mesa: 'LC01', ruta: '01', supervisor: 'Mariana Torres', telefonoSupervisor: '900100100', asesor: 'Carlos Flores', telefonoGestor: '900200200' },
  { id: 'c2', region: 'Lima', locacion: 'Lima Centro', mesa: 'LC01', ruta: '02', supervisor: 'Mariana Torres', telefonoSupervisor: '900100100', asesor: 'Lucía Medina', telefonoGestor: '900200201' },
  { id: 'c3', region: 'Sur', locacion: 'Arequipa', mesa: 'AR01', ruta: '01', supervisor: 'Jorge Linares', telefonoSupervisor: '900100300', asesor: 'Kevin Arias', telefonoGestor: '900200300' },
  { id: 'c4', region: 'Norte', locacion: 'Trujillo', mesa: 'TR01', ruta: '01', supervisor: 'Rosa Chávez', telefonoSupervisor: '900100400', asesor: 'Paola Díaz', telefonoGestor: '900200400' },
]

const now = new Date()
const dateKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

export const DEMO_TEAM = [
  { usuario: '90000001', nombre: 'Valeria Quispe', region: 'Lima', locacion: 'Lima Centro', asistencia: 'Puntual', visitas: 12, altas: 5, productividad: 100, horaInicio: '08:04' },
  { usuario: '90000003', nombre: 'José Paredes', region: 'Lima', locacion: 'Lima Norte', asistencia: 'Anticipado', visitas: 15, altas: 7, productividad: 140, horaInicio: '07:51' },
  { usuario: '90000004', nombre: 'Camila Soto', region: 'Lima', locacion: 'Lima Este', asistencia: 'Tardío', visitas: 9, altas: 2, productividad: 40, horaInicio: '08:23' },
  { usuario: '90000005', nombre: 'Renzo Vidal', region: 'Lima', locacion: 'Lima Sur', asistencia: 'Puntual', visitas: 13, altas: 4, productividad: 80, horaInicio: '08:11' },
  { usuario: '90000006', nombre: 'Andrea Salazar', region: 'Norte', locacion: 'Trujillo', asistencia: 'Puntual', visitas: 11, altas: 4, productividad: 80, horaInicio: '07:08' },
  { usuario: '90000007', nombre: 'Marco León', region: 'Norte', locacion: 'Piura', asistencia: 'Anticipado', visitas: 10, altas: 3, productividad: 60, horaInicio: '06:52' },
  { usuario: '90000008', nombre: 'Lucía Torres', region: 'Sur', locacion: 'Arequipa', asistencia: 'Puntual', visitas: 14, altas: 6, productividad: 120, horaInicio: '08:06' },
  { usuario: '90000009', nombre: 'Daniela Ruiz', region: 'Centro Oriente', locacion: 'Huancayo', asistencia: 'Puntual', visitas: 8, altas: 3, productividad: 60, horaInicio: '08:10' },
]

export const DEMO_WEEK = [
  { dia: 'Lun', visitas: 38, altas: 13 },
  { dia: 'Mar', visitas: 44, altas: 15 },
  { dia: 'Mié', visitas: 41, altas: 14 },
  { dia: 'Jue', visitas: 49, altas: 19 },
  { dia: 'Vie', visitas: 52, altas: 21 },
  { dia: 'Sáb', visitas: 31, altas: 11 },
]

export const DEMO_VISITS_TODAY = [
  { id: 'v1', FECHA: dateKey, USUARIO: '90000001', HORA_INICIO_VISITA: '09:02:12', HORA_FIN_VISITA: '09:21:15', CLIENTE_EXITOSO: 'SI', SUBCANAL: 'Bodega', DIRECCION_CLIENTE: 'Av. Central 245', DURACION_VISITA: 19, STATUS_UBICACION: 'GPS_OK', LATITUD: -12.091, LONGITUD: -77.035 },
  { id: 'v2', FECHA: dateKey, USUARIO: '90000001', HORA_INICIO_VISITA: '09:35:08', HORA_FIN_VISITA: '09:47:48', CLIENTE_EXITOSO: 'NO', MOTIVO: 'Cliente cerrado', DURACION_VISITA: 13, STATUS_UBICACION: 'GPS_OK', LATITUD: -12.088, LONGITUD: -77.031 },
  { id: 'v3', FECHA: dateKey, USUARIO: '90000001', HORA_INICIO_VISITA: '10:04:02', HORA_FIN_VISITA: '10:28:20', CLIENTE_EXITOSO: 'SI', SUBCANAL: 'Licorería', DIRECCION_CLIENTE: 'Jr. Los Olivos 410', DURACION_VISITA: 24, STATUS_UBICACION: 'GPS_OK', LATITUD: -12.085, LONGITUD: -77.028 },
]
