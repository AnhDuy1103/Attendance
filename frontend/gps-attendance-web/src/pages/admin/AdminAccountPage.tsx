import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  Camera,
  KeyRound,
  Save,
} from 'lucide-react'
import ChangePasswordModal from '../../components/admin/account/ChangePasswordModal'

// ─── Types ────────────────────────────────────────────────────
type AdminAccountForm = {
  fullName: string
  email: string
  phone: string
}

const defaultAccountForm: AdminAccountForm = {
  fullName: 'Admin Quang Hoa',
  email: 'admin@quanghoa.vn',
  phone: '0901 234 567',
}

// ─── AdminAccountPage Component ───────────────────────────────
export default function AdminAccountPage() {
  const [accountForm, setAccountForm] = useState<AdminAccountForm>(defaultAccountForm)
  const [errors, setErrors] = useState<Partial<Record<keyof AdminAccountForm, string>>>({})
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)

  const handleChange = (field: keyof AdminAccountForm, value: string) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
  }

  const handleSave = () => {
    const newErrors: Partial<Record<keyof AdminAccountForm, string>> = {}

    if (!accountForm.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên'
    if (!accountForm.email.trim() || !validateEmail(accountForm.email)) {
      newErrors.email = 'Vui lòng nhập email hợp lệ'
    }
    if (!accountForm.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    console.log('Dữ liệu hồ sơ được lưu:', accountForm)
    alert('Lưu hồ sơ thành công')
  }

  const handlePasswordChange = () => {
    setIsChangePasswordOpen(true)
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '100%' }}>
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
              AQH
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
            Admin Quang Hoa
          </h2>
          <p className="text-sm font-medium mb-6 text-center lg:text-left" style={{ color: '#444653' }}>
            Quản trị viên hệ thống
          </p>

          <button
            onClick={handlePasswordChange}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 group mb-6 w-full lg:w-auto justify-center"
            style={{
              background: 'transparent',
              color: '#00288e',
              border: '1.5px solid #00288e',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#00288e'
              el.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = 'transparent'
              el.style.color = '#00288e'
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

          <div className="space-y-5">
            {/* Họ tên */}
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
                  value={accountForm.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: errors.fullName ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { if (!errors.fullName) e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { if (!errors.fullName) e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
              </div>
              {errors.fullName && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.fullName}</p>}
            </div>

            {/* Email */}
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
                  value={accountForm.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: errors.email ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { if (!errors.email) e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { if (!errors.email) e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
              </div>
              {errors.email && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.email}</p>}
            </div>

            {/* Số điện thoại */}
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
                  value={accountForm.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full pl-11 pr-4 h-12 text-sm rounded-lg outline-none transition-colors"
                  style={{
                    background: '#ffffff',
                    border: errors.phone ? '1.5px solid #ba1a1a' : '1.5px solid #c4c5d5',
                    color: '#0b1c30',
                  }}
                  onFocus={(e) => { if (!errors.phone) e.currentTarget.style.borderColor = '#00288e' }}
                  onBlur={(e) => { if (!errors.phone) e.currentTarget.style.borderColor = '#c4c5d5' }}
                />
              </div>
              {errors.phone && <p className="text-xs mt-1.5" style={{ color: '#ba1a1a' }}>{errors.phone}</p>}
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold text-white transition-all shadow-sm active:scale-[0.98]"
                style={{ background: '#00288e' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e40af' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#00288e' }}
              >
                <Save size={18} />
                Lưu hồ sơ
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  )
}
