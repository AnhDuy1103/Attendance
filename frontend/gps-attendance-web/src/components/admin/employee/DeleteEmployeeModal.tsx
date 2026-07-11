import { AlertTriangle } from 'lucide-react'
import { type MockEmployee } from './EmployeeTable'

interface Props {
  isOpen: boolean
  employee: MockEmployee | null
  onClose: () => void
  onConfirm: (employee: MockEmployee) => void
}

export default function DeleteEmployeeModal({ isOpen, employee, onClose, onConfirm }: Props) {
  if (!isOpen || !employee) return null

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Modal container */}
      <div
        className="w-full max-w-md rounded-xl shadow-xl flex flex-col overflow-hidden animate-fade-in-up"
        style={{ background: '#ffffff', border: '1px solid #e8eaf4' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 p-6 shrink-0"
          style={{ borderBottom: '1px solid #e8eaf4' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#fee2e2', color: '#dc2626' }}
          >
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#0b1c30' }}>
            Xác nhận xóa
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm" style={{ color: '#444653' }}>
            Bạn có chắc chắn muốn xóa nhân viên này khỏi hệ thống? Hành động này không thể hoàn tác.
          </p>
          
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ background: '#f8f9ff', border: '1px solid #e8eaf4' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#9da3b4' }}>
              Nhân viên đang chọn:
            </p>
            <p className="text-sm font-medium" style={{ color: '#0b1c30' }}>
              {employee.fullName} - {employee.code}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 p-6 shrink-0"
          style={{ background: '#f8f9ff', borderTop: '1px solid #e8eaf4' }}
        >
          {/* Nút Hủy */}
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
            style={{ background: '#fff', color: '#444653', border: '1px solid #c4c5d5' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
          >
            Hủy
          </button>

          {/* Nút Xác nhận */}
          <button
            onClick={() => onConfirm(employee)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98]"
            style={{ background: '#dc2626', boxShadow: '0 1px 3px rgba(220,38,38,0.2)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  )
}
