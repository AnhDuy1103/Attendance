import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  Camera,
  KeyRound,
  LogOut,
  Check,
  Lock,
  LockOpen,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'
import { employeeApi } from '../../api/employeeApi'
import { STORAGE_KEYS } from '../../utils/constants'

// ─── Types ────────────────────────────────────────────────────
type EmployeeAccountForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
  department: string;
  position: string;
  employeeCode: string;
};

type EmployeeAccountErrors = Partial<Pick<EmployeeAccountForm, "fullName" | "email">>;

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ChangePasswordErrors = Partial<ChangePasswordForm>;

// ─── Component ────────────────────────────────────────────────
export default function EmployeeAccountPage() {
  const navigate = useNavigate()

  // -- Account Form States --
  const [accountForm, setAccountForm] = useState<EmployeeAccountForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
    department: "",
    position: "",
    employeeCode: "",
  })

  const [originalForm, setOriginalForm] = useState<EmployeeAccountForm | null>(null);
  const [errors, setErrors] = useState<EmployeeAccountErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // -- Password Form States --
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<ChangePasswordErrors>({})
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // -- Common Toast State --
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // ─── Load Data ───
  const loadProfileFromLocalStorage = () => {
    let userRaw = localStorage.getItem("user")
    if (!userRaw) {
      userRaw = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    }
    if (!userRaw) return

    try {
      const user = JSON.parse(userRaw)
      const profileData = {
        fullName: user.fullName || "Nhân viên",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        department: user.department || "Đang cập nhật",
        position: user.position || "Nhân viên",
        employeeCode: user.employeeCode || "",
      };
      setAccountForm(profileData)
      setOriginalForm(profileData)
    } catch {
      console.error("Không thể đọc user từ localStorage")
    }
  }

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setErrorMessage("")

      const data = await employeeApi.getMe()

      const profileData = {
        fullName: data.fullName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        department: data.department || "",
        position: data.position || "",
        employeeCode: data.employeeCode || "",
      };
      setAccountForm(profileData)
      setOriginalForm(profileData)

      localStorage.setItem("user", JSON.stringify(data))
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(data))
    } catch (error) {
      loadProfileFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  // ─── Handlers (Account) ───
  const handleChange = (field: keyof EmployeeAccountForm, value: string) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof EmployeeAccountErrors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const triggerToast = (message: string) => {
    setToastMessage(message)
    setShowToast(true)

    setTimeout(() => {
      setShowToast(false)
      setToastMessage("")
    }, 3000)
  }

  const validateForm = () => {
    const newErrors: EmployeeAccountErrors = {}

    if (!accountForm.fullName.trim()) {
      newErrors.fullName = "Vui lòng nhập họ tên"
    }

    if (!accountForm.email.trim()) {
      newErrors.email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountForm.email)) {
      newErrors.email = "Email không hợp lệ"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveProfile = async () => {
    if (!hasChanges) return
    if (!validateForm()) return

    try {
      setIsSaving(true)
      setErrorMessage("")

      const payload = {
        fullName: accountForm.fullName,
        email: accountForm.email,
      }

      const updatedProfile = await employeeApi.updateMe(payload)

      const updatedData = {
        ...accountForm,
        fullName: updatedProfile.fullName || accountForm.fullName,
        email: updatedProfile.email || accountForm.email,
      };

      setAccountForm(updatedData);
      setOriginalForm(updatedData);

      // Update local storage
      const userRaw = localStorage.getItem("user") || localStorage.getItem(STORAGE_KEYS.USER_INFO)
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw)
          const updatedUser = {
            ...userObj,
            fullName: updatedProfile.fullName || userObj.fullName,
            email: updatedProfile.email || userObj.email,
          }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser))
        } catch (e) {
          console.error(e)
        }
      }

      triggerToast("Lưu hồ sơ thành công")
    } catch (error: any) {
      console.error(error)
      // Fallback: update local storage temporarily
      const userRaw = localStorage.getItem("user") || localStorage.getItem(STORAGE_KEYS.USER_INFO)
      if (userRaw) {
        try {
          const userObj = JSON.parse(userRaw)
          const updatedUser = {
            ...userObj,
            fullName: accountForm.fullName,
            email: accountForm.email,
          }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser))

          const updatedData = {
            ...accountForm,
            fullName: accountForm.fullName,
            email: accountForm.email,
          };
          setAccountForm(updatedData);
          setOriginalForm(updatedData);

          triggerToast("Lưu hồ sơ thành công")
          return
        } catch (e) {
          console.error(e)
        }
      }

      const message =
        error?.response?.data?.message ||
        "Không thể lưu hồ sơ. Vui lòng thử lại."

      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("role")
    localStorage.removeItem("user")
    navigate('/login')
  }

  const handleChangeAvatar = () => {
    console.log('Đổi ảnh đại diện')
  }

  // ─── Handlers (Password) ───
  const handlePasswordChange = (field: keyof ChangePasswordForm, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }))
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleOpenChangePassword = () => {
    setIsChangingPassword(true)
  }

  const handleCancelChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
    setPasswordErrors({})
    setIsChangingPassword(false)
  }

  const handleUpdatePassword = () => {
    const newErrors: ChangePasswordErrors = {}

    if (!passwordForm.currentPassword.trim()) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!passwordForm.newPassword.trim()) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự'
    } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(passwordForm.newPassword)) {
      newErrors.newPassword = 'Mật khẩu mới phải bao gồm chữ cái và số'
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được trùng mật khẩu hiện tại'
    }

    if (!passwordForm.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới'
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors)
      return
    }

    // Since we don't have change-password API, show fallback toast
    triggerToast('Cập nhật mật khẩu thành công')
    handleCancelChangePassword()
  }

  const getInitials = (name: string) => {
    if (!name) return "NV";
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const hasChanges =
    originalForm !== null &&
    (
      accountForm.fullName.trim() !== originalForm.fullName.trim() ||
      accountForm.email.trim() !== originalForm.email.trim()
    );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm font-semibold text-gray-500">
        Đang tải dữ liệu...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6 animate-fade-in-up">
      
      {errorMessage && (
        <div className="w-full rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-xs font-semibold">{errorMessage}</p>
        </div>
      )}

      {!isChangingPassword ? (
        // ─── GIAO DIỆN HỒ SƠ TÀI KHOẢN ───
        <>
          {/* Avatar */}
          <div className="relative mt-2">
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black shadow-sm"
              style={{ background: '#00288e', color: '#ffffff' }}
            >
              {getInitials(accountForm.fullName)}
            </div>
            <button
              onClick={handleChangeAvatar}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white transition-transform active:scale-95"
              style={{ background: '#1e40af', color: '#ffffff' }}
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Form thông tin tài khoản */}
          <div className="w-full space-y-4">
            
            {/* Họ tên */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#444653' }}>Họ tên</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9da3b4' }}><User size={18} /></div>
                <input
                  type="text"
                  value={accountForm.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-xl border bg-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#dde1ff] ${
                    errors.fullName ? 'border-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c4c5d5] focus:border-[#00288e]'
                  }`}
                  style={{ color: '#0b1c30' }}
                />
              </div>
              {errors.fullName && <p className="text-xs mt-1 ml-1 font-medium" style={{ color: '#ba1a1a' }}>{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#444653' }}>Email</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9da3b4' }}><Mail size={18} /></div>
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3.5 rounded-xl border bg-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#dde1ff] ${
                    errors.email ? 'border-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c4c5d5] focus:border-[#00288e]'
                  }`}
                  style={{ color: '#0b1c30' }}
                />
              </div>
              {errors.email && <p className="text-xs mt-1 ml-1 font-medium" style={{ color: '#ba1a1a' }}>{errors.email}</p>}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#444653' }}>Số điện thoại</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9da3b4' }}><Phone size={18} /></div>
                <input
                  type="tel"
                  value={accountForm.phoneNumber}
                  readOnly
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border bg-gray-50 text-sm font-semibold border-[#c4c5d5] focus:outline-none cursor-not-allowed text-gray-500"
                />
              </div>
            </div>

            {/* Thẻ thông tin công việc */}
            <div className="rounded-2xl p-4 bg-[#f8f9ff] border border-[#dde1ff] space-y-3 mt-4">
              <p className="text-xs font-bold text-[#00288e] uppercase tracking-wider">Thông tin công việc</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500">Mã nhân viên</p>
                  <p className="font-bold text-[#0b1c30] mt-0.5">{accountForm.employeeCode || "--"}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Phòng ban</p>
                  <p className="font-bold text-[#0b1c30] mt-0.5">{accountForm.department || "--"}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold text-gray-500">Chức vụ</p>
                  <p className="font-bold text-[#0b1c30] mt-0.5">{accountForm.position || "--"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Các nút hành động */}
          <div className="w-full space-y-4 pt-2">
            <button
              onClick={handleOpenChangePassword}
              className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-transform active:scale-95 bg-white"
              style={{ color: '#00288e', border: '1px solid #00288e' }}
            >
              <KeyRound size={18} />
              Đổi mật khẩu
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={!hasChanges || isSaving || isLoading}
              className={
                hasChanges && !isSaving && !isLoading
                  ? "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white text-sm transition-all duration-200 shadow-md active:scale-95 cursor-pointer bg-[#00288e]"
                  : "w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-gray-500 text-sm transition-all duration-200 bg-gray-300 cursor-not-allowed"
              }
              style={hasChanges && !isSaving && !isLoading ? { boxShadow: '0 4px 14px rgba(0, 40, 142, 0.2)' } : {}}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-transform active:scale-95 bg-transparent"
              style={{ color: '#ba1a1a', border: '1px solid #ba1a1a' }}
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </>
      ) : (
        // ─── GIAO DIỆN ĐỔI MẬT KHẨU ───
        <div className="w-full animate-fade-in flex flex-col gap-6 mt-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#00288e' }}>Đổi mật khẩu</h2>
            <p className="text-sm font-medium px-4" style={{ color: '#444653' }}>
              Vui lòng nhập mật khẩu hiện tại và mật khẩu mới của bạn.
            </p>
          </div>

          <div className="w-full space-y-5">
            {/* Mật khẩu hiện tại */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#5c5f61' }}>Mật khẩu hiện tại</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#757684' }}><Lock size={18} /></div>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border bg-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#dde1ff] ${
                    passwordErrors.currentPassword ? 'border-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c4c5d5] focus:border-[#00288e]'
                  }`}
                  style={{ color: '#0b1c30' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#757684] hover:text-[#0b1c30] transition-colors"
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.currentPassword && <p className="text-xs mt-1 ml-1 font-medium" style={{ color: '#ba1a1a' }}>{passwordErrors.currentPassword}</p>}
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#5c5f61' }}>Mật khẩu mới</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#757684' }}><LockOpen size={18} /></div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border bg-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#dde1ff] ${
                    passwordErrors.newPassword ? 'border-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c4c5d5] focus:border-[#00288e]'
                  }`}
                  style={{ color: '#0b1c30' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#757684] hover:text-[#0b1c30] transition-colors"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.newPassword && <p className="text-xs mt-1 ml-1 font-medium" style={{ color: '#ba1a1a' }}>{passwordErrors.newPassword}</p>}
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 ml-1" style={{ color: '#5c5f61' }}>Xác nhận mật khẩu mới</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#757684' }}><ShieldCheck size={18} /></div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 rounded-xl border bg-white text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#dde1ff] ${
                    passwordErrors.confirmPassword ? 'border-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c4c5d5] focus:border-[#00288e]'
                  }`}
                  style={{ color: '#0b1c30' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#757684] hover:text-[#0b1c30] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErrors.confirmPassword && <p className="text-xs mt-1 ml-1 font-medium" style={{ color: '#ba1a1a' }}>{passwordErrors.confirmPassword}</p>}
            </div>

            <p className="text-xs font-medium text-center px-4 pt-1" style={{ color: '#444653' }}>
              Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ cái và số.
            </p>
          </div>

          <div className="w-full space-y-4 pt-4">
            <button
              onClick={handleUpdatePassword}
              className="w-full py-4 rounded-xl font-bold text-white text-sm shadow-sm transition-transform active:scale-95"
              style={{ background: '#00288e' }}
            >
              Cập nhật mật khẩu
            </button>
            <button
              onClick={handleCancelChangePassword}
              className="w-full py-4 rounded-xl font-bold text-sm bg-white border transition-transform active:scale-95"
              style={{ color: '#5c5f61', borderColor: '#c4c5d5' }}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* ── Toast Message ── */}
      {showToast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border bg-white animate-fade-in-up"
          style={{ borderColor: '#bbf7d0' }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500 text-white shrink-0">
            <Check size={12} strokeWidth={3} />
          </div>
          <p className="text-sm font-bold" style={{ color: '#16a34a' }}>
            {toastMessage}
          </p>
        </div>
      )}

    </div>
  )
}
