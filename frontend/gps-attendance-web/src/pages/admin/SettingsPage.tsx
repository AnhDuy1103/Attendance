import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crosshair,
  Loader2,
  MapPin,
  Save,
  Search,
} from "lucide-react";
import { workingHoursApi } from "../../api/workingHoursApi";
import { locationApi } from "../../api/locationApi";
import { settingsApi, PlaceSuggestion } from "../../api/settingsApi";
import LocationMapPicker from "../../components/admin/settings/LocationMapPicker";

type LocationForm = {
  locationId: number | null;
  locationName: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
};

const DEFAULT_LOCATION_NAME = "Nhà máy Quang Hoa";

const getSafeErrorMessage = (message: string): string => {
  if (!message) return "";
  if (message.length > 250) {
    return "Không thể tìm kiếm địa chỉ. Vui lòng thử lại sau.";
  }
  return message;
};

export default function SettingsPage() {
  const [workingHourId, setWorkingHourId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [originalStartTime, setOriginalStartTime] = useState("08:00");
  const [originalEndTime, setOriginalEndTime] = useState("17:00");
  const [overtime, setOvertime] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [isLoadingWorkingHours, setIsLoadingWorkingHours] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [locationForm, setLocationForm] = useState<LocationForm>({
    locationId: null,
    locationName: DEFAULT_LOCATION_NAME,
    address: "",
    latitude: "",
    longitude: "",
    radius: "100",
  });
  const [originalLocationForm, setOriginalLocationForm] = useState<LocationForm | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const isSelectingRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const normalizeTimeForInput = (value?: string | null): string => {
    if (!value) return "";
    if (value.includes("T")) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return value.slice(0, 5);
  };

  const formatTimeForApi = (value: string): string =>
    value.length === 5 ? `${value}:00` : value;

  const calculateShiftDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const diff = endHour * 60 + endMinute - (startHour * 60 + startMinute);
    return diff <= 0 ? 0 : Number((diff / 60).toFixed(2));
  };

  const triggerToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(""), 3000);
  };

  const fetchWorkingHour = async () => {
    try {
      setIsLoadingWorkingHours(true);
      setErrorMessage("");
      const data = await workingHoursApi.getActiveWorkingHour();
      if (!data) return;

      const start = normalizeTimeForInput(data.startTime);
      const end = normalizeTimeForInput(data.endTime);
      setWorkingHourId(data.workingHourId);
      setStartTime(start);
      setEndTime(end);
      setOriginalStartTime(start);
      setOriginalEndTime(end);
      setOvertime(data.overtime ?? 30);
      setIsActive(data.isActive ?? true);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Không thể tải thiết lập giờ làm.");
    } finally {
      setIsLoadingWorkingHours(false);
    }
  };

  const fetchActiveLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError("");
      const data = await locationApi.getActiveLocation();
      const next: LocationForm = {
        locationId: data.locationId,
        locationName: data.locationName || DEFAULT_LOCATION_NAME,
        address: data.address || "",
        latitude: String(data.latitude ?? ""),
        longitude: String(data.longitude ?? ""),
        radius: String(data.radius ?? 100),
      };
      isSelectingRef.current = true;
      setLocationForm(next);
      setOriginalLocationForm(next);
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 1000);
    } catch (error: any) {
      setLocationError(error?.response?.data?.message || "Không thể tải vị trí chấm công.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    fetchWorkingHour();
    fetchActiveLocation();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const executeSearch = async (rawKeyword: string) => {
    const keyword = rawKeyword.trim();
    if (keyword.length < 2) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsSearchingPlace(true);
      setLocationError("");
      setHasSearched(true);
      const suggestions = await settingsApi.searchPlaceAutocomplete(keyword);
      setPlaceSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error: any) {
      setPlaceSuggestions([]);
      setLocationError(getSafeErrorMessage(error?.response?.data?.message || "Không thể tìm địa chỉ."));
    } finally {
      setIsSearchingPlace(false);
    }
  };

  useEffect(() => {
    if (isSelectingRef.current) return;
    const keyword = locationForm.address.trim();
    if (keyword.length < 3) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!isSelectingRef.current) {
        executeSearch(keyword);
      }
    }, 600);

    return () => window.clearTimeout(timeoutId);
  }, [locationForm.address]);

  const handleSelectPlaceSuggestion = async (suggestion: PlaceSuggestion) => {
    isSelectingRef.current = true;
    setShowSuggestions(false);
    try {
      setIsSearchingPlace(true);
      setLocationError("");
      const details = await settingsApi.getPlaceDetails(suggestion.placeId);
      setLocationForm((prev) => ({
        ...prev,
        address: details.address,
        latitude: String(details.latitude),
        longitude: String(details.longitude),
      }));
      setPlaceSuggestions([]);
      triggerToast("Đã chọn vị trí và cập nhật tọa độ.");
    } catch (error: any) {
      setLocationError(getSafeErrorMessage(error?.response?.data?.message || "Không thể lấy chi tiết địa chỉ."));
    } finally {
      setIsSearchingPlace(false);
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 500);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setIsSearchingPlace(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocationForm((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lon),
        }));

        try {
          const rev = await settingsApi.reverseGeocode(lat, lon);
          if (rev && rev.address) {
            isSelectingRef.current = true;
            setLocationForm((prev) => ({
              ...prev,
              address: rev.address,
            }));
            setTimeout(() => {
              isSelectingRef.current = false;
            }, 500);
          }
        } catch {
          // Keep coordinates even if reverse geocoding is unavailable
        } finally {
          setIsSearchingPlace(false);
        }

        setLocationError("");
        triggerToast("Đã cập nhật tọa độ từ thiết bị.");
      },
      () => {
        setIsSearchingPlace(false);
        setLocationError("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí trên trình duyệt.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const parsedLat = locationForm.latitude.trim() !== "" ? Number(locationForm.latitude) : null;
  const parsedLng = locationForm.longitude.trim() !== "" ? Number(locationForm.longitude) : null;
  const isLatInvalid =
    locationForm.latitude.trim() !== "" &&
    (Number.isNaN(parsedLat) || (parsedLat !== null && (parsedLat < -90 || parsedLat > 90)));
  const isLngInvalid =
    locationForm.longitude.trim() !== "" &&
    (Number.isNaN(parsedLng) || (parsedLng !== null && (parsedLng < -180 || parsedLng > 180)));
  const isCoordinatesInvalid = isLatInvalid || isLngInvalid;

  const handleMapLocationChange = async (lat: number, lng: number) => {
    isSelectingRef.current = true;
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    setLocationForm((prev) => ({
      ...prev,
      latitude: latStr,
      longitude: lngStr,
    }));
    setLocationError("");

    try {
      const rev = await settingsApi.reverseGeocode(lat, lng);
      if (rev && rev.address) {
        setLocationForm((prev) => ({
          ...prev,
          address: rev.address,
        }));
      }
    } catch {
      // Keep coordinates even if reverse geocode fails
    } finally {
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 500);
    }
  };

  const validateWorkingHours = (): boolean => {
    if (!startTime) {
      setErrorMessage("Vui lòng nhập giờ bắt đầu.");
      return false;
    }
    if (!endTime) {
      setErrorMessage("Vui lòng nhập giờ kết thúc.");
      return false;
    }
    if (calculateShiftDuration(startTime, endTime) <= 0) {
      setErrorMessage("Giờ kết thúc phải lớn hơn giờ bắt đầu.");
      return false;
    }
    return true;
  };

  const validateLocationForm = (): boolean => {
    if (!locationForm.locationName.trim()) {
      setLocationError("Vui lòng nhập tên địa điểm chấm công.");
      return false;
    }
    if (!locationForm.address.trim()) {
      setLocationError("Vui lòng nhập địa chỉ chấm công.");
      return false;
    }

    const latitude = Number(locationForm.latitude);
    const longitude = Number(locationForm.longitude);
    const radius = Number(locationForm.radius);

    if (!locationForm.latitude || Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      setLocationError("Vĩ độ không hợp lệ. Giá trị phải nằm trong khoảng -90 đến 90.");
      return false;
    }
    if (!locationForm.longitude || Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      setLocationError("Kinh độ không hợp lệ. Giá trị phải nằm trong khoảng -180 đến 180.");
      return false;
    }
    if (Number.isNaN(radius) || radius <= 0) {
      setLocationError("Bán kính chấm công phải lớn hơn 0 mét.");
      return false;
    }

    return true;
  };

  const handleSaveWorkingHours = async () => {
    if (!workingHourId) {
      setErrorMessage("Không tìm thấy ca làm hợp lệ để cập nhật.");
      return;
    }
    if (!validateWorkingHours()) return;

    try {
      setIsSaving(true);
      setErrorMessage("");
      const payload = {
        startTime: formatTimeForApi(startTime),
        endTime: formatTimeForApi(endTime),
        shiftDuration: calculateShiftDuration(startTime, endTime),
        overtime,
        isActive: true,
      };
      const updated = await workingHoursApi.updateWorkingHour(workingHourId, payload);
      const updatedStart = normalizeTimeForInput(updated.startTime);
      const updatedEnd = normalizeTimeForInput(updated.endTime);
      setStartTime(updatedStart);
      setEndTime(updatedEnd);
      setOriginalStartTime(updatedStart);
      setOriginalEndTime(updatedEnd);
      setOvertime(updated.overtime ?? overtime);
      setIsActive(updated.isActive ?? isActive);
      triggerToast("Đã lưu thiết lập giờ làm.");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Không thể lưu thiết lập giờ làm.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!validateLocationForm()) return;
    if (!locationForm.locationId) {
      setLocationError("Không tìm thấy vị trí chấm công đang hoạt động để cập nhật.");
      return;
    }

    try {
      setIsSavingLocation(true);
      setLocationError("");
      const payload = {
        locationName: locationForm.locationName.trim(),
        address: locationForm.address.trim(),
        latitude: Number(locationForm.latitude),
        longitude: Number(locationForm.longitude),
        radius: Number(locationForm.radius),
        isActive: true,
      };
      const updated = await locationApi.updateLocation(locationForm.locationId, payload);
      const next: LocationForm = {
        locationId: updated.locationId,
        locationName: updated.locationName,
        address: updated.address,
        latitude: String(updated.latitude),
        longitude: String(updated.longitude),
        radius: String(updated.radius),
      };
      setLocationForm(next);
      setOriginalLocationForm(next);
      triggerToast("Đã lưu vị trí chấm công.");
    } catch (error: any) {
      setLocationError(error?.response?.data?.message || "Không thể lưu vị trí chấm công.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const hasWorkingHourChanges = startTime !== originalStartTime || endTime !== originalEndTime;
  const hasLocationChanges = originalLocationForm !== null && (
    locationForm.locationName.trim() !== originalLocationForm.locationName.trim() ||
    locationForm.address.trim() !== originalLocationForm.address.trim() ||
    locationForm.latitude !== originalLocationForm.latitude ||
    locationForm.longitude !== originalLocationForm.longitude ||
    locationForm.radius !== originalLocationForm.radius
  );
  const hasSettingsChanges = hasWorkingHourChanges || hasLocationChanges;
  const isSavingSettings = isSaving || isSavingLocation;

  const handleSaveSettings = async () => {
    if (!hasSettingsChanges) {
      triggerToast("Không có thay đổi để lưu.");
      return;
    }
    if (hasWorkingHourChanges) await handleSaveWorkingHours();
    if (hasLocationChanges) await handleSaveLocation();
  };

  const shiftDuration = calculateShiftDuration(startTime, endTime);

  return (
    <div className="min-h-[calc(100vh-96px)] px-1 py-1 space-y-5">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={!hasSettingsChanges || isSavingSettings || isLoadingWorkingHours || isLoadingLocation}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00288e] px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#002070] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSavingSettings ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
          {isSavingSettings ? "Đang lưu" : "Lưu cài đặt"}
        </button>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#00288e]">
              <Clock size={21} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Giờ làm việc</h3>
              <p className="text-sm text-gray-500">Khung giờ áp dụng cho ca làm đang hoạt động.</p>
            </div>
          </div>

          {isLoadingWorkingHours ? (
            <div className="flex h-48 items-center justify-center text-sm font-semibold text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Đang tải thiết lập giờ làm...
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 focus:border-[#00288e] focus:outline-none focus:ring-2 focus:ring-[#00288e]/15"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">Giờ kết thúc</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900 focus:border-[#00288e] focus:outline-none focus:ring-2 focus:ring-[#00288e]/15"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[#00288e]">Thời lượng ca</span>
                  <span className="text-lg font-bold text-[#00288e]">
                    {shiftDuration > 0 ? `${shiftDuration} giờ` : "--"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#00288e]">
                  Thay đổi khung giờ sẽ có hiệu lực cho các lượt chấm công tiếp theo.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm xl:col-span-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-[#00288e]">
              <MapPin size={21} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Vị trí chấm công</h3>
              <p className="text-sm text-gray-500">Nhân viên chỉ chấm công được trong bán kính cho phép.</p>
            </div>
          </div>

          {isLoadingLocation ? (
            <div className="flex h-64 items-center justify-center text-sm font-semibold text-gray-500">
              <Loader2 size={18} className="mr-2 animate-spin" />
              Đang tải vị trí chấm công...
            </div>
          ) : (
            <div className="space-y-5">
              {locationError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>{getSafeErrorMessage(locationError)}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-600">Tên địa điểm</label>
                <input
                  type="text"
                  value={locationForm.locationName}
                  onChange={(event) => setLocationForm((prev) => ({ ...prev, locationName: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-900 focus:border-[#00288e] focus:outline-none focus:ring-2 focus:ring-[#00288e]/15"
                />
              </div>

              <div ref={searchContainerRef} className="relative">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Địa chỉ / Tìm kiếm vị trí</label>
                  <span className="text-xs text-gray-400">Nhập địa chỉ hoặc tên khu vực rồi bấm Tìm</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={locationForm.address}
                      onChange={(event) => {
                        setLocationForm((prev) => ({ ...prev, address: event.target.value }));
                        setHasSearched(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          executeSearch(locationForm.address);
                        }
                      }}
                      onFocus={() => {
                        if (placeSuggestions.length > 0) setShowSuggestions(true);
                      }}
                      placeholder="Nhập địa chỉ, tên đường, KCN hoặc quận/huyện..."
                      className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm font-medium text-gray-900 focus:border-[#00288e] focus:outline-none focus:ring-2 focus:ring-[#00288e]/15"
                    />
                    {isSearchingPlace && (
                      <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00288e]" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => executeSearch(locationForm.address)}
                    disabled={isSearchingPlace || !locationForm.address.trim()}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[#00288e] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#002070] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSearchingPlace ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    <span>Tìm</span>
                  </button>
                </div>

                {showSuggestions && placeSuggestions.length > 0 && (
                  <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                    <div className="border-b border-gray-100 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500">
                      Chọn địa điểm bên dưới để tự động điền tọa độ ({placeSuggestions.length} kết quả):
                    </div>
                    {placeSuggestions.map((item) => (
                      <button
                        key={item.placeId}
                        type="button"
                        onClick={() => handleSelectPlaceSuggestion(item)}
                        className="flex w-full items-start gap-3 border-b border-gray-50 px-4 py-2.5 text-left transition-colors hover:bg-blue-50"
                      >
                        <MapPin size={17} className="mt-0.5 shrink-0 text-[#00288e]" />
                        <span className="text-sm font-medium text-gray-800">{item.description}</span>
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && hasSearched && placeSuggestions.length === 0 && !isSearchingPlace && (
                  <div className="absolute z-50 mt-1 w-full rounded-lg border border-amber-200 bg-amber-50 p-3.5 shadow-lg">
                    <p className="text-xs font-bold text-amber-800">
                      Không tìm thấy địa điểm cụ thể cho từ khóa này.
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      Gợi ý: Hãy thử nhập tên ngắn gọn hơn (tên đường, quận/huyện hoặc tỉnh/thành phố) hoặc bấm <strong>"Dùng vị trí hiện tại"</strong> bên dưới.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">Vĩ độ (Latitude)</label>
                  <input
                    type="text"
                    value={locationForm.latitude}
                    onChange={(event) => setLocationForm((prev) => ({ ...prev, latitude: event.target.value }))}
                    placeholder="15.879440"
                    className={`h-11 w-full rounded-lg border px-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 ${
                      isLatInvalid
                        ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 bg-gray-50 focus:border-[#00288e] focus:ring-[#00288e]/15"
                    }`}
                  />
                  {isLatInvalid && (
                    <p className="mt-1 text-xs font-semibold text-red-600">Vĩ độ phải từ -90 đến 90</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">Kinh độ (Longitude)</label>
                  <input
                    type="text"
                    value={locationForm.longitude}
                    onChange={(event) => setLocationForm((prev) => ({ ...prev, longitude: event.target.value }))}
                    placeholder="108.335000"
                    className={`h-11 w-full rounded-lg border px-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 ${
                      isLngInvalid
                        ? "border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 bg-gray-50 focus:border-[#00288e] focus:ring-[#00288e]/15"
                    }`}
                  />
                  {isLngInvalid && (
                    <p className="mt-1 text-xs font-semibold text-red-600">Kinh độ phải từ -180 đến 180</p>
                  )}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-600">Bán kính cho phép</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={locationForm.radius}
                      onChange={(event) => setLocationForm((prev) => ({ ...prev, radius: event.target.value }))}
                      className="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 pr-10 text-sm font-medium text-gray-900 focus:border-[#00288e] focus:outline-none focus:ring-2 focus:ring-[#00288e]/15"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">m</span>
                  </div>
                </div>
              </div>

              {/* Cảnh báo tọa độ không hợp lệ */}
              {isCoordinatesInvalid && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Tọa độ không hợp lệ: Vui lòng nhập số hợp lệ hoặc click chọn vị trí trên bản đồ.</span>
                </div>
              )}

              {/* Bản đồ Leaflet + OpenStreetMap */}
              <LocationMapPicker
                latitude={isCoordinatesInvalid ? null : parsedLat}
                longitude={isCoordinatesInvalid ? null : parsedLng}
                radius={Number(locationForm.radius)}
                address={locationForm.address}
                onLocationChange={handleMapLocationChange}
              />

              <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Cập nhật tọa độ nhanh từ thiết bị</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Hệ thống sẽ lấy tọa độ GPS thực tế của bạn và tự động điền địa chỉ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isSearchingPlace}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-bold text-[#00288e] transition-colors hover:bg-blue-100 active:scale-[0.98] disabled:opacity-50"
                >
                  {isSearchingPlace ? <Loader2 size={17} className="animate-spin" /> : <Crosshair size={17} />}
                  Dùng vị trí hiện tại
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {toastMessage && (
        <div className="fixed right-6 top-20 z-[9999] flex items-center gap-2 rounded-full border border-green-200 bg-white px-4 py-2.5 shadow-lg">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
            <CheckCircle size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-bold text-green-600">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
