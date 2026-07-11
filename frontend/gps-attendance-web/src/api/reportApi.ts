import axiosClient from "./axiosClient";

export type ReportAttendanceRecord = {
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
  checkOutTime: string | null;
  actualHours?: number | null;
  overtimeHours?: number | null;
  status: string;
  locationName?: string;
  note?: string | null;
};

export type TopLateEmployee = {
  employeeId: number;
  employeeCode?: string;
  fullName: string;
  lateCount: number;
};

export type OvertimeByDepartment = {
  department: string;
  totalOvertimeHours: number;
};

export type AttendanceReportResponse = {
  totalWorkingHours: number;
  lateCount: number;
  totalOvertimeHours: number;
  forgotCheckoutCount: number;
  topLateEmployees: TopLateEmployee[];
  overtimeByDepartment: OvertimeByDepartment[];
  records: ReportAttendanceRecord[];
};

export type GetAttendanceReportParams = {
  fromDate?: string;
  toDate?: string;
  department?: string;
};

export const reportApi = {
  getAttendanceReport: async (
    params: GetAttendanceReportParams
  ): Promise<AttendanceReportResponse> => {
    const response = await axiosClient.get<AttendanceReportResponse>(
      "/reports/attendance",
      { params }
    );
    return response.data;
  },
};
