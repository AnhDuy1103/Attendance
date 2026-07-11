import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, Filter, Plus, ChevronLeft, ChevronRight, Check, AlertCircle, X, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import EmployeeTable, { type MockEmployee } from '../../components/admin/employee/EmployeeTable'
import { employeeApi, EmployeeResponse } from '../../api/employeeApi'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const departmentPositions = {
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

const inputStyle = (hasError: boolean): React.CSSProperties => {
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

// ─── Pagination Button ────────────────────────────────────────
function PageBtn({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: active ? '#1e40af' : '#fff',
        color: active ? '#fff' : '#444653',
        border: active ? 'none' : '1.5px solid #c4c5d5',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled)
          (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff'
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled)
          (e.currentTarget as HTMLButtonElement).style.background = '#fff'
      }}
    >
      {label}
    </button>
  )
}

// ─── EmployeeManagementPage ───────────────────────────────────
export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeResponse[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [toastMessage, setToastMessage] = useState("")

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeResponse | null>(null)
  const [selectedDeleteEmployee, setSelectedDeleteEmployee] = useState<EmployeeResponse | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5

  // --- Form States for Adding ---
  const [addForm, setAddForm] = useState({
    fullName: '',
    department: 'Phòng sản xuất',
    position: 'Quản đốc sản xuất',
    role: 'Nhân viên' as 'Nhân viên' | 'Quản trị viên',
    startDate: '',
    email: '',
    phone: '',
    password: '',
  })
  const [addErrors, setAddErrors] = useState<Partial<Record<string, string>>>({})
  const [showAddPw, setShowAddPw] = useState(false)

  // --- Form States for Editing ---
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: 'Phòng sản xuất',
    position: 'Quản đốc sản xuất',
    role: 'Nhân viên' as 'Nhân viên' | 'Quản trị viên',
    startDate: '',
    email: '',
    phone: '',
    password: '',
  })
  const [editErrors, setEditErrors] = useState<Partial<Record<string, string>>>({})
  const [showEditPw, setShowEditPw] = useState(false)

  // --- Background Scroll Lock ---
  useEffect(() => {
    if (isAddModalOpen || isEditModalOpen || isDeleteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isAddModalOpen, isEditModalOpen, isDeleteModalOpen]);

  // ─── Fetch Employees ───
  const fetchEmployees = async () => {
    try {
      setErrorMessage("")
      const response = await employeeApi.getAll()
      const list = response.data?.data?.items || []
      setEmployees(list)
      setFilteredEmployees(list)
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        "Không thể tải danh sách nhân viên"
      setErrorMessage(message)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // ─── Search Filter ───
  useEffect(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) {
      setFilteredEmployees(employees)
      setCurrentPage(1)
      return
    }

    const result = employees.filter((item) => {
      return (
        item.employeeCode?.toLowerCase().includes(keyword) ||
        item.fullName?.toLowerCase().includes(keyword) ||
        item.department?.toLowerCase().includes(keyword) ||
        item.position?.toLowerCase().includes(keyword) ||
        item.phoneNumber?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword)
      )
    })

    setFilteredEmployees(result)
    setCurrentPage(1)
  }, [searchTerm, employees])

  // ─── Helpers ───
  const getInitials = (name: string) => {
    if (!name) return "NV";
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 1) return words[0][0].toUpperCase();
    return words
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const triggerToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(""), 3000)
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#1e40af'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.12)'
    e.currentTarget.style.background = '#fff'
  }
  const onBlur =
    (hasError: boolean) =>
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = hasError ? '#ba1a1a' : '#c4c5d5'
      e.currentTarget.style.boxShadow = 'none'
      e.currentTarget.style.background = hasError ? '#ffdad6' : '#eff4ff'
    }

  // ─── Validation ───
  const validateAddForm = () => {
    const e: Partial<Record<string, string>> = {}
    if (!addForm.fullName.trim())           e.fullName   = 'Vui lòng nhập họ tên.'
    if (!addForm.department)                e.department = 'Vui lòng chọn phòng ban.'
    if (!addForm.position)                  e.position   = 'Vui lòng chọn chức vụ.'
    if (!addForm.startDate)                 e.startDate  = 'Vui lòng chọn ngày vào làm.'
    else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(addForm.startDate) > today) {
        e.startDate = 'Ngày vào làm không được lớn hơn ngày hôm nay.';
      }
    }
    
    if (!addForm.email.trim()) {
      e.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_REGEX.test(addForm.email)) {
      e.email = 'Email không hợp lệ.'
    }
    
    const cleanPhone = addForm.phone.replace(/\s+/g, '')
    if (!addForm.phone.trim()) {
      e.phone = 'Vui lòng nhập số điện thoại.'
    } else if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
      e.phone = 'Số điện thoại không hợp lệ.'
    }
    
    if (!addForm.password.trim()) {
      e.password = 'Vui lòng nhập mật khẩu.'
    } else if (addForm.password.length < 6) {
      e.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    }
    
    setAddErrors(e)
    return Object.keys(e).length === 0
  }

  const validateEditForm = () => {
    const e: Partial<Record<string, string>> = {}
    if (!editForm.fullName.trim())           e.fullName   = 'Vui lòng nhập họ và tên.'
    if (!editForm.department)                e.department = 'Vui lòng chọn phòng ban.'
    if (!editForm.position)                  e.position   = 'Vui lòng chọn chức vụ.'
    if (!editForm.startDate)                 e.startDate  = 'Vui lòng chọn ngày vào làm.'
    else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(editForm.startDate) > today) {
        e.startDate = 'Ngày vào làm không được lớn hơn ngày hôm nay.';
      }
    }
    
    if (!editForm.email.trim()) {
      e.email = 'Vui lòng nhập email.'
    } else if (!EMAIL_REGEX.test(editForm.email)) {
      e.email = 'Email không hợp lệ.'
    }
    
    const cleanPhone = editForm.phone.replace(/\s+/g, '')
    if (!editForm.phone.trim()) {
      e.phone = 'Vui lòng nhập số điện thoại.'
    } else if (cleanPhone.length !== 10 || !/^\d+$/.test(cleanPhone)) {
      e.phone = 'Số điện thoại không hợp lệ.'
    }
    
    if (editForm.password && editForm.password.trim() !== '') {
      if (editForm.password.length < 6) {
        e.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
      }
    }
    
    setEditErrors(e)
    return Object.keys(e).length === 0
  }

  // ─── Handlers ───
  const handleOpenAddModal = () => {
    setAddForm({
      fullName: '',
      department: 'Phòng sản xuất',
      position: 'Quản đốc sản xuất',
      role: 'Nhân viên',
      startDate: '',
      email: '',
      phone: '',
      password: '',
    })
    setAddErrors({})
    setShowAddPw(false)
    setIsAddModalOpen(true)
  }

  const handleCreateEmployee = async () => {
    if (!validateAddForm()) return

    try {
      setErrorMessage("")

      const payload = {
        fullName: addForm.fullName,
        email: addForm.email,
        department: addForm.department,
        position: addForm.position,
        phoneNumber: addForm.phone,
        role: addForm.role === 'Quản trị viên' ? 'Admin' as const : 'Employee' as const,
        password: addForm.password,
        joinDate: addForm.startDate,
      }

      await employeeApi.create(payload)
      triggerToast("Thêm nhân viên thành công")
      setIsAddModalOpen(false)
      await fetchEmployees()
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        "Không thể thêm nhân viên"
      setErrorMessage(message)
    }
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return
    if (!validateEditForm()) return

    try {
      setErrorMessage("")

      const payload: any = {
        fullName: editForm.fullName,
        email: editForm.email,
        department: editForm.department,
        position: editForm.position,
        phoneNumber: editForm.phone,
        role: editForm.role === 'Quản trị viên' ? 'Admin' as const : 'Employee' as const,
        joinDate: editForm.startDate,
        employeeStatus: selectedEmployee.employeeStatus,
        isActive: selectedEmployee.isActive,
      }

      if (editForm.password.trim()) {
        payload.password = editForm.password
      }

      await employeeApi.update(selectedEmployee.employeeId, payload)
      triggerToast("Cập nhật nhân viên thành công")
      setIsEditModalOpen(false)
      setSelectedEmployee(null)
      await fetchEmployees()
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        "Không thể cập nhật nhân viên"
      setErrorMessage(message)
    }
  }

  const handleRowClick = (emp: MockEmployee) => {
    const original = employees.find(e => e.employeeId.toString() === emp.id)
    if (original) {
      setSelectedEmployee(original)
      
      let formattedDate = ''
      if (original.joinDate) {
        const dateObj = new Date(original.joinDate)
        if (!Number.isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0]
        }
      }

      setEditForm({
        fullName: original.fullName,
        department: original.department || 'Phòng sản xuất',
        position: original.position || 'Quản đốc sản xuất',
        role: original.role === 'Admin' ? 'Quản trị viên' : 'Nhân viên',
        startDate: formattedDate,
        email: original.email || '',
        phone: original.phoneNumber || '',
        password: '',
      })
      setEditErrors({})
      setShowEditPw(false)
      setIsEditModalOpen(true)
    }
  }

  const handleOpenDeleteModal = (emp: MockEmployee) => {
    const original = employees.find(e => e.employeeId.toString() === emp.id)
    if (original) {
      setSelectedDeleteEmployee(original)
      setIsDeleteModalOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedDeleteEmployee) return

    try {
      setErrorMessage("")

      await employeeApi.remove(selectedDeleteEmployee.employeeId)
      triggerToast("Xóa nhân viên thành công")
      setIsDeleteModalOpen(false)
      setSelectedDeleteEmployee(null)
      await fetchEmployees()
    } catch (error: any) {
      console.error(error)
      const message =
        error?.response?.data?.message ||
        "Không thể xóa nhân viên"
      setErrorMessage(message)
    }
  }

  // ─── Pagination Math ───
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1
  const paginatedEmployees = useMemo(() => {
    return filteredEmployees.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    )
  }, [filteredEmployees, currentPage])

  const tableData = useMemo(() => {
    return paginatedEmployees.map((emp) => ({
      id: emp.employeeId.toString(),
      code: emp.employeeCode,
      fullName: emp.fullName,
      initials: getInitials(emp.fullName),
      avatarColor: '#1e40af',
      department: emp.department || "--",
      position: emp.position || "--",
      phone: emp.phoneNumber,
      email: emp.email,
      startDate: formatDate(emp.joinDate),
      role: emp.role === 'Admin' ? 'Quản trị viên' as const : 'Nhân viên' as const,
    }))
  }, [paginatedEmployees])

  const start = filteredEmployees.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, filteredEmployees.length)

  // ─── Modals Render Portals ───

  const renderAddEmployeeModal = () => {
    if (!isAddModalOpen) return null;

    const deptList = Object.keys(departmentPositions) as Array<keyof typeof departmentPositions>;
    const posList = departmentPositions[addForm.department as keyof typeof departmentPositions] || [];

    const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dept = e.target.value as keyof typeof departmentPositions;
      setAddForm(prev => ({
        ...prev,
        department: dept,
        position: departmentPositions[dept][0]
      }))
      if (addErrors.department) setAddErrors(prev => ({ ...prev, department: undefined }))
    };

    const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setAddForm(prev => ({ ...prev, [field]: val }));
      if (addErrors[field]) setAddErrors(prev => ({ ...prev, [field]: undefined }));
    };

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483647] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setIsAddModalOpen(false)}
      >
        <div
          className="w-full max-w-4xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header modal */}
          <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Thêm nhân viên
              </h2>
              <p className="text-gray-500 mt-1">
                Nhập thông tin nhân viên và tài khoản đăng nhập cho hệ thống.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body modal */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {errorMessage && (
              <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200 mb-6">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-xs font-semibold">{errorMessage}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Họ và tên */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Họ và tên</label>
                <input
                  style={inputStyle(!!addErrors.fullName)}
                  placeholder="Nhập họ và tên"
                  value={addForm.fullName}
                  onChange={handleFieldChange('fullName')}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.fullName)}
                  autoComplete="off"
                />
                {addErrors.fullName && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                <input
                  style={inputStyle(!!addErrors.email)}
                  type="email"
                  placeholder="example@company.com"
                  value={addForm.email}
                  onChange={handleFieldChange('email')}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.email)}
                  autoComplete="off"
                />
                {addErrors.email && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.email}</p>}
              </div>

              {/* Phòng ban */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Phòng ban</label>
                <select
                  style={inputStyle(!!addErrors.department)}
                  value={addForm.department}
                  onChange={handleDeptChange}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.department)}
                >
                  {deptList.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {addErrors.department && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.department}</p>}
              </div>

              {/* Chức vụ */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Chức vụ</label>
                <select
                  style={inputStyle(!!addErrors.position)}
                  value={addForm.position}
                  onChange={handleFieldChange('position')}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.position)}
                >
                  {posList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                {addErrors.position && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.position}</p>}
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Số điện thoại</label>
                <input
                  style={inputStyle(!!addErrors.phone)}
                  type="tel"
                  placeholder="09xx xxx xxx"
                  value={addForm.phone}
                  onChange={handleFieldChange('phone')}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.phone)}
                  autoComplete="off"
                />
                {addErrors.phone && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.phone}</p>}
              </div>

              {/* Quyền truy cập */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Quyền truy cập</label>
                <div
                  className="flex items-center gap-6 rounded-lg p-3"
                  style={{ background: '#eff4ff', border: '1.5px solid #c4c5d5' }}
                >
                  {(['Nhân viên', 'Quản trị viên'] as const).map((r) => (
                    <label
                      key={r}
                      className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-800"
                    >
                      <input
                        type="radio"
                        name="add-modal-role"
                        value={r}
                        checked={addForm.role === r}
                        onChange={() => setAddForm(prev => ({ ...prev, role: r }))}
                        className="w-4 h-4 accent-blue-700"
                      />
                      {r === 'Quản trị viên' ? 'Admin' : 'Employee'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mật khẩu đăng nhập</label>
                <div className="relative">
                  <input
                    style={{ ...inputStyle(!!addErrors.password), paddingRight: 44 }}
                    type={showAddPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={addForm.password}
                    onChange={handleFieldChange('password')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!addErrors.password)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPw(!showAddPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showAddPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {addErrors.password && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.password}</p>}
              </div>

              {/* Ngày vào làm */}
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-700">Ngày vào làm</label>
                <input
                  style={inputStyle(!!addErrors.startDate)}
                  type="date"
                  value={addForm.startDate}
                  onChange={handleFieldChange('startDate')}
                  onFocus={onFocus}
                  onBlur={onBlur(!!addErrors.startDate)}
                  max={new Date().toISOString().split('T')[0]}
                />
                {addErrors.startDate && <p className="text-xs mt-1 font-medium text-red-600">{addErrors.startDate}</p>}
              </div>
            </div>
          </div>

          {/* Footer modal */}
          <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="button"
              onClick={handleCreateEmployee}
              className="px-8 py-3 rounded-xl bg-[#00288e] text-white font-semibold shadow-lg shadow-[#00288e]/20 hover:bg-[#002070] transition-all cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderEditEmployeeModal = () => {
    if (!isEditModalOpen || !selectedEmployee) return null;

    const deptList = Object.keys(departmentPositions) as Array<keyof typeof departmentPositions>;
    const posList = departmentPositions[editForm.department as keyof typeof departmentPositions] || [];

    const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const dept = e.target.value as keyof typeof departmentPositions;
      setEditForm(prev => ({
        ...prev,
        department: dept,
        position: departmentPositions[dept]?.[0] || ''
      }))
      if (editErrors.department) setEditErrors(prev => ({ ...prev, department: undefined }))
    };

    const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value;
      setEditForm(prev => ({ ...prev, [field]: val }));
      if (editErrors[field]) setEditErrors(prev => ({ ...prev, [field]: undefined }));
    };

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483647] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setIsEditModalOpen(false)}
      >
        <div
          className="w-full max-w-5xl max-h-[90dvh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header modal */}
          <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Chỉnh sửa thông tin nhân viên
              </h2>
              <p className="text-gray-500 mt-1">
                Cập nhật thông tin chi tiết và cài đặt quyền của nhân viên {selectedEmployee.fullName}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body modal */}
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              {errorMessage && (
                <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200 mb-6">
                  <AlertCircle size={16} className="shrink-0" />
                  <p className="text-xs font-semibold">{errorMessage}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Họ và tên */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Họ và tên</label>
                  <input
                    style={inputStyle(!!editErrors.fullName)}
                    placeholder="Nhập họ và tên"
                    value={editForm.fullName}
                    onChange={handleFieldChange('fullName')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.fullName)}
                  />
                  {editErrors.fullName && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.fullName}</p>}
                </div>

                {/* Phòng ban */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Phòng ban</label>
                  <select
                    style={inputStyle(!!editErrors.department)}
                    value={editForm.department}
                    onChange={handleDeptChange}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.department)}
                  >
                    {deptList.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {editErrors.department && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.department}</p>}
                </div>

                {/* Chức vụ */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Chức vụ</label>
                  <select
                    style={inputStyle(!!editErrors.position)}
                    value={editForm.position}
                    onChange={handleFieldChange('position')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.position)}
                  >
                    {posList.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  {editErrors.position && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.position}</p>}
                </div>

                {/* Quyền truy cập */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Quyền truy cập</label>
                  <div
                    className="flex items-center gap-6 rounded-lg p-3"
                    style={{ background: '#eff4ff', border: '1.5px solid #c4c5d5' }}
                  >
                    {(['Nhân viên', 'Quản trị viên'] as const).map((r) => (
                      <label
                        key={r}
                        className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-gray-800"
                      >
                        <input
                          type="radio"
                          name="edit-modal-role"
                          value={r}
                          checked={editForm.role === r}
                          onChange={() => setEditForm(prev => ({ ...prev, role: r }))}
                          className="w-4 h-4 accent-blue-700"
                        />
                        {r === 'Quản trị viên' ? 'Admin' : 'Employee'}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ngày vào làm */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Ngày vào làm</label>
                  <input
                    style={inputStyle(!!editErrors.startDate)}
                    type="date"
                    value={editForm.startDate}
                    onChange={handleFieldChange('startDate')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.startDate)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {editErrors.startDate && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.startDate}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Email</label>
                  <input
                    style={inputStyle(!!editErrors.email)}
                    type="email"
                    placeholder="example@company.com"
                    value={editForm.email}
                    onChange={handleFieldChange('email')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.email)}
                  />
                  {editErrors.email && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.email}</p>}
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Số điện thoại</label>
                  <input
                    style={inputStyle(!!editErrors.phone)}
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={editForm.phone}
                    onChange={handleFieldChange('phone')}
                    onFocus={onFocus}
                    onBlur={onBlur(!!editErrors.phone)}
                  />
                  {editErrors.phone && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.phone}</p>}
                </div>

                {/* Mật khẩu */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-gray-700">Mật khẩu đăng nhập</label>
                  <div className="relative">
                    <input
                      style={{ ...inputStyle(!!editErrors.password), paddingRight: 44 }}
                      type={showEditPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={editForm.password}
                      onChange={handleFieldChange('password')}
                      onFocus={onFocus}
                      onBlur={onBlur(!!editErrors.password)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPw(!showEditPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showEditPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs mt-1.5 text-gray-500">
                    Để trống nếu không muốn thay đổi mật khẩu
                  </p>
                  {editErrors.password && <p className="text-xs mt-1 font-medium text-red-600">{editErrors.password}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Footer modal */}
          <div className="flex items-center justify-end gap-4 px-8 py-5 border-t border-gray-200 bg-white shrink-0">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleUpdateEmployee}
              className="px-8 py-3 rounded-xl bg-[#00288e] text-white font-semibold shadow-lg shadow-[#00288e]/20 hover:bg-[#002070] transition-all cursor-pointer"
            >
              Cập nhật nhân viên
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const renderDeleteEmployeeModal = () => {
    if (!isDeleteModalOpen || !selectedDeleteEmployee) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483647] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setIsDeleteModalOpen(false)}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden bg-white animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-6 shrink-0 border-b border-gray-200"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-red-100 text-red-600"
            >
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Xác nhận xóa
            </h2>
          </div>

          {/* Body */}
          <div className="p-6 bg-white">
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Hành động này không thể hoàn tác.
            </p>
            
            <div
              className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50"
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1 text-gray-400">
                Nhân viên đang chọn:
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {selectedDeleteEmployee.fullName} - {selectedDeleteEmployee.employeeCode}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 shrink-0 border-t border-gray-100 bg-gray-50"
          >
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer"
            >
              Hủy
            </button>

            <button
              onClick={handleConfirmDelete}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] cursor-pointer bg-red-600 hover:bg-red-700 shadow-md shadow-red-600/10"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="page-container animate-fade-in space-y-5" style={{ maxWidth: '100%' }}>

        {errorMessage && (
          <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          style={{
            background: '#fff',
            border: '1px solid #e8eaf4',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {/* Search input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#9da3b4' }}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã, họ tên hoặc phòng ban..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
              style={{ background: '#f8f9ff', border: '1.5px solid #e8eaf4', color: '#0b1c30' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1e40af'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(30,64,175,0.08)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e8eaf4'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => alert('Chức năng bộ lọc sẽ được phát triển sau.')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer"
              style={{ border: '1.5px solid #c4c5d5', background: '#fff', color: '#444653' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f8f9ff'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fff'
              }}
            >
              <Filter size={15} />
              Bộ lọc
            </button>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #1e40af 0%, #00288e 100%)',
                boxShadow: '0 3px 10px rgba(0,40,142,0.25)',
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
              <Plus size={15} />
              Thêm nhân viên
            </button>
          </div>
        </div>

        {/* ── Employee Table Card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: '#fff',
            border: '1px solid #e8eaf4',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          {/* Card header */}
          <div
            className="px-6 py-5"
            style={{ borderBottom: '1px solid #e8eaf4' }}
          >
            <h2 className="text-base font-bold" style={{ color: '#0b1c30' }}>
              Danh sách nhân viên
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#9da3b4' }}>
              {searchTerm.trim()
                ? `${filteredEmployees.length} kết quả tìm kiếm`
                : `Tổng ${employees.length} nhân viên`}
            </p>
          </div>

          {/* Table */}
          <EmployeeTable 
            employees={tableData} 
            onRowClick={handleRowClick}
            onDelete={handleOpenDeleteModal} 
          />

          {/* ── Pagination ── */}
          {filteredEmployees.length > 0 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4"
              style={{ borderTop: '1px solid #e8eaf4' }}
            >
              <p className="text-xs" style={{ color: '#9da3b4' }}>
                Hiển thị {start} - {end} của {filteredEmployees.length} nhân viên
              </p>

              <div className="flex items-center gap-1.5">
                <PageBtn
                  label={<ChevronLeft size={14} />}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1
                  return (
                    <PageBtn
                      key={p}
                      label={p}
                      active={currentPage === p}
                      onClick={() => setCurrentPage(p)}
                    />
                  )
                })}
                <PageBtn
                  label={<ChevronRight size={14} />}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {renderAddEmployeeModal()}
      {renderEditEmployeeModal()}
      {renderDeleteEmployeeModal()}

      {/* ── Toast Message ── */}
      {toastMessage && (
        <div
          className="fixed top-20 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border bg-white animate-fade-in-up"
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
    </>
  )
}
