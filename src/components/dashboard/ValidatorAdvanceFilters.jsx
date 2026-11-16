import { useMemo, useState } from 'react'
import { CalendarDays, Check, ChevronDown, MapPin, RotateCcw } from 'lucide-react'
import { MONTHS, defaultDashboardFilters } from '../../lib/dashboardFilters'

const YEARS=Array.from({length:9},(_,i)=>String(new Date().getFullYear()+1-i))
const labelClass='mb-1 block text-[10px] font-bold uppercase tracking-wide text-zinc-500'
const controlClass='w-full min-h-10 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-prospecta-500'

function MultiSelect({label,items,selected,onChange,disabled=false}){
 const [open,setOpen]=useState(false)
 const summary=selected.length===0?'Todas':selected.length===1?selected[0]:`${selected.length} seleccionadas`
 return <div className="relative min-w-0">
   <div className={labelClass}>{label}</div>
   <button type="button" disabled={disabled} onClick={()=>setOpen(v=>!v)} aria-expanded={open} className={`${controlClass} flex items-center justify-between gap-2 text-left disabled:opacity-60`}>
    <span className="truncate">{summary}</span><ChevronDown size={15}/>
   </button>
   {open&&<div className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
    <button type="button" onClick={()=>{onChange([]);setOpen(false)}} className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs hover:bg-zinc-50">
     <span className="flex h-4 w-4 items-center justify-center rounded border border-zinc-300">{selected.length===0&&<Check size={12}/>}</span>Todas
    </button>
    {items.map(item=><label key={item} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-zinc-50">
     <input type="checkbox" checked={selected.includes(item)} onChange={e=>onChange(e.target.checked?[...selected,item]:selected.filter(v=>v!==item))} className="accent-prospecta-700"/><span className="break-words">{item}</span>
    </label>)}
    <button type="button" onClick={()=>setOpen(false)} className="mt-1 w-full rounded-lg bg-prospecta-700 px-3 py-2 text-xs font-bold text-white">Aplicar</button>
   </div>}
  </div>
}

export default function ValidatorAdvanceFilters({filters,onChange,options={regions:[],locationsByRegion:{}},loading=false}){
 const locations=useMemo(()=>{
  const regions=filters.regions?.length?filters.regions:options.regions||[]
  return [...new Set(regions.flatMap(r=>options.locationsByRegion?.[r]||[]))]
    .filter(v=>String(v).trim().toLocaleLowerCase('es')!=='la molina')
    .sort((a,b)=>a.localeCompare(b,'es'))
 },[filters.regions,options])
 const update=(key,value)=>{
  const next={...filters,[key]:value}
  if(key==='year'||key==='month'){next.dateFrom='';next.dateTo='';next.date=''}
  if(key==='dateFrom'||key==='dateTo'){next.date=''}
  if(key==='regions'){
   next.locations=(next.locations||[]).filter(l=>{
    const active=value.length?value:options.regions||[]
    return active.some(r=>(options.locationsByRegion?.[r]||[]).includes(l))
   })
  }
  onChange(next)
 }
 const reset=()=>onChange({...defaultDashboardFilters(),date:'',dateFrom:'',dateTo:'',regions:[],locations:[]})
 return <section className="mb-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-black/5">
  <div className="mb-3 flex items-center justify-between gap-3">
   <div><p className="text-sm font-black">Filtros de avance</p><p className="text-[10px] text-zinc-500">Año · Mes · Fecha desde · Fecha hasta · Región · Locación</p></div>
   <button type="button" onClick={reset} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-600"><RotateCcw size={13}/>Limpiar</button>
  </div>
  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
   <div><label className={labelClass}>Año</label><select disabled={loading} className={controlClass} value={filters.year||''} onChange={e=>update('year',e.target.value)}><option value="">Todos</option>{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
   <div><label className={labelClass}>Mes</label><select disabled={loading} className={controlClass} value={filters.month||''} onChange={e=>update('month',e.target.value)}><option value="">Todos</option>{MONTHS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></div>
   <div><label className={labelClass}>Fecha desde</label><input disabled={loading} type="date" className={controlClass} value={filters.dateFrom||''} max={filters.dateTo||undefined} onChange={e=>update('dateFrom',e.target.value)}/></div>
   <div><label className={labelClass}>Fecha hasta</label><input disabled={loading} type="date" className={controlClass} value={filters.dateTo||''} min={filters.dateFrom||undefined} onChange={e=>update('dateTo',e.target.value)}/></div>
   <MultiSelect label="Región" items={options.regions||[]} selected={filters.regions||[]} onChange={v=>update('regions',v)} disabled={loading}/>
   <MultiSelect label="Locación" items={locations} selected={filters.locations||[]} onChange={v=>update('locations',v)} disabled={loading}/>
  </div>
  {(filters.dateFrom||filters.dateTo)&&<p className="mt-2 text-[10px] text-zinc-500">El rango de fechas tiene prioridad sobre Año y Mes. Limpia ambas fechas para volver a filtrar por Año y Mes.</p>}
 </section>
}
