// ─── Date Formatting Utilities ────────────────────────────────

/**
 * Format: "01/07/2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format: "01/07/2026 08:30"
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format: "08:30"
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format: "Thứ Ba, 01 tháng 07, 2026"
 */
export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format working hours: "8 giờ 30 phút"
 */
export function formatWorkingHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
}

/**
 * Returns "HH:mm" for ISO date string
 */
export function toTimeString(dateStr?: string): string {
  if (!dateStr) return '─'
  return formatTime(dateStr)
}

/**
 * Returns today's date as "YYYY-MM-DD"
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
