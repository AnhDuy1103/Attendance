import { useState, useEffect } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
export type AddEmployeeForm = {
  fullName: string
  department: string
  position: string
  role: 'Nhân viên' | 'Quản trị viên'
  startDate: string
  email: string
  phone: string
  password: string
}

type FormErrors = Partial<Record<keyof AddEmployeeForm, string>>

export const departmentPositions = {
  "Phòng sản xuất": [
    "Quản đốc sản xuất",
    "Công nhân sản xuất",
    "Tổ trưởng sản xuất",
  ],
  "Phòng kho": [
    "Thủ kho",
    "Nhân viên kho",
  ],
  "Phòng kế toán": [
    "Kế toán trưởng",
    "Nhân viên kế toán",
  ],
  "Phòng kỹ thuật": [
    "Trưởng phòng kỹ thuật",
    "Nhân viên kỹ thuật",
    "Bảo trì máy móc",
  ],
};

const INITIAL_FORM: AddEmployeeForm = {
  fullName: '',
  department: 'Phòng sản xuất',
  position: 'Quản đốc sản xuất',
  role: 'Nhân viên',
  startDate: '',
  email: '',
  phone: '',
  password: '',
}

// ─── Validate ─────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form: AddEmployeeForm): FormErrors {
  const e: FormErrors = {}
  if (!form.fullName.trim())           e.fullName   = 'Vui lòng nhập họ tên.'
  if (!form.department)                e.department = 'Vui lòng chọn phòng ban.'
  if (!form.position)                  e.position   = 'Vui lòng chọn chức vụ.'
  if (!form.startDate)                 e.startDate  = 'Vui lòng chọn ngày vào làm.'
  
  if (!form.email.trim()) {
    e.email = 'Vui lòng nhập email.'
  } else if (!EMAIL_REGEX.test(form.email)) {
    e.email = 'Email không hợp lệ.'
  }
  
  const cleanPhone = form.phone.replace(/\s+/g, '')
  if (!form.phone.trim()) {
    e.phone = 'Vui lòng nhập số điện thoại.'
  } else if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
    e.phone = 'Số điện thoại không hợp lệ.'
  }
  
  if (!form.password.trim()) {
    e.password = 'Vui lòng nhập mật khẩu.'
  } else if (form.password.length < 6) {
    e.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
  }
  
  return e
}

// ─── Shared field styles ──────────────────────────────────────
function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: hasError ? '#ffdad6' : '#eff4ff',
    border: `1.5px solid ${hasError ? '#ba1a1a' : '#c4c5d5'}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    color: '#0b1c30',
    outline: 'none',
  }
}

// ─── Label component ──────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-sm font-semibold mb-1.5"
      style={{ color: '#0b1c30' }}
    >
      {children}
    </label>
  )
}

// ─── Error message ────────────────────────────────────────────
function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="text-xs mt-1 font-medium" style={{ color: '#ba1a1a' }}>
      {msg}
    </p>
  )
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (form: AddEmployeeForm) => void
}

// ─── AddEmployeeModal ─────────────────────────────────────────
export default function AddEmployeeModal({ isOpen, onClose, onSave }: Props) {
  const [form, setForm] = useState<AddEmployeeForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPw, setShowPw] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM)
      setErrors({})
      setShowPw(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── Field updater ────────────────────────────────────────────
  const set =
    (field: keyof AddEmployeeForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value
      if (field === 'department') {
        const dept = val as keyof typeof departmentPositions;
        setForm((f) => ({
          ...f,
          department: dept,
          position: departmentPositions[dept][0],
        }))
      } else {
        setForm((f) => ({ ...f, [field]: val }))
      }

      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

  // ── Focus / blur handlers ────────────────────────────────────
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#1e40af'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.12)'
    e.currentTarget.style.background = '#fff'
  }
  const onBlur =
    (field: keyof AddEmployeeForm) =>
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const hasErr = !!errors[field]
      e.currentTarget.style.borderColor = hasErr ? '#ba1a1a' : '#c4c5d5'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.background = hasErr ? '#ffdad6' : '#eff4ff'
    }

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
    handleClose()
  }

  // ── Close & reset ─────────────────────────────────────────────
  const handleClose = () => {
    setForm(INITIAL_FORM)
    setErrors({})
    setShowPw(false)
    onClose()
  }

  const deptList = Object.keys(departmentPositions) as Array<keyof typeof departmentPositions>;
  const posList = departmentPositions[form.department as keyof typeof departmentPositions] || [];

  return (
    /* ── Fullscreen Overlay ── */
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-fade-in"
      onClick={handleClose}
    >
      {/* ── Screen container ── */}
      <div
        className="w-full h-full flex flex-col overflow-hidden bg-white"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-8 py-5 shrink-0"
          style={{ borderBottom: '1px solid #e8eaf4', background: '#f8f9ff' }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
              Thêm nhân viên mới
            </h2>
            <p className="text-sm mt-0.5" style={{ color: '#444653' }}>
              Nhập thông tin nhân viên và thiết lập tài khoản truy cập hệ thống.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl transition-colors hover:bg-gray-200 ml-4 shrink-0 cursor-pointer"
            style={{ color: '#9da3b4' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-8 overflow-y-auto flex-1 bg-[#f0f2f5]">
          <div className="max-w-4xl mx-auto w-full bg-white rounded-2xl border border-[#e8eaf4] p-8 shadow-sm my-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Họ và tên */}
              <div>
                <Label>Họ và tên</Label>
                <input
                  style={inputStyle(!!errors.fullName)}
                  placeholder="Nhập họ và tên"
                  value={form.fullName}
                  onChange={set('fullName')}
                  onFocus={onFocus}
                  onBlur={onBlur('fullName')}
                />
                <ErrorMsg msg={errors.fullName} />
              </div>

              {/* Email */}
              <div>
                <Label>Email</Label>
                <input
                  style={inputStyle(!!errors.email)}
                  type="email"
                  placeholder="example@company.com"
                  value={form.email}
                  onChange={set('email')}
                  onFocus={onFocus}
                  onBlur={onBlur('email')}
                />
                <ErrorMsg msg={errors.email} />
              </div>

              {/* Phòng ban */}
              <div>
                <Label>Phòng ban</Label>
                <select
                  style={inputStyle(!!errors.department)}
                  value={form.department}
                  onChange={set('department')}
                  onFocus={onFocus}
                  onBlur={onBlur('department')}
                >
                  {deptList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.department} />
              </div>

              {/* Chức vụ */}
              <div>
                <Label>Chức vụ</Label>
                <select
                  style={inputStyle(!!errors.position)}
                  value={form.position}
                  onChange={set('position')}
                  onFocus={onFocus}
                  onBlur={onBlur('position')}
                >
                  {posList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ErrorMsg msg={errors.position} />
              </div>

              {/* Số điện thoại */}
              <div>
                <Label>Số điện thoại</Label>
                <input
                  style={inputStyle(!!errors.phone)}
                  type="tel"
                  placeholder="09xx xxx xxx"
                  value={form.phone}
                  onChange={set('phone')}
                  onFocus={onFocus}
                  onBlur={onBlur('phone')}
                />
                <ErrorMsg msg={errors.phone} />
              </div>

              {/* Quyền truy cập */}
              <div>
                <Label>Quyền truy cập</Label>
                <div
                  className="flex items-center gap-6 rounded-lg p-3"
                  style={{ background: '#eff4ff', border: '1.5px solid #c4c5d5' }}
                >
                  {(['Nhân viên', 'Quản trị viên'] as const).map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium"
                      style={{ color: '#0b1c30' }}
                    >
                      <input
                        type="radio"
                        name="modal-role"
                        value={r}
                        checked={form.role === r}
                        onChange={() => setForm((f) => ({ ...f, role: r }))}
                        className="w-4 h-4 accent-blue-700"
                      />
                      {r === 'Quản trị viên' ? 'Admin' : 'Employee'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <Label>Mật khẩu đăng nhập</Label>
                <div className="relative">
                  <input
                    style={{ ...inputStyle(!!errors.password), paddingRight: 44 }}
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    onFocus={onFocus}
                    onBlur={onBlur('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer"
                    style={{ color: '#9da3b4' }}
                    tabIndex={-1}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#444653' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#9da3b4' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <ErrorMsg msg={errors.password} />
              </div>

              {/* Ngày vào làm */}
              <div>
                <Label>Ngày vào làm</Label>
                <input
                  style={inputStyle(!!errors.startDate)}
                  type="date"
                  value={form.startDate}
                  onChange={set('startDate')}
                  onFocus={onFocus}
                  onBlur={onBlur('startDate')}
                />
                <ErrorMsg msg={errors.startDate} />
              </div>

            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-4 px-8 py-5 shrink-0"
          style={{ borderTop: '1px solid #e8eaf4', background: '#f8f9ff' }}
        >
          {/* Hủy */}
          <button
            onClick={handleClose}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer"
            style={{ background: '#fff', color: '#444653', border: '1.5px solid #c4c5d5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            Hủy bỏ
          </button>

          {/* Lưu */}
          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #00288e 100%)',
              boxShadow: '0 3px 10px rgba(0,40,142,0.28)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(135deg, #1e3a8a 0%, #001f6d 100%)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                'linear-gradient(135deg, #1e40af 0%, #00288e 100%)'
            }}
          >
            Lưu nhân viên
          </button>
        </div>

      </div>
    </div>
  )
}
