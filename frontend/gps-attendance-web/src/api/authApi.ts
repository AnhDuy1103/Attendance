import axiosClient from './axiosClient';

export type LoginRequest = {
  identifier: string;
  password: string;
  deviceToken: string;
  deviceName?: string;
  devicePlatform?: string;
  deviceBrowser?: string;
  requestDeviceApproval?: boolean;
};

export function getDeviceToken(): string {
  const key = 'gps_attendance_device_token';
  let token = localStorage.getItem(key);
  if (!token) {
    token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, token);
  }
  return token;
}

export type LoginResponse = {
  token: string;
  role: "Admin" | "Employee";
  userId?: number;
  phoneNumber?: string;
  fullName?: string;
  employeeId?: number;
  employeeCode?: string;
};

// Kiểu dữ liệu chuẩn trả về từ API backend theo thiết kế ApiResponseDto<T>
export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
};

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // API backend trả về ApiResponseDto<any> vì cấu trúc là { token, userInfo: {...} }
    const response = await axiosClient.post<ApiResponse<any>>("/auth/login", {
      ...data,
      identifier: data.identifier.trim(),
    });
    if (response.status === 202) {
      const apiError: any = new Error(response.data?.message || 'Yêu cầu thiết bị chưa được xử lý.');
      apiError.code = response.data?.errors?.[0];
      apiError.apiMessage = response.data?.message;
      throw apiError;
    }
    const result = response.data.data;
    
    return {
      token: result.token,
      role: result.userInfo?.role,
      userId: result.userInfo?.userId,
      phoneNumber: result.userInfo?.phoneNumber,
      fullName: result.userInfo?.fullName,
      employeeId: result.userInfo?.employeeId,
      employeeCode: result.userInfo?.employeeCode
    };
  },
  requestPasswordOtp: async (email: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<null>>('/auth/forgot-password', { email });
    return response.data.message;
  },
  verifyPasswordOtp: async (email: string, otp: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<{ resetToken: string }>>('/auth/verify-otp', { email, otp });
    return response.data.data.resetToken;
  },
  resetPassword: async (resetToken: string, newPassword: string): Promise<string> => {
    const response = await axiosClient.post<ApiResponse<null>>('/auth/reset-password', { resetToken, newPassword });
    return response.data.message;
  },
};
