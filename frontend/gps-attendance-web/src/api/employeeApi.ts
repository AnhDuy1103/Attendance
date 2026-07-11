import axiosClient from "./axiosClient";

export type EmployeeResponse = {
  employeeId: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  phoneNumber: string;
  role: "Admin" | "Employee";
  joinDate: string;
  employeeStatus: string;
  isActive: boolean;
};

export type CreateEmployeeRequest = {
  fullName: string;
  email: string;
  department: string;
  position: string;
  phoneNumber: string;
  role: "Admin" | "Employee";
  password: string;
  joinDate: string;
};

export type UpdateEmployeeRequest = {
  fullName: string;
  email: string;
  department: string;
  position: string;
  phoneNumber: string;
  role: "Admin" | "Employee";
  joinDate: string;
  employeeStatus?: string;
  isActive?: boolean;
  password?: string;
};

const PREFIX = '/employees';

export const employeeApi = {
  /** Lấy danh sách nhân viên */
  getAll: (params?: { page?: number; pageSize?: number; search?: string; status?: string }) =>
    axiosClient.get(PREFIX, { params }),

  /** Tạo nhân viên mới */
  create: async (data: CreateEmployeeRequest): Promise<EmployeeResponse> => {
    const response = await axiosClient.post<{ data: EmployeeResponse }>(PREFIX, data);
    return response.data.data;
  },

  /** Cập nhật nhân viên */
  update: async (
    id: number,
    data: UpdateEmployeeRequest
  ): Promise<EmployeeResponse> => {
    const response = await axiosClient.put<{ data: EmployeeResponse }>(`${PREFIX}/${id}`, data);
    return response.data.data;
  },

  /** Xóa nhân viên */
  remove: async (id: number): Promise<void> => {
    await axiosClient.delete(`${PREFIX}/${id}`);
  },

  /** Đổi mật khẩu bản thân (Employee) */
  changeMyPassword: (currentPassword: string, newPassword: string) =>
    axiosClient.post(`${PREFIX}/me/change-password`, { currentPassword, newPassword }),

  /** Lấy thông tin cá nhân */
  getMe: async (): Promise<any> => {
    const response = await axiosClient.get(`${PREFIX}/me`);
    return response.data.data;
  },

  /** Cập nhật thông tin cá nhân */
  updateMe: async (data: { fullName: string; email: string }): Promise<any> => {
    const response = await axiosClient.put(`${PREFIX}/me`, data);
    return response.data.data;
  },
};
