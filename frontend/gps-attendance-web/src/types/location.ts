// ─── Location Types ───────────────────────────────────────────

export interface WorkLocation {
  id: number
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number          // Bán kính hợp lệ (mét)
  isActive: boolean
  createdAt: string
}

export interface CreateLocationRequest {
  name: string
  address: string
  latitude: number
  longitude: number
  radius: number
}

export interface UpdateLocationRequest {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  radius?: number
  isActive?: boolean
}

export interface GeoCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
}
