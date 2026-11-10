import axiosClient from './axiosClient'

export type DeviceRequest = {
  requestId: number
  userId: number
  phoneNumber: string
  fullName: string
  deviceName?: string
  devicePlatform?: string
  deviceBrowser?: string
  ipAddress?: string
  requestedAt: string
}

export const deviceApprovalApi = {
  getPending: async (): Promise<DeviceRequest[]> => {
    const response = await axiosClient.get<{ data: DeviceRequest[] }>('/admin/device-requests')
    return response.data.data || []
  },
  approve: (id: number) => axiosClient.put(`/admin/device-requests/${id}/approve`),
  reject: (id: number, note?: string) => axiosClient.put(`/admin/device-requests/${id}/reject`, { note }),
}
