'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Search,
  Crosshair,
  Navigation,
  Store,
  Star,
  Clock,
  ChevronLeft,
  X,
  SlidersHorizontal,
  Layers,
  LocateFixed,
} from 'lucide-react'

interface FoodItem {
  name: string
  price: number
  originalPrice: number
  stock: number
  badge?: string
}

interface StoreData {
  id: number
  name: string
  category: string
  rating: number
  orders: number
  lat: number
  lng: number
  address: string
  openTime: string
  closeTime: string
  foods: FoodItem[]
}

const mockStores: StoreData[] = [
  {
    id: 1, name: 'Warung Bu Ani', category: 'Makanan Berat', rating: 4.8, orders: 320,
    lat: -6.2088, lng: 106.8456, address: 'Jl. Merdeka No. 10, Jakarta Pusat',
    openTime: '08:00', closeTime: '20:00',
    foods: [
      { name: 'Nasi Goreng Spesial', price: 12000, originalPrice: 25000, stock: 5, badge: 'Last Chance' },
      { name: 'Ayam Goreng Kremes', price: 15000, originalPrice: 30000, stock: 8 },
    ],
  },
  {
    id: 2, name: 'Bakery Mama', category: 'Roti & Kue', rating: 4.9, orders: 510,
    lat: -6.225, lng: 106.8, address: 'Jl. Tanah Abang No. 5, Jakarta Barat',
    openTime: '07:00', closeTime: '21:00',
    foods: [
      { name: 'Roti Coklat Lumer', price: 9000, originalPrice: 18000, stock: 2, badge: 'Hampir Habis' },
      { name: 'Kue Sus Vla', price: 7000, originalPrice: 15000, stock: 12, badge: 'Fresh Hari Ini' },
    ],
  },
  {
    id: 3, name: 'Kedai Sejahtera', category: 'Minuman', rating: 4.7, orders: 280,
    lat: -6.23, lng: 106.88, address: 'Jl. Matraman No. 22, Jakarta Timur',
    openTime: '09:00', closeTime: '22:00',
    foods: [
      { name: 'Es Campur Segar', price: 7000, originalPrice: 15000, stock: 10, badge: 'Fresh Hari Ini' },
    ],
  },
  {
    id: 4, name: 'RM Padang Sederhana', category: 'Makanan Berat', rating: 4.6, orders: 190,
    lat: -6.195, lng: 106.82, address: 'Jl. Sudirman No. 88, Jakarta Selatan',
    openTime: '10:00', closeTime: '21:00',
    foods: [
      { name: 'Ayam Bakar Madu', price: 18000, originalPrice: 35000, stock: 3, badge: 'Last Chance' },
      { name: 'Rendang Daging', price: 22000, originalPrice: 40000, stock: 6 },
    ],
  },
  {
    id: 5, name: 'Kue Tradisional Nenek', category: 'Roti & Kue', rating: 4.9, orders: 430,
    lat: -6.24, lng: 106.83, address: 'Jl. Cikini No. 14, Jakarta Pusat',
    openTime: '06:00', closeTime: '18:00',
    foods: [
      { name: 'Kue Lumpur Surga', price: 6000, originalPrice: 12000, stock: 8, badge: 'Fresh Hari Ini' },
      { name: 'Onde-onde Ketawa', price: 5000, originalPrice: 10000, stock: 15 },
    ],
  },
  {
    id: 6, name: 'Soto Ayam Pak Haji', category: 'Makanan Berat', rating: 4.5, orders: 150,
    lat: -6.215, lng: 106.86, address: 'Jl. Salemba No. 7, Jakarta Pusat',
    openTime: '07:00', closeTime: '19:00',
    foods: [
      { name: 'Soto Ayam Komplit', price: 10000, originalPrice: 20000, stock: 7 },
    ],
  },
]

function StoreIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="#0F766E"/>
      <path d="M6 10L12 6L18 10V18H14V14H10V18H6V10Z" fill="white"/>
    </svg>
  )
}

export default function ExploreMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null)
  // Synchronous flag to prevent React Strict Mode double-init
  const initializingRef = useRef(false)

  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)

  const filteredStores = mockStores.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.foods.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createTealIcon = useCallback((L: any, isSelected = false) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background:${isSelected ? '#FF8A00' : '#0F766E'};color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px ${isSelected ? 'rgba(255,138,0,0.5)' : 'rgba(15,118,110,0.4)'};border:3px solid white;font-size:18px;transition:all 0.2s;">${StoreIcon()}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    })
  }, [])

  useEffect(() => {
    let destroyed = false

    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current || initializingRef.current) return
      initializingRef.current = true // set BEFORE any await

      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // Second guard after async imports
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
        center: [-6.2088, 106.8456],
        zoom: 12,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors',
      }).addTo(map)

      L.control.zoom({ position: 'bottomright' }).addTo(map)

      map.on('click', () => setSelectedStore(null))

      mapInstanceRef.current = map
      setTimeout(() => map.invalidateSize(), 300)
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
  }, [])

  // Update markers when stores or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    const init = async () => {
      const L = (await import('leaflet')).default

      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []

      filteredStores.forEach((store) => {
        const isSelected = selectedStore?.id === store.id
        const icon = createTealIcon(L, isSelected)

        const marker = L.marker([store.lat, store.lng], { icon }).addTo(map)

        const foodList = store.foods
          .map(
            (f) =>
              `<div style="display:flex;justify-content:space-between;gap:12px;padding:4px 0;border-bottom:1px solid #f0f0f0;">
                <div>
                  <div style="font-weight:600;color:#1A1A1A;font-size:13px;">${f.name}</div>
                  <div style="color:#0F766E;font-weight:700;font-size:14px;">Rp${f.price.toLocaleString()}</div>
                </div>
                <div style="text-align:right;">
                  <div style="color:#999;text-decoration:line-through;font-size:11px;">Rp${f.originalPrice.toLocaleString()}</div>
                  <div style="color:#666;font-size:11px;">Sisa ${f.stock}</div>
                </div>
              </div>`
          )
          .join('')

        marker.bindPopup(`
          <div style="font-family:'Plus Jakarta Sans',sans-serif;min-width:240px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="background:#0F766E;color:white;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;">🏪</div>
              <div>
                <strong style="color:#1A1A1A;font-size:14px;">${store.name}</strong>
                <div style="display:flex;align-items:center;gap:4px;color:#f59e0b;font-size:11px;">★ ${store.rating}</div>
              </div>
            </div>
            <div style="color:#666;font-size:11px;margin-bottom:8px;">${store.address}</div>
            ${foodList}
            <a href="/stores/${store.id}" style="display:block;text-align:center;margin-top:8px;padding:8px;background:#0F766E;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:12px;">Lihat Detail Toko →</a>
          </div>
        `)

        marker.on('click', () => {
          setSelectedStore(store)
        })

        markersRef.current.push(marker)
      })
    }

    init()
  }, [filteredStores, selectedStore, createTealIcon])

  // Center map on selected store
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedStore) return
    map.flyTo([selectedStore.lat, selectedStore.lng], 15, { duration: 0.6 })
  }, [selectedStore])

  const handleLocate = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setUserLocation([latitude, longitude])
        const map = mapInstanceRef.current
        if (map) {
          map.flyTo([latitude, longitude], 14, { duration: 0.6 })

          const Lmod = await import('leaflet')
          if (userMarkerRef.current) {
            map.removeLayer(userMarkerRef.current)
          }

          const userIcon = Lmod.default.divIcon({
            className: 'user-location-marker',
            html: `<div style="width:20px;height:20px;border-radius:50%;background:#FF8A00;border:3px solid white;box-shadow:0 0 0 4px rgba(255,138,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          userMarkerRef.current = Lmod.default.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<div style="font-family:Plus Jakarta Sans,sans-serif;font-size:13px;font-weight:600;">📍 Lokasi Kamu</div>')
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="relative h-[calc(100dvh-64px)] font-sans flex">
      {/* Sidebar */}
      <div
        className={`absolute lg:relative z-20 h-full bg-white border-r border-dark/5 transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-full lg:w-96' : 'w-0 lg:w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="shrink-0 p-4 border-b border-dark/5">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-poppins font-extrabold text-dark text-lg">Peta Toko</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl text-dark/50 hover:bg-dark/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30" />
            <input
              type="text"
              placeholder="Cari toko atau makanan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cream-bg border border-dark/5 text-dark text-sm placeholder-dark/30 focus:border-primary-teal focus:ring-2 focus:ring-primary-teal/10 outline-none transition-all"
            />
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleLocate}
              disabled={locating}
              className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-primary-teal/10 text-primary-teal text-xs font-bold hover:bg-primary-teal/20 transition-all disabled:opacity-50"
            >
              <LocateFixed className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
              {locating ? 'Mencari...' : 'Lokasi Saya'}
            </button>
            <div className="flex-1" />
            <span className="text-xs text-dark/40 font-medium">
              {filteredStores.length} toko
            </span>
          </div>
        </div>

        {/* Store List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <Store className="w-10 h-10 text-dark/20 mx-auto mb-3" />
              <p className="text-dark/40 text-sm">Toko tidak ditemukan</p>
            </div>
          ) : (
            filteredStores.map((store) => (
              <button
                key={store.id}
                onClick={() => {
                  setSelectedStore(store)
                  if (window.innerWidth < 1024) setSidebarOpen(false)
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selectedStore?.id === store.id
                    ? 'border-primary-teal bg-primary-teal/[0.03] shadow-sm'
                    : 'border-dark/5 bg-cream-bg hover:border-dark/10 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${
                    selectedStore?.id === store.id ? 'bg-primary-teal text-white' : 'bg-primary-teal/10 text-primary-teal'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-poppins font-bold text-dark text-sm truncate">{store.name}</h3>
                    <p className="text-xs text-dark/50 mt-0.5">{store.category}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-dark/50">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {store.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {store.openTime} - {store.closeTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      {store.foods.map((f, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-semibold bg-white rounded-full px-2 py-0.5 border border-dark/5 truncate max-w-[100px]"
                        >
                          {f.badge && (
                            <span className={`mr-1 ${
                              f.badge === 'Last Chance' ? 'text-red-500' :
                              f.badge === 'Hampir Habis' ? 'text-amber-500' :
                              'text-emerald-500'
                            }`}>●</span>
                          )}
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-primary-orange">
                      {store.foods.reduce((min, f) => Math.min(min, f.price), Infinity).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-dark/40">mulai</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Mobile: toggle sidebar button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-30 lg:hidden bg-white rounded-2xl shadow-lg border border-dark/5 p-3 flex items-center gap-2"
        >
          <Store className="w-5 h-5 text-primary-teal" />
          <span className="text-sm font-bold text-dark">Daftar Toko</span>
        </button>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 1 }} />

        {/* Floating info: selected store */}
        {selectedStore && (
          <div className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-96 z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-dark/5 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-orange text-white">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-dark text-sm">{selectedStore.name}</h3>
                    <p className="text-xs text-dark/50">{selectedStore.address}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStore(null)}
                  className="p-1.5 rounded-lg hover:bg-dark/5 text-dark/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-4 text-xs text-dark/50 mb-3">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {selectedStore.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedStore.openTime} - {selectedStore.closeTime}
                </span>
                <span>{selectedStore.foods.length} makanan</span>
              </div>
              <Link
                href={`/stores/${selectedStore.id}`}
                className="block w-full py-2.5 rounded-xl bg-primary-teal text-white text-center text-sm font-bold hover:bg-primary-teal/90 transition-all"
              >
                Lihat Detail Toko
              </Link>
            </div>
          </div>
        )}

        {/* Desktop: toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute top-4 left-4 z-10 bg-white rounded-xl shadow-sm border border-dark/5 p-2.5 hover:bg-cream-bg transition-all"
        >
          <ChevronLeft className={`w-5 h-5 text-dark/50 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </div>
  )
}
