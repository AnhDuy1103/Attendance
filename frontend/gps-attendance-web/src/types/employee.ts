// ─── Employee Types ───────────────────────────────────────────

export interface Employee {
  id: number
  employeeCode: string
  fullName: string
  email: string
  phone: string
  department: string
  position: string
  status: EmployeeStatus
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export type EmployeeStatus = 'Active' | 'Inactive' | 'OnLeave'

export interface CreateEmployeeRequest {
  employeeCode: string
  fullName: string
  email: string
  phone: string
  department: string
  position: string
  username: string
  password: string
}

export interface UpdateEmployeeRequest {
  fullName?: string
  email?: string
  phone?: string
  department?: string
  position?: string
  status?: EmployeeStatus
}

export interface PaginatedEmployees {
  items: Employee[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}
