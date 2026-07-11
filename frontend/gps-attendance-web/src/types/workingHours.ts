// ─── Working Hours Types ──────────────────────────────────────

export interface WorkingHoursConfig {
  id: number
  shiftName: string
  startTime: string       // "HH:mm"
  endTime: string         // "HH:mm"
  lateToleranceMinutes: number
  earlyLeaveToleranceMinutes: number
  isDefault: boolean
  workDays: number[]      // 0=CN, 1=T2, ..., 6=T7
}

export interface CreateWorkingHoursRequest {
  shiftName: string
  startTime: string
  endTime: string
  lateToleranceMinutes: number
  earlyLeaveToleranceMinutes: number
  isDefault: boolean
  workDays: number[]
}

export interface UpdateWorkingHoursRequest {
  shiftName?: string
  startTime?: string
  endTime?: string
  lateToleranceMinutes?: number
  earlyLeaveToleranceMinutes?: number
  isDefault?: boolean
  workDays?: number[]
}
