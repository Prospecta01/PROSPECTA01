export const getCurrentLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Este dispositivo no tiene geolocalización disponible.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        resolve({
          latitude,
          longitude,
          accuracy: Math.round(accuracy || 0),
          status: accuracy <= 100 ? 'GPS_OK' : 'GPS_BAJA_PRECISION',
          gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        })
      },
      (err) => {
        const message = err.code === 1
          ? 'Activa el permiso de ubicación para continuar.'
          : 'No pudimos obtener tu ubicación. Intenta nuevamente en un lugar con mejor señal.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  })

export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&addressdetails=1&accept-language=es`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('reverse-geocode')
    const json = await response.json()
    return String(json?.display_name || '').trim()
  } catch {
    return ''
  }
}

export async function captureLocationWithAddress() {
  const geo = await getCurrentLocation()
  const address = await reverseGeocode(geo.latitude, geo.longitude)
  return { ...geo, address: address || `Lat. ${geo.latitude.toFixed(6)}, Long. ${geo.longitude.toFixed(6)}` }
}

export const captureLocation = getCurrentLocation
