import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart2,
  Settings,
  UserCircle,
  LogOut,
} from 'lucide-react'
import { ROUTES, STORAGE_KEYS } from '../../utils/constants'

// ─── Admin Sidebar ────────────────────────────────────────────

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.ADMIN.DASHBOARD, icon: <LayoutDashboard size={20} /> },
  { label: 'Quản lý Nhân viên', path: ROUTES.ADMIN.EMPLOYEES, icon: <Users size={20} /> },
  { label: 'Lịch sử Chấm công', path: ROUTES.ADMIN.ATTENDANCE_HISTORY, icon: <ClipboardList size={20} /> },
  { label: 'Báo cáo', path: ROUTES.ADMIN.REPORTS, icon: <BarChart2 size={20} /> },
  { label: 'Cài đặt', path: ROUTES.ADMIN.SETTINGS, icon: <Settings size={20} /> },
  { label: 'Tài khoản', path: ROUTES.ADMIN.ACCOUNT, icon: <UserCircle size={20} /> },
]

export default function AdminSidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    navigate(ROUTES.LOGIN)
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo justify-center">
        <img
          src="/quanghoaaa.png"
          alt="Quang Hoa Logo"
          style={{ width: 140, height: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
