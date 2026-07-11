// ─── Attendance Types ─────────────────────────────────────────

export interface AttendanceRecord {
  id: number
  employeeId: number
  employeeName: string
  employeeCode: string
  checkInTime?: string
  checkOutTime?: string
  checkInLatitude?: number
  checkInLongitude?: number
  checkOutLatitude?: number
  checkOutLongitude?: number
  locationName?: string
  status: AttendanceStatus
  workingHours?: number
  note?: string
  date: string
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'EarlyLeave'
  | 'HalfDay'
  | 'Leave'

export interface CheckInRequest {
  latitude: number
  longitude: number
  accuracy?: number
  note?: string
}

export interface CheckOutRequest {
  latitude: number
  longitude: number
  accuracy?: number
  note?: string
}

export interface AttendanceFilter {
  employeeId?: number
  startDate?: string
  endDate?: string
  status?: AttendanceStatus
  pageNumber?: number
  pageSize?: number
}

export interface PaginatedAttendance {
  items: AttendanceRecord[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface TodayStatus {
  date: string
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime?: string
  checkOutTime?: string
  status?: AttendanceStatus
}
