import axiosClient from "./axiosClient";

export type TodayAttendanceResponse = {
  attendanceId?: number;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
  note?: string | null;
};

export type AttendanceLocationRequest = {
  latitude: number;
  longitude: number;
};

export type AttendanceResponse = {
  attendanceId: number;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
  note?: string | null;
};

export type MyHistoryResponse = {
  attendanceId: number;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
  locationName?: string;
  address?: string;
  note?: string | null;
  /** Tính từ backend: true khi có checkIn, không có checkOut, ngày đã qua (giờ VN) */
  isForgotCheckout: boolean;
  /** "ForgotCheckout" hoặc bằng status gốc – ưu tiên hiển thị */
  displayStatus?: string;
};

export const attendanceApi = {
  getTodayAttendance: async (): Promise<TodayAttendanceResponse> => {
    // API backend trả về ApiResponseDto<TodayAttendanceResponse>
    const response = await axiosClient.get<{ data: TodayAttendanceResponse }>("/attendance/today");
    return response.data.data;
  },

  checkIn: async (data: AttendanceLocationRequest): Promise<AttendanceResponse> => {
    const response = await axiosClient.post<{ data: AttendanceResponse }>("/attendance/check-in", data);
    return response.data.data;
  },

  checkOut: async (data: AttendanceLocationRequest): Promise<AttendanceResponse> => {
    const response = await axiosClient.post<{ data: AttendanceResponse }>("/attendance/check-out", data);
    return response.data.data;
  },

  getMyHistory: async (): Promise<MyHistoryResponse[]> => {
    const response = await axiosClient.get<{ data: MyHistoryResponse[] }>("/attendance/my-history");
    return response.data.data;
  },

  getAllAttendances: async (): Promise<AdminAttendanceResponse[]> => {
    const response = await axiosClient.get<{ data: AdminAttendanceResponse[] }>("/attendance/all");
    return response.data.data;
  },
};

export type AdminAttendanceResponse = {
  attendanceId: number;
  employeeId: number;
  employeeCode?: string;
  fullName?: string;
  employeeName?: string;
  name?: string;
  department?: string;
  position?: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkInLat?: number | null;
  checkInLong?: number | null;
  checkOutTime: string | null;
  checkOutLat?: number | null;
  checkOutLong?: number | null;
  actualHours?: number | null;
  overtimeHours?: number | null;
  status: string;
  locationName?: string;
  locationAddress?: string;
  note?: string | null;
};

export type ApproveForgotCheckoutResponse = {
  attendanceId: number;
  employeeId: number;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
  note: string | null;
};

// Thêm hàm approveForgotCheckout vào object attendanceApi
// (gắn thêm vào object đã export ở trên qua namespace mở rộng không được,
//  nên dùng export function riêng)
export const approveForgotCheckout = async (
  attendanceId: number
): Promise<ApproveForgotCheckoutResponse> => {
  const response = await axiosClient.put<ApproveForgotCheckoutResponse>(
    `/attendance/${attendanceId}/approve-forgot-checkout`
  );
  return response.data;
};

