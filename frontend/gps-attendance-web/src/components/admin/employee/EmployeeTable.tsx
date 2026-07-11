import { Trash2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
export interface MockEmployee {
  id: string
  code: string
  fullName: string
  initials: string
  avatarColor: string
  department: string
  position: string
  phone: string
  email: string
  startDate: string
  role?: 'Nhân viên' | 'Quản trị viên'
}

interface Props {
  employees: MockEmployee[]
  onRowClick?: (emp: MockEmployee) => void
  onDelete?: (emp: MockEmployee) => void
}

const COLS = [
  'Mã NV',
  'Họ và tên',
  'Phòng ban',
  'Chức vụ',
  'Số điện thoại',
  'Email',
  'Ngày vào làm',
  'Thao tác',
]

// ─── EmployeeTable ─────────────────────────────────────────────
export default function EmployeeTable({ employees, onRowClick, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr style={{ background: '#f8f9ff', borderBottom: '2px solid #e8eaf4' }}>
            {COLS.map((col) => (
              <th
                key={col}
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap ${
                  col === 'Thao tác' ? 'text-right' : 'text-left'
                }`}
                style={{ color: '#444653' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {employees.length === 0 && (
            <tr>
              <td
                colSpan={COLS.length}
                className="px-4 py-16 text-center text-sm"
                style={{ color: '#9da3b4' }}
              >
                Không tìm thấy nhân viên phù hợp.
              </td>
            </tr>
          )}

          {employees.map((emp, idx) => (
            <tr
              key={emp.id}
              onClick={() => onRowClick?.(emp)}
              style={{
                borderBottom: idx < employees.length - 1 ? '1px solid #f1f3f9' : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = '#f0f5ff'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
              }}
              className="transition-colors duration-100 cursor-pointer"
            >
              {/* Mã NV */}
              <td className="px-4 py-3.5">
                <span className="text-sm font-bold" style={{ color: '#1e40af' }}>
                  {emp.code}
                </span>
              </td>

              {/* Họ và tên */}
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: '#eff6ff', color: '#1e40af' }}
                  >
                    {emp.initials}
                  </div>
                  <span className="font-semibold whitespace-nowrap" style={{ color: '#0b1c30' }}>
                    {emp.fullName}
                  </span>
                </div>
              </td>

              {/* Phòng ban */}
              <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: '#444653' }}>
                {emp.department}
              </td>

              {/* Chức vụ */}
              <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: '#444653' }}>
                {emp.position}
              </td>

              {/* Số điện thoại */}
              <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: '#444653' }}>
                {emp.phone}
              </td>

              {/* Email */}
              <td className="px-4 py-3.5" style={{ color: '#9da3b4' }}>
                {emp.email}
              </td>

              {/* Ngày vào làm */}
              <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: '#444653' }}>
                {emp.startDate}
              </td>

              {/* Thao tác */}
              <td className="px-4 py-3.5 text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(emp)
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center ml-auto transition-colors duration-150"
                  style={{ background: 'transparent', color: '#9da3b4' }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = '#fee2e2'
                    el.style.color = '#dc2626'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.background = 'transparent'
                    el.style.color = '#9da3b4'
                  }}
                  title="Xóa nhân viên"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
