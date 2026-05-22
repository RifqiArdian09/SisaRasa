'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Shield, ShoppingBag, User, ChevronDown, MoreHorizontal, Loader2 } from 'lucide-react'
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
}

const ROLE_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  customer: { label: 'Customer', cls: 'bg-blue-50 text-blue-700', icon: User },
  store:    { label: 'Store',    cls: 'bg-orange-50 text-orange-700', icon: ShoppingBag },
  admin:    { label: 'Admin',    cls: 'bg-purple-50 text-purple-700', icon: Shield },
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

  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // Fetch orders count per user (simplified)
      // In a real large-scale app, you might want to do a join or rpc
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id')

      if (ordersError) throw ordersError

      const formattedUsers: UserItem[] = (usersData || []).map(u => ({
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-2xl p-1.5 ring-1 ring-[#E5E7EB] shadow-sm">
          {(['all', 'customer', 'store', 'admin'] as const).map(r => (
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
        <button className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl ring-1 ring-[#E5E7EB] text-sm font-semibold text-[#6A7686] shadow-sm hover:text-[#080C1A]">
          <Filter className="size-4" /> Filter <ChevronDown className="size-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="rounded-3xl ring-1 ring-[#E5E7EB] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#F8FAFC]">
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
                        <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${color}`}>
                          {initials}
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
                      <button className="size-8 inline-flex items-center justify-center rounded-xl ring-1 ring-[#E5E7EB] bg-white hover:ring-[#0F766E] hover:text-[#0F766E] transition-all">
                        <MoreHorizontal className="size-4" />
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
            Menampilkan <strong className="text-[#080C1A]">{filtered.length}</strong> dari <strong className="text-[#080C1A]">{users.length}</strong> pengguna
          </div>
        )}
      </div>
    </div>
  )
}
