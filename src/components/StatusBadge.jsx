export default function StatusBadge({ children, tone = 'neutral', compact = false }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    danger: 'bg-red-50 text-red-700 ring-red-600/15',
    info: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-500/10',
  }
  return <span className={`inline-flex items-center rounded-full font-semibold ring-1 ring-inset ${compact?'px-1.5 py-0.5 text-[8px] leading-3':'px-2.5 py-1 text-xs'} ${styles[tone] || styles.neutral}`}>{children}</span>
}
