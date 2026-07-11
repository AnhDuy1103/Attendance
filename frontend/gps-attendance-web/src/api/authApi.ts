import axiosClient from './axiosClient';

export type LoginRequest = {
  phoneNumber: string;
  password: string;
};

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
    const response = await axiosClient.post<ApiResponse<any>>("/auth/login", data);
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
};
