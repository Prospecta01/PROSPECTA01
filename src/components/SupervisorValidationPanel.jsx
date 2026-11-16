import { useEffect, useMemo, useState } from 'react'
import { Camera, CheckCircle2, LocateFixed, RefreshCw, Target } from 'lucide-react'
import KpiCard from './KpiCard'
import MobileDateInput from './MobileDateInput'
import { peruDateKey } from '../lib/date'
import { getFacadePublicUrl, getSupervisorDniSignedUrl } from '../services/storageService'
import { captureSupervisorLocation, getSupervisorValidationRows, isValidationComplete, saveSupervisorChoice, saveSupervisorDniPhoto } from '../services/supervisorValidationService'

export default function SupervisorValidationPanel({user,options={regions:[],locationsByRegion:{}}}){
  const [filters,setFilters]=useState({date:peruDateKey(),region:user.region||'TODAS',location:'TODAS'})
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(false)
  const [error,setError]=useState('')

  const load=async()=>{setLoading(true);setError('');try{setRows(await getSupervisorValidationRows(user,filters))}catch(e){setError(e.message||'No fue posible cargar las altas.') }finally{setLoading(false)}}
  useEffect(()=>{load()},[filters.date,filters.region,filters.location])
  const patchRow=(id,next)=>setRows(prev=>prev.map(r=>(r.VISITA_ID||r.id)===id?next:r))
  const locations=useMemo(()=>filters.region==='TODAS'?Array.from(new Set(Object.values(options.locationsByRegion||{}).flat())).sort((a,b)=>a.localeCompare(b,'es')):(options.locationsByRegion?.[filters.region]||[]),[filters.region,options])
  const completed=rows.filter(isValidationComplete).length
  const objective=Math.min(100,Math.round((completed/5)*100))
  const adherencia=rows.length?Math.round((rows.filter(r=>r.SUBCANAL_CORRECTO==='SI').length/rows.length)*100):0

  return <div>
    <div className="rounded-2xl bg-white p-3 shadow-card ring-1 ring-black/5">
      <div className="grid grid-cols-3 gap-2">
        <MiniField label="Fecha"><MobileDateInput dense value={filters.date} onChange={e=>setFilters({...filters,date:e.target.value})} ariaLabel="Fecha de validación"/></MiniField>
        <MiniField label="Región"><select className="validation-filter" value={filters.region} onChange={e=>setFilters({...filters,region:e.target.value,location:'TODAS'})}><option value="TODAS">Toda la región</option>{options.regions.map(x=><option key={x}>{x}</option>)}</select></MiniField>
        <MiniField label="Locación"><select className="validation-filter" value={filters.location} onChange={e=>setFilters({...filters,location:e.target.value})}><option value="TODAS">Todas</option>{locations.map(x=><option key={x}>{x}</option>)}</select></MiniField>
      </div>
    </div>

    {error&&<div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
    <div className="mt-3 grid grid-cols-2 gap-2">
      <KpiCard compact icon={Target} label="Objetivo validación" value={`${objective}%`} helper={`${completed}/5 completas`} tone={objective>=100?'success':objective>=60?'warning':'danger'}/>
      <KpiCard compact icon={CheckCircle2} label="Adherencia subcanal" value={`${adherencia}%`} helper={`${rows.filter(r=>r.SUBCANAL_CORRECTO==='SI').length}/${rows.length} correctos`} tone={adherencia>=100?'success':adherencia>=60?'warning':'danger'}/>
    </div>

    <div className="mt-4 rounded-[1.5rem] bg-white shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 p-3"><div><p className="text-sm font-black">Validación de visitas</p><p className="text-[10px] text-zinc-500">Altas efectivas del día · completa 4 campos por cliente</p></div><button onClick={load} className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-100 text-zinc-600"><RefreshCw size={15} className={loading?'animate-spin':''}/></button></div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-left text-[9px]">
          <thead className="bg-zinc-50 text-[8px] uppercase text-zinc-500"><tr><th className="px-2 py-2">DNI</th><th className="px-2 py-2">Subcanal</th><th className="px-2 py-2">Fachada</th><th className="px-2 py-2">Validación DNI</th><th className="px-2 py-2">Foto DNI</th><th className="px-2 py-2">Ubicación</th><th className="px-2 py-2">¿Subcanal correcto?</th></tr></thead>
          <tbody>{rows.map(row=><ValidationRow key={row.VISITA_ID||row.id} user={user} row={row} onChange={next=>patchRow(row.VISITA_ID||row.id,next)}/>)}</tbody>
        </table>
        {!loading&&!rows.length&&<div className="p-6 text-center text-xs text-zinc-500">No hay altas efectivas para los filtros seleccionados.</div>}
      </div>
    </div>
  </div>
}

function ValidationRow({user,row,onChange}){
  const [busy,setBusy]=useState('')
  const [dniUrl,setDniUrl]=useState('')
  const facade=getFacadePublicUrl(row.FOTO_FACHADA)
  useEffect(()=>{let active=true;if(row.FOTO_DNI)getSupervisorDniSignedUrl(row.FOTO_DNI).then(x=>active&&setDniUrl(x));else setDniUrl('');return()=>{active=false}},[row.FOTO_DNI])
  const choice=async(key,value)=>{setBusy(key);try{onChange(await saveSupervisorChoice(user,row,key,value))}finally{setBusy('')}}
  const upload=async(file)=>{if(!file)return;setBusy('foto');try{onChange(await saveSupervisorDniPhoto(user,row,file))}finally{setBusy('')}}
  const location=async()=>{setBusy('loc');try{onChange(await captureSupervisorLocation(user,row))}finally{setBusy('')}}
  return <tr className="border-t border-zinc-100 align-middle">
    <td className="whitespace-nowrap px-2 py-2 font-black"><div>{row.DNI_CLIENTE}</div><div className="max-w-[90px] truncate text-[8px] font-medium text-zinc-400">{row.NOMBRE_PROSPECTOR}</div></td>
    <td className="max-w-[100px] px-2 py-2 font-semibold">{row.SUBCANAL}</td>
    <td className="px-2 py-2">{facade?<a href={facade} target="_blank" rel="noreferrer"><img src={facade} alt="Fachada" className="h-10 w-12 rounded-lg object-cover"/></a>:<span>—</span>}</td>
    <td className="px-2 py-2"><TinySelect value={row.VALIDACION_DNI||''} onChange={v=>choice('VALIDACION_DNI',v)} disabled={busy==='VALIDACION_DNI'}/></td>
    <td className="px-2 py-2"><label className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1.5 font-black"><Camera size={11}/>{dniUrl?<img src={dniUrl} alt="DNI" className="h-7 w-9 rounded object-cover"/>:'Subir'}<input type="file" accept="image/*" capture="environment" className="hidden" onChange={e=>upload(e.target.files?.[0])}/></label></td>
    <td className="px-2 py-2"><label className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-black ${row.UBICACION_MARCADA?'bg-emerald-50 text-emerald-700':'bg-zinc-100 text-zinc-600'}`}><input type="checkbox" checked={row.UBICACION_MARCADA===true} disabled={busy==='loc'||row.UBICACION_MARCADA===true} onChange={e=>e.target.checked&&location()} className="h-3 w-3 accent-[#CC0000]"/><LocateFixed size={10}/><span>{row.UBICACION_MARCADA?`${row.UBICACION_CORRECTA||'—'} · ${row.DISTANCIA_M??'—'}m`:'GPS'}</span></label></td>
    <td className="px-2 py-2"><TinySelect value={row.SUBCANAL_CORRECTO||''} onChange={v=>choice('SUBCANAL_CORRECTO',v)} disabled={busy==='SUBCANAL_CORRECTO'}/></td>
  </tr>
}
function TinySelect({value,onChange,disabled}){return <select className="rounded-lg border border-zinc-200 bg-white px-1.5 py-1.5 text-[9px] font-black" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}><option value="">—</option><option value="SI">SI</option><option value="NO">NO</option></select>}
function MiniField({label,children}){return <label className="validation-filter-cell"><span className="mb-1 block truncate text-[7px] font-black uppercase tracking-wide text-zinc-400">{label}</span><div className="filter-control-wrap">{children}</div></label>}
