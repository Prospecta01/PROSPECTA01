import { useEffect, useMemo, useState } from 'react'
import { MessageCircle, Phone, Search, UserRound } from 'lucide-react'
import AppShell from '../../components/AppShell'
import { useAuth } from '../../context/AuthContext'
import { getContacts } from '../../services/contactService'

export default function ContactsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [term, setTerm] = useState('')
  useEffect(() => { getContacts(user).then(setRows) }, [user])

  const filtered = useMemo(() => rows.filter((r) => JSON.stringify(r).toLowerCase().includes(term.toLowerCase())), [rows, term])

  return (
    <AppShell title="Contactos" subtitle="Supervisores y asesores vinculados a tu operación.">
      <div className="flex items-center rounded-2xl bg-white px-4 shadow-card ring-1 ring-black/5 focus-within:ring-prospecta-700/20">
        <Search size={18} className="text-zinc-400" /><input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full bg-transparent px-3 py-4 text-sm outline-none" placeholder="Buscar por nombre, ruta o mesa…" />
      </div>
      <div className="mt-4 space-y-3">
        {filtered.map((r) => {
          const supervisor = r.supervisor || r.SUPERVISOR
          const phoneSupervisor = String(r.telefonoSupervisor || r.TELEFONO_SUPERVISOR || '')
          const advisor = r.asesor || r.ASESOR
          const phoneAdvisor = String(r.telefonoGestor || r.TELEFONO_GESTOR || '')
          return (
            <div key={r.id} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-black/5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-prospecta-700">{r.mesa || r.MESA} · Ruta {r.ruta || r.RUTA}</p><p className="mt-1 text-sm font-semibold text-zinc-500">{r.locacion || r.LOCACION}</p></div></div>
              <ContactRow title="Supervisor" name={supervisor} phone={phoneSupervisor} />
              <ContactRow title="Asesor" name={advisor} phone={phoneAdvisor} />
            </div>
          )
        })}
        {!filtered.length && <div className="rounded-3xl bg-white p-8 text-center text-sm text-zinc-500 shadow-card">No encontramos contactos para el filtro actual.</div>}
      </div>
    </AppShell>
  )
}
function ContactRow({ title, name, phone }) {
  return <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-100"><UserRound size={18} /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-bold uppercase text-zinc-400">{title}</p><p className="truncate text-sm font-black">{name}</p><p className="text-xs text-zinc-500">{phone}</p></div>{phone && <div className="flex gap-2"><a href={`tel:${phone}`} className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-950 text-white"><Phone size={17} /></a><a href={`https://wa.me/51${phone}`} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><MessageCircle size={18} /></a></div>}</div>
}
