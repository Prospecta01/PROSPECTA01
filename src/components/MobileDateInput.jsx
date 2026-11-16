import { useRef } from 'react'
import { CalendarDays } from 'lucide-react'

function displayDate(value){
  if(!value) return 'Todas'
  const [year,month,day]=String(value).split('-').map(Number)
  if(!year||!month||!day) return value
  const months=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${String(day).padStart(2,'0')} ${months[month-1]} ${year}`
}

export default function MobileDateInput({value,onChange,disabled=false,dense=false,ariaLabel='Fecha'}){
  const inputRef=useRef(null)
  const openPicker=()=>{
    if(disabled) return
    const el=inputRef.current
    if(!el) return
    try{
      if(typeof el.showPicker==='function') el.showPicker()
      else { el.focus(); el.click() }
    }catch{
      try{ el.focus(); el.click() }catch{}
    }
  }

  return <div className={`mobile-date-shell ${dense?'mobile-date-shell--dense':''} ${disabled?'opacity-60':''}`}>
    <button
      type="button"
      onClick={openPicker}
      disabled={disabled}
      className="mobile-date-control"
      aria-label={ariaLabel}
    >
      <CalendarDays size={dense?11:13} className="mobile-date-icon"/>
      <span className="mobile-date-text">{displayDate(value)}</span>
    </button>
    <input
      ref={inputRef}
      type="date"
      tabIndex={-1}
      aria-hidden="true"
      value={value||''}
      disabled={disabled}
      onChange={onChange}
      className="mobile-date-native-hidden"
    />
  </div>
}
