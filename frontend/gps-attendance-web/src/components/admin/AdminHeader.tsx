import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Check, X } from 'lucide-react'
import { accountApi } from '../../api/accountApi'
import { deviceApprovalApi, DeviceRequest } from '../../api/deviceApprovalApi'

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Tổng quan hệ thống',
  '/admin/employees': 'Quản lý nhân viên',
  '/admin/attendance-history': 'Lịch sử chấm công',
  '/admin/reports': 'Báo cáo',
  '/admin/settings': 'Cài đặt',
  '/admin/account': 'Tài khoản',
}

type HeaderUser = {
  fullName: string
  role: string
}

// ─── Helpers ──────────────────────────────────────────────────
const getStoredUser = (): HeaderUser | null => {
  try {
    const rawUser = localStorage.getItem('user')
    if (!rawUser) return null
    const parsedUser = JSON.parse(rawUser)
    return {
      fullName: parsedUser.fullName || parsedUser.name || parsedUser.userName || '',
      role: parsedUser.role || '',
    }
  } catch {
    return null
  }
}

const getInitials = (fullName?: string): string => {
  if (!fullName?.trim()) return 'U'
  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return words
    .slice(-3)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

const getRoleLabel = (role?: string): string => {
  const normalizedRole = String(role || '').toLowerCase()
  if (normalizedRole === 'admin') {
    return 'Quản trị viên'
  }
  if (normalizedRole === 'employee') {
    return 'Nhân viên'
  }
  return role || ''
}

interface AdminHeaderProps {
  adminName?: string
}

export default function AdminHeader({ adminName }: AdminHeaderProps) {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Quang Hoa Admin'

  const [headerUser, setHeaderUser] = useState<HeaderUser>({
    fullName: adminName || '',
    role: '',
  })
  const [deviceRequests, setDeviceRequests] = useState<DeviceRequest[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const loadDeviceRequests = async () => {
    try { setDeviceRequests(await deviceApprovalApi.getPending()) } catch { /* ignore notification errors */ }
  }

  // ── Load User ───────────────────────────────────────────────
  const fetchCurrentUser = async () => {
    try {
      const data = await accountApi.getMyProfile()
      const nextUser = {
        fullName: data.fullName || '',
        role: data.role || '',
      }
      setHeaderUser(nextUser)

      const currentStoredUser = JSON.parse(localStorage.getItem('user') || '{}')
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...currentStoredUser,
          ...data,
        })
      )
    } catch {
      // Fallback read from localStorage
      const storedUser = getStoredUser()
      if (storedUser) {
        setHeaderUser(storedUser)
      }
    }
  }

  useEffect(() => {
    // Thu tu: Doc localStorage truoc de co du lieu ngay
    const stored = getStoredUser()
    if (stored) {
      setHeaderUser(stored)
    }
    // Sau do goi API lay du lieu moi nhat
    fetchCurrentUser()
    loadDeviceRequests()
    const timer = window.setInterval(loadDeviceRequests, 30000)
    return () => window.clearInterval(timer)
  }, [])

  // ── Sync profile update ─────────────────────────────────────
  useEffect(() => {
    const handleUserProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<HeaderUser>
      if (customEvent.detail) {
        setHeaderUser({
          fullName: customEvent.detail.fullName || '',
          role: customEvent.detail.role || '',
        })
      }
    }

    window.addEventListener('user-profile-updated', handleUserProfileUpdated)
    return () => {
      window.removeEventListener('user-profile-updated', handleUserProfileUpdated)
    }
  }, [])

  // ── Sync storage tabs ───────────────────────────────────────
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== 'user') return
      const storedUser = getStoredUser()
      if (storedUser) {
        setHeaderUser(storedUser)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return (
    <header className="admin-header">
      <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button type="button" aria-label="Thông báo" onClick={() => setShowNotifications((value) => !value)} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={20} />
            {deviceRequests.length > 0 && <span className="absolute top-1.5 right-1.5 min-w-2 h-2 px-1 bg-red-500 rounded-full" />}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 z-50 w-96 rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
              <p className="mb-2 text-sm font-bold text-gray-800">Yêu cầu thiết bị mới</p>
              {deviceRequests.length === 0 ? <p className="py-4 text-center text-xs text-gray-500">Không có yêu cầu đang chờ</p> : deviceRequests.map((request) => (
                <div key={request.requestId} className="mb-2 rounded-lg bg-gray-50 p-2.5 text-xs">
                  <p className="font-semibold text-gray-800">{request.fullName} ({request.phoneNumber})</p>
                  <p className="mt-1 text-gray-500">{request.deviceName || request.devicePlatform || 'Thiết bị mới'}</p>
                  <div className="mt-2 flex justify-end gap-2">
                    <button type="button" onClick={async () => { await deviceApprovalApi.reject(request.requestId); await loadDeviceRequests() }} className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-1 font-semibold text-red-700"><X size={13} /> Từ chối</button>
                    <button type="button" onClick={async () => { await deviceApprovalApi.approve(request.requestId); await loadDeviceRequests() }} className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 font-semibold text-green-700"><Check size={13} /> Duyệt</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold select-none text-sm shrink-0">
            {getInitials(headerUser.fullName)}
          </div>
          <div className="text-left hidden sm:block min-w-0 max-w-[150px]">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {headerUser.fullName || 'Người dùng'}
            </p>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              {getRoleLabel(headerUser.role)}
            </p>
          </div>
          <ChevronDown size={16} className="text-gray-400 hidden sm:block shrink-0" />
        </button>
      </div>
    </header>
  )
}
