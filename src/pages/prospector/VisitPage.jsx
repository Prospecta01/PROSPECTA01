import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, Clock3, FileText, LocateFixed, MapPinPlus, Navigation, Upload, UserRound, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { listActiveSubchannels } from '../../services/subchannelService'
import { ACD_SEGMENTS, FAILED_VISIT_REASONS, SEGMENTS, SUBCHANNELS, VIA_TYPES } from '../../lib/constants'
import { captureLocationWithAddress, getCurrentLocation } from '../../lib/geo'
import { getTodayStart } from '../../services/jornadaService'
import { getRouteCatalog } from '../../services/locationRouteService'
import { finishVisit, getOpenVisit, startVisit } from '../../services/visitaService'

const EMPTY_FORM={
  motivo:'',motivoOtro:'',canalPrincipal:'Tradicional',subcanal:'',ruc:'',dniCliente:'',razonSocial:'',correo:'',telefono1:'',telefono2:'',
  viaTipo:'',direccion:'',numero:'',manzana:'',lote:'',seccion:'',interior:'',departamento:'',provincia:'',distrito:'',ubigeo:'',ubicacionReferencia:'',
  locacionComercial:'',ruta:'',segmento:'',representanteLegal:'',nombreVendedor:'',codigoVendedor:'',segmentoAcd:'',ubicacionCapturada:'',ubicacionLat:'',ubicacionLong:'',
}
const EMPTY_DOCS={dniFrente:null,dniAtras:null,rucDoc:null,recibo:null,ficha:null,fotoLocal:null,fotoInterior:null}

export default function VisitPage(){
  const [activeSubchannels,setActiveSubchannels]=useState(SUBCHANNELS)
  useEffect(()=>{let mounted=true;listActiveSubchannels().then(x=>{if(mounted)setActiveSubchannels(x)}).catch(console.error);return()=>{mounted=false}},[])

  const {user}=useAuth()
  const [journey,setJourney]=useState(undefined)
  const [visit,setVisit]=useState(null)
  const [choice,setChoice]=useState('')
  const [form,setForm]=useState(EMPTY_FORM)
  const [docs,setDocs]=useState(EMPTY_DOCS)
  const [routeCatalog,setRouteCatalog]=useState([])
  const [openSection,setOpenSection]=useState('cliente')
  const [busy,setBusy]=useState(false)
  const [gpsBusy,setGpsBusy]=useState(false)
  const [error,setError]=useState('')
  const [finished,setFinished]=useState(null)

  useEffect(()=>{
    let active=true
    const load=async()=>{
      setError('')
      try{
        const j=await getTodayStart(user)
        if(!active)return
        setJourney(j)
        if(!j)return
        try{setVisit(await getOpenVisit(user))}catch(e){if(active)setError(e.message)}
        try{setRouteCatalog(await getRouteCatalog())}catch(e){if(active)setError(prev=>prev||'No se pudo cargar el catálogo de rutas. Puedes continuar y volver a intentar después.')}
      }catch(e){if(active){setJourney(null);setError(e.message)}}
    }
    load();return()=>{active=false}
  },[user])

  const locations=useMemo(()=>Array.from(new Set(routeCatalog.map(x=>x.locacion))).sort((a,b)=>a.localeCompare(b,'es')),[routeCatalog])
  const routes=useMemo(()=>routeCatalog.filter(x=>x.locacion===form.locacionComercial).map(x=>x.ruta),[routeCatalog,form.locacionComercial])
  const set=(key,value)=>setForm(prev=>({...prev,[key]:value}))

  const begin=async()=>{setBusy(true);setError('');try{setVisit(await startVisit(user,await getCurrentLocation()));setFinished(null)}catch(e){setError(e.message)}finally{setBusy(false)}}
  const captureBusinessLocation=async()=>{setGpsBusy(true);setError('');try{const geo=await captureLocationWithAddress();setForm(prev=>({...prev,ubicacionCapturada:geo.address,ubicacionLat:geo.latitude,ubicacionLong:geo.longitude}))}catch(e){setError(e.message)}finally{setGpsBusy(false)}}
  const complete=async()=>{
    if(!choice){setError('Indica si la visita fue exitosa.');return}
    setBusy(true);setError('')
    try{
      const result=await finishVisit(user,visit,{...form,clienteExitoso:choice},docs)
      setFinished(result);setVisit(null);setChoice('');setForm(EMPTY_FORM);setDocs(EMPTY_DOCS);setOpenSection('cliente')
    }catch(e){setError(e.message)}finally{setBusy(false)}
  }

  if(journey===undefined)return <AppShell title="Registro de Visitas"><Loading/></AppShell>
  if(!journey)return <AppShell title="Registro de Visitas" subtitle="Toda visita requiere una jornada iniciada."><div className="rounded-[2rem] bg-white p-6 text-center shadow-card ring-1 ring-black/5"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-50 text-amber-600"><Clock3 size={36}/></span><h2 className="mt-4 text-xl font-black">Hola prospector ☺</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">Antes de iniciar tus visitas, registra tu inicio de jornada.</p><Link to="/prospector/inicio" className="mt-6 inline-flex rounded-2xl bg-prospecta-700 px-5 py-3.5 text-sm font-black text-white shadow-soft">Ir a Inicio de Jornada</Link></div></AppShell>

  return <AppShell title="Registro de Visitas" subtitle="Alta 360 · Cliente, Dirección, Ubicación y Documentos en una sola pantalla.">
    {finished&&<div className="mb-4 flex items-start gap-3 rounded-3xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-600/10"><CheckCircle2 size={20}/><div><p className="font-black">Visita registrada correctamente</p><p className="mt-1 text-xs">Resultado: {finished.CLIENTE_EXITOSO==='SI'?'Alta exitosa':'No exitosa'} · Duración: {finished.DURACION_VISITA} min</p></div></div>}
    {!visit?<NewVisitCard busy={busy} error={error} onBegin={begin}/>:<div className="space-y-4">
      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Visita en curso</p><p className="mt-1 text-lg font-black">Inicio {visit.HORA_INICIO_VISITA?.slice(0,5)}</p></div><StatusBadge tone={visit.STATUS_UBICACION==='GPS_OK'?'success':'warning'}>{visit.STATUS_UBICACION}</StatusBadge></div><div className="mt-3 flex items-center gap-2 rounded-2xl bg-zinc-50 p-3"><Navigation size={17} className="text-prospecta-700"/><p className="min-w-0 truncate text-xs font-bold">{visit.UBICACION_GPS}</p></div></div>
      <div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5"><p className="text-sm font-black">¿Visita exitosa?</p><div className="mt-3 grid grid-cols-2 gap-2"><Choice active={choice==='SI'} onClick={()=>{setChoice('SI');setError('')}} icon={CheckCircle2} label="SÍ" positive/><Choice active={choice==='NO'} onClick={()=>{setChoice('NO');setError('')}} icon={XCircle} label="NO"/></div></div>

      {choice==='NO'&&<div className="rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5"><Field label="Motivo *"><select value={form.motivo} onChange={e=>set('motivo',e.target.value)} className="field"><option value="">Selecciona un motivo</option>{FAILED_VISIT_REASONS.map(x=><option key={x}>{x}</option>)}</select></Field>{form.motivo==='Otro'&&<textarea rows={3} value={form.motivoOtro} onChange={e=>set('motivoOtro',e.target.value)} className="field mt-3 resize-none" placeholder="Escribe el motivo"/>}<p className="mt-4 rounded-2xl bg-prospecta-50 px-4 py-3 text-center text-sm font-bold text-prospecta-800">Dale clic y termina visita</p></div>}

      {choice==='SI'&&<div className="space-y-2">
        <Accordion title="A. Cliente" active={openSection==='cliente'} onClick={()=>setOpenSection(openSection==='cliente'?'':'cliente')} icon={UserRound} complete={Boolean(form.subcanal&&form.dniCliente&&form.razonSocial&&form.telefono1)}>
          <div className="grid gap-3">
            <Field label="Canal Principal"><input className="field bg-zinc-100 font-bold" value="Tradicional" readOnly/></Field>
            <Field label="Subcanal *"><select className="field" value={form.subcanal} onChange={e=>set('subcanal',e.target.value)}><option value="">Selecciona subcanal</option>{activeSubchannels.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="RUC"><input inputMode="numeric" maxLength={11} className="field" value={form.ruc} onChange={e=>set('ruc',e.target.value.replace(/\D/g,''))} placeholder="Opcional"/></Field>
            <Field label="DNI Cliente *"><input inputMode="numeric" maxLength={8} className="field" value={form.dniCliente} onChange={e=>set('dniCliente',e.target.value.replace(/\D/g,''))} placeholder="8 dígitos"/></Field>
            <Field label="Razón Social *"><input className="field" value={form.razonSocial} onChange={e=>set('razonSocial',e.target.value)}/></Field>
            <Field label="Correo electrónico"><input type="email" className="field" value={form.correo} onChange={e=>set('correo',e.target.value)}/></Field>
            <Field label="Teléfono Celular 1 *"><input inputMode="tel" className="field" value={form.telefono1} onChange={e=>set('telefono1',e.target.value.replace(/[^0-9+]/g,''))}/></Field>
            <Field label="Teléfono Celular 2"><input inputMode="tel" className="field" value={form.telefono2} onChange={e=>set('telefono2',e.target.value.replace(/[^0-9+]/g,''))}/></Field>
          </div>
        </Accordion>

        <Accordion title="B. Dirección" active={openSection==='direccion'} onClick={()=>setOpenSection(openSection==='direccion'?'':'direccion')} icon={MapPinPlus} complete={Boolean(form.direccion)}>
          <div className="grid gap-3">
            <Field label="Vía Tipo"><select className="field" value={form.viaTipo} onChange={e=>set('viaTipo',e.target.value)}><option value="">Selecciona</option>{VIA_TYPES.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Dirección *"><input className="field" value={form.direccion} onChange={e=>set('direccion',e.target.value)}/></Field>
            <Two><Field label="Número"><input className="field" value={form.numero} onChange={e=>set('numero',e.target.value)}/></Field><Field label="Manzana"><input className="field" value={form.manzana} onChange={e=>set('manzana',e.target.value)}/></Field></Two>
            <Two><Field label="Lote"><input className="field" value={form.lote} onChange={e=>set('lote',e.target.value)}/></Field><Field label="Sección"><input className="field" value={form.seccion} onChange={e=>set('seccion',e.target.value)}/></Field></Two>
            <Two><Field label="Interior"><input className="field" value={form.interior} onChange={e=>set('interior',e.target.value)}/></Field><Field label="Departamento"><input className="field" value={form.departamento} onChange={e=>set('departamento',e.target.value)}/></Field></Two>
            <Field label="Provincia"><input className="field" value={form.provincia} onChange={e=>set('provincia',e.target.value)}/></Field>
            <Field label="Distrito"><input className="field" value={form.distrito} onChange={e=>set('distrito',e.target.value)}/></Field>
            <Field label="Ubigeo"><input className="field" value={form.ubigeo} onChange={e=>set('ubigeo',e.target.value)}/></Field>
            <Field label="Ubicación"><input className="field" value={form.ubicacionReferencia} onChange={e=>set('ubicacionReferencia',e.target.value)} placeholder="Referencia de la dirección"/></Field>
          </div>
        </Accordion>

        <Accordion title="C. Ubicación" active={openSection==='ubicacion'} onClick={()=>setOpenSection(openSection==='ubicacion'?'':'ubicacion')} icon={LocateFixed} complete={Boolean(form.ubicacionCapturada)}>
          <div className="grid gap-3">
            <Field label="Locación Comercial"><select className="field" value={form.locacionComercial} onChange={e=>setForm(prev=>({...prev,locacionComercial:e.target.value,ruta:''}))}><option value="">Selecciona locación</option>{locations.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Ruta"><select className="field" value={form.ruta} disabled={!form.locacionComercial} onChange={e=>set('ruta',e.target.value)}><option value="">Selecciona ruta</option>{routes.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Segmento"><select className="field" value={form.segmento} onChange={e=>set('segmento',e.target.value)}><option value="">Selecciona segmento</option>{SEGMENTS.map(x=><option key={x}>{x}</option>)}</select></Field>
            <Field label="Representante Legal"><input className="field" value={form.representanteLegal} onChange={e=>set('representanteLegal',e.target.value)}/></Field>
            <Field label="Nombre del vendedor"><input className="field" value={form.nombreVendedor} onChange={e=>set('nombreVendedor',e.target.value)}/></Field>
            <Field label="Código de vendedor"><input className="field" value={form.codigoVendedor} onChange={e=>set('codigoVendedor',e.target.value)}/></Field>
            <Field label="Segmento ACD"><select className="field" value={form.segmentoAcd} onChange={e=>set('segmentoAcd',e.target.value)}><option value="">Selecciona segmento ACD</option>{ACD_SEGMENTS.map(x=><option key={x}>{x}</option>)}</select></Field>
            <div className="rounded-2xl bg-zinc-50 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black">Ubicación en tiempo real</p><p className="mt-1 text-[10px] text-zinc-500">Marca el punto exacto donde te encuentras.</p></div><button type="button" onClick={captureBusinessLocation} disabled={gpsBusy} className="shrink-0 rounded-xl bg-zinc-950 px-3 py-2 text-[10px] font-black text-white">{gpsBusy?'Marcando…':'Marcar ubicación'}</button></div>{form.ubicacionCapturada&&<div className="mt-3 rounded-xl bg-white p-3 text-[10px] leading-4 text-zinc-600 ring-1 ring-black/5"><p className="font-bold text-zinc-800">{form.ubicacionCapturada}</p><p className="mt-1">Lat. {Number(form.ubicacionLat).toFixed(6)} · Long. {Number(form.ubicacionLong).toFixed(6)}</p></div>}</div>
          </div>
        </Accordion>

        <Accordion title="D. Documentos" active={openSection==='documentos'} onClick={()=>setOpenSection(openSection==='documentos'?'':'documentos')} icon={FileText} complete={Boolean(docs.dniFrente&&docs.dniAtras&&docs.recibo&&docs.fotoLocal&&docs.fotoInterior)}>
          <div className="grid gap-3">
            <DocumentField label="DNI – CE (Frente) *" file={docs.dniFrente} onFile={f=>setDocs(p=>({...p,dniFrente:f}))}/>
            <DocumentField label="DNI – CE (Atrás) *" file={docs.dniAtras} onFile={f=>setDocs(p=>({...p,dniAtras:f}))}/>
            <DocumentField label="RUC" file={docs.rucDoc} onFile={f=>setDocs(p=>({...p,rucDoc:f}))}/>
            <DocumentField label="Recibo de Servicios – Contrato de Renta *" file={docs.recibo} onFile={f=>setDocs(p=>({...p,recibo:f}))}/>
            <DocumentField label="Ficha de Caracterización (Canal Vertical)" file={docs.ficha} onFile={f=>setDocs(p=>({...p,ficha:f}))}/>
            <DocumentField label="Foto de Fachada *" file={docs.fotoLocal} imageOnly capture onFile={f=>setDocs(p=>({...p,fotoLocal:f}))}/>
            <DocumentField label="Foto interior *" file={docs.fotoInterior} imageOnly capture onFile={f=>setDocs(p=>({...p,fotoInterior:f}))}/>
          </div>
        </Accordion>
      </div>}

      {error&&<ErrorBox text={error}/>}<button onClick={complete} disabled={busy||!choice} className="w-full rounded-2xl bg-prospecta-700 px-5 py-4 font-black text-white shadow-soft disabled:cursor-not-allowed disabled:opacity-40">{busy?'Guardando visita…':'Finalizar Visita'}</button>
    </div>}
  </AppShell>
}

function NewVisitCard({busy,error,onBegin}){return <div className="overflow-hidden rounded-[2rem] bg-white shadow-card ring-1 ring-black/5"><div className="bg-gradient-to-br from-zinc-950 to-zinc-800 p-6 text-white"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><MapPinPlus size={28}/></span><h2 className="mt-4 text-2xl font-black">Nueva visita</h2><p className="mt-2 text-sm leading-6 text-white/65">Al iniciar se solicitará tu ubicación actual y se guardará la precisión GPS.</p></div><div className="p-5">{error&&<ErrorBox text={error}/>}<button onClick={onBegin} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-prospecta-700 px-5 py-4 font-black text-white shadow-soft disabled:opacity-60"><LocateFixed size={21}/>{busy?'Obteniendo GPS…':'Iniciar Visita'}</button></div></div>}
function Accordion({title,active,onClick,icon:Icon,complete,children}){return <div className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-black/5"><button type="button" onClick={onClick} className="flex w-full items-center gap-3 p-4 text-left"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${complete?'bg-emerald-50 text-emerald-600':'bg-prospecta-50 text-prospecta-700'}`}><Icon size={18}/></span><span className="min-w-0 flex-1 text-sm font-black">{title}</span>{complete&&<CheckCircle2 size={17} className="text-emerald-600"/>}<ChevronDown size={18} className={`text-zinc-400 transition ${active?'rotate-180':''}`}/></button>{active&&<div className="border-t border-zinc-100 p-4">{children}</div>}</div>}
function Choice({active,onClick,icon:Icon,label,positive}){const activeClass=positive?'border-emerald-500 bg-emerald-50 text-emerald-700':'border-prospecta-700 bg-prospecta-50 text-prospecta-700';return <button onClick={onClick} className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-4 font-black ${active?activeClass:'border-zinc-200 bg-zinc-50 text-zinc-500'}`}><Icon size={21}/>{label}</button>}
function Two({children}){return <div className="grid grid-cols-2 gap-2">{children}</div>}
function Field({label,children}){return <label className="block"><span className="mb-1.5 block text-[11px] font-black text-zinc-700">{label}</span>{children}</label>}
function DocumentField({label,file,onFile,imageOnly=false,capture=false}){const preview=useMemo(()=>file&&file.type?.startsWith('image/')?URL.createObjectURL(file):'',[file]);return <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3"><p className="text-[11px] font-black">{label}</p><label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-3 text-[10px] font-black text-zinc-600"><Upload size={14}/>{file?file.name:'Adjuntar archivo'}<input type="file" accept={imageOnly?'image/*':'image/*,.pdf,application/pdf'} capture={capture?'environment':undefined} className="hidden" onChange={e=>onFile(e.target.files?.[0]||null)}/></label>{preview&&<img src={preview} alt={label} className="mt-2 h-24 w-full rounded-xl object-cover"/>}</div>}
function ErrorBox({text}){return <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{text}</div>}
function Loading(){return <div className="grid min-h-[240px] place-items-center rounded-3xl bg-white shadow-card"><span className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-prospecta-700"/></div>}
