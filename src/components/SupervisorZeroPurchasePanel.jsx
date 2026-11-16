import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, ShoppingCart, Store, Target } from 'lucide-react'
import KpiCard from './KpiCard'
import { getSupervisorZeroPurchaseData, saveZeroPurchaseManagement } from '../services/zeroPurchaseService'

export default function SupervisorZeroPurchasePanel({user}){
  const [rows,setRows]=useState([]);const [totalVisits,setTotalVisits]=useState(0);const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [saving,setSaving]=useState('')
  const load=async()=>{setLoading(true);setError('');try{const data=await getSupervisorZeroPurchaseData(user);setRows(data.rows);setTotalVisits(data.totalSuccessfulVisits)}catch(e){setError(e.message||'No fue posible cargar Compra Cero.')}finally{setLoading(false)}}
  useEffect(()=>{load()},[user])
  const kpis=useMemo(()=>{const total=rows.length,withPurchase=rows.filter(x=>x.REALIZO_COMPRA).length;return{total,pctZero:totalVisits?Math.round((total/totalVisits)*100):0,pctManaged:total?Math.round((withPurchase/total)*100):0}},[rows,totalVisits])
  const patchLocal=(id,patch)=>setRows(prev=>prev.map(r=>r.id===id?{...r,...patch}:r))
  const save=async(row,patch)=>{patchLocal(row.id,patch);setSaving(row.id);setError('');try{const latest={...row,...patch};const saved=await saveZeroPurchaseManagement(user,latest,{});setRows(prev=>prev.map(r=>r.id===row.id?saved:r))}catch(e){setError(e.message||'No fue posible guardar la gestión.');load()}finally{setSaving('')}}
  return <>
    {error&&<div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
    <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black">Gestión de compra cero</p><p className="mt-1 text-xs text-zinc-500">Solo clientes vigentes de la Región {user.region}.</p></div><button onClick={load} className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-[10px] font-black text-zinc-600"><RefreshCw size={12} className={loading?'animate-spin':''}/>Actualizar</button></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <KpiCard icon={Store} label="Clientes compra cero" value={kpis.total} accent />
      <KpiCard icon={ShoppingCart} label="% compra cero" value={`${kpis.pctZero}%`} helper={`${kpis.total} / ${totalVisits} visitas exitosas`} />
      <KpiCard icon={Target} label="% gestión compra cero" value={`${kpis.pctManaged}%`} tone={kpis.pctManaged>=100?'success':kpis.pctManaged>=60?'warning':'danger'} helper="Checks ¿Realizó compra? / clientes compra cero" />
    </div>
    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-black/5">
      <div className="border-b border-zinc-100 p-3"><p className="text-sm font-black">Clientes Compra Cero</p><p className="mt-1 text-[10px] text-zinc-500">Código SAP, nombre del cliente, dirección, locación, visita, compra realizada, cantidad vendida y comentarios.</p></div>
      <div className="overflow-x-auto"><table className="min-w-[1180px] w-full text-left text-[10px]"><thead className="bg-zinc-50 text-[8px] uppercase text-zinc-500"><tr><th className="min-w-[120px] px-3 py-2">Código SAP</th><th className="min-w-[190px] px-3 py-2">Nombre del cliente</th><th className="min-w-[240px] px-3 py-2">Dirección</th><th className="min-w-[140px] px-3 py-2">Locación</th><th className="min-w-[100px] px-3 py-2 text-center">Visita</th><th className="min-w-[115px] px-3 py-2 text-center">¿Realizó compra?</th><th className="min-w-[130px] px-3 py-2">Cantidad vendida</th><th className="min-w-[260px] px-3 py-2">Comentarios</th></tr></thead><tbody className="divide-y divide-zinc-100">{rows.map(row=><ZeroRow key={row.id} row={row} saving={saving===row.id} onSave={(patch)=>save(row,patch)} onLocal={(patch)=>patchLocal(row.id,patch)}/>)}</tbody></table>{!loading&&!rows.length&&<div className="p-8 text-center text-xs text-zinc-500">No hay clientes Compra Cero vigentes para tu región.</div>}</div>
    </div>
  </>
}

function ZeroRow({row,saving,onSave,onLocal}){return <tr className="align-middle"><td className="px-3 py-3"><p className="font-black">{row.CODIGO_SAP||row.CODIGO_CLIENTE||'—'}</p>{saving&&<p className="mt-1 text-[8px] font-bold text-prospecta-700">Guardando…</p>}</td><td className="px-3 py-3 font-bold">{row.CLIENTE||row.NOMBRE_CLIENTE||'—'}</td><td className="px-3 py-3 text-zinc-600">{row.DIRECCION||'—'}</td><td className="px-3 py-3 font-bold">{row.LOCACION||'—'}</td><td className="px-3 py-3 text-center"><input type="checkbox" className="h-5 w-5 accent-prospecta-700" checked={row.VISITA_FISICA===true} onChange={e=>onSave({VISITA_FISICA:e.target.checked})}/></td><td className="px-3 py-3 text-center"><input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={row.REALIZO_COMPRA===true} onChange={e=>onSave({REALIZO_COMPRA:e.target.checked})}/></td><td className="px-3 py-3"><input type="number" min="0" step="1" className="w-28 rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-bold outline-none focus:border-prospecta-500" value={row.CANTIDAD_VENDIDA??0} onChange={e=>onLocal({CANTIDAD_VENDIDA:e.target.value})} onBlur={e=>onSave({CANTIDAD_VENDIDA:e.target.value})}/></td><td className="px-3 py-3"><input className="w-full min-w-[240px] rounded-xl border border-zinc-200 px-3 py-2 text-[10px] outline-none focus:border-prospecta-500" value={row.COMENTARIOS||''} placeholder="Agregar comentario" onChange={e=>onLocal({COMENTARIOS:e.target.value})} onBlur={e=>onSave({COMENTARIOS:e.target.value})}/></td></tr>}
