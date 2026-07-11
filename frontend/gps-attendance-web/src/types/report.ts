// ─── Report Types ─────────────────────────────────────────────

export interface AttendanceSummaryReport {
  employeeId: number
  employeeCode: string
  employeeName: string
  department: string
  totalWorkDays: number
  presentDays: number
  absentDays: number
  lateDays: number
  earlyLeaveDays: number
  leaveDays: number
  totalWorkingHours: number
  month: number
  year: number
}

export interface DailyAttendanceReport {
  date: string
  totalEmployees: number
  presentCount: number
  absentCount: number
  lateCount: number
  earlyLeaveCount: number
  leaveCount: number
  attendanceRate: number  // Phần trăm (0-100)
}

export interface ReportFilter {
  startDate: string
  endDate: string
  department?: string
  employeeId?: number
  month?: number
  year?: number
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  absentToday: number
  lateToday: number
  attendanceRateToday: number
  recentAttendance: DailyAttendanceReport[]
}
