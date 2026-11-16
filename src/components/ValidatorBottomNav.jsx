import { BarChart3, Clock3, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
const items=[
  {to:'/validador/inicio',label:'Inicio',icon:Clock3},
  {to:'/validador/fin',label:'Fin',icon:LogOut},
  {to:'/validador/avance',label:'Avance',icon:BarChart3},
]
export default function ValidatorBottomNav(){return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"><div className="mx-auto grid max-w-lg grid-cols-3 gap-1">{items.map(({to,label,icon:Icon})=><NavLink key={to} to={to} className={({isActive})=>`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold ${isActive?'bg-prospecta-50 text-prospecta-700':'text-zinc-500'}`}><Icon size={19}/><span>{label}</span></NavLink>)}</div></nav>}
