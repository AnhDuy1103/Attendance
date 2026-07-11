// ─── Auth Types ───────────────────────────────────────────────

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  expiresAt: string
  user: AuthUser
}

export interface AuthUser {
  id: number
  username: string
  fullName: string
  role: UserRole
  avatarUrl?: string
}

export type UserRole = 'Admin' | 'Employee'

export interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
}
