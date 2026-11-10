import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react'
import { authApi } from '../../api/authApi'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setLoading(true); setError(''); setMessage('')
    try { await action() } catch (e: any) { setError(e.response?.data?.message || 'Không thể thực hiện yêu cầu.') }
    finally { setLoading(false) }
  }

  const submitEmail = () => run(async () => { const msg = await authApi.requestPasswordOtp(email.trim()); setMessage(msg); setStep(2) })
  const submitOtp = () => run(async () => { const token = await authApi.verifyPasswordOtp(email.trim(), otp.trim()); setResetToken(token); setStep(3) })
  const submitPassword = () => run(async () => {
    if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.')
    if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.')
    await authApi.resetPassword(resetToken, password); setMessage('Đặt lại mật khẩu thành công.'); setTimeout(() => navigate('/login'), 1000)
  })

  return <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f8f9ff' }}>
    <div className="w-full max-w-md rounded-3xl p-10 shadow-xl bg-white border border-slate-100">
      <div className="flex justify-center mb-6"><img src="/quanghoaaa.png" alt="Quang Hoa" style={{ width: 150 }} /></div>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-blue-700 mb-5"><ArrowLeft size={16} /> Quay lại đăng nhập</Link>
      <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu</h1>
      <p className="text-sm text-slate-500 mt-2 mb-6">{step === 1 ? 'Nhập email đã liên kết với tài khoản để nhận mã OTP.' : step === 2 ? 'Nhập mã OTP được gửi đến email của bạn.' : 'Tạo mật khẩu mới cho tài khoản.'}</p>
      {message && <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">{message}</div>}
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
      {step === 1 && <div className="space-y-4"><label className="block text-sm font-semibold">Email</label><div className="relative"><Mail className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-xl border p-3 pl-10" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@congty.com" /></div><button disabled={loading || !email} onClick={submitEmail} className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{loading ? <Loader2 className="mx-auto animate-spin"/> : 'Gửi mã OTP'}</button></div>}
      {step === 2 && <div className="space-y-4"><label className="block text-sm font-semibold">Mã OTP 6 số</label><input className="w-full rounded-xl border p-3 text-center text-xl tracking-[.4em]" inputMode="numeric" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000"/><button disabled={loading || otp.length !== 6} onClick={submitOtp} className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{loading ? <Loader2 className="mx-auto animate-spin"/> : 'Xác nhận OTP'}</button></div>}
      {step === 3 && <div className="space-y-4"><div><label className="block text-sm font-semibold mb-1">Mật khẩu mới</label><div className="relative"><Lock className="absolute left-3 top-3 text-slate-400" size={18}/><input className="w-full rounded-xl border p-3 pl-10" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div></div><div><label className="block text-sm font-semibold mb-1">Nhập lại mật khẩu</label><input className="w-full rounded-xl border p-3" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></div><button disabled={loading} onClick={submitPassword} className="w-full rounded-xl bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{loading ? <Loader2 className="mx-auto animate-spin"/> : 'Đặt lại mật khẩu'}</button></div>}
      <div className="mt-8 pt-5 border-t flex justify-center gap-2 text-xs text-slate-400"><ShieldCheck size={14}/> Bảo mật bởi Quang Hoa</div>
    </div>
  </div>
}
