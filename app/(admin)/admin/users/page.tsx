'use client'

import { useState, useEffect } from 'react'
import { Search, ShoppingBag, User, MoreHorizontal, Loader2, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

type UserRole = 'customer' | 'store' | 'admin'

interface UserItem {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
  ordersCount: number
  avatar_url?: string | null
}

const ROLE_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  customer: { label: 'Customer', cls: 'bg-blue-50 text-blue-700', icon: User },
  store: { label: 'Store', cls: 'bg-orange-50 text-orange-700', icon: ShoppingBag },
  admin: { label: 'Admin', cls: 'bg-purple-50 text-purple-700', icon: User },
}

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700', 'bg-orange-100 text-orange-700',
  'bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700', 'bg-pink-100 text-pink-700'
]

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at, avatar_url')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id')

      if (ordersError) throw ordersError

      const formattedUsers: UserItem[] = (usersData || [])
        .filter(u => u.role !== 'admin')
        .map(u => ({
        ...u,
        role: u.role as UserRole,
        ordersCount: ordersData?.filter(o => o.customer_id === u.id).length || 0
      }))

      setUsers(formattedUsers)
    } catch (error: any) {
      toast.error('Gagal mengambil data pengguna: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      // Cari store milik user ini (jika role store)
      const { data: stores } = await supabase.from('stores').select('id').eq('user_id', id)

      if (stores && stores.length > 0) {
        const storeIds = stores.map(s => s.id)
        // Hapus produk & gambar dari store
        const { data: products } = await supabase.from('products').select('id').in('store_id', storeIds)
        if (products && products.length > 0) {
          const productIds = products.map(p => p.id)
          await supabase.from('product_images').delete().in('product_id', productIds)
          await supabase.from('reviews').delete().in('product_id', productIds)
          await supabase.from('products').delete().in('id', productIds)
        }
        await supabase.from('review_replies').delete().in('store_id', storeIds)
        await supabase.from('conversations').delete().in('store_id', storeIds)
        await supabase.from('orders').delete().in('store_id', storeIds)
        await supabase.from('stores').delete().in('id', storeIds)
      }

      // Hapus data user lainnya
      await supabase.from('reviews').delete().eq('customer_id', id)
      await supabase.from('orders').delete().eq('customer_id', id)
      await supabase.from('favorites').delete().eq('customer_id', id)
      await supabase.from('messages').delete().eq('sender_id', id)
      await supabase.from('notifications').delete().eq('user_id', id)

      // Hapus user
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) throw error

      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('Pengguna dan seluruh data terkait berhasil dihapus')
    } catch (error: any) {
      toast.error('Gagal menghapus pengguna: ' + error.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div className="p-5 md:p-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-bold text-2xl">Manajemen Pengguna</h1>
          <p className="text-sm text-[#6A7686] mt-0.5">Kelola semua pengguna platform SisaRasa</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="px-4 py-2 rounded-full bg-[#0F766E]/10 text-[#0F766E]">{users.length} Total User</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 ring-1 ring-[#E5E7EB] shadow-sm">
          {(['all', 'customer', 'store'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r as 'all' | UserRole)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                roleFilter === r ? 'bg-[#0F766E] text-white' : 'text-[#6A7686] hover:bg-[#F3F6F8]'
              }`}
            >
              {r === 'all' ? 'Semua' : r}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6A7686]" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm outline-none focus:ring-[#0F766E] transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-cream-bg">
              <tr>
                {['Pengguna', 'Role', 'Status', 'Bergabung', 'Order', 'Aksi'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-[#6A7686] uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Loader2 className="size-8 animate-spin text-[#0F766E] mx-auto mb-3" />
                    <p className="text-[#6A7686] font-medium">Memuat data pengguna...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <User className="size-10 mx-auto mb-3 text-[#E5E7EB]" />
                    <p className="text-[#6A7686] font-medium">Tidak ada pengguna ditemukan.</p>
                  </td>
                </tr>
              ) : filtered.map((user, idx) => {
                const roleInfo = ROLE_CONFIG[user.role] || ROLE_CONFIG.customer
                const RoleIcon = roleInfo.icon
                const initials = user.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
                return (
                  <tr key={user.id} className="hover:bg-[#F3F6F8]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden ${user.avatar_url ? '' : color}`}>
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.name} width={40} height={40} className="object-cover size-full" />
                          ) : (
                            initials
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{user.name}</p>
                          <p className="text-xs text-[#6A7686]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${roleInfo.cls}`}>
                        <RoleIcon className="size-3" /> {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                        Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6A7686]">
                      {new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold">{user.ordersCount}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="size-8 inline-flex items-center justify-center rounded-xl ring-1 ring-[#E5E7EB] bg-white hover:ring-red-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Hapus pengguna"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!isLoading && (
          <div className="px-6 py-4 border-t border-[#E5E7EB] text-sm text-[#6A7686]">
            Menampilkan <strong className="text-dark">{filtered.length}</strong> dari <strong className="text-dark">{users.length}</strong> pengguna
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-center">Hapus Pengguna</h3>
            <p className="text-[#6A7686] text-sm mb-6 text-center">Apakah kamu yakin ingin menghapus pengguna ini? Seluruh data terkait (toko, produk, pesanan, ulasan) akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-3 rounded-full ring-1 ring-[#E5E7EB] font-bold hover:bg-[#F3F6F8] transition-all">Batal</button>
              <button onClick={() => handleDeleteUser(deleteConfirm)} className="flex-1 px-4 py-3 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
