import { useEffect, useMemo, useState } from 'react'
import { Database, Download, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import MobileDateInput from '../../components/MobileDateInput'
import { DATABASE_CONFIG, exportAllDatabasesExcel, exportDatabaseExcel, filterDatabaseRows, loadAllDatabases, loadDatabase } from '../../services/adminDatabaseService'

const today=new Date().toISOString().slice(0,10)
const tabs=[['jornadas','Jornada'],['visitas','Visitas exitosas'],['validacion','Validación supervisor']]

export default function AdminDatabasesPage(){
  const [tab,setTab]=useState('jornadas')
  const [dateFilters,setDateFilters]=useState({startDate:today,endDate:today})
  const [filters,setFilters]=useState({usuario:'',region:'TODAS',locacion:'TODAS',visita:'TODAS',subcanal:'TODOS'})
  const [rows,setRows]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[exporting,setExporting]=useState(false)
  const load=async()=>{setLoading(true);setError('');try{setRows(await loadDatabase(tab,dateFilters))}catch(e){setError(e.message||'No fue posible cargar la base.')}finally{setLoading(false)}}
  useEffect(()=>{load()},[tab])
  const regions=useMemo(()=>['TODAS',...new Set(rows.map(x=>x.REGION).filter(Boolean))],[rows])
  const locations=useMemo(()=>['TODAS',...new Set(rows.map(x=>x.LOCACION).filter(Boolean))],[rows])
  const subchannels=useMemo(()=>['TODOS',...new Set(rows.map(x=>x.SUBCANAL).filter(Boolean))],[rows])
  const visible=useMemo(()=>filterDatabaseRows(rows,filters),[rows,filters])
  const config=DATABASE_CONFIG[tab]
  const exportAll=async()=>{setExporting(true);try{const data=await loadAllDatabases(dateFilters);await exportAllDatabasesExcel(Object.fromEntries(Object.entries(data).map(([k,v])=>[k,filterDatabaseRows(v,filters)])))}finally{setExporting(false)}}

  return <AppShell title="Bases de Datos" subtitle="Por el momento se muestran únicamente las 3 bases operativas solicitadas.">
    <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-zinc-200 p-1.5">{tabs.map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`rounded-xl px-1 py-2.5 text-[9px] font-black ${tab===id?'bg-white text-prospecta-700 shadow-sm':'text-zinc-500'}`}>{label}</button>)}</div>

    <div className="mt-3 rounded-[1.5rem] bg-white p-3 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-prospecta-50 text-prospecta-700"><Filter size={15}/></span><p className="text-xs font-black">Filtros</p></div>
      <div className="dashboard-filter-grid mt-3">
        <Field label="Desde"><MobileDateInput value={dateFilters.startDate} onChange={e=>setDateFilters({...dateFilters,startDate:e.target.value})} ariaLabel="Fecha desde"/></Field>
        <Field label="Hasta"><MobileDateInput value={dateFilters.endDate} onChange={e=>setDateFilters({...dateFilters,endDate:e.target.value})} ariaLabel="Fecha hasta"/></Field>
        <Field label="Usuario"><input className="compact-filter" value={filters.usuario} onChange={e=>setFilters({...filters,usuario:e.target.value})} placeholder="DNI / usuario"/></Field>
        <Field label="Región"><select className="compact-filter" value={filters.region} onChange={e=>setFilters({...filters,region:e.target.value,locacion:'TODAS'})}>{regions.map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field label="Locación"><select className="compact-filter" value={filters.locacion} onChange={e=>setFilters({...filters,locacion:e.target.value})}>{locations.map(x=><option key={x}>{x}</option>)}</select></Field>
        {(tab==='visitas'||tab==='validacion')&&<Field label="Subcanal"><select className="compact-filter" value={filters.subcanal} onChange={e=>setFilters({...filters,subcanal:e.target.value})}>{subchannels.map(x=><option key={x}>{x}</option>)}</select></Field>}
      </div>
      <button onClick={load} disabled={loading} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-2.5 text-[10px] font-black text-white"><RefreshCw size={13} className={loading?'animate-spin':''}/>Aplicar fechas</button>
    </div>

    <div className="mt-3 rounded-[1.5rem] bg-white shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 p-3"><div className="flex min-w-0 items-center gap-2"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-prospecta-50 text-prospecta-700"><Database size={17}/></span><div className="min-w-0"><p className="truncate text-xs font-black">{config.title}</p><StatusBadge compact tone="info">{visible.length} registros</StatusBadge></div></div><div className="flex gap-1"><button onClick={()=>exportDatabaseExcel(tab,visible)} disabled={!visible.length} className="rounded-xl bg-prospecta-700 p-2.5 text-white disabled:opacity-40"><Download size={14}/></button><button onClick={exportAll} disabled={exporting} className="rounded-xl border border-zinc-200 p-2.5 text-zinc-700"><FileSpreadsheet size={14}/></button></div></div>
      {error&&<div className="m-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
      {loading?<div className="p-8 text-center text-xs text-zinc-500">Cargando…</div>:<DataTable type={tab} rows={visible}/>} 
    </div>
    <div className="mt-3 rounded-xl bg-zinc-950 p-3 text-[10px] leading-4 text-white/70">La base de Visitas contiene únicamente visitas exitosas (altas) e incluye el Código cliente SAP capturado por el Validador. La foto de fachada se exporta como URL directa.</div>
  </AppShell>
}

function Field({label,children}){return <label className="filter-cell block"><span className="mb-1 block text-[8px] font-black uppercase tracking-wide text-zinc-400">{label}</span><div className="filter-control-wrap">{children}</div></label>}
function DataTable({type,rows}){const columns=DATABASE_CONFIG[type].columns;if(!rows.length)return <div className="p-8 text-center text-xs text-zinc-500">No hay registros para los filtros seleccionados.</div>;return <div className="overflow-x-auto"><table className="min-w-max text-left text-[9px]"><thead className="bg-zinc-50 text-[8px] text-zinc-500"><tr>{columns.map(([k,l])=><th key={k} className="whitespace-nowrap px-2 py-2 font-black">{l}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{rows.map((r,i)=><tr key={r.id||i}>{columns.map(([k])=><td key={k} className="max-w-[180px] px-2 py-2">{k==='FOTO_FACHADA_URL'&&r[k]?<a href={r[k]} target="_blank" rel="noreferrer" className="font-black text-prospecta-700 underline">Abrir foto</a>:<span className="block truncate" title={String(r[k]??'')}>{String(r[k]??'')||'—'}</span>}</td>)}</tr>)}</tbody></table></div>}
