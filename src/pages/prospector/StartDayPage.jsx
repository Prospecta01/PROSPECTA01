import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, MapPin, PlayCircle } from 'lucide-react'
import AppShell from '../../components/AppShell'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { getTodayStart, startDay } from '../../services/jornadaService'
import { getCurrentLocation } from '../../lib/geo'

export default function StartDayPage() {
  const { user } = useAuth()
  const [record, setRecord] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getTodayStart(user).then(setRecord) }, [user])

  const submit = async () => {
    setBusy(true); setError('')
    try { const geo=await getCurrentLocation(); setRecord(await startDay(user,geo)) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <AppShell title="Inicio de Jornada" subtitle="Registra una sola vez tu ingreso del día.">
      <div className="rounded-[2rem] bg-white p-5 shadow-card ring-1 ring-black/5 sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Info icon={MapPin} label="Región" value={user.region} />
          <Info icon={MapPin} label="Locación" value={user.locacion} />
        </div>
        <div className="my-6 h-px bg-zinc-100" />

        {record ? (
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={38} /></span>
            <h2 className="mt-4 text-2xl font-black">Jornada iniciada</h2>
            <p className="mt-2 text-sm text-zinc-500">Tu registro de hoy ya se encuentra guardado.</p>
            <div className="mt-5 flex justify-center gap-2"><StatusBadge tone={record.CLASIFICACION_INGRESO?.includes('Tardío') ? 'warning' : 'success'}>{record.CLASIFICACION_INGRESO}</StatusBadge><StatusBadge tone="info">{record.HORA_INICIO?.slice(0,5)}</StatusBadge></div>
          </div>
        ) : (
          <div className="text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-prospecta-50 text-prospecta-700"><Clock3 size={36} /></span>
            <h2 className="mt-4 text-xl font-black">Listo para comenzar</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">La hora y tu ubicación se registrarán al tocar el botón. El ingreso se clasificará automáticamente según tu región.</p>
            {error && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
            <button onClick={submit} disabled={busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-prospecta-700 px-5 py-4 font-black text-white shadow-soft sm:w-auto"><PlayCircle size={20} />{busy ? 'Registrando…' : 'Registrar Inicio de Jornada'}</button>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-3xl bg-zinc-950 p-5 text-white">
        <p className="font-black">Regla de puntualidad</p>
        <p className="mt-2 text-sm leading-6 text-white/65">Lima, Sur y Centro Oriente: puntual entre 08:00 y 08:15. Norte: puntual entre 07:00 y 07:15. Antes del rango se considera anticipado y después, tardío.</p>
      </div>
    </AppShell>
  )
}

function Info({ icon: Icon, label, value }) { return <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-prospecta-700 shadow-sm"><Icon size={19} /></span><div><p className="text-xs font-semibold text-zinc-500">{label}</p><p className="font-black">{value}</p></div></div> }
