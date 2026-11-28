import { useEffect } from 'react'
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface NotificationToastProps {
  open: boolean
  type?: NotificationType
  title: string
  message?: string
  onClose: () => void
  duration?: number
}

const styles = {
  success: { icon: CheckCircle2, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  error: { icon: CircleAlert, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  warning: { icon: TriangleAlert, color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  info: { icon: Info, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
} as const

export default function NotificationToast({
  open,
  type = 'info',
  title,
  message,
  onClose,
  duration = 4500,
}: NotificationToastProps) {
  useEffect(() => {
    if (!open || duration <= 0) return
    const timer = window.setTimeout(onClose, duration)
    return () => window.clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null
  const config = styles[type]
  const Icon = config.icon

  return (
    <div
      role={type === 'error' || type === 'warning' ? 'alert' : 'status'}
      className="fixed right-4 top-20 z-[9999] flex w-[min(420px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-xl animate-fade-in-up"
      style={{ borderColor: config.border }}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: config.bg, color: config.color }}>
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold" style={{ color: config.color }}>{title}</p>
        {message && <p className="mt-0.5 text-xs leading-5 text-gray-600">{message}</p>}
      </div>
      <button type="button" aria-label="Đóng thông báo" onClick={onClose} className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
        <X size={17} />
      </button>
    </div>
  )
}
