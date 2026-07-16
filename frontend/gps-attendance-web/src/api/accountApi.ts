import axiosClient from "./axiosClient";

// ─── Types ────────────────────────────────────────────────────
export type AccountProfile = {
  userId: number;
  employeeId?: number | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
};

export type UpdateAccountProfileRequest = {
  fullName: string;
  email: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// ─── API Wrapper ───────────────────────────────────────────────
export const accountApi = {
  getMyProfile: async (): Promise<AccountProfile> => {
    const response = await axiosClient.get<{ success: boolean; data: AccountProfile }>(
      "/account/me"
    );
    return response.data.data;
  },

  updateMyProfile: async (
    data: UpdateAccountProfileRequest
  ): Promise<AccountProfile> => {
    const response = await axiosClient.put<{ success: boolean; data: AccountProfile }>(
      "/account/me",
      data
    );
    return response.data.data;
  },

  changePassword: async (
    data: ChangePasswordRequest
  ): Promise<{ message: string }> => {
    const response = await axiosClient.put<{ success: boolean; message: string }>(
      "/account/change-password",
      data
    );
    return { message: response.data.message };
  },
};
