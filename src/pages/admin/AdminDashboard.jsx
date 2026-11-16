import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, CheckCircle2, Database, FileSpreadsheet, MapPinPlus, ShieldCheck, Target, UserCheck, UserCog, Users } from 'lucide-react'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import StatusBadge from '../../components/StatusBadge'
import { ProductivityBadge } from '../../components/ProductivityCallout'
import DashboardFilters from '../../components/dashboard/DashboardFilters'
import { useAuth } from '../../context/AuthContext'
import { DEMO_MODE } from '../../lib/constants'
import { defaultDashboardFilters, periodLabel } from '../../lib/dashboardFilters'
import { productivityTone } from '../../lib/productivity'
import { getDashboardData } from '../../services/dashboardService'
import { getDashboardScopeOptions } from '../../services/dashboardScopeService'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState({ kpis: {}, team: [], week: [] })
  const [filters,setFilters]=useState(defaultDashboardFilters)
  const [options,setOptions]=useState({regions:[],locationsByRegion:{}})
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  useEffect(() => {
    let active=true
    getDashboardScopeOptions(user).then((result)=>active&&setOptions(result)).catch((e)=>active&&setError(e.message))
    return()=>{active=false}
  }, [user])

  useEffect(() => {
    let active=true
    setLoading(true);setError('')
    getDashboardData(user,filters).then(result=>{
      if(!active)return
      setData(result)
    }).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false))
    return()=>{active=false}
  }, [user,filters])

  const regions = useMemo(() => new Set(data.team.map((x) => x.region).filter(Boolean)).size, [data.team])

  return (
    <AppShell title="Dashboard Administrador" subtitle="Visión nacional, control de acceso y salud de la operación.">
      <div className="mb-5 overflow-hidden rounded-[2rem] bg-zinc-950 p-5 text-white shadow-card sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">Administración</p>
        <h2 className="mt-2 text-2xl font-black">Hola, {user.nombre} 👋</h2>
        <p className="mt-2 text-sm text-white/65">Usuarios, bases operativas e indicadores nacionales de PROSPECTA RTM.</p>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <StatusBadge tone="success"><span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> Entorno {DEMO_MODE ? 'DEMO' : 'SUPABASE'}</span></StatusBadge>
        <StatusBadge tone="info">{regions || 1} regiones visibles en el filtro actual</StatusBadge>
      </div>

      <DashboardFilters filters={filters} onChange={setFilters} options={options} loading={loading}/>
      {error&&<div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-black">Avance de Prospectores</p><p className="mt-1 text-xs text-zinc-500">{periodLabel(filters)}</p></div>{loading&&<span className="text-xs font-bold text-zinc-400">Actualizando…</span>}</div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <KpiCard icon={Users} label="Prospectores" value={data.kpis.prospectores ?? 0} accent />
        <KpiCard icon={UserCheck} label="Asistencia" value={`${data.kpis.asistenciaPct ?? 0}%`} />
        <KpiCard icon={MapPinPlus} label="Visitas" value={data.kpis.visitas ?? 0} />
        <KpiCard icon={CheckCircle2} label="Altas" value={data.kpis.altas ?? 0} />
        <KpiCard icon={Target} label="Productividad" value={`${data.kpis.productividad ?? 0}%`} tone={productivityTone(data.kpis.productividad)} helper="Meta: 5 altas por prospector/día" />
      </div>


      <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5">
        <div><p className="text-sm font-black">Avance por prospector</p><p className="mt-1 text-xs text-zinc-500">Productividad calculada contra la meta diaria de 5 altas.</p></div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead><tr className="border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-400"><th className="sticky left-0 z-20 bg-white px-3 py-3">Prospector</th><th className="px-3 py-3">Región / Locación</th><th className="px-3 py-3">Ingreso</th><th className="px-3 py-3">Status Ingreso</th><th className="px-3 py-3 text-right">Visitas</th><th className="px-3 py-3 text-right">Altas</th><th className="px-3 py-3 text-right">Productividad</th><th className="px-3 py-3">Salida</th><th className="px-3 py-3">Status Salida</th></tr></thead>
            <tbody>{data.team.map((x)=><tr key={x.usuario} className="border-b border-zinc-50"><td className="sticky left-0 z-10 bg-white px-3 py-4"><p className="font-black">{x.nombre}</p><p className="text-xs text-zinc-500">{x.usuario}</p></td><td className="px-3 py-4 text-xs"><p className="font-semibold">{x.region}</p><p className="text-zinc-500">{x.locacion}</p></td><td className="px-3 py-4 font-semibold">{x.horaInicio}</td><td className="px-3 py-4 text-xs font-semibold">{x.statusIngreso}</td><td className="px-3 py-4 text-right font-black">{x.visitas}</td><td className="px-3 py-4 text-right font-black text-prospecta-700">{x.altas}</td><td className="px-3 py-4 text-right"><ProductivityBadge value={x.productividad ?? 0}/></td><td className="px-3 py-4 font-semibold">{x.horaSalida}</td><td className="px-3 py-4 text-xs font-semibold">{x.statusSalida}</td></tr>)}</tbody>
          </table>
        </div>
      </div>

      <Link to="/admin/usuarios" className="mt-5 flex items-center justify-between gap-4 rounded-[2rem] bg-gradient-to-r from-prospecta-700 to-prospecta-800 p-5 text-white shadow-soft transition hover:brightness-105">
        <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15"><UserCog size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-white/60">Administración</p><h2 className="mt-1 text-lg font-black">Gestión de Usuarios</h2><p className="mt-1 text-xs text-white/70">Crear, editar, activar/desactivar e importar usuarios desde Excel.</p></div></div><span className="text-2xl">›</span>
      </Link>

      <Link to="/admin/cargas" className="mt-3 flex items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5 transition hover:bg-zinc-50">
        <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><FileSpreadsheet size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-400">Maestros operativos</p><h2 className="mt-1 text-lg font-black">Carga de bases</h2><p className="mt-1 text-xs text-zinc-500">Actualiza Usuarios y Rutas por Locación mediante plantillas Excel.</p></div></div><span className="text-2xl text-zinc-400">›</span>
      </Link>

      <Link to="/admin/bases" className="mt-3 flex items-center justify-between gap-4 rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5 transition hover:bg-zinc-50">
        <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-prospecta-50 text-prospecta-700"><Database size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[.18em] text-zinc-400">Datos operativos</p><h2 className="mt-1 text-lg font-black">Bases de Datos</h2><p className="mt-1 text-xs text-zinc-500">Visualiza las bases operativas vigentes y exporta la información disponible.</p></div></div><span className="text-2xl text-zinc-400">›</span>
      </Link>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <SystemCard icon={Database} title="Supabase PostgreSQL" value="Operativo" detail="Jornadas, visitas, productividad diaria, bonos, usuarios y contactos con RLS." />
        <SystemCard icon={ShieldCheck} title="Authentication" value="Protegido" detail="Usuario corporativo + rol + estado ACTIVO." />
        <SystemCard icon={Activity} title="Storage" value="Operativo" detail="Fachadas y evidencias de bonos en buckets privados." />
      </div>

      <div className="mt-5 rounded-[2rem] bg-zinc-950 p-5 text-white shadow-card">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">Administración de accesos</p>
        <h2 className="mt-2 text-xl font-black">Sin contraseñas en la base operativa</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">Las altas y modificaciones se administran desde Gestión de Usuarios. Las contraseñas se procesan de forma segura con Supabase Auth y nunca se almacenan en las tablas operativas.</p>
      </div>
    </AppShell>
  )
}
function SystemCard({ icon: Icon, title, value, detail }) { return <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-prospecta-50 text-prospecta-700"><Icon size={20}/></span><p className="mt-4 text-sm font-black">{title}</p><p className="mt-1 text-lg font-black text-emerald-600">{value}</p><p className="mt-2 text-xs leading-5 text-zinc-500">{detail}</p></div> }
