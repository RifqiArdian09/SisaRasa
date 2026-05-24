'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, User, Store, Leaf } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Step = 1 | 2

export default function RegisterPage() {
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'customer' | 'store'>('customer')
  const [otpToken, setOtpToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Harap lengkapi seluruh kolom input!')
      return
    }
    if (password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter!')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Kata sandi dan konfirmasi tidak cocok!')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, data: { name, role } },
      })
      if (error) throw error
      toast.success('Kode OTP telah dikirimkan ke email Anda!')
      setStep(2)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Gagal mengirimkan kode OTP.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpToken) {
      toast.error('Harap masukkan kode OTP Anda!')
      return
    }
    setLoading(true)
    try {
      const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
        email, token: otpToken, type: 'email',
      })
      if (otpError) throw otpError

      const { error: passError } = await supabase.auth.updateUser({ password })
      if (passError) throw passError

      toast.success('Pendaftaran berhasil! Akun Anda telah terverifikasi.')

      const user = otpData.user
      if (user) {
        await supabase.from('users').upsert({
          id: user.id, name, email, role, avatar_url: null, fcm_token: null,
        }, { onConflict: 'id' })

        if (role === 'store') {
          await supabase.from('stores').upsert({
            user_id: user.id, store_name: name, address: 'Alamat belum diatur', is_verified: false,
          }, { onConflict: 'user_id' })
          router.push('/store/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Verifikasi OTP gagal.'
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?role=${role}` },
      })
      if (error) throw error
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Gagal mendaftar dengan Google.'
      toast.error(errMsg)
    }
  }

  return (
    <div className="flex min-h-screen bg-white font-sans">

      {/* ── KIRI: Brand Panel ── */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex flex-col bg-gradient-to-br from-[#2E7D32]/5 via-[#EBF7F5] to-white">
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="relative w-10 h-10">
            <Image src="/images/logo.png" alt="SisaRasa Logo" width={40} height={40} className="object-contain" />
          </div>
          <span className="text-2xl font-poppins font-extrabold text-[#2E7D32] tracking-tight">SisaRasa</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 pb-16">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-2 bg-[#2E7D32]/10 rounded-full px-4 py-1.5 mb-6">
              <Leaf className="w-4 h-4 text-[#2E7D32]" />
              <span className="text-[#2E7D32] text-xs font-bold font-poppins">#SelamatkanMakanan</span>
            </div>
            <h2 className="text-3xl font-poppins font-extrabold text-[#1A1A1A] leading-tight mb-4">
              Mulai Penyelamatan Makanan Anda!
            </h2>
            <p className="text-[#1A1A1A]/60 text-sm leading-relaxed">
              Bergabunglah sebagai pembeli hemat, atau daftarkan UMKM Anda sebagai mitra untuk meminimalisir food waste.
            </p>
          </div>
        </div>

        <div className="absolute right-0 bottom-0 w-64 h-64 bg-[#2E7D32]/5 rounded-full -translate-y-1/4 translate-x-1/4" />
        <div className="absolute left-0 top-1/3 w-48 h-48 bg-[#FF8A00]/5 rounded-full" />
      </div>

      {/* ── KANAN: Form Pendaftaran ── */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:px-14 xl:px-20 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="relative w-8 h-8">
              <Image src="/images/logo.png" alt="SisaRasa" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-poppins font-bold text-[#2E7D32] text-lg">SisaRasa</span>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-poppins font-extrabold text-[#1A1A1A] tracking-tight">
              {step === 1 ? 'Daftar Akun Baru' : 'Verifikasi OTP'}
            </h1>
            <p className="mt-1.5 text-sm text-[#1A1A1A]/60">
              {step === 1
                ? 'Lengkapi data diri untuk mulai menyelamatkan makanan.'
                : `Masukkan 6 digit kode yang dikirim ke ${email}`}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Tipe Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['customer', 'store'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                        role === r
                          ? 'border-[#0F766E] bg-[#0F766E]/5 text-[#0F766E]'
                          : 'border-slate-200 bg-white text-[#1A1A1A]/60 hover:bg-slate-50'
                      }`}
                    >
                      {r === 'customer' ? (
                        <span className="flex items-center justify-center gap-1.5"><User size={15} /> Pembeli</span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5"><Store size={15} /> Mitra Toko</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">
                  {role === 'store' ? 'Nama Toko' : 'Nama Lengkap'}
                </label>
                <input
                  id="name" type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'store' ? 'Bakery Mama' : 'Budi Santoso'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 transition-all outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Alamat Email</label>
                <input
                  id="reg-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 transition-all outline-none text-sm"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-slate-200 bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 transition-all outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Konfirmasi Kata Sandi</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPass ? 'text' : 'password'}
                    required value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/30 focus:ring-2 transition-all outline-none text-sm ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
                        : 'border-slate-200 focus:border-[#2E7D32] focus:ring-[#2E7D32]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Kata sandi tidak cocok</p>
                )}
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#2E7D32] hover:bg-[#236026] text-white font-poppins font-bold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2 mt-1"
              >
                {loading ? <Spinner /> : 'Kirim Kode OTP →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-[#1A1A1A] mb-2">Kode OTP (6 Digit)</label>
                <input
                  id="otp" type="text" required maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white text-[#1A1A1A] text-center tracking-[0.5em] text-xl font-bold placeholder-[#1A1A1A]/20 focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10 transition-all outline-none"
                />
                <p className="mt-2 text-xs text-[#1A1A1A]/50 text-center">
                  Cek folder <strong>Inbox</strong> atau <strong>Spam</strong> Anda
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button" onClick={() => setStep(1)}
                  className="w-1/3 py-3 px-4 rounded-xl bg-white border border-slate-200 text-[#1A1A1A]/80 font-semibold text-sm hover:bg-slate-50 transition-all"
                >
                  ← Kembali
                </button>
                <button
                  type="submit" disabled={loading || otpToken.length < 6}
                  className="w-2/3 py-3 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D6B63] text-white font-poppins font-bold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex justify-center items-center gap-2"
                >
                  {loading ? <Spinner /> : 'Verifikasi & Masuk'}
                </button>
              </div>

              <p className="text-center text-xs text-[#1A1A1A]/50">
                Tidak menerima kode?{' '}
                <button type="button" onClick={handleSendOtp} className="font-bold text-[#0F766E] hover:underline">
                  Kirim ulang
                </button>
              </p>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-[#1A1A1A]/40 font-semibold tracking-wider">atau</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignup} type="button"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#1A1A1A]/80 font-semibold text-sm shadow-sm flex items-center justify-center gap-3 transition-all"
              >
                <GoogleIcon />
                Daftar dengan Google
              </button>
            </>
          )}

          <p className="mt-7 text-center text-sm text-[#1A1A1A]/60">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-bold text-[#0F766E] hover:text-[#14B8A6] underline decoration-2 underline-offset-2 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
