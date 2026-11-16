import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Download, FileText, MessageCircle, RefreshCw, Target, Users, XCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import ValidatorAdvanceFilters from '../../components/dashboard/ValidatorAdvanceFilters'
import { useAuth } from '../../context/AuthContext'
import { defaultDashboardFilters, periodLabel } from '../../lib/dashboardFilters'
import { getDashboardScopeOptions } from '../../services/dashboardScopeService'
import { getFacadeSignedUrl, getProspectorDocumentSignedUrl } from '../../services/storageService'
import { resolvePhotoLinks, setPhotoColumnWidths, addPhotoHyperlinks, PHOTO_LABELS } from '../../services/photoExcelExport'
import { getValidatorRows, setValidatorApprovalDate, setValidatorGeolocated, setValidatorSapCode, setValidatorEnlaceCode, setValidatorStatus, setValidatorWhatsAppSent, VALIDATOR_COLUMNS } from '../../services/validatorRegistrationService'

export default function ValidatorProgressPage(){
  const {user}=useAuth();const [filters,setFilters]=useState(()=>({...defaultDashboardFilters(),date:'',dateFrom:'',dateTo:'',regions:[],locations:[]}));const [options,setOptions]=useState({regions:[],locationsByRegion:{}});const [rows,setRows]=useState([]);const [loading,setLoading]=useState(false);const [error,setError]=useState('')
  useEffect(()=>{getDashboardScopeOptions(user).then(setOptions).catch(e=>setError(e.message))},[user])
  const load=async()=>{setLoading(true);setError('');try{setRows(await getValidatorRows(filters))}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[filters])
  const kpis=useMemo(()=>{const altas=rows.length,completadas=rows.filter(x=>x.ESTADO_REGISTRO==='COMPLETADO').length,rechazadas=rows.filter(x=>x.ESTADO_REGISTRO==='RECHAZADO').length,pendientes=rows.filter(x=>(x.ESTADO_REGISTRO||'PENDIENTE')==='PENDIENTE').length,codigosListos=rows.filter(x=>x.GEOLOCALIZADO===true).length,mensajesWhatsapp=rows.filter(x=>x.ENVIO_WHATSAPP===true).length;return{prospectores:new Set(rows.map(x=>x.USUARIO)).size,altas,completadas,rechazadas,pendientes,codigosListos,mensajesWhatsapp,productividad:altas?Math.round(((completadas+rechazadas)/altas)*100):0}},[rows])
  const patch=(id,next)=>setRows(prev=>prev.map(r=>r.id===id?next:r))
  const exportExcel=async()=>{
    if(!rows.length)return
    const data=rows.map(row=>{
      const out={
        'Nombre prospector':row.NOMBRE_PROSPECTOR||'',
        'Usuario':row.USUARIO||'',
        'Región':row.REGION||'',
        'Locación':row.LOCACION||''
      }
      for(const c of VALIDATOR_COLUMNS)out[c.label]=row[c.key]??''
      out['Estado Registro']=row.ESTADO_REGISTRO||'PENDIENTE'
      out['¿Geolocalizado?']=row.GEOLOCALIZADO===true?'SI':'NO'
      out['¿Envío WhatsApp?']=row.ENVIO_WHATSAPP===true?'SI':'NO'
      out['Fecha Prospector']=formatProspectorDate(row.FIN_ISO)
      out['Fecha Aprobador']=row.FECHA_APROBADOR||''
      out['Código cliente SAP']=row.CODIGO_CLIENTE_SAP||''
      out['Código Enlace']=row.CODIGO_ENLACE||''
      return out
    })
    let exported
    try { exported = await resolvePhotoLinks(data, PHOTO_LABELS) }
    catch (e) { alert(e.message); return }
    const wb=XLSX.utils.book_new()
    const ws=XLSX.utils.json_to_sheet(exported)
    setPhotoColumnWidths(ws, Object.keys(exported[0] || {}))
    addPhotoHyperlinks(ws, Object.keys(exported[0] || {}), exported)
    XLSX.utils.book_append_sheet(wb,ws,'Altas Prospectores')
    const stamp=new Date().toISOString().slice(0,10).replaceAll('-','')
    XLSX.writeFile(wb,`PROSPECTA_RTM_ALTAS_VALIDADOR_${stamp}.xlsx`,{compression:true})
  }
  return <AppShell title="Avance de Prospectores" subtitle="Validador · seguimiento y registro de altas efectivas.">
    <div className="mb-4 rounded-[2rem] bg-gradient-to-r from-zinc-950 to-prospecta-900 p-5 text-white shadow-card lg:mb-2 lg:rounded-2xl lg:px-4 lg:py-2.5"><div className="lg:flex lg:items-center lg:gap-4"><div className="shrink-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-white/50 lg:text-[9px]">Validador</p><h2 className="mt-2 text-2xl font-black lg:mt-0.5 lg:text-lg lg:leading-tight">Control de altas registradas</h2></div><p className="mt-1 text-xs text-white/65 lg:mt-0 lg:text-[10px]">Clasifica cada alta como Pendiente, Completado o Rechazado y registra la validación correspondiente.</p></div></div>
    <ValidatorAdvanceFilters filters={filters} onChange={setFilters} options={options} loading={loading}/>
    {error&&<div className="mb-4 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold text-zinc-500">{periodLabel(filters)}</p><button onClick={load} className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-[10px] font-black text-zinc-600"><RefreshCw size={12} className={loading?'animate-spin':''}/>Actualizar</button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
      <KpiCard compact icon={Users} label="Prospectores" value={kpis.prospectores}/>
      <KpiCard compact icon={CheckCircle2} label="Altas" value={kpis.altas}/>
      <KpiCard compact icon={FileText} label="Completadas" value={kpis.completadas} tone="success"/>
      <KpiCard compact icon={XCircle} label="Rechazadas" value={kpis.rechazadas} tone={kpis.rechazadas?'danger':'success'}/>
      <KpiCard compact icon={Clock3} label="Pendientes" value={kpis.pendientes} tone={kpis.pendientes?'warning':'success'}/>
      <KpiCard compact icon={CheckCircle2} label="Códigos Listos" value={kpis.codigosListos} tone={kpis.codigosListos?'success':'default'}/>
      <KpiCard compact icon={MessageCircle} label="Mensaje WhatsApp" value={kpis.mensajesWhatsapp} tone={kpis.mensajesWhatsapp?'success':'default'}/>
      <KpiCard compact icon={Target} label="Productividad registro" value={`${kpis.productividad}%`} tone={kpis.productividad>=100?'success':kpis.productividad>=60?'warning':'danger'}/>
    </div>
    <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-card ring-1 ring-black/5"><div className="flex items-center justify-between gap-3 border-b border-zinc-100 p-3"><div><p className="text-sm font-black">Base de altas de Prospectores</p><p className="mt-1 text-[10px] text-zinc-500">Nombre, región, locación, datos del alta, validación y Código cliente SAP.</p></div><button onClick={exportExcel} disabled={!rows.length} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-prospecta-700 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-40"><Download size={13}/>Exportar Excel</button></div><div className="overflow-x-auto"><table className="min-w-[5820px] text-left text-[9px]"><thead className="sticky top-0 bg-zinc-50 text-[8px] uppercase text-zinc-500"><tr><th className="sticky left-0 z-20 min-w-[150px] bg-zinc-50 px-2 py-2">Nombre prospector</th><th className="min-w-[85px] px-2 py-2">Región</th><th className="min-w-[100px] px-2 py-2">Locación</th>{VALIDATOR_COLUMNS.map(c=><th key={c.key} className="min-w-[115px] px-2 py-2">{c.label}</th>)}<th className="min-w-[115px] px-2 py-2">Estado Registro</th><th className="min-w-[105px] px-2 py-2">¿Geolocalizado?</th><th className="min-w-[115px] px-2 py-2">¿Envío WhatsApp?</th><th className="min-w-[145px] px-2 py-2">Fecha Prospector</th><th className="min-w-[125px] px-2 py-2">Fecha Aprobador</th><th className="sticky right-0 z-20 min-w-[140px] bg-zinc-50 px-2 py-2">Código cliente SAP</th><th className="min-w-[140px] px-2 py-2">Código Enlace</th></tr></thead><tbody>{rows.map(row=><ValidatorRow key={row.id} user={user} row={row} onChange={next=>patch(row.id,next)}/>)}</tbody></table>{!loading&&!rows.length&&<div className="p-8 text-center text-xs text-zinc-500">No hay altas efectivas para los filtros seleccionados.</div>}</div></div>
  </AppShell>
}

function formatProspectorDate(value){
  if(!value)return '—'
  const d=new Date(value)
  if(Number.isNaN(d.getTime()))return String(value)
  return new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(d)
}

function ValidatorRow({user,row,onChange}){
  const [busy,setBusy]=useState(false)
  const [sap,setSap]=useState(row.CODIGO_CLIENTE_SAP||'')
  const [enlace,setEnlace]=useState(row.CODIGO_ENLACE||'')
  const [approvalDate,setApprovalDate]=useState(row.FECHA_APROBADOR||'')
  useEffect(()=>setSap(row.CODIGO_CLIENTE_SAP||''),[row.CODIGO_CLIENTE_SAP])
  useEffect(()=>setEnlace(row.CODIGO_ENLACE||''),[row.CODIGO_ENLACE])
  useEffect(()=>setApprovalDate(row.FECHA_APROBADOR||''),[row.FECHA_APROBADOR])
  const changeStatus=async e=>{setBusy(true);try{onChange(await setValidatorStatus(user,row,e.target.value))}finally{setBusy(false)}}
  const toggleGeo=async e=>{setBusy(true);try{onChange(await setValidatorGeolocated(user,row,e.target.checked))}finally{setBusy(false)}}
  const toggleWhatsApp=async e=>{setBusy(true);try{onChange(await setValidatorWhatsAppSent(user,row,e.target.checked))}finally{setBusy(false)}}
  const saveApproval=async()=>{if((approvalDate||'')===(row.FECHA_APROBADOR||''))return;setBusy(true);try{onChange(await setValidatorApprovalDate(user,row,approvalDate))}finally{setBusy(false)}}
  const saveSap=async()=>{if(sap.trim()===(row.CODIGO_CLIENTE_SAP||'').trim())return;setBusy(true);try{onChange(await setValidatorSapCode(user,row,sap))}finally{setBusy(false)}}
  const saveEnlace=async()=>{if(enlace.trim()===(row.CODIGO_ENLACE||'').trim())return;setBusy(true);try{onChange(await setValidatorEnlaceCode(user,row,enlace))}finally{setBusy(false)}}
  const status=row.ESTADO_REGISTRO||'PENDIENTE'
  return <tr className="border-t border-zinc-100 align-middle">
    <td className="sticky left-0 z-10 bg-white px-2 py-2"><p className="max-w-[140px] truncate font-black">{row.NOMBRE_PROSPECTOR}</p><p className="text-[8px] text-zinc-400">{row.USUARIO}</p></td>
    <td className="px-2 py-2">{row.REGION||'—'}</td><td className="px-2 py-2">{row.LOCACION||'—'}</td>
    {VALIDATOR_COLUMNS.map(c=><td key={c.key} className="max-w-[150px] px-2 py-2">{c.document?<DocumentCell path={row[c.key]} publicFacade={c.publicFacade}/>:<span className="block max-w-[145px] whitespace-normal break-words">{row[c.key]||'—'}</span>}</td>)}
    <td className="px-2 py-2"><select value={status} disabled={busy} onChange={changeStatus} className={`w-28 rounded-xl border px-2 py-2 text-[9px] font-black outline-none ${status==='COMPLETADO'?'border-emerald-200 bg-emerald-50 text-emerald-700':status==='RECHAZADO'?'border-red-200 bg-red-50 text-red-700':'border-amber-200 bg-amber-50 text-amber-700'}`}><option value="PENDIENTE">Pendiente</option><option value="COMPLETADO">Completado</option><option value="RECHAZADO">Rechazado</option></select></td>
    <td className="px-2 py-2 text-center"><input type="checkbox" checked={row.GEOLOCALIZADO===true} disabled={busy} onChange={toggleGeo} className="h-4 w-4 accent-emerald-600"/></td>
    <td className="px-2 py-2 text-center"><input type="checkbox" checked={row.ENVIO_WHATSAPP===true} disabled={busy} onChange={toggleWhatsApp} className="h-4 w-4 accent-emerald-600"/></td>
    <td className="px-2 py-2"><span className="block max-w-[135px] whitespace-normal">{formatProspectorDate(row.FIN_ISO)}</span></td>
    <td className="px-2 py-2"><input type="date" value={approvalDate||''} disabled={busy} onChange={e=>setApprovalDate(e.target.value)} onBlur={saveApproval} className="w-28 rounded-xl border border-zinc-200 px-2 py-2 text-[9px] font-bold outline-none focus:border-prospecta-500"/></td>
    <td className="sticky right-0 bg-white px-2 py-2"><input value={sap} disabled={busy} onChange={e=>setSap(e.target.value)} onBlur={saveSap} placeholder="Código SAP" className="w-32 rounded-xl border border-zinc-200 px-2 py-2 text-[9px] font-bold outline-none focus:border-prospecta-500"/></td><td className="px-2 py-2"><input value={enlace} disabled={busy} onChange={e=>setEnlace(e.target.value)} onBlur={saveEnlace} placeholder="Código Enlace" className="w-32 rounded-xl border border-zinc-200 px-2 py-2 text-[9px] font-bold outline-none focus:border-prospecta-500"/></td>
  </tr>
}
function DocumentCell({path,publicFacade=false}){
  const [url,setUrl]=useState('')
  const [failed,setFailed]=useState(false)
  useEffect(()=>{
    let active=true
    setUrl('');setFailed(false)
    if(!path)return()=>{active=false}
    const request=publicFacade?getFacadeSignedUrl(path):getProspectorDocumentSignedUrl(path)
    Promise.resolve(request).then(value=>{if(active){setUrl(value||'');setFailed(!value)}}).catch(()=>active&&setFailed(true))
    return()=>{active=false}
  },[path,publicFacade])
  if(!path)return <span>—</span>
  if(failed)return <span className="text-xs text-zinc-500">No disponible</span>
  if(!url)return <span className="text-zinc-400">Cargando…</span>
  const isImage=/\.(png|jpe?g|webp)(\?|$)/i.test(url)||publicFacade
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-prospecta-700 underline">{isImage?<img src={url} onError={()=>setFailed(true)} alt="Documento" className="h-10 w-12 rounded-lg object-cover"/>:<FileText size={15}/>}<span className="text-[8px]">Ver</span></a>
}
