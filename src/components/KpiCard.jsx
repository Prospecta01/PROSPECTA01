export default function KpiCard({ icon: Icon, label, value, helper, accent = false, tone = '', compact = false }) {
  const toneStyles={
    success:'bg-emerald-50 text-emerald-900 ring-emerald-600/15',
    warning:'bg-amber-50 text-amber-900 ring-amber-600/15',
    danger:'bg-red-50 text-red-900 ring-red-600/15',
  }
  const toneIcon={
    success:'bg-white/80 text-emerald-700',warning:'bg-white/80 text-amber-700',danger:'bg-white/80 text-red-700'
  }
  const base=accent?'bg-gradient-to-br from-prospecta-700 to-prospecta-800 text-white':tone&&toneStyles[tone]?toneStyles[tone]:'bg-white text-zinc-900'
  const iconClass=accent?'bg-white/15':tone&&toneIcon[tone]?toneIcon[tone]:'bg-prospecta-50 text-prospecta-700'
  const cleanLabel=String(label||'').trim()
  const letters=cleanLabel.replace(/\s/g,'').length
  const labelPx=compact
    ? (letters>=16?5.1:letters>=12?5.6:6.8)
    : (letters>=17?6.8:letters>=13?7.4:9.5)
  const labelStyle={
    fontSize:`${labelPx}px`,
    whiteSpace:'nowrap',
    wordBreak:'normal',
    overflowWrap:'normal',
    hyphens:'none',
    lineHeight:'1',
    letterSpacing:compact?'0.015em':'0.025em',
  }

  return (
    <div className={`${compact?'rounded-2xl p-2.5':'rounded-3xl p-4'} min-w-0 overflow-hidden shadow-card ring-1 ring-black/5 ${base}`}>
      <div className={`flex min-w-0 items-start justify-between ${compact?'gap-1':'gap-1.5'}`}>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p
            className={`block max-w-full overflow-hidden text-ellipsis font-black uppercase ${accent ? 'text-white/70' : tone ? 'opacity-70' : 'text-zinc-500'}`}
            style={labelStyle}
            title={cleanLabel}
          >{cleanLabel}</p>
          <p className={`${compact?'mt-1.5 text-xl':'mt-2 text-2xl'} whitespace-nowrap font-black tracking-tight`}>{value}</p>
        </div>
        {Icon && <span className={`${compact?'h-6 w-6 rounded-lg':'h-8 w-8 rounded-xl'} grid shrink-0 place-items-center ${iconClass}`}><Icon size={compact?12:16} /></span>}
      </div>
      {helper && <p className={`${compact?'mt-1 text-[8px] leading-3':'mt-2 text-[10px] leading-4'} ${accent ? 'text-white/75' : tone ? 'opacity-75' : 'text-zinc-500'}`}>{helper}</p>}
    </div>
  )
}
