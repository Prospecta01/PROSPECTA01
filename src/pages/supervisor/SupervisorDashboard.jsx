import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, MapPin, MapPinPlus, Search, Target, UserCheck, Users } from 'lucide-react'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import StatusBadge from '../../components/StatusBadge'
import { ProductivityBadge, ProductivityCallout } from '../../components/ProductivityCallout'
import DashboardFilters from '../../components/dashboard/DashboardFilters'
import ProspectorMapModal from '../../components/ProspectorMapModal'
import SupervisorValidationPanel from '../../components/SupervisorValidationPanel'
import SupervisorZeroPurchasePanel from '../../components/SupervisorZeroPurchasePanel'
import { useAuth } from '../../context/AuthContext'
import { defaultDashboardFilters, periodLabel } from '../../lib/dashboardFilters'
import { DAILY_PRODUCTIVITY_TARGET, productivityTone, teamMotivation } from '../../lib/productivity'
import { getDashboardData } from '../../services/dashboardService'
import { getDashboardScopeOptions } from '../../services/dashboardScopeService'

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [section,setSection]=useState('operativo')
  const [data, setData] = useState({ kpis: {}, team: [], week: [] })
  const [filters,setFilters]=useState(defaultDashboardFilters)
  const [options,setOptions]=useState({regions:[],locationsByRegion:{}})
  const [term, setTerm] = useState('')
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')
  const [map,setMap]=useState(null)
  const isCoordinator=user.rol==='Coordinador Regional'

  useEffect(() => { let active=true; getDashboardScopeOptions(user).then(r=>active&&setOptions(r)).catch(e=>active&&setError(e.message)); return()=>{active=false} }, [user])
  useEffect(() => { let active=true; setLoading(true);setError(''); getDashboardData(user,filters).then(r=>active&&setData(r)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false)); return()=>{active=false} }, [user,filters])

  const team = useMemo(() => data.team.filter((x) => JSON.stringify(x).toLowerCase().includes(term.toLowerCase())), [data.team, term])
  const groupPoints=(kind)=>team.map(x=>({usuario:x.usuario,nombre:x.nombre,locacion:x.locacion,hora:kind==='inicio'?x.horaInicio:x.horaSalida,latitude:kind==='inicio'?x.ingresoLat:x.salidaLat,longitude:kind==='inicio'?x.ingresoLng:x.salidaLng}))
  const openOne=(x,kind)=>setMap({title:`${kind==='inicio'?'Ingreso':'Salida'} · ${x.nombre}`,points:[{usuario:x.usuario,nombre:x.nombre,locacion:x.locacion,hora:kind==='inicio'?x.horaInicio:x.horaSalida,latitude:kind==='inicio'?x.ingresoLat:x.salidaLat,longitude:kind==='inicio'?x.ingresoLng:x.salidaLng}]})

  return (
    <AppShell title={isCoordinator?'Dashboard Coordinador Regional':'Dashboard Supervisor'} subtitle={isCoordinator?`Seguimiento operativo · ${user.region}`:'Seguimiento operativo y validación en campo'}>
      <div className="mb-4 rounded-[2rem] bg-gradient-to-r from-zinc-950 to-zinc-800 p-5 text-white shadow-card">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/45">{isCoordinator?'Coordinador Regional':'Supervisor'}</p>
        <h2 className="mt-2 text-2xl font-black">Hola, {user.nombre} 👋</h2>
        <p className="mt-1 text-xs text-white/60">{user.region}</p>
      </div>

      {!isCoordinator&&<div className="mb-4 grid grid-cols-3 gap-2 rounded-2xl bg-zinc-200 p-1.5">
        <button onClick={()=>setSection('operativo')} className={`rounded-xl px-2 py-2.5 text-[10px] font-black ${section==='operativo'?'bg-white text-prospecta-700 shadow-sm':'text-zinc-500'}`}>Seguimiento operativo</button>
        <button onClick={()=>setSection('validacion')} className={`rounded-xl px-2 py-2.5 text-[10px] font-black ${section==='validacion'?'bg-white text-prospecta-700 shadow-sm':'text-zinc-500'}`}>Validación de visitas</button>
        <button onClick={()=>setSection('compraCero')} className={`rounded-xl px-2 py-2.5 text-[10px] font-black ${section==='compraCero'?'bg-white text-prospecta-700 shadow-sm':'text-zinc-500'}`}>Gestión compra cero</button>
      </div>}

      {section==='validacion'&&!isCoordinator ? <SupervisorValidationPanel user={user} options={options}/> : section==='compraCero'&&!isCoordinator ? <SupervisorZeroPurchasePanel user={user}/> : <>
        <DashboardFilters filters={filters} onChange={setFilters} options={options} loading={loading} hideLocation={false}/>
        {error&&<div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
        <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-black">Avance de Prospectores</p><p className="mt-1 text-xs text-zinc-500">{periodLabel(filters)}</p></div>{loading&&<span className="text-xs font-bold text-zinc-400">Actualizando…</span>}</div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiCard icon={Users} label="Prospectores" value={data.kpis.prospectores ?? 0} accent />
          <KpiCard icon={UserCheck} label="Asistencia" value={`${data.kpis.asistenciaPct ?? 0}%`} />
          <KpiCard icon={MapPinPlus} label="Visitas" value={data.kpis.visitas ?? 0} />
          <KpiCard icon={CheckCircle2} label="Altas" value={data.kpis.altas ?? 0} />
          <KpiCard icon={Target} label="Productividad" value={`${data.kpis.productividad ?? 0}%`} tone={productivityTone(data.kpis.productividad)} helper="Meta: 5 altas por prospector/día" />
        </div>
        <ProductivityCallout value={data.kpis.productividad ?? 0} message={teamMotivation(data.kpis.productividad ?? 0)} />

        <div className="mt-5 rounded-[1.5rem] bg-white p-3 shadow-card ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0"><p className="text-xs font-black">Avance por prospector</p><p className="mt-0.5 text-[9px] text-zinc-500">Tabla compacta para lectura móvil</p></div>
            <div className="flex max-w-[150px] items-center rounded-xl bg-zinc-50 px-2"><Search size={13} className="text-zinc-400"/><input value={term} onChange={(e)=>setTerm(e.target.value)} placeholder="Buscar…" className="min-w-0 bg-transparent px-1.5 py-2 text-[10px] outline-none"/></div>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[850px] text-left text-[9px] leading-3">
              <thead><tr className="border-b border-zinc-100 text-[7.5px] uppercase tracking-[.03em] text-zinc-400">
                <th className="sticky left-0 z-20 w-[105px] bg-white px-1.5 py-2">Prospector</th><th className="w-[85px] px-1.5 py-2">Región / Loc.</th><th className="w-[48px] px-1.5 py-2">Ingreso</th><th className="w-[72px] px-1.5 py-2">Status Ing.</th><th className="w-[62px] px-1.5 py-2">GPS Ing.</th><th className="w-[42px] px-1.5 py-2 text-right">Visitas</th><th className="w-[38px] px-1.5 py-2 text-right">Altas</th><th className="w-[38px] px-1.5 py-2 text-right">Meta</th><th className="w-[70px] px-1.5 py-2 text-right">Product.</th><th className="w-[48px] px-1.5 py-2">Salida</th><th className="w-[72px] px-1.5 py-2">Status Sal.</th><th className="w-[62px] px-1.5 py-2">GPS Sal.</th>
              </tr></thead>
              <tbody>{team.map(x=><tr key={x.usuario} className="border-b border-zinc-50">
                <td className="sticky left-0 z-10 bg-white px-1.5 py-2"><p className="max-w-[98px] truncate font-black">{x.nombre}</p><p className="text-[8px] text-zinc-500">{x.usuario}</p></td>
                <td className="px-1.5 py-2"><p className="truncate font-semibold">{x.region}</p><p className="truncate text-[8px] text-zinc-500">{x.locacion}</p></td>
                <td className="px-1.5 py-2 font-semibold">{x.horaInicio}</td><td className="px-1.5 py-2"><AttendanceBadge value={x.statusIngreso}/></td>
                <td className="px-1.5 py-2"><LocationButton enabled={x.ingresoLat!=null&&x.ingresoLng!=null} onClick={()=>openOne(x,'inicio')}/></td>
                <td className="px-1.5 py-2 text-right font-black">{x.visitas}</td><td className="px-1.5 py-2 text-right font-black text-prospecta-700">{x.altas}</td><td className="px-1.5 py-2 text-right font-black">{DAILY_PRODUCTIVITY_TARGET}</td><td className="px-1.5 py-2 text-right"><ProductivityBadge compact value={x.productividad??0}/></td>
                <td className="px-1.5 py-2 font-semibold">{x.horaSalida}</td><td className="px-1.5 py-2"><DepartureBadge value={x.statusSalida}/></td>
                <td className="px-1.5 py-2"><LocationButton enabled={x.salidaLat!=null&&x.salidaLng!=null} onClick={()=>openOne(x,'fin')}/></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button onClick={()=>setMap({title:'Ubicación de prospectores · Inicio de jornada',points:groupPoints('inicio')})} className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-3 text-[10px] font-black text-white"><MapPin size={15}/>Mapa inicio</button>
            <button onClick={()=>setMap({title:'Ubicación de prospectores · Fin de jornada',points:groupPoints('fin')})} className="flex items-center justify-center gap-1.5 rounded-xl bg-prospecta-700 px-3 py-3 text-[10px] font-black text-white"><MapPin size={15}/>Mapa fin</button>
          </div>
        </div>
        <ProspectorMapModal open={!!map} onClose={()=>setMap(null)} title={map?.title} points={map?.points||[]}/>
      </>}
    </AppShell>
  )
}
function LocationButton({enabled,onClick}){return <button disabled={!enabled} onClick={onClick} className="inline-flex items-center gap-0.5 rounded-lg bg-prospecta-50 px-1.5 py-1 text-[8px] font-black text-prospecta-700 disabled:bg-zinc-100 disabled:text-zinc-400"><MapPin size={9}/>{enabled?'Mapa':'—'}</button>}
function AttendanceBadge({value}){const v=String(value||'');return <StatusBadge compact tone={v.includes('%')?'info':v.includes('Tard')?'warning':v.includes('Sin')?'neutral':'success'}>{v}</StatusBadge>}
function DepartureBadge({value}){const v=String(value||'');return <StatusBadge compact tone={v.includes('Puntual')?'success':v.includes('Anticipada')?'warning':v.includes('Tardía')?'danger':'neutral'}>{v}</StatusBadge>}
