// ─── App Constants ────────────────────────────────────────────

/** Local storage keys */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user',
} as const

/** API base URL from environment */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

/** Routes */
export const ROUTES = {
  LOGIN: '/login',
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    EMPLOYEES: '/admin/employees',
    ATTENDANCE_HISTORY: '/admin/attendance-history',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
    ACCOUNT: '/admin/account',
  },
  EMPLOYEE: {
    HOME: '/employee/home',
    CHECK_ATTENDANCE: '/employee/check-attendance',
    HISTORY: '/employee/history',
    ACCOUNT: '/employee/account',
  },
} as const

/** Attendance status labels (Vietnamese) */
export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  Present: 'Đi làm',
  Absent: 'Vắng mặt',
  Late: 'Đi trễ',
  EarlyLeave: 'Về sớm',
  HalfDay: 'Nửa ngày',
  Leave: 'Nghỉ phép',
}

/** Employee status labels (Vietnamese) */
export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  Active: 'Đang làm việc',
  Inactive: 'Đã nghỉ việc',
  OnLeave: 'Đang nghỉ phép',
}

/** Days of the week (Vietnamese) */
export const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 10

/** GPS accuracy threshold (meters) */
export const GPS_ACCURACY_THRESHOLD = 50
