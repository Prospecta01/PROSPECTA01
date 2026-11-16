export const DAILY_PRODUCTIVITY_TARGET = 5

export function productivityPct(altas=0,days=1){
  const target=DAILY_PRODUCTIVITY_TARGET*Math.max(Number(days)||1,1)
  return target>0?Math.round((Number(altas||0)/target)*100):0
}

export function productivityTone(value=0){
  const pct=Number(value)||0
  if(pct>=100)return 'success'
  if(pct>=60)return 'warning'
  return 'danger'
}

export function productivityLabel(value=0){
  const pct=Number(value)||0
  if(pct>=100)return 'Meta lograda'
  if(pct>=60)return 'Cerca de la meta'
  return 'A reforzar'
}

export function prospectMotivation(value=0,altas=0,target=DAILY_PRODUCTIVITY_TARGET){
  const pct=Number(value)||0
  if(pct>=100)return '¡Excelente trabajo! Lograste el 100% de productividad. Sigue así.'
  const faltan=Math.max(Number(target||DAILY_PRODUCTIVITY_TARGET)-Number(altas||0),0)
  return `¡Tú puedes! Te falta poco para lograr el 100%. ${faltan===1?'Te falta 1 alta':`Te faltan ${faltan} altas`} para completar la meta.`
}

export function teamMotivation(value=0){
  const pct=Number(value)||0
  if(pct>=100)return '¡Excelente trabajo en equipo! La productividad alcanzó el 100% o más. Mantengamos el ritmo.'
  return '¡Tú puedes! Acompaña al equipo: falta poco para lograr el 100% de productividad.'
}
