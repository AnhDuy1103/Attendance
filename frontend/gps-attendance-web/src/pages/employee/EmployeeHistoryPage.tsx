import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  X,
  LogIn,
  LogOut,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import { attendanceApi } from '../../api/attendanceApi'

// ─── Types ────────────────────────────────────────────────────
type AttendanceHistoryItem = {
  attendanceId: number;
  attendanceDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
  locationName?: string;
  address?: string;
  note?: string | null;
};

type AvailablePeriod = {
  value: string; 
  month: number;
  year: number;
  label: string;
};

// ─── Component ────────────────────────────────────────────────
export default function EmployeeHistoryPage() {
  const [histories, setHistories] = useState<AttendanceHistoryItem[]>([]);
  const [filteredHistories, setFilteredHistories] = useState<AttendanceHistoryItem[]>([]);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [tempSelectedMonth, setTempSelectedMonth] = useState("");
  const [tempSelectedYear, setTempSelectedYear] = useState<number | null>(null);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceHistoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ─── Lock scroll when modal is open ───
  useEffect(() => {
    if (isMonthModalOpen || selectedRecord) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMonthModalOpen, selectedRecord]);

  // ─── Helpers ────────────────────────────────────────────────
  const formatTimeFromApi = (value: string | null | undefined) => {
    if (!value) return "--:--";

    if (value.includes(":") && !value.includes("T")) {
      return value.slice(0, 5);
    }

    if (value.includes("T")) {
      const timePart = value.split("T")[1];
      return timePart.slice(0, 5);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatTimeWithSecondsFromApi = (value: string | null | undefined) => {
    if (!value) return "--:--";

    if (value.includes(":") && !value.includes("T")) {
      return value;
    }

    if (value.includes("T")) {
      const timePart = value.split("T")[1];
      return timePart.split(".")[0].split("Z")[0]; // remove milliseconds and Z
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getDayDetails = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return { weekday: 'Th -', day: '--', fullDate: '' };
    }
    const weekdays = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
    const weekday = weekdays[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const fullDate = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return { weekday, day, fullDate };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OnTime":
        return "Đúng giờ";
      case "Late":
        return "Đi trễ";
      case "CheckedOut":
        return "Đã chấm công";
      case "InvalidLocation":
        return "Sai vị trí";
      case "ForgotCheckout":
        return "Quên check-out";
      case "Absent":
        return "Vắng mặt";
      default:
        return status || "Không xác định";
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "OnTime":
      case "CheckedOut":
        return {
          dot: 'bg-[#16a34a]',
          text: 'text-[#16a34a]',
          badge: 'bg-[#dcfce7] text-[#16a34a] border-[#bbf7d0]',
          borderLeft: 'border-l-transparent',
          checkInText: 'text-[#0b1c30]',
        };
      case "Late":
      case "ForgotCheckout":
        return {
          dot: 'bg-[#d97706]',
          text: 'text-[#d97706]',
          badge: 'bg-[#ffedd5] text-[#d97706] border-[#fed7aa]',
          borderLeft: 'border-l-[3px] border-l-[#d97706]',
          checkInText: 'text-[#d97706]',
        };
      case "InvalidLocation":
      case "Absent":
        return {
          dot: 'bg-[#ba1a1a]',
          text: 'text-[#ba1a1a]',
          badge: 'bg-[#fee2e2] text-[#ba1a1a] border-[#fecaca]',
          borderLeft: 'border-l-[3px] border-l-[#ba1a1a]',
          checkInText: 'text-[#ba1a1a]',
        };
      default:
        return {
          dot: 'bg-[#444653]',
          text: 'text-[#444653]',
          badge: 'bg-gray-100 text-gray-700 border-gray-200',
          borderLeft: 'border-l-transparent',
          checkInText: 'text-[#0b1c30]',
        };
    }
  };

  const formatNumber = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  // ─── Build available periods ───
  const buildAvailablePeriods = (data: AttendanceHistoryItem[]): AvailablePeriod[] => {
    const map = new Map<string, AvailablePeriod>();

    data.forEach((item) => {
      if (!item.attendanceDate) return;

      const date = new Date(item.attendanceDate);
      if (Number.isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const value = `${year}-${String(month).padStart(2, "0")}`;

      if (!map.has(value)) {
        map.set(value, {
          value,
          month,
          year,
          label: `Tháng ${String(month).padStart(2, "0")}, ${year}`,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  // ─── Fetch Histories ───
  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await attendanceApi.getMyHistory();
      setHistories(data);

      const periods = buildAvailablePeriods(data);
      setAvailablePeriods(periods);

      if (periods.length > 0) {
        setSelectedMonth(periods[0].value);
        setTempSelectedMonth(periods[0].value);
        setTempSelectedYear(periods[0].year);
      } else {
        setSelectedMonth("");
        setTempSelectedMonth("");
        setTempSelectedYear(null);
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể tải lịch sử chấm công";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // ─── Filtering logic ───
  const filterByMonth = (data: AttendanceHistoryItem[], monthValue: string) => {
    if (!monthValue) return [];

    return data.filter((item) => {
      if (!item.attendanceDate) return false;

      const date = new Date(item.attendanceDate);
      if (Number.isNaN(date.getTime())) return false;

      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return yearMonth === monthValue;
    });
  };

  useEffect(() => {
    const filtered = filterByMonth(histories, selectedMonth);
    // Sắp xếp ngày mới nhất lên trước
    filtered.sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
    setFilteredHistories(filtered);
  }, [histories, selectedMonth]);

  // ─── Stats ───
  const workedDays = filteredHistories.length;
  const lateDays = filteredHistories.filter(x => x.status === "Late").length;
  const absentDays = filteredHistories.filter(x => x.status === "Absent").length;

  const formatSelectedMonth = (monthValue: string) => {
    if (!monthValue) return "Chưa có dữ liệu";

    const period = availablePeriods.find((p) => p.value === monthValue);
    if (period) return period.label;

    const [year, month] = monthValue.split("-");
    return `Tháng ${month}, ${year}`;
  };

  // ─── Modal select Month/Year logic ───
  const openMonthModal = () => {
    setTempSelectedMonth(selectedMonth);

    const selectedPeriod = availablePeriods.find(
      (p) => p.value === selectedMonth
    );

    setTempSelectedYear(selectedPeriod?.year ?? availablePeriods[0]?.year ?? null);
    setIsMonthModalOpen(true);
  };

  const handleCloseMonthModal = () => {
    setIsMonthModalOpen(false);
  };

  const handleConfirmMonth = () => {
    if (!tempSelectedMonth) return;

    setSelectedMonth(tempSelectedMonth);
    setIsMonthModalOpen(false);
  };

  const handleSelectYear = (year: number) => {
    setTempSelectedYear(year);

    const firstPeriodOfYear = availablePeriods.find((p) => p.year === year);

    if (firstPeriodOfYear) {
      setTempSelectedMonth(firstPeriodOfYear.value);
    }
  };

  const availableYears = Array.from(
    new Set(availablePeriods.map((p) => p.year))
  ).sort((a, b) => b - a);

  const availableMonthsForSelectedYear = availablePeriods
    .filter((p) => p.year === tempSelectedYear)
    .sort((a, b) => a.month - b.month);

  const openDetail = (record: AttendanceHistoryItem) => {
    setSelectedRecord(record)
  }

  const closeDetail = () => {
    setSelectedRecord(null)
  }

  // ─── Render Portalled Month Selector Modal ───
  const renderMonthModal = () => {
    if (!isMonthModalOpen) return null;

    return createPortal(
      <div
        className="fixed left-0 top-0 right-0 bottom-0 z-[2147483647] w-[100vw] h-[100dvh] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
        onClick={handleCloseMonthModal}
      >
        <div
          className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Thanh kéo nhỏ (Mobile) */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6 sm:hidden" />

            {/* Header Modal */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[#0b1c30]">
                Chọn thời gian
              </h3>

              <button
                type="button"
                onClick={handleCloseMonthModal}
                className="w-11 h-11 rounded-full bg-[#eff4ff] flex items-center justify-center hover:bg-[#dce9ff] transition-colors"
              >
                <X className="w-5 h-5 text-[#444653]" />
              </button>
            </div>

            {/* Content (Grid 2 cột) */}
            {availablePeriods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 min-h-[300px]">
                <p className="text-sm font-semibold text-gray-500">Chưa có dữ liệu chấm công</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-0 mb-8 min-h-[300px]">
                {/* Cột Tháng (Bên trái) */}
                <div className="pr-4">
                  <p className="text-xs font-bold text-[#757684] uppercase tracking-wider mb-4">
                    Tháng
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {availableMonthsForSelectedYear.map((period) => {
                      const isActive = tempSelectedMonth === period.value;

                      return (
                        <button
                          key={period.value}
                          type="button"
                          onClick={() => setTempSelectedMonth(period.value)}
                          className={
                            isActive
                              ? "w-full py-3 px-4 rounded-xl bg-[#1e40af] text-white font-bold text-left shadow-sm"
                              : "w-full py-3 px-4 rounded-xl text-[#0b1c30] font-medium text-left hover:bg-[#eff4ff] transition-colors"
                          }
                        >
                          Tháng {String(period.month).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cột Năm (Bên phải) */}
                <div className="pl-4 border-l border-[#c4c5d5]/70">
                  <p className="text-xs font-bold text-[#757684] uppercase tracking-wider mb-4">
                    Năm
                  </p>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {availableYears.map((year) => {
                      const isActive = tempSelectedYear === year;

                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleSelectYear(year)}
                          className={
                            isActive
                              ? "w-full py-3 px-4 rounded-xl bg-[#1e40af] text-white font-bold text-left shadow-sm"
                              : "w-full py-3 px-4 rounded-xl text-[#0b1c30] font-medium text-left hover:bg-[#eff4ff] transition-colors"
                          }
                        >
                          Năm {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseMonthModal}
                className="flex-1 py-4 border border-[#c4c5d5] text-[#0b1c30] font-bold rounded-2xl active:scale-95 transition-transform bg-white"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmMonth}
                disabled={availablePeriods.length === 0 || !tempSelectedMonth}
                className="flex-1 py-4 bg-[#00288e] text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-transform disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  // ─── Render Portalled Detail Modal ───
  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    return createPortal(
      <div
        className="fixed left-0 top-0 right-0 bottom-0 z-[2147483647] w-[100vw] h-[100dvh] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-0 sm:px-4"
        onClick={closeDetail}
      >
        <div
          className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-fade-in-up flex flex-col"
          style={{ maxHeight: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Thanh kéo nhỏ (Mobile) */}
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-gray-300" />
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
            {/* Header Modal */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold" style={{ color: '#0b1c30' }}>
                Chi tiết chấm công
              </h2>
              <button
                onClick={closeDetail}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tóm tắt ngày */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: '#eff4ff', color: '#00288e' }}
                >
                  <p className="text-[10px] font-bold uppercase">{getDayDetails(selectedRecord.attendanceDate).weekday}</p>
                  <p className="text-xl font-black leading-tight">{getDayDetails(selectedRecord.attendanceDate).day}</p>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0b1c30' }}>{getDayDetails(selectedRecord.attendanceDate).fullDate}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-semibold mb-1" style={{ color: '#444653' }}>Trạng thái</p>
                <div
                  className={`px-2 py-1 border rounded font-bold text-[11px] ${getStatusStyle(selectedRecord.status).badge}`}
                >
                  {getStatusText(selectedRecord.status)}
                </div>
              </div>
            </div>

            {/* Timeline chấm công */}
            <div
              className="relative rounded-2xl p-5 mb-6"
              style={{ background: '#f8f9ff', border: '1px solid #e8eaf4' }}
            >
              {/* Đường đứt nét dọc */}
              <div
                className="absolute left-[39px] top-[40px] bottom-[40px] w-[2px] border-l-2 border-dashed"
                style={{ borderColor: '#c4c5d5' }}
              />

              {/* Mốc Giờ vào */}
              <div className="flex gap-4 mb-8 relative z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: '#ffffff', color: '#16a34a', border: '1px solid #e8eaf4' }}
                >
                  <LogIn size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#444653' }}>Giờ vào</p>
                  <p className="text-lg font-bold mb-1" style={{ color: '#0b1c30' }}>
                    {formatTimeWithSecondsFromApi(selectedRecord.checkInTime)}
                  </p>
                  <div className="flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: '#9da3b4' }} />
                    <p className="text-[11px] font-medium" style={{ color: '#444653' }}>
                      {selectedRecord.locationName || selectedRecord.address || "Vị trí không xác định"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mốc Giờ ra */}
              <div className="flex gap-4 relative z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: '#ffffff', color: '#ea580c', border: '1px solid #e8eaf4' }}
                >
                  <LogOut size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: '#444653' }}>Giờ ra</p>
                  <p className="text-lg font-bold mb-1" style={{ color: '#0b1c30' }}>
                    {formatTimeWithSecondsFromApi(selectedRecord.checkOutTime)}
                  </p>
                  <div className="flex items-start gap-1">
                    <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: '#9da3b4' }} />
                    <p className="text-[11px] font-medium" style={{ color: '#444653' }}>
                      {selectedRecord.locationName || selectedRecord.address || "Vị trí không xác định"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông tin thêm: Tổng giờ làm, Tăng ca, Ghi chú */}
            {(selectedRecord.actualHours != null || selectedRecord.overtimeHours != null || selectedRecord.note) && (
              <div className="space-y-3 mb-6 p-4 rounded-2xl border bg-gray-50 border-gray-200">
                {selectedRecord.actualHours != null && (
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-500">Tổng giờ làm:</span>
                    <span className="font-bold text-[#0b1c30]">{selectedRecord.actualHours}h</span>
                  </div>
                )}
                {selectedRecord.overtimeHours != null && selectedRecord.overtimeHours > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-500">Tăng ca:</span>
                    <span className="font-bold text-[#00288e]">{selectedRecord.overtimeHours}h</span>
                  </div>
                )}
                {selectedRecord.note && (
                  <div className="border-t pt-2 text-sm">
                    <p className="font-semibold text-gray-500 mb-1">Ghi chú:</p>
                    <p className="text-xs text-gray-700 bg-white p-2 rounded border">{selectedRecord.note}</p>
                  </div>
                )}
              </div>
            )}

            {/* Nút Xác nhận */}
            <button
              onClick={closeDetail}
              className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-transform active:scale-[0.98] shadow-md"
              style={{ background: '#00288e' }}
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* ── Header nội dung ── */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#0b1c30]">
              Lịch sử chấm công
            </h2>
            <p className="text-sm text-[#444653]">
              {formatSelectedMonth(selectedMonth)}
            </p>
          </div>

          {/* Nút lọc tháng ở giữa */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={openMonthModal}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-[#00288e]/20 rounded-full shadow-sm hover:bg-[#eff4ff] transition-all active:scale-95"
            >
              <CalendarDays className="w-5 h-5 text-[#00288e]" />
              <span className="text-sm font-semibold text-[#0b1c30]">
                {formatSelectedMonth(selectedMonth)}
              </span>
              <ChevronDown className="w-4 h-4 text-[#00288e]" />
            </button>
          </div>
        </section>

        {/* ── Thống kê tháng ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Card Công */}
          <div
            className="rounded-2xl p-3 text-center"
            style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Công</p>
            <p className="text-xl font-black" style={{ color: '#00288e' }}>
              {workedDays === 0 ? "0/26" : `${formatNumber(workedDays)}/26`}
            </p>
          </div>

          {/* Card Trễ */}
          <div
            className="rounded-2xl p-3 text-center"
            style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Trễ</p>
            <p className="text-xl font-black" style={{ color: '#d97706' }}>
              {formatNumber(lateDays)}
            </p>
          </div>

          {/* Card Vắng */}
          <div
            className="rounded-2xl p-3 text-center"
            style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Vắng</p>
            <p className="text-xl font-black" style={{ color: '#ba1a1a' }}>
              {formatNumber(absentDays)}
            </p>
          </div>
        </div>

        {/* ── Lỗi hiển thị ── */}
        {errorMessage && (
          <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* ── Danh sách lịch sử ── */}
        {isLoading ? (
          <div className="text-center py-8 text-sm font-semibold text-gray-500">
            Đang tải lịch sử...
          </div>
        ) : filteredHistories.length === 0 ? (
          <div className="rounded-2xl p-8 text-center border" style={{ background: '#ffffff', borderColor: '#c4c5d5' }}>
            <p className="text-sm font-semibold text-gray-500">
              Không có dữ liệu chấm công trong tháng này
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistories.map((item) => {
              const style = getStatusStyle(item.status);
              const dateDetails = getDayDetails(item.attendanceDate);

              return (
                <div
                  key={item.attendanceId}
                  onClick={() => openDetail(item)}
                  className={`rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-colors active:bg-[#eff4ff] hover:bg-[#f8f9ff] ${style.borderLeft}`}
                  style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  {/* Cột Ngày bên trái */}
                  <div
                    className="w-14 shrink-0 border-r flex flex-col justify-center text-center pr-3"
                    style={{ borderColor: '#e8eaf4' }}
                  >
                    <p className="text-xs font-semibold" style={{ color: '#444653' }}>{dateDetails.weekday}</p>
                    <p className="text-xl font-black" style={{ color: '#0b1c30' }}>{dateDetails.day}</p>
                  </div>

                  {/* Cột Nội dung ở giữa */}
                  <div className="flex-1 px-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-bold ${style.checkInText}`}>{formatTimeFromApi(item.checkInTime)}</span>
                      <span style={{ color: '#9da3b4' }}>→</span>
                      <span className="text-sm font-bold" style={{ color: '#0b1c30' }}>{formatTimeFromApi(item.checkOutTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <p className={`text-[11px] font-bold ${style.text}`}>
                        {getStatusText(item.status)}
                        {item.overtimeHours != null && item.overtimeHours > 0 && " (Tăng ca)"}
                      </p>
                    </div>
                  </div>

                  {/* Icon mũi tên bên phải */}
                  <div className="shrink-0" style={{ color: '#c4c5d5' }}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Portalled Popups ── */}
      {renderMonthModal()}
      {renderDetailModal()}
    </>
  )
}
