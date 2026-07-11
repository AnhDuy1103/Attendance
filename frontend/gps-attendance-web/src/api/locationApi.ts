import axiosClient from "./axiosClient";

export type LocationResponse = {
  locationId: number;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
};

export type UpdateLocationRequest = {
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
};

export const locationApi = {
  getActiveLocation: async (): Promise<LocationResponse> => {
    const response = await axiosClient.get<{ data: LocationResponse }>("/locations/active");
    return response.data.data;
  },

  updateLocation: async (
    id: number,
    data: UpdateLocationRequest
  ): Promise<LocationResponse> => {
    const response = await axiosClient.put<{ data: LocationResponse }>(
      `/locations/${id}`,
      data
    );
    return response.data.data;
  },
};
