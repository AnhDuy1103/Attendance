import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  User,
  Mail,
  Phone,
  Camera,
  KeyRound,
  Save,
  Lock,
  LockOpen,
  ShieldCheck,
  Eye,
  EyeOff,
  X,
  Loader2,
} from 'lucide-react'
import { accountApi } from '../../api/accountApi'

// ─── Helpers ──────────────────────────────────────────────────
const getInitials = (fullName?: string): string => {
  if (!fullName?.trim()) return 'A'
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words
    .slice(-3)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

const getRoleLabel = (role?: string): string => {
  switch (role) {
    case 'Admin':
      return 'Quản trị viên hệ thống'
    case 'Employee':
      return 'Nhân viên'
    default:
      return role || 'Quản trị viên'
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Types ────────────────────────────────────────────────────
type AccountForm = {
  fullName: string
  email: string
  phoneNumber: string
  role: string
}

type ChangePasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const defaultPasswordForm: ChangePasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

// ─── AdminAccountPage Component ───────────────────────────────
export default function AdminAccountPage() {
  // ── Profile State ──
  const [form, setForm] = useState<AccountForm>({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: '',
  })
  const [originalForm, setOriginalForm] = useState<AccountForm | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // ── Password State ──
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>(defaultPasswordForm)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  // ── Toast ──────────────────────────────────────────────────
  const triggerToast = (message: string) => {
    setToastMessage(message)
    window.setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  // ── Load Profile ───────────────────────────────────────────
  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setErrorMessage('')

      const data = await accountApi.getMyProfile()

      const nextForm: AccountForm = {
        fullName: data.fullName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        role: data.role || '',
      }

      setForm(nextForm)
      setOriginalForm(nextForm)

      // Cập nhật localStorage để Header có thể đọc tên mới
      const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem('user', JSON.stringify({ ...currentStoredUser, ...data }))
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Không thể tải thông tin tài khoản'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // Lock scroll khi modal mở
  useEffect(() => {
    if (isPasswordModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPasswordModalOpen])

  // ── Has Changes ────────────────────────────────────────────
  const hasProfileChanges =
    originalForm !== null &&
    (form.fullName.trim() !== originalForm.fullName.trim() ||
      form.email.trim() !== originalForm.email.trim())

  // ── Validate Profile ───────────────────────────────────────
  const validateProfileForm = (): boolean => {
    const fullName = form.fullName.trim()
    const email = form.email.trim()

    if (!fullName) {
      setErrorMessage('Vui lòng nhập họ tên')
      return false
    }
    if (!email) {
      setErrorMessage('Vui lòng nhập email')
      return false
    }
    if (!EMAIL_REGEX.test(email)) {
      setErrorMessage('Email không hợp lệ')
      return false
    }
    return true
  }

  // ── Save Profile ───────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!hasProfileChanges) return
    if (!validateProfileForm()) return

    try {
      setIsSaving(true)
      setErrorMessage('')

      const updated = await accountApi.updateMyProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      })

      const nextForm: AccountForm = {
        fullName: updated.fullName || '',
        email: updated.email || '',
        phoneNumber: updated.phoneNumber || '',
        role: updated.role || '',
      }

      setForm(nextForm)
      setOriginalForm(nextForm)

      const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}')
      const newUserObj = { ...currentStoredUser, ...updated }
      localStorage.setItem('user', JSON.stringify(newUserObj))

      window.dispatchEvent(
        new CustomEvent('user-profile-updated', {
          detail: updated,
        })
      )

      triggerToast('Lưu hồ sơ thành công')
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Không thể lưu hồ sơ'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  // ── Validate Password ──────────────────────────────────────
  const validatePasswordForm = (): boolean => {
    if (!passwordForm.currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại')
      return false
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự')
      return false
    }
    if (!/[A-Za-z]/.test(passwordForm.newPassword)) {
      setPasswordError('Mật khẩu mới phải có ít nhất một chữ cái')
      return false
    }
    if (!/\d/.test(passwordForm.newPassword)) {
      setPasswordError('Mật khẩu mới phải có ít nhất một chữ số')
      return false
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại')
      return false
    }
    if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp')
      return false
    }
    return true
  }

  // ── Change Password ────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return

    try {
      setIsChangingPassword(true)
      setPasswordError('')

      const result = await accountApi.changePassword(passwordForm)

      setIsPasswordModalOpen(false)
      setPasswordForm(defaultPasswordForm)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)

      triggerToast(result.message || 'Đổi mật khẩu thành công')
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Không thể đổi mật khẩu'
      setPasswordError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  // ── Close Password Modal ────────────────────────────────────
  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false)
    setPasswordForm(defaultPasswordForm)
    setPasswordError('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  // ── Password Modal (Portal) ─────────────────────────────────
  const renderPasswordModal = () => {
    if (!isPasswordModalOpen) return null

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483647] w-screen h-[100dvh] flex items-center justify-center px-4"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={handleClosePasswordModal}
      >
        <div
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #e8eaf4' }}
          >
            <h2 className="text-lg font-bold" style={{ color: '#00288e' }}>
              Đổi mật khẩu
            </h2>
            <button
              onClick={handleClosePasswordModal}
              className="p-1.5 rounded-full transition-colors hover:bg-gray-100 text-gray-500"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Error */}
            {passwordError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {passwordError}
              </div>
            )}

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
                  onChange={(e) => {
                    setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                    if (passwordError) setPasswordError('')
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                  onChange={(e) => {
                    setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    if (passwordError) setPasswordError('')
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
                  onChange={(e) => {
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    if (passwordError) setPasswordError('')
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Guide Note */}
            <p className="text-[13px] font-medium mt-4" style={{ color: '#444653' }}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.
            </p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleClosePasswordModal}
              disabled={isChangingPassword}
              className="w-1/2 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
              style={{ background: '#fff', color: '#444653', border: '1.5px solid #c4c5d5' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
            >
              Hủy
            </button>
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="w-1/2 py-2.5 rounded-lg text-sm font-bold text-white transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#00288e' }}
              onMouseEnter={(e) => { if (!isChangingPassword) (e.currentTarget as HTMLButtonElement).style.background = '#1e40af' }}
              onMouseLeave={(e) => { if (!isChangingPassword) (e.currentTarget as HTMLButtonElement).style.background = '#00288e' }}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-20 right-6 z-[9999] bg-white border border-green-200 shadow-lg rounded-xl px-5 py-3 flex items-center gap-3 animate-fade-in"
          style={{ minWidth: 240 }}
        >
          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-sm font-semibold text-gray-700">{toastMessage}</span>
        </div>
      )}

      {/* Password Modal (Portal) */}
      {renderPasswordModal()}

      {/* ── Page Header ── */}
      <div className="mb-6">
        <p className="text-sm font-medium" style={{ color: '#444653' }}>
          Xem thông tin tài khoản quản trị viên đang đăng nhập trong hệ thống.
        </p>
      </div>

      {/* ── Main Card ── */}
      <div
        className="bg-white rounded-xl shadow-sm border p-6 md:p-8 flex flex-col lg:flex-row gap-12"
        style={{ borderColor: 'rgba(196, 197, 213, 0.3)' }}
      >
        {/* ── Left Column: Avatar & Info ── */}
        <div className="flex flex-col items-center lg:items-start lg:w-1/3 shrink-0">
          <div className="relative mb-5">
            {/* Avatar */}
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold shadow-sm"
              style={{ background: '#dde1ff', color: '#001453', border: '4px solid #ffffff' }}
            >
              {isLoading ? (
                <Loader2 size={32} className="animate-spin text-blue-300" />
              ) : (
                getInitials(form.fullName)
              )}
            </div>
            {/* Camera Icon */}
            <button
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md border transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ borderColor: '#e8eaf4', color: '#444653' }}
              title="Đổi avatar"
            >
              <Camera size={16} />
            </button>
          </div>

          <h2 className="text-xl font-bold mb-1 text-center lg:text-left" style={{ color: '#0b1c30' }}>
            {isLoading ? (
              <span className="inline-block w-36 h-5 bg-gray-200 rounded animate-pulse" />
            ) : (
              form.fullName || 'Quản trị viên'
            )}
          </h2>
          <p className="text-sm font-medium mb-6 text-center lg:text-left" style={{ color: '#444653' }}>
            {isLoading ? (
              <span className="inline-block w-28 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              getRoleLabel(form.role)
            )}
          </p>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 group mb-6 w-full lg:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'transparent',
              color: '#00288e',
              border: '1.5px solid #00288e',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = '#00288e'
                el.style.color = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                const el = e.currentTarget as HTMLButtonElement
                el.style.background = 'transparent'
                el.style.color = '#00288e'
              }
            }}
          >
            <KeyRound size={16} className="group-hover:text-white" />
            Đổi mật khẩu
          </button>

          <p className="text-xs font-medium text-center lg:text-left px-4 lg:px-0" style={{ color: '#9da3b4' }}>
            Avatar sẽ hiển thị ở hồ sơ và các khu vực nhận diện trong hệ thống.
          </p>
        </div>

        {/* ── Right Column: Profile Form ── */}
        <div className="flex-1 lg:pl-12 lg:border-l" style={{ borderColor: '#e8eaf4' }}>
          <div className="mb-8">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
              style={{ background: '#eff4ff', color: '#00288e' }}
            >
              PROFILE
            </span>
            <h2 className="text-2xl font-bold mt-3 mb-2" style={{ color: '#0b1c30' }}>
              Thông tin hồ sơ
            </h2>
            <p className="text-sm font-medium" style={{ color: '#444653' }}>
              Thông tin này dùng để nhận diện tài khoản quản trị viên trong hệ thống.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </div>
          )}

          {isLoading ? (
            /* Skeleton Loading */
            <div className="space-y-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1.5" />
                  <div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {/* Họ tên – editable */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
                  Họ tên
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9da3b4' }}
                  />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, fullName: e.target.value }))
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none transition-colors"
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #c4c5d5',
                      color: '#0b1c30',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#00288e' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#c4c5d5' }}
                  />
                </div>
              </div>

              {/* Email – editable */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9da3b4' }}
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                      if (errorMessage) setErrorMessage('')
                    }}
                    className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none transition-colors"
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #c4c5d5',
                      color: '#0b1c30',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#00288e' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#c4c5d5' }}
                  />
                </div>
              </div>

              {/* Số điện thoại – readOnly */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: '#9da3b4' }}
                  />
                  <input
                    type="text"
                    value={form.phoneNumber}
                    readOnly
                    className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none cursor-not-allowed"
                    style={{
                      background: '#f8f9fb',
                      border: '1.5px solid #e8eaf4',
                      color: '#9da3b4',
                    }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: '#9da3b4' }}>
                  Số điện thoại không thể thay đổi
                </p>
              </div>

              {/* Vai trò – chỉ hiển thị */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#0b1c30' }}>
                  Vai trò
                </label>
                <div
                  className="w-full pl-4 pr-4 h-12 text-sm rounded-lg flex items-center cursor-not-allowed"
                  style={{
                    background: '#f8f9fb',
                    border: '1.5px solid #e8eaf4',
                    color: '#9da3b4',
                  }}
                >
                  {getRoleLabel(form.role)}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={!hasProfileChanges || isSaving || isLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  style={{
                    background: hasProfileChanges && !isSaving ? '#00288e' : '#9da3b4',
                  }}
                  onMouseEnter={(e) => {
                    if (hasProfileChanges && !isSaving) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#1e40af'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasProfileChanges && !isSaving) {
                      (e.currentTarget as HTMLButtonElement).style.background = '#00288e'
                    }
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Lưu hồ sơ
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
