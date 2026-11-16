import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, MapPinPlus, Target } from 'lucide-react'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import StatusBadge from '../../components/StatusBadge'
import { ProductivityCallout } from '../../components/ProductivityCallout'
import { useAuth } from '../../context/AuthContext'
import { getTodayVisits } from '../../services/visitaService'
import { getFacadePublicUrl } from '../../services/storageService'
import { DAILY_PRODUCTIVITY_TARGET, productivityPct, productivityTone, prospectMotivation } from '../../lib/productivity'

export default function DailyProgressPage() {
  const { user } = useAuth()
  const [visits, setVisits] = useState([])
  useEffect(() => { getTodayVisits(user).then(setVisits) }, [user])

  const altas = visits.filter((v) => v.CLIENTE_EXITOSO === 'SI').length
  const productivity = productivityPct(altas,1)
  const avg = visits.length ? Math.round(visits.reduce((a,v) => a + (Number(v.DURACION_VISITA) || 0), 0) / visits.length) : 0

  return (
    <AppShell title="Avance del Día" subtitle={`Meta diaria: ${DAILY_PRODUCTIVITY_TARGET} altas = 100% de productividad.`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={MapPinPlus} label="Visitas" value={visits.length} accent />
        <KpiCard icon={CheckCircle2} label="Altas" value={`${altas}/${DAILY_PRODUCTIVITY_TARGET}`} />
        <KpiCard icon={Target} label="Productividad" value={`${productivity}%`} tone={productivityTone(productivity)} helper="5 altas = 100%" />
        <KpiCard icon={Clock3} label="Duración prom." value={`${avg} min`} />
      </div>

      <ProductivityCallout value={productivity} message={prospectMotivation(productivity,altas,DAILY_PRODUCTIVITY_TARGET)} />

      <div className="mt-5 rounded-[2rem] bg-white p-4 shadow-card ring-1 ring-black/5">
        <p className="text-sm font-black">Últimas visitas</p>
        <p className="mt-1 text-xs text-zinc-500">Las altas muestran DNI, subcanal y evidencia de fachada.</p>
        <div className="mt-3 space-y-2">
          {visits.length ? [...visits].reverse().slice(0,8).map((v) => {
            const success=v.CLIENTE_EXITOSO==='SI'
            const photo=success?getFacadePublicUrl(v.FOTO_FACHADA):''
            return <div key={v.id} className="flex items-center gap-3 rounded-2xl bg-zinc-50 p-3">
              {success ? (photo?<img src={photo} alt="Fachada" className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-black/5"/>:<div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-zinc-200 text-[9px] font-bold text-zinc-500">Sin foto</div>) : <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white text-[10px] font-black text-zinc-400 ring-1 ring-black/5">NO</div>}
              <div className="min-w-0 flex-1">
                {success?<><p className="truncate text-sm font-black">DNI {v.DNI_CLIENTE||'—'}</p><p className="mt-0.5 truncate text-xs font-semibold text-zinc-600">{v.SUBCANAL||'Sin subcanal'}</p></>:<><p className="truncate text-sm font-bold">{v.MOTIVO||'No exitosa'}</p><p className="mt-0.5 text-xs text-zinc-500">Visita no efectiva</p></>}
                <p className="mt-0.5 text-[10px] text-zinc-400">{v.HORA_INICIO_VISITA?.slice(0,5)} · {v.DURACION_VISITA||0} min</p>
              </div>
              <StatusBadge tone={success?'success':'neutral'}>{success?'Alta':'No'}</StatusBadge>
            </div>
          }) : <p className="rounded-2xl bg-zinc-50 p-5 text-center text-sm text-zinc-500">Aún no hay visitas finalizadas hoy.</p>}
        </div>
      </div>
    </AppShell>
  )
}
