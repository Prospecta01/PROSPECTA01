import { BarChart3, Clock3, Home, MapPinPlus } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/prospector', label: 'Inicio', icon: Home, end: true },
  { to: '/prospector/visitas', label: 'Visitas', icon: MapPinPlus },
  { to: '/prospector/avance', label: 'Avance', icon: BarChart3 },
  { to: '/prospector/fin', label: 'Fin', icon: Clock3 },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition ${isActive ? 'bg-prospecta-50 text-prospecta-700' : 'text-zinc-500'}`}>
            <Icon size={20} strokeWidth={2.2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
