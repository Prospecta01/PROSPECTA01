import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, LogOut } from 'lucide-react'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { durationLabel } from '../../lib/date'
import { endValidatorDay, getValidatorTodayEnd, getValidatorTodayStart } from '../../services/validatorJornadaService'

export default function ValidatorEndDayPage(){
  const {user}=useAuth();const [start,setStart]=useState(null);const [end,setEnd]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  const refresh=()=>Promise.all([getValidatorTodayStart(user),getValidatorTodayEnd(user)]).then(([a,b])=>{setStart(a);setEnd(b)})
  useEffect(()=>{refresh().catch(e=>setError(e.message))},[user])
  const finish=async()=>{setBusy(true);setError('');try{await endValidatorDay(user);await refresh()}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <AppShell title="Fin de Jornada · Validador" subtitle="Cierra tu jornada al finalizar el proceso de registro."><div className="rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5 sm:p-7">{end?<div className="text-center"><span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={38}/></span><h2 className="mt-4 text-2xl font-black">Jornada cerrada</h2><p className="mt-2 text-sm text-zinc-500">Tu salida quedó registrada a las {end.HORA_FIN?.slice(0,5)}.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><StatusBadge tone="info">Inicio {end.HORA_INICIO?.slice(0,5)}</StatusBadge><StatusBadge tone="success">{durationLabel(end.DURACION_JORNADA||0)}</StatusBadge></div></div>:<><div className="grid grid-cols-2 gap-3"><Mini icon={Clock3} label="Inicio" value={start?.HORA_INICIO?.slice(0,5)||'--:--'}/><Mini icon={Clock3} label="Estado" value={start?'Listo':'Pendiente'}/></div>{error&&<div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}<button onClick={finish} disabled={busy||!start} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-black text-white disabled:opacity-35"><LogOut size={20}/>{busy?'Registrando…':'Registrar Fin de Jornada'}</button></>}</div></AppShell>
}
function Mini({icon:Icon,label,value}){return <div className="rounded-2xl bg-zinc-50 p-3 text-center"><Icon size={18} className="mx-auto text-prospecta-700"/><p className="mt-2 text-[10px] font-bold uppercase text-zinc-400">{label}</p><p className="mt-1 text-sm font-black">{value}</p></div>}
