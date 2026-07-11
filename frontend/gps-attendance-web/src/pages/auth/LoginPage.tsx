import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { STORAGE_KEYS, ROUTES } from '../../utils/constants'
import { authApi } from '../../api/authApi'

// ─── LoginPage ────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()

  const [phoneNumber, setPhoneNumber] = useState('')
  const [password, setPassword]       = useState('')
  const [remember, setRemember]       = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [shakeKey, setShakeKey]       = useState(0)   // increment to re-trigger shake

  const triggerError = (msg: string) => {
    setError(msg)
    setShakeKey((k) => k + 1)   // re-mount element → replays animation
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phoneNumber.trim() || !password.trim()) {
      triggerError('Vui lòng nhập đầy đủ số điện thoại và mật khẩu.')
      return
    }

    setLoading(true)
    try {
      const data = await authApi.login({ phoneNumber, password });
      
      // Save token and role
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, data.token);
      localStorage.setItem('role', data.role);
      
      // Save user info
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify({
        userId: data.userId,
        phoneNumber: data.phoneNumber,
        fullName: data.fullName,
        role: data.role,
        employeeId: data.employeeId,
        employeeCode: data.employeeCode
      }));

      // Navigate based on role
      if (data.role === 'Admin') {
        navigate(ROUTES.ADMIN.DASHBOARD, { replace: true })
      } else {
        navigate(ROUTES.EMPLOYEE.HOME, { replace: true })
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        triggerError(err.response.data.message);
      } else {
        triggerError('Số điện thoại hoặc mật khẩu không đúng.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: '#f8f9ff' }}
    >
      {/* ── Background blobs ── */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full animate-blob"
        style={{ background: 'radial-gradient(circle, #bfdbfe 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full animate-blob"
        style={{ background: 'radial-gradient(circle, #c7d7fd 0%, transparent 70%)', animationDelay: '3s' }}
      />

      {/* ── Login Card ── */}
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div
          className="rounded-3xl p-10 shadow-xl"
          style={{
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid #e8eaf4',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/quanghoaaa.png"
              alt="Quang Hoa Logo"
              style={{ width: 160, height: 'auto', objectFit: 'contain' }}
            />
          </div>


          {/* Error Banner */}
          {error && (
            <div
              key={shakeKey}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 animate-shake"
              style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
            >
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: '#0b1c30' }}
              >
                Số điện thoại
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <User size={16} />
                </span>
                <input
                  id="phoneNumber"
                  type="text"
                  autoComplete="tel"
                  autoFocus
                  placeholder="Nhập số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                  style={{
                    border: '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                    background: '#fff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#c4c5d5'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#0b1c30' }}
                >
                  Mật khẩu
                </label>
                <button
                  type="button"
                  className="text-xs font-medium transition-colors duration-150"
                  style={{ color: '#1e40af' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#00288e' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#1e40af' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl outline-none transition-all duration-200 disabled:opacity-60"
                  style={{
                    border: '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                    background: '#fff',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.1)' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#c4c5d5'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded cursor-pointer accent-blue-700"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                Ghi nhớ đăng nhập
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-1"
              style={{
                background: loading
                  ? '#3b5fc0'
                  : 'linear-gradient(135deg, #1e40af 0%, #00288e 100%)',
                boxShadow: '0 4px 14px rgba(0,40,142,0.3)',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #1e3a8a 0%, #001f6d 100%)' }}
              onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #1e40af 0%, #00288e 100%)' }}
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <LogIn size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-8 pt-5" style={{ borderTop: '1px solid #e8eaf4' }}>
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-gray-400" />
              <p className="text-xs text-gray-400 text-center">
                Xác thực GPS bảo mật bởi Quang Hoa
              </p>
            </div>
          </div>
        </div>

        {/* Footer below card */}
        <p className="text-center text-xs mt-5" style={{ color: '#9da3b4' }}>
          © 2024 Quang Hoa Construction. All rights reserved.
        </p>
      </div>
    </div>
  )
}
