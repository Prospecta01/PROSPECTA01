import { Filter, RotateCcw } from 'lucide-react'
import MobileDateInput from '../MobileDateInput'
import { MONTHS, defaultDashboardFilters, syncFilters } from '../../lib/dashboardFilters'

const currentYear=new Date().getFullYear()
const YEARS=Array.from({length:7},(_,i)=>String(currentYear+1-i))
const isVisibleLocation=(value)=>String(value||'').trim().toLocaleLowerCase('es')!=='la molina'

export default function DashboardFilters({filters,onChange,options={regions:[],locationsByRegion:{}},loading=false,hideLocation=false,compactDesktop=false}){
  const locations=filters.region==='TODAS'
    ? Array.from(new Set(Object.values(options.locationsByRegion||{}).flat())).filter(isVisibleLocation).sort((a,b)=>a.localeCompare(b,'es'))
    : (options.locationsByRegion?.[filters.region]||[]).filter(isVisibleLocation)

  const set=(key,value)=>onChange(syncFilters({...filters,[key]:value},key))
  const reset=()=>{const base=defaultDashboardFilters();onChange({...base,date:'',region:'TODAS',location:'TODAS'})}

  return <div className={`mb-4 overflow-hidden rounded-2xl bg-white p-3 shadow-card ring-1 ring-black/5 ${compactDesktop?'dashboard-filters--desktop-compact':''}`}>
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-prospecta-50 text-prospecta-700"><Filter size={15}/></span><div className="min-w-0"><p className="text-xs font-black">Filtros de avance</p><p className="truncate text-[9px] text-zinc-400">{hideLocation?'Año · Mes · Fecha · Región':'Año · Mes · Fecha · Región · Locación'}</p></div></div>
      <button type="button" onClick={reset} className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 text-[9px] font-bold text-zinc-500 hover:bg-zinc-50"><RotateCcw size={11}/> Reset</button>
    </div>
    <div className={`dashboard-filter-grid mt-3 ${compactDesktop?'dashboard-filter-grid--desktop-single-row':''}`}>
      <Field label="Año"><select className="compact-filter" value={filters.year} disabled={loading} onChange={e=>set('year',e.target.value)}><option value="">Todos</option>{YEARS.map(y=><option key={y}>{y}</option>)}</select></Field>
      <Field label="Mes"><select className="compact-filter" value={filters.month} disabled={loading} onChange={e=>set('month',e.target.value)}><option value="">Todos</option>{MONTHS.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></Field>
      <Field label="Fecha"><MobileDateInput value={filters.date} disabled={loading} onChange={e=>set('date',e.target.value)} ariaLabel="Fecha del avance"/></Field>
      <Field label="Región"><select className="compact-filter" value={filters.region} disabled={loading} onChange={e=>set('region',e.target.value)}><option value="TODAS">Todas</option>{options.regions.map(r=><option key={r}>{r}</option>)}</select></Field>
      {!hideLocation&&<Field label="Locación" full><select className="compact-filter" value={filters.location} disabled={loading} onChange={e=>set('location',e.target.value)}><option value="TODAS">Todas</option>{locations.map(l=><option key={l}>{l}</option>)}</select></Field>}
    </div>
  </div>
}

function Field({label,children,full=false}){return <label className={`filter-cell block ${full?'filter-cell--full':''}`}><span className="mb-1 block text-[8px] font-black uppercase tracking-[.1em] text-zinc-400">{label}</span><div className="filter-control-wrap">{children}</div></label>}
