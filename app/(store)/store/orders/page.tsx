'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  ClipboardList,
  Search,
  Check,
  X,
  User,
  ShoppingBag,
  HelpCircle,
  Package,
  CheckCircle,
  MessageCircle,
  Printer,
  Store
} from 'lucide-react'
import { toast } from 'sonner'

interface OrderItem {
  id: string
  quantity: number
  price: number
  products: {
    title: string
    thumbnail_url: string
  }
}

interface Order {
  id: string
  total_price: number
  payment_method: string
  status: 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'
  created_at: string
  customer_id: string
  users: {
    name: string
    email: string
  }
  order_items: OrderItem[]
}

type TabType = 'semua' | 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan'

export default function MerchantOrdersPage() {
  const supabase = createClient()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('semua')
  const [searchQuery, setSearchQuery] = useState('')

  const handleChat = async (customerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!store) return

      let { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('store_id', store.id)
        .eq('customer_id', customerId)
        .single()

      if (!conv) {
        const { data: newConv } = await supabase
          .from('conversations')
          .insert({ store_id: store.id, customer_id: customerId })
          .select('id')
          .single()
        conv = newConv
      }

      if (conv) router.push(`/store/chat/${conv.id}`)
    } catch {
      toast.error('Gagal membuka chat.')
    }
  }

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!store) return

      const { data: ords, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          payment_method,
          status,
          created_at,
          customer_id,
          users (
            name,
            email
          ),
          order_items (
            id,
            quantity,
            price,
            products (
              title,
              thumbnail_url
            )
          )
        `)
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOrders((ords || []) as unknown as Order[])
    } catch (err) {
      toast.error('Gagal mengambil daftar pesanan.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders()

    // Realtime listener
    const channel = supabase
      .channel('store-orders-page-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      // If order is marked as selesai, reduce product stock
      if (newStatus === 'selesai') {
        const order = orders.find(o => o.id === orderId)
        if (order?.order_items) {
          for (const item of order.order_items) {
            const { data: prod } = await supabase
              .from('products')
              .select('stock')
              .eq('id', item.products?.title ? (item as any).product_id : (item as any).product_id)
              .single()

            // Get product_id from order_items directly
            const { data: orderItem } = await supabase
              .from('order_items')
              .select('product_id, quantity')
              .eq('id', item.id)
              .single()

            if (orderItem) {
              const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', orderItem.product_id)
                .single()

              if (product) {
                const newStock = Math.max(0, product.stock - orderItem.quantity)
                await supabase
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', orderItem.product_id)
              }
            }
          }
        }
      }

      toast.success(`Pesanan berhasil diupdate menjadi: ${newStatus.replace('_', ' ')}`)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (err) {
      toast.error('Gagal mengupdate status pesanan.')
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val)
  }

  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
  const [receiptStore, setReceiptStore] = useState<{ name: string; address: string } | null>(null)

  const handlePrint = async (order: Order) => {
    const { data: store } = await supabase
      .from('stores')
      .select('store_name, address')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    setReceiptStore(store ? { name: store.store_name, address: store.address } : { name: 'Toko SisaRasa', address: '' })
    setReceiptOrder(order)
  }

  const triggerPrint = () => {
    if (!receiptOrder) return
    const store = receiptStore
    const order = receiptOrder
    const storeName = store?.name || 'Toko SisaRasa'
    const storeAddress = store?.address || ''
    const now = new Date(order.created_at)
    const dateStr = now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    const orderId = order.id.slice(0, 8).toUpperCase()

    const itemsHtml = order.order_items.map(item => `
      <tr>
        <td style="padding:6px 0;font-size:13px">${item.products?.title || '-'}</td>
        <td style="padding:6px 0;font-size:13px;text-align:center">${item.quantity}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right">${formatPrice(Number(item.price))}</td>
        <td style="padding:6px 0;font-size:13px;text-align:right">${formatPrice(Number(item.price) * item.quantity)}</td>
      </tr>
    `).join('')

    const printWindow = window.open('', '_blank')
    if (!printWindow) { toast.error('Izinkan pop-up untuk mencetak struk.'); return }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk Pesanan #${orderId}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #000;
            width: 80mm;
            padding: 10mm 5mm;
          }
          .header { text-align: center; margin-bottom: 12px; }
          .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .header p { font-size: 11px; color: #555; margin-top: 2px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .info { font-size: 11px; margin-bottom: 10px; }
          .info-row { display: flex; justify-content: space-between; padding: 2px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { padding: 6px 0; font-size: 11px; text-align: left; border-bottom: 1px solid #000; }
          th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
          .total { margin-top: 10px; padding-top: 8px; border-top: 1px dashed #000; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; padding: 2px 0; }
          .payment { margin-top: 6px; font-size: 11px; }
          .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #777; }
          .footer .thanks { font-size: 12px; font-weight: bold; color: #000; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${storeName}</h1>
          ${storeAddress ? `<p>${storeAddress}</p>` : ''}
        </div>
        <div class="divider"></div>
        <div class="info">
          <div class="info-row"><span>No. Pesanan</span><span>#${orderId}</span></div>
          <div class="info-row"><span>Tanggal</span><span>${dateStr}</span></div>
          <div class="info-row"><span>Waktu</span><span>${timeStr}</span></div>
          <div class="info-row"><span>Pembeli</span><span>${order.users?.name || '-'}</span></div>
        </div>
        <div class="divider"></div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align:center">Qty</th>
              <th style="text-align:right">Harga</th>
              <th style="text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="total">
          <div class="total-row">
            <span>Total</span>
            <span>${formatPrice(order.total_price)}</span>
          </div>
        </div>
        <div class="payment">
          Metode Pembayaran: ${order.payment_method.toUpperCase()}
        </div>
        <div class="divider"></div>
        <div class="footer">
          <div class="thanks">Terima Kasih!</div>
          <p>Makanan terselamatkan, lingkungan terjaga.</p>
          <p style="margin-top:4px">#SisaRasa #SelamatkanMakanan</p>
        </div>
      </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 300)
  }

  const tabs: { value: TabType; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'siap_diambil', label: 'Siap Diambil' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Batal' }
  ]

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'semua' || order.status === activeTab
    const matchesSearch = 
      order.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items?.some(item => item.products?.title?.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesTab && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-10 w-48 bg-dark/10 rounded-xl" />
        <div className="h-12 w-full bg-dark/5 rounded-xl" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-dark/5 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-poppins font-extrabold text-dark tracking-tight">
          Kelola Pesanan
        </h1>
        <p className="text-dark/50 text-sm mt-1">
          Pantau, terima, dan selesaikan pesanan makanan penyelamatan dari customer Anda.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-dark/5">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 shrink-0 ${
              activeTab === tab.value
                ? 'bg-primary-teal text-white shadow-md shadow-primary-teal/15'
                : 'text-dark/60 bg-white border border-dark/5 hover:bg-dark/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          placeholder="Cari pembeli, ID pesanan, atau menu makanan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-dark/10 bg-white text-dark placeholder-dark/30 focus:border-primary-orange focus:ring-2 focus:ring-primary-orange/20 transition-all outline-none"
        />
      </div>

      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dark/5 shadow-sm p-12 text-center flex flex-col items-center justify-center">
          <ClipboardList className="w-12 h-12 text-dark/20 mb-4" />
          <h3 className="text-lg font-bold text-dark font-poppins">Tidak Ada Pesanan</h3>
          <p className="text-sm text-dark/50 mt-1 max-w-sm">
            Tidak ada pesanan yang sesuai dengan filter atau kriteria pencarian saat ini.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl border border-dark/5 shadow-sm p-6 flex flex-col md:flex-row justify-between gap-6 transition-all hover:shadow-md"
            >
              {/* Order Info & Products */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-mono font-bold bg-dark/5 text-dark/70 px-2.5 py-1 rounded-lg">
                    ID: #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'diproses' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'siap_diambil' ? 'bg-green-100 text-green-800' :
                    order.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {order.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-dark/40 font-semibold">
                    {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>

                {/* Customer Details Card */}
                <div className="bg-cream-bg/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-dark/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-teal/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary-teal" />
                    </div>
                    <div>
                      <p className="text-[10px] text-dark/50 font-bold uppercase tracking-wider">Pemesan</p>
                      <p className="text-sm text-dark font-extrabold truncate">{order.users?.name || 'Customer'}</p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-dark/50 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Daftar Belanja
                  </h4>
                  <div className="divide-y divide-dark/5">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2.5">
                        <div>
                          <p className="text-sm font-bold text-dark">{item.products?.title}</p>
                          <p className="text-xs text-dark/40 mt-0.5">{formatPrice(Number(item.price))} / porsi</p>
                        </div>
                        <span className="text-sm font-extrabold text-dark font-poppins">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Payment & Actions Panel */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-dark/5 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-dark/40 font-semibold block">Total Pembayaran</span>
                    <span className="text-2xl font-extrabold text-primary-orange font-poppins block mt-1">
                      {formatPrice(order.total_price)}
                    </span>
                    <span className="text-[10px] font-bold bg-primary-teal/10 text-primary-teal px-2 py-0.5 rounded-md inline-block mt-2">
                      Metode: {order.payment_method.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Hubungi Pembeli */}
                <button
                  onClick={() => handleChat(order.customer_id)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-teal/10 text-primary-teal text-xs font-bold hover:bg-primary-teal/20 transition-all w-full"
                >
                  <MessageCircle className="w-4 h-4" /> Hubungi Pembeli
                </button>

                {/* CTA actions depending on status */}
                <div className="space-y-2 mt-3">
                  {order.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'diproses')}
                        className="flex-1 py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-md shadow-primary-teal/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4" /> Terima Pesanan
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'dibatalkan')}
                        className="p-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {order.status === 'diproses' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'siap_diambil')}
                      className="w-full py-2.5 rounded-xl bg-primary-orange text-white text-xs font-bold shadow-md shadow-primary-orange/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Package className="w-4 h-4" /> Siap Diambil
                    </button>
                  )}

                  {order.status === 'siap_diambil' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'selesai')}
                      className="w-full py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold shadow-md shadow-green-600/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Selesai
                    </button>
                  )}

                  {order.status === 'selesai' && (
                    <>
                      <button
                        onClick={() => handlePrint(order)}
                        className="w-full py-2.5 rounded-xl bg-primary-teal text-white text-xs font-bold shadow-md shadow-primary-teal/15 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" /> Cetak Struk
                      </button>
                      <div className="py-2.5 px-4 rounded-xl bg-dark/5 text-center text-xs font-bold text-dark/40 flex items-center justify-center gap-1.5">
                        <HelpCircle className="w-4 h-4" /> Pesanan Selesai
                      </div>
                    </>
                  )}
                  {order.status === 'dibatalkan' && (
                    <div className="py-2.5 px-4 rounded-xl bg-dark/5 text-center text-xs font-bold text-dark/40 flex items-center justify-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Pesanan Dibatalkan
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RECEIPT MODAL ── */}
      {receiptOrder && receiptStore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setReceiptOrder(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-3">
              <h3 className="font-bold text-lg">Struk Pesanan</h3>
              <button onClick={() => setReceiptOrder(null)} className="size-8 flex items-center justify-center rounded-xl hover:bg-dark/5 transition-colors cursor-pointer">
                <X className="size-5" />
              </button>
            </div>

            {/* Receipt Preview (monospace, thermal style) */}
            <div className="px-6 pb-4">
              <div className="bg-white border-2 border-dashed border-dark/20 rounded-2xl p-5 font-mono text-xs leading-relaxed">
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Store className="size-4 text-primary-teal" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">{receiptStore.name}</h4>
                  </div>
                  {receiptStore.address && <p className="text-[10px] text-dark/50">{receiptStore.address}</p>}
                </div>

                <div className="border-t border-dashed border-dark/30 my-2" />

                {/* Info */}
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-dark/50">No. Pesanan</span>
                  <span className="font-bold">#{receiptOrder.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-dark/50">Tanggal</span>
                  <span className="font-bold">{new Date(receiptOrder.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-dark/50">Waktu</span>
                  <span className="font-bold">{new Date(receiptOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-dark/50">Pembeli</span>
                  <span className="font-bold">{receiptOrder.users?.name || '-'}</span>
                </div>

                <div className="border-t border-dashed border-dark/30 my-2" />

                {/* Items */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-1.5 text-[10px]">
                  <div className="font-bold text-dark/50 uppercase tracking-wider text-[9px]">Item</div>
                  <div className="font-bold text-dark/50 uppercase tracking-wider text-[9px] text-right">Qty</div>
                  <div className="font-bold text-dark/50 uppercase tracking-wider text-[9px] text-right">Sub</div>
                  {receiptOrder.order_items.map((item) => (
                    <React.Fragment key={item.id}>
                      <span className="truncate">{item.products?.title}</span>
                      <span className="text-right">x{item.quantity}</span>
                      <span className="text-right font-semibold">{formatPrice(Number(item.price) * item.quantity)}</span>
                    </React.Fragment>
                  ))}
                </div>

                <div className="border-t border-dashed border-dark/30 my-2" />

                {/* Total */}
                <div className="flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span className="text-primary-orange">{formatPrice(receiptOrder.total_price)}</span>
                </div>

                <div className="text-[9px] text-dark/50 mt-1">
                  Metode: {receiptOrder.payment_method.toUpperCase()}
                </div>

                <div className="border-t border-dashed border-dark/30 my-2" />

                {/* Footer */}
                <div className="text-center text-[10px] mt-2">
                  <p className="font-bold text-dark text-xs">Terima Kasih!</p>
                  <p className="text-dark/50">Makanan terselamatkan, lingkungan terjaga.</p>
                  <p className="text-primary-teal font-bold mt-1">#SisaRasa</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setReceiptOrder(null)} className="flex-1 py-3 rounded-xl ring-1 ring-[#E5E7EB] font-bold text-sm hover:bg-[#F3F6F8] transition-all cursor-pointer">
                Tutup
              </button>
              <button onClick={triggerPrint} className="flex-1 py-3 rounded-xl bg-primary-teal text-white font-bold text-sm shadow-md hover:bg-primary-teal/90 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Printer className="size-4" /> Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
