import { useEffect, useMemo, useRef } from 'react'
import { X } from 'lucide-react'

const CSS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const JS='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
let loader
function loadLeaflet(){
  if(window.L)return Promise.resolve(window.L)
  if(loader)return loader
  loader=new Promise((resolve,reject)=>{
    if(!document.querySelector(`link[href="${CSS}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=CSS;document.head.appendChild(l)}
    const existing=document.querySelector(`script[src="${JS}"]`)
    if(existing){existing.addEventListener('load',()=>resolve(window.L));existing.addEventListener('error',reject);return}
    const s=document.createElement('script');s.src=JS;s.onload=()=>resolve(window.L);s.onerror=reject;document.body.appendChild(s)
  })
  return loader
}
const initials=(name='')=>name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()).join('')||'P'

export default function ProspectorMapModal({open,onClose,title,points=[]}){
  const ref=useRef(null)
  const valid=useMemo(()=>points.filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude))),[points])
  useEffect(()=>{
    if(!open||!ref.current)return
    let map
    loadLeaflet().then(L=>{
      if(!ref.current)return
      map=L.map(ref.current,{zoomControl:true})
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap'}).addTo(map)
      const bounds=[]
      valid.forEach(p=>{
        const lat=Number(p.latitude),lng=Number(p.longitude);bounds.push([lat,lng])
        const icon=L.divIcon({className:'prospecta-map-icon',html:`<div style="width:38px;height:38px;border-radius:9999px;background:#CC0000;color:white;border:3px solid white;box-shadow:0 2px 10px #0005;display:grid;place-items:center;font:800 12px system-ui">${initials(p.nombre)}</div>`,iconSize:[38,38],iconAnchor:[19,19]})
        L.marker([lat,lng],{icon}).addTo(map).bindPopup(`<b>${p.nombre||p.usuario}</b><br>${p.locacion||''}<br>${p.hora||''}`)
      })
      if(bounds.length===1)map.setView(bounds[0],16)
      else if(bounds.length>1)map.fitBounds(bounds,{padding:[35,35],maxZoom:16})
      else map.setView([-9.19,-75.0152],5)
      setTimeout(()=>map.invalidateSize(),50)
    })
    return()=>{if(map)map.remove()}
  },[open,valid])
  if(!open)return null
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-3" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
    <div className="w-full max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><p className="font-black">{title}</p><p className="text-xs text-zinc-500">{valid.length} ubicación(es) disponibles</p></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100"><X size={18}/></button></div>
      <div ref={ref} className="h-[65vh] min-h-[420px] w-full"/>
    </div>
  </div>
}
