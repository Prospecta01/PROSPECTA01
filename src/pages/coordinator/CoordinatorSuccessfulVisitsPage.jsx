import { useEffect, useMemo, useState } from 'react'
import { Download, Filter, RefreshCw } from 'lucide-react'
import AppShell from '../../components/AppShell'
import MobileDateInput from '../../components/MobileDateInput'
import { useAuth } from '../../context/AuthContext'
import { DATABASE_CONFIG, exportDatabaseExcel, filterDatabaseRows, loadDatabase } from '../../services/adminDatabaseService'
import { getDashboardScopeOptions } from '../../services/dashboardScopeService'

const today=new Date().toISOString().slice(0,10)
export default function CoordinatorSuccessfulVisitsPage(){
  const {user}=useAuth();const [dateFilters,setDateFilters]=useState({startDate:today,endDate:today});const [region,setRegion]=useState(user.region||'TODAS');const [locacion,setLocacion]=useState('TODAS');const [rows,setRows]=useState([]);const [options,setOptions]=useState({regions:[],locationsByRegion:{}});const [loading,setLoading]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{getDashboardScopeOptions(user).then(setOptions).catch(e=>setError(e.message))},[user])
  const load=async()=>{setLoading(true);setError('');try{setRows(await loadDatabase('visitas',dateFilters))}catch(e){setError(e.message||'No fue posible cargar las altas.')}finally{setLoading(false)}}
  useEffect(()=>{load()},[])
  const locations=region==='TODAS'?Array.from(new Set(Object.values(options.locationsByRegion||{}).flat())).sort((a,b)=>a.localeCompare(b,'es')):(options.locationsByRegion?.[region]||[])
  const visible=useMemo(()=>filterDatabaseRows(rows,{region,locacion}),[rows,region,locacion])
  const cols=DATABASE_CONFIG.visitas.columns
  return <AppShell title="Base de Altas" subtitle="Visitas exitosas de tu región con Código cliente SAP.">
    <div className="rounded-[1.5rem] bg-white p-3 shadow-card ring-1 ring-black/5"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-prospecta-50 text-prospecta-700"><Filter size={15}/></span><p className="text-xs font-black">Filtros para exportación</p></div><div className="dashboard-filter-grid mt-3"><Field label="Desde"><MobileDateInput value={dateFilters.startDate} onChange={e=>setDateFilters({...dateFilters,startDate:e.target.value})}/></Field><Field label="Hasta"><MobileDateInput value={dateFilters.endDate} onChange={e=>setDateFilters({...dateFilters,endDate:e.target.value})}/></Field><Field label="Región"><select className="compact-filter" value={region} onChange={e=>{setRegion(e.target.value);setLocacion('TODAS')}}><option value={user.region}>{user.region}</option></select></Field><Field label="Locación"><select className="compact-filter" value={locacion} onChange={e=>setLocacion(e.target.value)}><option value="TODAS">Todas</option>{locations.map(x=><option key={x}>{x}</option>)}</select></Field></div><div className="mt-3 flex gap-2"><button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2.5 text-[10px] font-black text-white"><RefreshCw size={13} className={loading?'animate-spin':''}/>Aplicar fechas</button><button onClick={()=>exportDatabaseExcel('visitas',visible)} disabled={!visible.length} className="inline-flex items-center gap-1.5 rounded-xl bg-prospecta-700 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-40"><Download size={13}/>Exportar Excel</button></div></div>
    {error&&<div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
    <div className="mt-3 overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-black/5"><div className="border-b border-zinc-100 p-3"><p className="text-sm font-black">Altas realizadas</p><p className="mt-1 text-[10px] text-zinc-500">{visible.length} registros · Región {user.region}</p></div><div className="overflow-x-auto"><table className="min-w-max text-left text-[9px]"><thead className="bg-zinc-50 text-[8px] text-zinc-500"><tr>{cols.map(([k,l])=><th key={k} className="whitespace-nowrap px-2 py-2 font-black">{l}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{visible.map((r,i)=><tr key={r.id||i}>{cols.map(([k])=><td key={k} className="max-w-[180px] px-2 py-2"><span className="block truncate" title={String(r[k]??'')}>{String(r[k]??'')||'—'}</span></td>)}</tr>)}</tbody></table>{!loading&&!visible.length&&<div className="p-8 text-center text-xs text-zinc-500">No hay altas para los filtros seleccionados.</div>}</div></div>
  </AppShell>
}
function Field({label,children}){return <label className="filter-cell block"><span className="mb-1 block text-[8px] font-black uppercase tracking-wide text-zinc-400">{label}</span><div className="filter-control-wrap">{children}</div></label>}
