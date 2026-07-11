import { NavLink } from 'react-router-dom'
import { Home, MapPin, History, User } from 'lucide-react'

// ─── Employee Bottom Navigation ───────────────────────────────

const navItems = [
  {
    label: 'Trang chủ',
    path: '/employee/home',
    icon: Home,
  },
  {
    label: 'Chấm công',
    path: '/employee/check-attendance',
    icon: MapPin,
  },
  {
    label: 'Lịch sử',
    path: '/employee/history',
    icon: History,
  },
  {
    label: 'Tài khoản',
    path: '/employee/account',
    icon: User,
  },
]

export default function EmployeeBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] border-t border-[#c4c5d5]/20 rounded-t-2xl">
      <div className="max-w-md mx-auto flex items-center justify-between px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-1/4 py-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#eff4ff] text-[#00288e]'
                    : 'text-[#9da3b4] hover:bg-[#f8f9ff]'
                }`
              }
            >
              <Icon size={22} className="mb-1" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
