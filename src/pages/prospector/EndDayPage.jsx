import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, LogOut } from 'lucide-react'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { endDay, getTodayEnd, getTodayStart } from '../../services/jornadaService'
import { getOpenVisit, getTodayVisits } from '../../services/visitaService'
import { getCurrentLocation } from '../../lib/geo'

export default function EndDayPage() {
  const { user } = useAuth()
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [openVisit, setOpenVisit] = useState(null)
  const [visits, setVisits] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = () => Promise.all([getTodayStart(user), getTodayEnd(user), getOpenVisit(user), getTodayVisits(user)]).then(([a,b,c,d]) => { setStart(a); setEnd(b); setOpenVisit(c); setVisits(d) })
  useEffect(() => { refresh() }, [user])

  const finish = async () => {
    setBusy(true); setError('')
    try { const geo=await getCurrentLocation(); await endDay(user,geo); await refresh() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const altas = visits.filter((v) => v.CLIENTE_EXITOSO === 'SI').length

  return (
    <AppShell title="Fin de Jornada" subtitle="Cierra tu día una vez terminadas todas las visitas.">
      <div className="rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5 sm:p-7">
        {end ? (
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={38} /></span>
            <h2 className="mt-4 text-2xl font-black">Jornada cerrada</h2>
            <p className="mt-2 text-sm text-zinc-500">Tu salida quedó registrada a las {end.HORA_FIN?.slice(0,5)} · {end.CLASIFICACION_FIN}.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Mini label="Inicio" value={start?.HORA_INICIO?.slice(0,5) || '--:--'} />
              <Mini label="Visitas" value={visits.length} />
              <Mini label="Altas" value={altas} />
            </div>
            <div className="mt-5 space-y-2">
              <CheckRow ok={!!start} text={start ? 'Inicio de jornada registrado' : 'Inicio de jornada pendiente'} />
              <CheckRow ok={!openVisit} text={openVisit ? 'Tienes una visita en curso' : 'No hay visitas abiertas'} />
            </div>
            {error && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
            <button onClick={finish} disabled={busy || !start || !!openVisit} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-4 font-black text-white disabled:opacity-35"><LogOut size={20} />{busy ? 'Registrando…' : 'Registrar Fin de Jornada'}</button>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3 rounded-3xl bg-prospecta-50 p-4 text-prospecta-900"><Clock3 size={21} className="shrink-0" /><p className="text-sm leading-6"><strong>Importante:</strong> si existe una visita en curso, debes finalizarla antes de cerrar la jornada.</p></div>
    </AppShell>
  )
}
function Mini({ label, value }) { return <div className="rounded-2xl bg-zinc-50 p-3 text-center"><p className="text-[11px] font-bold uppercase text-zinc-400">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div> }
function CheckRow({ ok, text }) { return <div className="flex items-center justify-between rounded-2xl border border-zinc-100 p-3"><span className="text-sm font-semibold">{text}</span><StatusBadge tone={ok ? 'success' : 'warning'}>{ok ? 'OK' : 'Pendiente'}</StatusBadge></div> }
