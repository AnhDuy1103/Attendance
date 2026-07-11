import axiosClient from "./axiosClient";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
};

export type PlaceDetails = {
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
};

export const settingsApi = {
  searchPlaceAutocomplete: async (
    input: string
  ): Promise<PlaceSuggestion[]> => {
    const response = await axiosClient.get<{ data: PlaceSuggestion[] }>(
      "/settings/place-autocomplete",
      {
        params: { input },
      }
    );

    return response.data.data;
  },

  getPlaceDetails: async (placeId: string): Promise<PlaceDetails> => {
    const response = await axiosClient.get<{ data: PlaceDetails }>(
      "/settings/place-details",
      {
        params: { placeId },
      }
    );

    return response.data.data;
  },
};
