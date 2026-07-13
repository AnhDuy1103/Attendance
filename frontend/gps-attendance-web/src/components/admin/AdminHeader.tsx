import { useLocation } from 'react-router-dom'
import { Bell, ChevronDown } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan hệ thống',
  '/admin/employees': 'Quản lý nhân viên',
  '/admin/attendance-history': 'Lịch sử chấm công',
  '/admin/reports': 'Báo cáo',
  '/admin/settings': 'Cài đặt',
  '/admin/account': 'Tài khoản',
}

interface AdminHeaderProps {
  adminName?: string
}

export default function AdminHeader({ adminName = 'Admin Quang Hoa' }: AdminHeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Quang Hoa Admin'
  const initial = adminName.trim().split(' ').at(-1)?.charAt(0) || 'A'

  return (
    <header className="admin-header">
      <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Thông báo"
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold select-none">
            {initial}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">{adminName}</p>
            <p className="text-[11px] text-gray-400">Quản trị viên</p>
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  )
}
