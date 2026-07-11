import { useEffect, useState } from "react";
import {
  Clock,
  MapPin,
  Crosshair,
  CheckCircle,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { workingHoursApi } from "../../api/workingHoursApi";
import { locationApi } from "../../api/locationApi";
import { settingsApi, PlaceSuggestion } from "../../api/settingsApi";

// ─── Types ────────────────────────────────────────────────────────────────────
type LocationForm = {
  locationId: number | null;
  locationName: string;
  address: string;
  latitude: string;
  longitude: string;
  radius: string;
};

// ─── Helper: clean Google error messages ──────────────────────────────────────
const getSafeErrorMessage = (message: string): string => {
  if (!message) return "";
  if (
    message.includes("API_KEY_SERVICE_BLOCKED") ||
    message.includes("AutocompletePlaces are blocked") ||
    message.includes("blocked") ||
    message.includes("REQUEST_DENIED")
  ) {
    return "Google Places API chua duoc bat hoac API key chua co quyen su dung Places API.";
  }
  if (message.length > 250) {
    return "Khong the tim kiem dia chi. Vui long kiem tra cau hinh Google Places API.";
  }
  return message;
};

// ─── SettingsPage Component ───────────────────────────────────────────────────
export default function SettingsPage() {
  // Working Hours
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

  // Location
  const [locationForm, setLocationForm] = useState<LocationForm>({
    locationId: null,
    locationName: "Nha may Quang Hoa",
    address: "",
    latitude: "",
    longitude: "",
    radius: "100",
  });
  const [originalLocationForm, setOriginalLocationForm] = useState<LocationForm | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Helpers
  const normalizeTimeForInput = (value?: string | null): string => {
    if (!value) return "";
    if (value.includes("T")) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
    }
    return value.slice(0, 5);
  };

  const formatTimeForApi = (value: string): string =>
    value.length === 5 ? `${value}:00` : value;

  const calculateShiftDuration = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const d = eh * 60 + em - (sh * 60 + sm);
    return d <= 0 ? 0 : Number((d / 60).toFixed(2));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Load working hours
  const fetchWorkingHour = async () => {
    try {
      setIsLoadingWorkingHours(true);
      setErrorMessage("");
      const data = await workingHoursApi.getActiveWorkingHour();
      if (!data) return;
      const start = normalizeTimeForInput(data.startTime);
      const end = normalizeTimeForInput(data.endTime);
      setWorkingHourId(data.workingHourId);
      setStartTime(start); setEndTime(end);
      setOriginalStartTime(start); setOriginalEndTime(end);
      setOvertime(data.overtime ?? 30);
      setIsActive(data.isActive ?? true);
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Khong the tai thiet lap gio lam");
    } finally { setIsLoadingWorkingHours(false); }
  };

  // Load active location
  const fetchActiveLocation = async () => {
    try {
      setIsLoadingLocation(true);
      setLocationError("");
      const data = await locationApi.getActiveLocation();
      const next: LocationForm = {
        locationId: data.locationId,
        locationName: data.locationName || "Nha may Quang Hoa",
        address: data.address || "",
        latitude: String(data.latitude ?? ""),
        longitude: String(data.longitude ?? ""),
        radius: String(data.radius ?? 100),
      };
      setLocationForm(next);
      setOriginalLocationForm(next);
    } catch (error: any) {
      setLocationError(error?.response?.data?.message || "Khong the tai vi tri cham cong");
    } finally { setIsLoadingLocation(false); }
  };

  useEffect(() => {
    fetchWorkingHour();
    fetchActiveLocation();
  }, []);

  // Debounce autocomplete
  useEffect(() => {
    const keyword = locationForm.address.trim();
    if (keyword.length < 3) { setPlaceSuggestions([]); return; }
    const id = window.setTimeout(async () => {
      try {
        setIsSearchingPlace(true);
        setLocationError("");
        const suggestions = await settingsApi.searchPlaceAutocomplete(keyword);
        setPlaceSuggestions(suggestions);
      } catch (error: any) {
        setPlaceSuggestions([]);
        setLocationError(getSafeErrorMessage(error?.response?.data?.message || "Khong the tim dia chi"));
      } finally { setIsSearchingPlace(false); }
    }, 400);
    return () => window.clearTimeout(id);
  }, [locationForm.address]);

  const handleSelectPlaceSuggestion = async (suggestion: PlaceSuggestion) => {
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
    } catch (error: any) {
      setLocationError(getSafeErrorMessage(error?.response?.data?.message || "Khong the lay chi tiet dia chi"));
    } finally { setIsSearchingPlace(false); }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) { setLocationError("Trinh duyet khong ho tro vi tri hien tai"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocationError("");
        triggerToast("Da cap nhat toa do vi tri thiet bi");
      },
      (err) => { console.error(err); setLocationError("Khong the lay vi tri hien tai. Vui long kiem tra quyen truy cap vi tri."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const validateWorkingHours = (): boolean => {
    if (!startTime) { setErrorMessage("Vui long nhap gio bat dau"); return false; }
    if (!endTime) { setErrorMessage("Vui long nhap gio ket thuc"); return false; }
    if (calculateShiftDuration(startTime, endTime) <= 0) { setErrorMessage("Gio ket thuc phai lon hon gio bat dau"); return false; }
    return true;
  };

  const validateLocationForm = (): boolean => {
    if (!locationForm.address.trim()) { setLocationError("Vui long nhap dia chi cham cong"); return false; }
    const lat = Number(locationForm.latitude);
    const lng = Number(locationForm.longitude);
    const r = Number(locationForm.radius);
    if (!locationForm.latitude || Number.isNaN(lat) || lat < -90 || lat > 90) { setLocationError("Vi do khong hop le (phai tu -90 den 90)"); return false; }
    if (!locationForm.longitude || Number.isNaN(lng) || lng < -180 || lng > 180) { setLocationError("Kinh do khong hop le (phai tu -180 den 180)"); return false; }
    if (Number.isNaN(r) || r <= 0) { setLocationError("Ban kinh cham cong phai lon hon 0"); return false; }
    return true;
  };

  const handleSaveWorkingHours = async () => {
    if (!workingHourId) { setErrorMessage("Khong tim thay ca lam hop le de cap nhat"); return; }
    if (!validateWorkingHours()) return;
    try {
      setIsSaving(true); setErrorMessage("");
      const payload = { startTime: formatTimeForApi(startTime), endTime: formatTimeForApi(endTime), shiftDuration: calculateShiftDuration(startTime, endTime), overtime, isActive: true };
      const updated = await workingHoursApi.updateWorkingHour(workingHourId, payload);
      const us = normalizeTimeForInput(updated.startTime);
      const ue = normalizeTimeForInput(updated.endTime);
      setStartTime(us); setEndTime(ue); setOriginalStartTime(us); setOriginalEndTime(ue);
      setOvertime(updated.overtime ?? overtime); setIsActive(updated.isActive ?? isActive);
      triggerToast("Luu thiet lap gio lam thanh cong");
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || "Khong the luu thiet lap gio lam");
    } finally { setIsSaving(false); }
  };

  const handleSaveLocation = async () => {
    if (!validateLocationForm()) return;
    if (!locationForm.locationId) { setLocationError("Khong tim thay vi tri cham cong active de cap nhat"); return; }
    try {
      setIsSavingLocation(true); setLocationError("");
      const payload = {
        locationName: locationForm.locationName || "Nha may Quang Hoa",
        address: locationForm.address.trim(),
        latitude: Number(locationForm.latitude),
        longitude: Number(locationForm.longitude),
        radius: Number(locationForm.radius),
        isActive: true,
      };
      const updated = await locationApi.updateLocation(locationForm.locationId, payload);
      const next: LocationForm = {
        locationId: updated.locationId, locationName: updated.locationName,
        address: updated.address, latitude: String(updated.latitude),
        longitude: String(updated.longitude), radius: String(updated.radius),
      };
      setLocationForm(next); setOriginalLocationForm(next);
      triggerToast("Luu vi tri cham cong thanh cong");
    } catch (error: any) {
      setLocationError(error?.response?.data?.message || "Khong the luu vi tri cham cong");
    } finally { setIsSavingLocation(false); }
  };

  const hasWorkingHourChanges = startTime !== originalStartTime || endTime !== originalEndTime;
  const hasLocationChanges = originalLocationForm !== null && (
    locationForm.address.trim() !== originalLocationForm.address.trim() ||
    locationForm.latitude !== originalLocationForm.latitude ||
    locationForm.longitude !== originalLocationForm.longitude ||
    locationForm.radius !== originalLocationForm.radius
  );
  const hasSettingsChanges = hasWorkingHourChanges || hasLocationChanges;

  const handleSaveSettings = async () => {
    if (!hasWorkingHourChanges && !hasLocationChanges) { triggerToast("Khong co thay doi de luu"); return; }
    if (hasWorkingHourChanges) await handleSaveWorkingHours();
    if (hasLocationChanges) await handleSaveLocation();
  };

  return (
    <div className="h-[calc(100vh-96px)] overflow-hidden px-1 py-1 space-y-4 flex flex-col">
      {errorMessage && (
        <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200 text-xs shrink-0">
          <AlertCircle size={14} className="shrink-0" />
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      <div className="flex items-center justify-end shrink-0">
        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={!hasSettingsChanges || isSaving || isSavingLocation || isLoadingWorkingHours || isLoadingLocation}
          className="px-6 py-2.5 rounded-xl bg-[#00288e] text-white text-sm font-bold shadow-lg shadow-[#00288e]/20 hover:bg-[#002070] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isSaving || isSavingLocation ? "Dang luu..." : "Luu cai dat"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        <section className="lg:col-span-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#00288e]">
                <Clock size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Thiet lap gio lam</h3>
            </div>
            {isLoadingWorkingHours ? (
              <div className="text-center py-10 text-xs font-semibold text-gray-500 flex-1 flex items-center justify-center">Dang tai thiet lap gio lam...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-600">Gio bat dau</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-600">Gio ket thuc</label>
                    <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]" />
                  </div>
                </div>
                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-sm text-[#00288e] italic">Luu y: Moi thay doi ve khung gio se co hieu luc tu ngay lam viec tiep theo.</p>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="lg:col-span-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#00288e]">
                <MapPin size={22} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Vi tri cham cong</h3>
            </div>
            {isLoadingLocation ? (
              <div className="text-center py-10 text-xs font-semibold text-gray-500 flex-1 flex items-center justify-center">Dang tai vi tri cham cong...</div>
            ) : (
              <div className="space-y-6 overflow-y-auto flex-1">
                {locationError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{getSafeErrorMessage(locationError)}</p>
                  </div>
                )}

                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Nhap hoac tim kiem dia chi</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={locationForm.address}
                      onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="Nhap dia chi cham cong..."
                      className="w-full h-12 pl-11 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]"
                    />
                    {isSearchingPlace && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                  </div>
                  {placeSuggestions.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      {placeSuggestions.map((item) => (
                        <button key={item.placeId} type="button" onClick={() => handleSelectPlaceSuggestion(item)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-[#00288e] mt-0.5 shrink-0" />
                            <span className="text-sm font-medium text-gray-800">{item.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Vi do (Latitude)</label>
                    <input type="text" value={locationForm.latitude}
                      onChange={(e) => setLocationForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      placeholder="VD: 15.879440"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Kinh do (Longitude)</label>
                    <input type="text" value={locationForm.longitude}
                      onChange={(e) => setLocationForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      placeholder="VD: 108.335000"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]" />
                  </div>
                </div>

                <div>
                  <button type="button" onClick={handleUseCurrentLocation}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#00288e] bg-blue-50 hover:bg-blue-100 transition-all text-sm font-bold">
                    <Crosshair size={18} />
                    Dung vi tri hien tai
                  </button>
                  <p className="text-xs text-gray-400 mt-2">Chi cap nhat toa do theo GPS, khong tu thay doi dia chi.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Ban kinh cho phep (met)</label>
                  <div className="relative">
                    <input type="number" value={locationForm.radius}
                      onChange={(e) => setLocationForm((prev) => ({ ...prev, radius: e.target.value }))}
                      className="w-full h-12 px-4 pr-14 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e]" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">Met</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Nhan vien chi duoc cham cong trong pham vi ban kinh nay.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border border-green-200 bg-white">
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500 text-white shrink-0">
            <CheckCircle size={14} strokeWidth={3} />
          </div>
          <p className="text-sm font-bold text-green-600">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}
