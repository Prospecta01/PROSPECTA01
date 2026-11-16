import { Sparkles, Target } from 'lucide-react'
import { productivityLabel, productivityTone } from '../lib/productivity'

const styles={
  success:'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning:'border-amber-200 bg-amber-50 text-amber-800',
  danger:'border-red-200 bg-red-50 text-red-800',
}

export function ProductivityCallout({value=0,message}){
  const tone=productivityTone(value)
  return <div className={`mt-4 flex items-start gap-3 rounded-2xl border p-4 ${styles[tone]}`}>
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70"><Sparkles size={18}/></span>
    <div><p className="text-xs font-black uppercase tracking-[.12em]">{productivityLabel(value)} · {value}%</p><p className="mt-1 text-sm font-semibold leading-5">{message}</p></div>
  </div>
}

export function ProductivityBadge({value=0,compact=false}){
  const tone=productivityTone(value)
  const cls=tone==='success'?'bg-emerald-50 text-emerald-700 ring-emerald-600/15':tone==='warning'?'bg-amber-50 text-amber-700 ring-amber-600/15':'bg-red-50 text-red-700 ring-red-600/15'
  return <span className={`inline-flex items-center rounded-full font-black ring-1 ring-inset ${compact?'gap-0.5 px-1.5 py-0.5 text-[8px]':'gap-1 px-2.5 py-1 text-xs'} ${cls}`}><Target size={compact?9:12}/>{value}%</span>
}
