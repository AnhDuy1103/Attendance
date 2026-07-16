import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import {
  Download,
  ListChecks,
  CheckCircle,
  Clock,
  XCircle,
  Timer,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  ChevronDown,
  Calendar,
} from "lucide-react";
import { attendanceApi, AdminAttendanceResponse, approveForgotCheckout } from "../../api/attendanceApi";
import { ClipboardCheck } from "lucide-react";

// --- Helpers for Date/Month values ---
const padNumber = (value: number) => {
  return String(value).padStart(2, "0");
};

const getTodayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  const day = padNumber(now.getDate());
  return `${year}-${month}-${day}`;
};

const getCurrentMonthValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1);
  return `${year}-${month}`;
};

// ─── Pagination Btn ───────────────────────────────────────────
function PageBtn({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      style={{
        background: active ? "#1e40af" : "#fff",
        color: active ? "#fff" : "#444653",
        border: active ? "none" : "1.5px solid #c4c5d5",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = "#f8f9ff";
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) (e.currentTarget as HTMLButtonElement).style.background = "#fff";
      }}
    >
      {label}
    </button>
  );
}

// ─── Page Component ───────────────────────────────────────────
export default function AttendanceHistoryPage() {
  const [attendances, setAttendances] = useState<AdminAttendanceResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Tất cả");
  const [selectedStatus, setSelectedStatus] = useState("Tất cả");

  // --- Date/Month Filter States ---
  type TimeFilterMode = "day" | "month";
  const [filterMode, setFilterMode] = useState<TimeFilterMode>("day");
  const [isTimeModeDropdownOpen, setIsTimeModeDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(getTodayDateValue());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
  const timeModeDropdownRef = useRef<HTMLDivElement | null>(null);

  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const monthInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedAttendance, setSelectedAttendance] = useState<AdminAttendanceResponse | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [toastMessage, setToastMessage] = useState("");

  // ── Approve Forgot Checkout State ──
  const [isApprovingForgotCheckout, setIsApprovingForgotCheckout] = useState(false);
  const [approveError, setApproveError] = useState("");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // ── Approve Forgot Checkout Handler ──
  const handleApproveForgotCheckout = async () => {
    if (!selectedAttendance) return;
    if (!isForgotCheckoutRecord(selectedAttendance)) {
      setApproveError("Bản ghi này không còn thuộc trạng thái quên check-out");
      return;
    }

    try {
      setIsApprovingForgotCheckout(true);
      setApproveError("");
      setShowApproveConfirm(false);

      const updated = await approveForgotCheckout(selectedAttendance.attendanceId);

      // Cập nhật selectedAttendance với dữ liệu mới từ server
      setSelectedAttendance((prev) =>
        prev
          ? {
              ...prev,
              checkOutTime: updated.checkOutTime,
              actualHours: updated.actualHours,
              overtimeHours: updated.overtimeHours,
              status: updated.status,
              note: updated.note,
            }
          : prev
      );

      // Refresh danh sách để cập nhật card Quên check-out
      await fetchAttendances();

      triggerToast("Đã duyệt giờ ra theo giờ kết thúc ca");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể duyệt bản ghi quên check-out";
      setApproveError(message);
    } finally {
      setIsApprovingForgotCheckout(false);
    }
  };

  // --- Load Data ---
  const fetchAttendances = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const data = await attendanceApi.getAllAttendances();
      setAttendances(data);
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || "Không thể tải lịch sử chấm công";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  // --- Background Scroll Lock ---
  useEffect(() => {
    if (selectedAttendance) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedAttendance]);

  // --- Click outside time filter dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        timeModeDropdownRef.current &&
        !timeModeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimeModeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getFilterModeLabel = () => {
    return filterMode === "day" ? "Theo ngày" : "Theo tháng";
  };

  const handleSelectFilterMode = (mode: TimeFilterMode) => {
    setFilterMode(mode);
    setIsTimeModeDropdownOpen(false);
    if (mode === "day" && !selectedDate) {
      setSelectedDate(getTodayDateValue());
    }
    if (mode === "month" && !selectedMonth) {
      setSelectedMonth(getCurrentMonthValue());
    }
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const openMonthPicker = () => {
    const input = monthInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  // --- Formatter Helpers ---
  const formatTimeFromApi = (value?: string | null) => {
    if (!value) return "-";
    if (value.includes(":") && !value.includes("T")) {
      return value.slice(0, 5);
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateDisplay = (dateValue: string) => {
    if (!dateValue) return "Chọn ngày";
    const [year, month, day] = dateValue.split("-");
    if (!year || !month || !day) return dateValue;
    return `${day}/${month}/${year}`;
  };

  const formatMonthDisplay = (monthValue: string) => {
    if (!monthValue) return "Chọn tháng";
    const [year, month] = monthValue.split("-");
    if (!year || !month) return monthValue;
    return `${Number(month)}/${year}`;
  };

  const normalizeDateValue = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("T")) {
      return value.split("T")[0];
    }
    return value.slice(0, 10);
  };

  const isForgotCheckoutRecord = (item: {
    attendanceDate?: string | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }) => {
    const itemDate = normalizeDateValue(item.attendanceDate);
    const today = getTodayDateValue();
    return Boolean(
      item.checkInTime &&
      !item.checkOutTime &&
      itemDate &&
      itemDate < today
    );
  };

  const isWorkingTodayRecord = (item: {
    attendanceDate?: string | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
  }) => {
    const itemDate = normalizeDateValue(item.attendanceDate);
    const today = getTodayDateValue();
    return Boolean(
      item.checkInTime &&
      !item.checkOutTime &&
      itemDate === today
    );
  };

  const isLateRecord = (item: { status?: string | null }) => {
    const status = String(item.status || "").toLowerCase();
    return (
      status === "late" ||
      status === "đi trễ" ||
      status === "di tre"
    );
  };

  const getDisplayStatus = (item: {
    attendanceDate?: string | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    status: string;
  }) => {
    if (isForgotCheckoutRecord(item)) {
      return "ForgotCheckout";
    }
    if (item.status === "Late") {
      return "Late";
    }
    if (item.status === "OnTime") {
      return "OnTime";
    }
    if (isWorkingTodayRecord(item)) {
      return "Working";
    }
    return item.status;
  };

  const formatDateForFileName = (dateValue: string) => {
    if (!dateValue) return "";
    const [year, month, day] = dateValue.split("-");
    if (!year || !month || !day) return dateValue;
    return `${day}-${month}-${year}`;
  };

  const formatMonthForFileName = (monthValue: string) => {
    const [year, month] = monthValue.split("-");
    if (!year || !month) return monthValue;
    return `${month}-${year}`;
  };

  const getExportFileName = () => {
    if (filterMode === "day") {
      return `BaoCaoChamCong_${formatDateForFileName(selectedDate)}.xlsx`;
    }
    return `BaoCaoChamCong_Thang_${formatMonthForFileName(selectedMonth)}.xlsx`;
  };

  const formatHours = (value?: number | null) => {
    if (value === null || value === undefined) return "-";
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  };

  const formatOvertime = (value?: number | null) => {
    if (!value || value <= 0) return "-";
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `+${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OnTime":
        return "Đúng giờ";
      case "Late":
        return "Đi trễ";
      case "Absent":
        return "Vắng";
      case "ForgotCheckout":
        return "Quên check-out";
      case "InvalidLocation":
        return "Sai vị trí";
      case "Working":
        return "Đang làm việc";
      default:
        return status || "Không xác định";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OnTime":
        return "bg-green-100 text-green-700";
      case "Late":
        return "bg-orange-100 text-orange-700";
      case "Absent":
        return "bg-red-100 text-red-700";
      case "ForgotCheckout":
        return "bg-purple-100 text-purple-700";
      case "InvalidLocation":
        return "bg-red-100 text-red-700";
      case "Working":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "NV";
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 1) return words[0][0].toUpperCase();
    return words
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // --- Constants ---
  const departments = [
    "Tất cả",
    "Phòng sản xuất",
    "Phòng kho",
    "Phòng kế toán",
    "Phòng kỹ thuật",
  ];

  const statuses = [
    { value: "Tất cả", label: "Tất cả" },
    { value: "OnTime", label: "Đúng giờ" },
    { value: "Late", label: "Đi trễ" },
    { value: "Absent", label: "Vắng" },
    { value: "ForgotCheckout", label: "Quên check-out" },
    { value: "InvalidLocation", label: "Sai vị trí" },
  ];

  // --- Filter Data ---
  const filteredAttendances = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return attendances.filter((item) => {
      const matchKeyword =
        !keyword ||
        item.employeeCode?.toLowerCase().includes(keyword) ||
        (item.fullName || item.employeeName || "")?.toLowerCase().includes(keyword) ||
        item.department?.toLowerCase().includes(keyword) ||
        item.position?.toLowerCase().includes(keyword);

      const matchDepartment =
        selectedDepartment === "Tất cả" ||
        item.department === selectedDepartment;

      const matchStatus =
        selectedStatus === "Tất cả" ||
        (selectedStatus === "Late"
          ? isLateRecord(item)
          : selectedStatus === "ForgotCheckout"
          ? isForgotCheckoutRecord(item)
          : getDisplayStatus(item) === selectedStatus);

      const itemDate = normalizeDateValue(item.attendanceDate);

      let matchTime = true;
      if (filterMode === "day") {
        matchTime = !selectedDate || itemDate === selectedDate;
      } else if (filterMode === "month") {
        matchTime = !selectedMonth || itemDate.startsWith(selectedMonth);
      }

      return matchKeyword && matchDepartment && matchStatus && matchTime;
    });
  }, [
    attendances,
    searchTerm,
    selectedDepartment,
    selectedStatus,
    filterMode,
    selectedDate,
    selectedMonth,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedDepartment,
    selectedStatus,
    filterMode,
    selectedDate,
    selectedMonth,
  ]);

  // --- Stats Card Calculation ---
  const stats = useMemo(() => {
    return {
      total: filteredAttendances.length,
      onTime: filteredAttendances.filter((item) => getDisplayStatus(item) === "OnTime").length,
      late: filteredAttendances.filter(isLateRecord).length,
      absent: filteredAttendances.filter((item) => getDisplayStatus(item) === "Absent").length,
      overtime: filteredAttendances.filter((item) => (item.overtimeHours || 0) > 0).length,
      forgotCheckout: filteredAttendances.filter(isForgotCheckoutRecord).length,
    };
  }, [filteredAttendances]);

  const statCards = [
    { title: "Tổng bản ghi", value: stats.total.toLocaleString(), icon: <ListChecks size={20} />, color: "#64748b", bg: "#f8fafc" },
    { title: "Đúng giờ", value: stats.onTime.toLocaleString(), icon: <CheckCircle size={20} />, color: "#16a34a", bg: "#dcfce7" },
    { title: "Đi trễ", value: stats.late.toLocaleString(), icon: <Clock size={20} />, color: "#ea580c", bg: "#ffedd5" },
    { title: "Vắng", value: stats.absent.toLocaleString(), icon: <XCircle size={20} />, color: "#dc2626", bg: "#fee2e2" },
    { title: "Tăng ca", value: stats.overtime.toLocaleString(), icon: <Timer size={20} />, color: "#2563eb", bg: "#dbeafe" },
    { title: "Quên check-out", value: stats.forgotCheckout.toLocaleString(), icon: <AlertTriangle size={20} />, color: "#7c3aed", bg: "#ede9fe" },
  ];

  // --- Pagination Calculation ---
  const totalPages = Math.ceil(filteredAttendances.length / pageSize);

  const paginatedAttendances = useMemo(() => {
    return filteredAttendances.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredAttendances, currentPage]);

  const startIndex =
    filteredAttendances.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const endIndex = Math.min(currentPage * pageSize, filteredAttendances.length);

  // --- Reset Filter Handler ---
  const handleResetFilter = () => {
    setSearchTerm("");
    setSelectedDepartment("Tất cả");
    setSelectedStatus("Tất cả");
    setFilterMode("day");
    setSelectedDate(getTodayDateValue());
    setSelectedMonth(getCurrentMonthValue());
    setIsTimeModeDropdownOpen(false);
    setCurrentPage(1);
  };

  // --- CSV Export Handler ---
  // --- Excel Export Handler ---
  const handleExportReport = () => {
    if (filteredAttendances.length === 0) {
      triggerToast("Không có dữ liệu để xuất báo cáo");
      return;
    }

    const exportData = filteredAttendances.map((item, index) => ({
      "STT": index + 1,
      "Mã nhân viên": item.employeeCode || "",
      "Họ tên": item.fullName || item.employeeName || "",
      "Phòng ban": item.department || "",
      "Chức vụ": item.position || "",
      "Ngày chấm công": formatDate(item.attendanceDate),
      "Giờ vào": formatTimeFromApi(item.checkInTime),
      "Giờ ra": formatTimeFromApi(item.checkOutTime),
      "Tổng giờ": formatHours(item.actualHours),
      "Tăng ca": formatOvertime(item.overtimeHours),
      "Vị trí": item.locationName || "",
      "Trạng thái": getStatusText(getDisplayStatus(item)),
      "Ghi chú": item.note || "Không có",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 25 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "LichSuChamCong"
    );

    const fileName = getExportFileName();

    XLSX.writeFile(workbook, fileName);

    if (selectedDate) {
      triggerToast(`Đã xuất báo cáo ngày ${formatDate(selectedDate)}`);
    } else {
      triggerToast("Đã xuất báo cáo tất cả bản ghi");
    }
  };

  // --- Close Detail Modal helper ---
  const closeDetailModal = () => {
    setSelectedAttendance(null);
    setApproveError("");
    setShowApproveConfirm(false);
  };

  // --- Portal Render Portal Modal ---
  const renderAttendanceDetailModal = () => {
    if (!selectedAttendance) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[2147483647] w-screen h-screen bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        onClick={() => { if (!isApprovingForgotCheckout) closeDetailModal(); }}
      >
        <div
          className="w-full max-w-3xl max-h-[90dvh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-8 py-6 border-b border-gray-200 shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiết chấm công
              </h2>
              <p className="text-gray-500 mt-1">
                Thông tin check-in, check-out và trạng thái chấm công của nhân viên.
              </p>
            </div>

            <button
              type="button"
              onClick={closeDetailModal}
              disabled={isApprovingForgotCheckout}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <X size={22} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#00288e] text-white flex items-center justify-center font-bold text-lg">
                {getInitials(selectedAttendance.fullName || selectedAttendance.employeeName || "Nhân viên")}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedAttendance.fullName || selectedAttendance.employeeName || "Nhân viên"}
                </h3>
                <p className="text-gray-500">
                  {selectedAttendance.employeeCode || "-"} • {selectedAttendance.department || "-"} • {selectedAttendance.position || "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Ngày chấm công</p>
                <p className="font-bold text-gray-900 mt-1">
                  {formatDate(selectedAttendance.attendanceDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Trạng thái</p>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusClass(getDisplayStatus(selectedAttendance))}`}>
                    {getStatusText(getDisplayStatus(selectedAttendance))}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Giờ vào</p>
                <p className="font-bold text-gray-950 mt-1 text-base">
                  {formatTimeFromApi(selectedAttendance.checkInTime)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Giờ ra</p>
                <p className="font-bold text-gray-950 mt-1 text-base">
                  {formatTimeFromApi(selectedAttendance.checkOutTime)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Tổng giờ làm</p>
                <p className="font-bold text-gray-900 mt-1">
                  {formatHours(selectedAttendance.actualHours)}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Tăng ca</p>
                <p className="font-bold text-blue-700 mt-1">
                  {formatOvertime(selectedAttendance.overtimeHours)}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase">Vị trí chấm công</p>
              <p className="font-bold text-gray-900 mt-1">
                {selectedAttendance.locationName || "-"}
              </p>
              {selectedAttendance.locationAddress && (
                <p className="text-gray-500 mt-1 text-xs">
                  {selectedAttendance.locationAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Tọa độ check-in</p>
                <p className="font-mono text-gray-900 mt-1 text-xs">
                  {selectedAttendance.checkInLat && selectedAttendance.checkInLong
                    ? `${selectedAttendance.checkInLat}, ${selectedAttendance.checkInLong}`
                    : "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Tọa độ check-out</p>
                <p className="font-mono text-gray-900 mt-1 text-xs">
                  {selectedAttendance.checkOutLat && selectedAttendance.checkOutLong
                    ? `${selectedAttendance.checkOutLat}, ${selectedAttendance.checkOutLong}`
                    : "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 p-4 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase">Ghi chú</p>
              <p className="font-bold text-gray-800 mt-1 text-sm">
                {selectedAttendance.note || "Không có"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col gap-3 px-8 py-5 border-t border-gray-200 bg-white shrink-0">
            {/* Error message */}
            {approveError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {approveError}
              </div>
            )}

            {/* Confirm prompt */}
            {showApproveConfirm && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  Bạn có chắc muốn duyệt bản ghi này? Giờ ra sẽ được ghi nhận theo giờ kết thúc ca tiêu chuẩn.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setShowApproveConfirm(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveForgotCheckout}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-[#00288e] text-white hover:bg-[#002070] transition-colors cursor-pointer"
                  >
                    Xác nhận duyệt
                  </button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeDetailModal}
                disabled={isApprovingForgotCheckout}
                className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Đóng
              </button>

              {isForgotCheckoutRecord(selectedAttendance) && (
                <button
                  type="button"
                  onClick={() => {
                    setApproveError("");
                    setShowApproveConfirm(true);
                  }}
                  disabled={isApprovingForgotCheckout || showApproveConfirm}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00288e] text-white font-bold shadow-lg hover:bg-[#001f70] disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {isApprovingForgotCheckout ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang duyệt...
                    </>
                  ) : (
                    <>
                      <ClipboardCheck size={18} />
                      Duyệt giờ ra
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <>
      <div className="page-container animate-fade-in" style={{ maxWidth: "100%" }}>
        {errorMessage && (
          <div className="rounded-xl p-4 mb-6 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-medium" style={{ color: "#444653" }}>
              Theo dõi dữ liệu check-in, check-out, tổng giờ làm và trạng thái chấm công của nhân viên.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Lọc theo</span>
              <div className="relative" ref={timeModeDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsTimeModeDropdownOpen((prev) => !prev)}
                  className="h-12 px-4 rounded-xl border border-gray-300 bg-white text-gray-800 font-semibold flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {getFilterModeLabel()}
                  <ChevronDown size={18} />
                </button>

                {isTimeModeDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleSelectFilterMode("day")}
                      className={
                        filterMode === "day"
                          ? "w-full px-4 py-3 text-left bg-[#00288e] text-white font-semibold cursor-pointer"
                          : "w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                      }
                    >
                      Theo ngày
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectFilterMode("month")}
                      className={
                        filterMode === "month"
                          ? "w-full px-4 py-3 text-left bg-[#00288e] text-white font-semibold cursor-pointer"
                          : "w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 font-medium cursor-pointer"
                      }
                    >
                      Theo tháng
                    </button>
                  </div>
                )}
              </div>

              {filterMode === "day" ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={openDatePicker}
                    className="h-12 min-w-[180px] px-4 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold flex items-center justify-between gap-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e] transition-colors cursor-pointer"
                  >
                    <span>{formatDateDisplay(selectedDate)}</span>
                    <Calendar size={18} className="text-gray-600 animate-pulse" />
                  </button>

                  <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                    tabIndex={-1}
                  />
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={openMonthPicker}
                    className="h-12 min-w-[180px] px-4 rounded-xl border border-gray-300 bg-white text-gray-900 font-semibold flex items-center justify-between gap-3 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00288e]/20 focus:border-[#00288e] transition-colors cursor-pointer"
                  >
                    <span>{formatMonthDisplay(selectedMonth)}</span>
                    <Calendar size={18} className="text-gray-600 animate-pulse" />
                  </button>

                  <input
                    ref={monthInputRef}
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                    tabIndex={-1}
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.98] cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #1e40af 0%, #00288e 100%)",
                boxShadow: "0 2px 8px rgba(0,40,142,0.2)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              <Download size={16} />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {statCards.map((s, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex items-center gap-4 transition-shadow hover:shadow-md cursor-default"
              style={{
                background: "#fff",
                border: "1px solid #e8eaf4",
                borderLeft: `4px solid ${s.color}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#9da3b4" }}>
                  {s.title}
                </p>
                <p className="text-xl font-bold mt-0.5" style={{ color: "#0b1c30" }}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Card (Filter + Table) ── */}
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: "#fff",
            border: "1px solid #e8eaf4",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          {/* ── Filter Bar ── */}
          <div
            className="flex flex-col sm:flex-row items-center gap-3 p-4 shrink-0"
            style={{ borderBottom: "1px solid #e8eaf4" }}
          >
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#9da3b4" }}
              />
              <input
                type="text"
                placeholder="Tìm tên, mã NV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-colors"
                style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
              />
            </div>

            {/* Department */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === "Tất cả" ? "Tất cả phòng ban" : d}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label === "Tất cả" ? "Tất cả trạng thái" : s.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleResetFilter}
              className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0 cursor-pointer"
              style={{ background: "#fff", color: "#444653", border: "1.5px solid #c4c5d5" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f1f5f9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
            >
              Đặt lại
            </button>

            <button
              onClick={fetchAttendances}
              className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-semibold text-white transition-opacity shrink-0 cursor-pointer"
              style={{ background: "#1e40af" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            >
              Lọc
            </button>
          </div>

          {/* ── Table ── */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ background: "#f8f9ff", borderBottom: "1px solid #e8eaf4" }}>
                  {["Mã NV", "Họ tên", "Phòng ban", "Ngày", "Giờ vào", "Giờ ra", "Tổng giờ", "Tăng ca", "Vị trí", "Trạng thái", "Ghi chú"].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "#9da3b4" }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-sm" style={{ color: "#9da3b4" }}>
                      Đang tải dữ liệu chấm công...
                    </td>
                  </tr>
                ) : paginatedAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-16 text-center text-sm" style={{ color: "#9da3b4" }}>
                      Không tìm thấy dữ liệu chấm công.
                    </td>
                  </tr>
                ) : (
                  paginatedAttendances.map((row, idx) => (
                    <tr
                      key={row.attendanceId}
                      onClick={() => setSelectedAttendance(row)}
                      className="cursor-pointer transition-colors duration-100"
                      style={{ borderBottom: idx < paginatedAttendances.length - 1 ? "1px solid #f1f3f9" : "none" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#f0f5ff"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-xs font-bold text-gray-700">
                        {row.employeeCode || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: "#1e40af" }}
                          >
                            {getInitials(row.fullName || row.employeeName || "Nhân viên")}
                          </div>
                          <span className="font-semibold" style={{ color: "#0b1c30" }}>
                            {row.fullName || row.employeeName || "Nhân viên"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#444653" }}>
                        {row.department || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#444653" }}>
                        {formatDate(row.attendanceDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {formatTimeFromApi(row.checkInTime)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                        {formatTimeFromApi(row.checkOutTime)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-800">
                        {formatHours(row.actualHours)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-700">
                        {formatOvertime(row.overtimeHours)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600 font-medium" style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.locationName || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusClass(getDisplayStatus(row))}`}>
                          {getStatusText(getDisplayStatus(row))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">
                        {row.note || "Không có"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          {filteredAttendances.length > 0 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 shrink-0"
              style={{ borderTop: "1px solid #e8eaf4", background: "#f8f9ff" }}
            >
              <p className="text-xs font-medium" style={{ color: "#9da3b4" }}>
                Hiển thị {startIndex}-{endIndex} trong {filteredAttendances.length} bản ghi
              </p>
              <div className="flex items-center gap-1.5">
                <PageBtn
                  label={<ChevronLeft size={14} />}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                />
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <PageBtn
                      key={p}
                      label={p}
                      active={currentPage === p}
                      onClick={() => setCurrentPage(p)}
                    />
                  );
                })}
                <PageBtn
                  label={<ChevronRight size={14} />}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {renderAttendanceDetailModal()}

      {/* ── Toast Message ── */}
      {toastMessage && (
        <div
          className="fixed top-20 right-6 z-[9999] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border bg-white animate-fade-in-up"
          style={{ borderColor: "#bbf7d0" }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center bg-green-500 text-white shrink-0">
            <Check size={12} strokeWidth={3} />
          </div>
          <p className="text-sm font-bold" style={{ color: "#16a34a" }}>
            {toastMessage}
          </p>
        </div>
      )}
    </>
  );
}
