import axiosClient from "./axiosClient";

export type DashboardRecentAttendance = {
  attendanceId: number;
  employeeId: number;
  employeeCode?: string;
  fullName: string;
  department?: string;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
};

export type DashboardSummaryResponse = {
  totalEmployees: number;
  checkedToday: number;
  lateToday: number;
  forgotCheckout: number;
  recentAttendances: DashboardRecentAttendance[];
};

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummaryResponse> => {
    // API backend trả về ApiResponseDto<DashboardSummaryResponse>
    const response = await axiosClient.get<{ data: DashboardSummaryResponse }>("/dashboard/summary");
    return response.data.data;
  },
};
