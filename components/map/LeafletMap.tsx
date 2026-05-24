'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface MapMarker {
  lat: number
  lng: number
  title: string
}

interface LeafletMapProps {
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  className?: string
  height?: string
}

export default function LeafletMap({
  center = [-6.2088, 106.8456],
  zoom = 12,
  markers = [
    { lat: -6.2088, lng: 106.8456, title: 'Jakarta Pusat' },
    { lat: -6.225, lng: 106.8, title: 'Jakarta Barat' },
    { lat: -6.23, lng: 106.88, title: 'Jakarta Timur' },
  ],
  className = '',
  height = '400px',
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // Synchronous flag to prevent React Strict Mode double-init
  const initializingRef = useRef(false)

  useEffect(() => {
    let destroyed = false

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || initializingRef.current) return
      initializingRef.current = true // set BEFORE any await

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Second guard: cleanup may have fired while awaiting imports
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

      const map = L.map(mapRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const tealIcon = L.divIcon({
        className: '',
        html: `<div style="background:#0F766E;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(15,118,110,0.4);border:3px solid white;font-size:16px;">🏪</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      })

      markers.forEach((marker) => {
        const m = L.marker([marker.lat, marker.lng], { icon: tealIcon }).addTo(map)
        m.bindPopup(
          `<div style="font-family:Plus Jakarta Sans,sans-serif;padding:4px 0;"><strong style="color:#1A1A1A;">${marker.title}</strong><br/><span style="color:#0F766E;font-size:12px;">🏪 Toko UMKM Aktif</span></div>`
        )
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

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-sm ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%', zIndex: 0 }} />
      <div className="absolute bottom-3 left-3 z-[1] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm flex items-center gap-1.5 text-xs font-semibold text-dark/70">
        <MapPin className="w-3.5 h-3.5 text-primary-teal" />
        <span>{markers.length} Toko Terdekat</span>
      </div>
    </div>
  )
}
