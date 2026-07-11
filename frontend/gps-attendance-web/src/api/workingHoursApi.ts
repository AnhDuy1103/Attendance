import axiosClient from "./axiosClient";

export type WorkingHourResponse = {
  workingHourId: number;
  startTime: string;
  endTime: string;
  shiftDuration?: number;
  overtime?: number;
  isActive?: boolean;
};

export type UpdateWorkingHourRequest = {
  startTime: string;
  endTime: string;
  shiftDuration?: number;
  overtime?: number;
  isActive?: boolean;
};

export const workingHoursApi = {
  getActiveWorkingHour: async (): Promise<WorkingHourResponse> => {
    // API backend returns wrapped ApiResponseDto
    const response = await axiosClient.get<{ data: WorkingHourResponse }>(
      "/workinghours/active"
    );
    return response.data.data;
  },

  getWorkingHours: async (): Promise<WorkingHourResponse[]> => {
    // API backend returns wrapped ApiResponseDto
    const response = await axiosClient.get<{ data: WorkingHourResponse[] }>(
      "/workinghours"
    );
    return response.data.data;
  },

  updateWorkingHour: async (
    id: number,
    data: UpdateWorkingHourRequest
  ): Promise<WorkingHourResponse> => {
    // API backend returns wrapped ApiResponseDto
    const response = await axiosClient.put<{ data: WorkingHourResponse }>(
      `/workinghours/${id}`,
      data
    );
    return response.data.data;
  },
};
