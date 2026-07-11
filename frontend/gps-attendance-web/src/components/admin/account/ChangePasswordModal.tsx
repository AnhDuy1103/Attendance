import { useState } from 'react'
import {
  X,
  Lock,
  LockOpen,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
export type ChangePasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const defaultPasswordForm: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

// ─── ChangePasswordModal Component ───────────────────────────
export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>(defaultPasswordForm)
  const [errors, setErrors] = useState<Partial<Record<keyof ChangePasswordForm, string>>>({})
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  if (!isOpen) return null

  const handleChange = (field: keyof ChangePasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleClose = () => {
    setPasswordForm(defaultPasswordForm)
    setErrors({})
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return { minLength, hasLetter, hasNumber }
  }

  const handleSave = () => {
    const newErrors: Partial<Record<keyof ChangePasswordForm, string>> = {}

    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else {
      const { minLength, hasLetter, hasNumber } = validatePassword(passwordForm.newPassword)
      if (!minLength) {
        newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự'
      } else if (!hasLetter || !hasNumber) {
        newErrors.newPassword = 'Mật khẩu mới phải bao gồm chữ cái và số'
      } else if (passwordForm.newPassword === passwordForm.currentPassword) {
        newErrors.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại'
      }
    }

    if (!passwordForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    console.log('Cập nhật mật khẩu:', passwordForm)
    alert('Cập nhật mật khẩu thành công')
    handleClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid #e8eaf4' }}
        >
          <h2 className="text-lg font-bold" style={{ color: '#00288e' }}>
            Đổi mật khẩu
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full transition-colors hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-5">
          {/* Mật khẩu hiện tại */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9da3b4' }}
              />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordForm.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: '#ffffff',
                  border: errors.currentPassword ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                  color: '#0b1c30',
                }}
                onFocus={(e) => { if (!errors.currentPassword) e.currentTarget.style.borderColor = '#00288e' }}
                onBlur={(e) => { if (!errors.currentPassword) e.currentTarget.style.borderColor = '#c4c5d5' }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.currentPassword}</p>}
          </div>

          {/* Mật khẩu mới */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
              Mật khẩu mới
            </label>
            <div className="relative">
              <LockOpen
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9da3b4' }}
              />
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: '#ffffff',
                  border: errors.newPassword ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                  color: '#0b1c30',
                }}
                onFocus={(e) => { if (!errors.newPassword) e.currentTarget.style.borderColor = '#00288e' }}
                onBlur={(e) => { if (!errors.newPassword) e.currentTarget.style.borderColor = '#c4c5d5' }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.newPassword}</p>}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <ShieldCheck
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: '#9da3b4' }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                style={{
                  background: '#ffffff',
                  border: errors.confirmPassword ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                  color: '#0b1c30',
                }}
                onFocus={(e) => { if (!errors.confirmPassword) e.currentTarget.style.borderColor = '#00288e' }}
                onBlur={(e) => { if (!errors.confirmPassword) e.currentTarget.style.borderColor = '#c4c5d5' }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.confirmPassword}</p>}
          </div>

          {/* Guide Note */}
          <p className="text-[13px] font-medium mt-4" style={{ color: '#444653' }}>
            Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={handleClose}
            className="w-1/2 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
            style={{ background: '#fff', color: '#444653', border: '1.5px solid #c4c5d5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="w-1/2 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm active:scale-[0.98]"
            style={{ background: '#00288e' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e40af' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#00288e' }}
          >
            Cập nhật mật khẩu
          </button>
        </div>
      </div>
    </div>
  )
}
