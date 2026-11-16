import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, CheckCircle2, Clock3, MapPinPlus, PlayCircle, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import AppShell from '../../components/AppShell'
import KpiCard from '../../components/KpiCard'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { humanDate } from '../../lib/date'
import { productivityPct, productivityTone } from '../../lib/productivity'
import { getTodayEnd, getTodayStart } from '../../services/jornadaService'
import { getTodayVisits } from '../../services/visitaService'

export default function HomePage() {
  const { user } = useAuth()
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [visits, setVisits] = useState([])

  useEffect(() => {
    Promise.all([getTodayStart(user), getTodayEnd(user), getTodayVisits(user)]).then(([a, b, c]) => { setStart(a); setEnd(b); setVisits(c) })
  }, [user])

  const altas = visits.filter((v) => v.CLIENTE_EXITOSO === 'SI').length
  const productividad = productivityPct(altas,1)

  return (
    <AppShell>
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-prospecta-700 via-prospecta-700 to-prospecta-900 p-5 text-white shadow-soft sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/70">{humanDate()}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Hola, {user.nombre} 👋</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/80">Tu jornada, visitas y resultados del día en un solo lugar.</p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><Sparkles /></span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {start ? <StatusBadge tone={start.CLASIFICACION_INGRESO.includes('Tardío') ? 'warning' : 'success'}>{start.CLASIFICACION_INGRESO} · {start.HORA_INICIO?.slice(0,5)}</StatusBadge> : <StatusBadge tone="warning">Inicio pendiente</StatusBadge>}
          {end && <StatusBadge tone="info">Jornada cerrada · {end.HORA_FIN?.slice(0,5)}</StatusBadge>}
        </div>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2">
        <KpiCard compact icon={MapPinPlus} label="Visitas" value={visits.length} />
        <KpiCard compact icon={CheckCircle2} label="Altas" value={altas} />
        <KpiCard compact icon={BarChart3} label="Productividad" value={`${productividad}%`} tone={productivityTone(productividad)} />
      </section>

      {!start && (
        <Link to="/prospector/inicio" className="mt-5 flex items-center justify-between rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-prospecta-50 text-prospecta-700"><PlayCircle /></span>
            <div><p className="font-black">Registrar Inicio de Jornada</p><p className="mt-1 text-xs text-zinc-500">Es obligatorio antes de iniciar visitas.</p></div>
          </div>
          <ArrowRight className="text-zinc-400" />
        </Link>
      )}

      <section className="mt-5">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-zinc-500">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink to="/prospector/visitas" icon={MapPinPlus} title="Registro de Visitas" text="Captura GPS, DNI, subcanal y evidencias del punto de venta." />
          <QuickLink to="/prospector/avance" icon={BarChart3} title="Avance del Día" text="Revisa productividad, altas y últimas visitas." />
          <QuickLink to="/prospector/fin" icon={Clock3} title="Fin de Jornada" text="Cierra tu día cuando termines." />
        </div>
      </section>
    </AppShell>
  )
}

function QuickLink({ to, icon: Icon, title, text }) {
  return <Link to={to} className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card ring-1 ring-black/5 transition hover:-translate-y-0.5"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-white"><Icon size={21} /></span><span className="min-w-0 flex-1"><span className="block font-black">{title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{text}</span></span><ArrowRight size={18} className="text-zinc-300 transition group-hover:translate-x-1 group-hover:text-prospecta-700" /></Link>
}
