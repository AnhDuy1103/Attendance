import { X, FileText } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
export type AttendanceStatus =
  | 'Đúng giờ'
  | 'Đi trễ'
  | 'Vắng mặt'
  | 'Tăng ca'
  | 'Quên check-out'

export interface AttendanceRecord {
  id: string
  employeeCode: string
  employeeName: string
  initials: string
  department: string
  date: string
  checkInTime: string
  checkOutTime: string
  totalHours: string
  overtime: string
  location: string
  statuses: AttendanceStatus[]
  note: string
  checkInCoordinate?: string
  checkOutCoordinate?: string
}

interface Props {
  isOpen: boolean
  attendance: AttendanceRecord | null
  onClose: () => void
  onApprove: (id: string) => void
}

// ─── Badge Config ─────────────────────────────────────────────
export const STATUS_CONFIG: Record<AttendanceStatus, { bg: string; text: string; dot?: string }> = {
  'Đúng giờ':       { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  'Đi trễ':         { bg: '#ffedd5', text: '#c2410c', dot: '#ea580c' },
  'Vắng mặt':       { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
  'Tăng ca':        { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  'Quên check-out': { bg: '#ede9fe', text: '#6d28d9', dot: '#8b5cf6' },
}

// ─── AttendanceDetailModal ───────────────────────────────────
export default function AttendanceDetailModal({ isOpen, attendance, onClose, onApprove }: Props) {
  if (!isOpen || !attendance) return null

  const isForgotCheckOut = attendance.statuses.includes('Quên check-out')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-xl flex flex-col overflow-hidden animate-fade-in-up"
        style={{ background: '#fff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between p-5 shrink-0"
          style={{ borderBottom: '1px solid #e8eaf4' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#eff6ff', color: '#1e40af' }}
            >
              <FileText size={20} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#0b1c30' }}>
              Chi tiết chấm công
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: '#9da3b4' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>
          
          {/* Employee Info */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{ background: '#1e40af' }}
            >
              {attendance.initials}
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: '#0b1c30' }}>
                {attendance.employeeName}
              </p>
              <p className="text-sm mt-0.5 font-medium" style={{ color: '#444653' }}>
                {attendance.department} • {attendance.date}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Giờ vào */}
            <div
              className="p-4 rounded-xl"
              style={{ background: '#f8f9ff', border: '1px solid #e8eaf4' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9da3b4' }}>
                Giờ vào
              </p>
              <p className="text-lg font-bold" style={{ color: '#0b1c30' }}>
                {attendance.checkInTime}
              </p>
              <p className="text-xs mt-1" style={{ color: '#444653' }}>
                Tọa độ: {attendance.checkInCoordinate || '15.879440, 108.335000'}
              </p>
            </div>

            {/* Giờ ra */}
            <div
              className="p-4 rounded-xl"
              style={{ background: '#f8f9ff', border: '1px solid #e8eaf4' }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9da3b4' }}>
                Giờ ra
              </p>
              <p className="text-lg font-bold" style={{ color: isForgotCheckOut ? '#ea580c' : '#0b1c30' }}>
                {isForgotCheckOut ? 'Chờ quản trị duyệt' : attendance.checkOutTime}
              </p>
              <p className="text-xs mt-1" style={{ color: '#444653' }}>
                Tọa độ: {isForgotCheckOut ? '--' : (attendance.checkOutCoordinate || '--')}
              </p>
            </div>

            {/* Vị trí */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold mb-1" style={{ color: '#9da3b4' }}>Vị trí chấm công</p>
              <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>{attendance.location}</p>
            </div>

            {/* Tổng giờ */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#9da3b4' }}>Tổng giờ</p>
              <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>{attendance.totalHours}</p>
            </div>

            {/* Tăng ca */}
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#9da3b4' }}>Tăng ca</p>
              <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>{attendance.overtime}</p>
            </div>

            {/* Trạng thái */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold mb-1.5" style={{ color: '#9da3b4' }}>Trạng thái</p>
              <div className="flex flex-wrap gap-2">
                {attendance.statuses.map((s) => {
                  const cfg = STATUS_CONFIG[s]
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: cfg.bg, color: cfg.text }}
                    >
                      {s}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* Ghi chú */}
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold mb-1" style={{ color: '#9da3b4' }}>Ghi chú</p>
              <p className="text-sm font-medium" style={{ color: isForgotCheckOut ? '#ea580c' : '#0b1c30' }}>
                {isForgotCheckOut ? 'Cần quản trị duyệt' : attendance.note}
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-end gap-3 p-5 shrink-0"
          style={{ borderTop: '1px solid #e8eaf4', background: '#f8f9ff' }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
            style={{ background: '#fff', color: '#444653', border: '1px solid #c4c5d5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            Đóng
          </button>

          {isForgotCheckOut && (
            <button
              onClick={() => {
                onApprove(attendance.id)
                onClose()
              }}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98]"
              style={{ background: '#ea580c', boxShadow: '0 1px 3px rgba(234,88,12,0.3)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
            >
              Duyệt giờ ra
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
