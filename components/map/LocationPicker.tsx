'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface LocationPickerProps {
  lat: number
  lng: number
  onChange: (lat: number, lng: number) => void
  height?: string
}

export default function LocationPicker({
  lat,
  lng,
  onChange,
  height = '300px'
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  // Set SYNCHRONOUSLY before any await to block React Strict Mode double-init
  const initializingRef = useRef(false)

  useEffect(() => {
    let destroyed = false

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || initializingRef.current) return
      initializingRef.current = true

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      if (destroyed || !mapRef.current) {
        initializingRef.current = false
        return
      }

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      })

      const center: [number, number] = [lat || -6.2088, lng || 106.8456]

      const map = L.map(mapRef.current, { center, zoom: 14, scrollWheelZoom: true })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const orangeIcon = L.divIcon({
        className: '',
        html: `<div style="background:#FF8A00;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(255,138,0,0.4);border:3px solid white;font-size:16px;">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = L.marker(center, { icon: orangeIcon, draggable: true }).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(pos.lat, pos.lng)
      })

      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng([e.latlng.lat, e.latlng.lng])
        onChange(e.latlng.lat, e.latlng.lng)
      })

      mapInstanceRef.current = map
      map.whenReady(() => {
        if (!destroyed) map.invalidateSize()
      })
    }

    initMap()

    return () => {
      destroyed = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      initializingRef.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when lat/lng props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && lat && lng) {
      const pos = markerRef.current.getLatLng()
      if (pos.lat !== lat || pos.lng !== lng) {
        markerRef.current.setLatLng([lat, lng])
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom())
      }
    }
  }, [lat, lng])

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-dark/5">
      <div ref={mapRef} style={{ height, width: '100%', zIndex: 0 }} />
      <div className="absolute bottom-3 left-3 z-[1] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-dark/70">
        <MapPin className="w-3.5 h-3.5 text-primary-orange" />
        <span>Geser pin atau klik peta untuk atur lokasi toko</span>
      </div>
    </div>
  )
}
