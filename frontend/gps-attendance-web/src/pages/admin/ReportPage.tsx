import { useEffect, useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  CalendarClock,
  ClockAlert,
  Timer,
  AlertCircle,
  UserRoundX,
  Building2,
  Check,
} from "lucide-react";
import * as XLSX from "xlsx";
import { reportApi, ReportAttendanceRecord } from "../../api/reportApi";
import { attendanceApi } from "../../api/attendanceApi";

// ─── Types ────────────────────────────────────────────────────
type SummaryCard = {
  id: string;
  title: string;
  value: string;
  note: string;
  variant: "primary" | "danger" | "neutral" | "warning";
};

// ─── Helpers ──────────────────────────────────────────────────
function getCardIcon(id: string) {
  switch (id) {
    case "1":
      return <CalendarClock size={28} />;
    case "2":
      return <ClockAlert size={28} />;
    case "3":
      return <Timer size={28} />;
    case "4":
      return <AlertCircle size={28} />;
    default:
      return <CalendarClock size={28} />;
  }
}

function getCardColors(variant: SummaryCard["variant"], id: string) {
  if (id === "4") return { text: "#7c3aed", bg: "#ede9fe" };
  switch (variant) {
    case "primary":
      return { text: "#1e40af", bg: "#eff6ff" };
    case "danger":
      return { text: "#ea580c", bg: "#ffedd5" };
    case "warning":
      return { text: "#7c3aed", bg: "#ede9fe" };
    default:
      return { text: "#444653", bg: "#f8f9ff" };
  }
}

// ─── ReportPage Component ─────────────────────────────────────
export default function ReportPage() {
  const [records, setRecords] = useState<ReportAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("Tất cả phòng ban");

  // --- Departments list ---
  const departments = [
    "Tất cả phòng ban",
    "Phòng sản xuất",
    "Phòng kho",
    "Phòng kế toán",
    "Phòng kỹ thuật",
  ];

  // --- Success Toast trigger ---
  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // --- Load Data ---
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = {
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          department:
            selectedDepartment === "Tất cả phòng ban"
              ? undefined
              : selectedDepartment,
        };

        const report = await reportApi.getAttendanceReport(params);
        setRecords(report.records || []);
        return;
      } catch (reportError) {
        console.warn("Report API chưa có, fallback sang /attendance/all");
      }

      const data = await attendanceApi.getAllAttendances();
      setRecords(data);
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message || "Không thể tải dữ liệu báo cáo";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // --- Date helpers ---
  const getEmployeeDisplayName = (item: ReportAttendanceRecord) => {
    return (
      item.fullName?.trim() ||
      item.employeeName?.trim() ||
      item.name?.trim() ||
      item.employeeCode?.trim() ||
      "Không xác định"
    );
  };

  const normalizeDateValue = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("T")) {
      return value.split("T")[0];
    }
    return value.slice(0, 10);
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

  const formatHours = (value?: number | null) => {
    if (value === null || value === undefined) return "0h";
    const totalMinutes = Math.round(value * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
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
      default:
        return status || "Không xác định";
    }
  };

  // --- Filter Records ---
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const itemDate = normalizeDateValue(item.attendanceDate);
      const matchFromDate = !fromDate || itemDate >= fromDate;
      const matchToDate = !toDate || itemDate <= toDate;

      const matchDepartment =
        selectedDepartment === "Tất cả phòng ban" ||
        item.department === selectedDepartment;

      return matchFromDate && matchToDate && matchDepartment;
    });
  }, [records, fromDate, toDate, selectedDepartment]);

  // --- Calculate Statistics ---
  const reportStats = useMemo(() => {
    const totalWorkingHours = filteredRecords.reduce(
      (sum, item) => sum + (item.actualHours || 0),
      0
    );

    const lateCount = filteredRecords.filter(
      (item) => item.status === "Late"
    ).length;

    const totalOvertimeHours = filteredRecords.reduce(
      (sum, item) => sum + (item.overtimeHours || 0),
      0
    );

    const forgotCheckoutCount = filteredRecords.filter(
      (item) =>
        item.status === "ForgotCheckout" ||
        (item.checkInTime && !item.checkOutTime)
    ).length;

    return {
      totalWorkingHours,
      lateCount,
      totalOvertimeHours,
      forgotCheckoutCount,
    };
  }, [filteredRecords]);

  // --- Summary cards configurations ---
  const summaryCards: SummaryCard[] = useMemo(() => {
    return [
      {
        id: "1",
        title: "Tổng giờ làm",
        value: formatHours(reportStats.totalWorkingHours),
        note: "* Dữ liệu theo bộ lọc hiện tại",
        variant: "primary",
      },
      {
        id: "2",
        title: "Tổng lượt đi trễ",
        value: reportStats.lateCount.toLocaleString(),
        note: "* Dữ liệu theo bộ lọc hiện tại",
        variant: "danger",
      },
      {
        id: "3",
        title: "Tổng giờ tăng ca",
        value: formatHours(reportStats.totalOvertimeHours),
        note: "* Dữ liệu theo bộ lọc hiện tại",
        variant: "primary",
      },
      {
        id: "4",
        title: "Tổng lượt quên check-out",
        value: reportStats.forgotCheckoutCount.toLocaleString(),
        note: "* Cần quản trị duyệt",
        variant: "warning",
      },
    ];
  }, [reportStats]);

  // --- Top Late Employees ---
  const topLateEmployees = useMemo(() => {
    const map = new Map<
      string,
      {
        employeeId?: number;
        employeeCode?: string;
        fullName: string;
        lateCount: number;
      }
    >();

    filteredRecords.forEach((item) => {
      if (item.status !== "Late") return;

      const key =
        item.employeeId?.toString() ||
        item.employeeCode ||
        getEmployeeDisplayName(item);

      const current = map.get(key);

      if (current) {
        current.lateCount += 1;
      } else {
        map.set(key, {
          employeeId: item.employeeId,
          employeeCode: item.employeeCode,
          fullName: getEmployeeDisplayName(item),
          lateCount: 1,
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.lateCount - a.lateCount)
      .slice(0, 5);
  }, [filteredRecords]);

  // Log debug tạm thời
  useEffect(() => {
    console.log("Report records:", records);
    console.log("Filtered records:", filteredRecords);
    console.log("Top late employees:", topLateEmployees);
  }, [records, filteredRecords, topLateEmployees]);

  const maxLateCount = useMemo(() => {
    return Math.max(...topLateEmployees.map((item) => item.lateCount), 1);
  }, [topLateEmployees]);

  // --- Overtime by Department ---
  const overtimeByDepartment = useMemo(() => {
    const map = new Map<string, number>();

    filteredRecords.forEach((item) => {
      const department = item.department || "Không xác định";
      const overtime = item.overtimeHours || 0;
      map.set(department, (map.get(department) || 0) + overtime);
    });

    return Array.from(map.entries())
      .map(([department, totalOvertimeHours]) => ({
        department,
        totalOvertimeHours,
      }))
      .sort((a, b) => b.totalOvertimeHours - a.totalOvertimeHours);
  }, [filteredRecords]);

  const maxOvertime = useMemo(() => {
    return Math.max(...overtimeByDepartment.map((item) => item.totalOvertimeHours), 1);
  }, [overtimeByDepartment]);

  // --- Reset Filter Handler ---
  const handleResetFilter = () => {
    setFromDate("");
    setToDate("");
    setSelectedDepartment("Tất cả phòng ban");
  };

  // --- Excel File Name Helpers ---
  const formatDateForFileName = (dateValue: string) => {
    if (!dateValue) return "";
    const [year, month, day] = dateValue.split("-");
    if (!year || !month || !day) return dateValue;
    return `${day}-${month}-${year}`;
  };

  const getExportFileName = () => {
    if (fromDate && toDate) {
      return `BaoCaoThongKeChamCong_${formatDateForFileName(fromDate)}_den_${formatDateForFileName(toDate)}.xlsx`;
    }
    if (fromDate) {
      return `BaoCaoThongKeChamCong_Tu_${formatDateForFileName(fromDate)}.xlsx`;
    }
    if (toDate) {
      return `BaoCaoThongKeChamCong_Den_${formatDateForFileName(toDate)}.xlsx`;
    }
    return "BaoCaoThongKeChamCong_TatCaDuLieu.xlsx";
  };

  // --- Export dynamic data to XLSX ---
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      triggerToast("Không có dữ liệu để xuất file Excel");
      return;
    }

    const summaryData = [
      {
        "Chỉ tiêu": "Tổng giờ làm",
        "Giá trị": formatHours(reportStats.totalWorkingHours),
      },
      {
        "Chỉ tiêu": "Tổng lượt đi trễ",
        "Giá trị": reportStats.lateCount,
      },
      {
        "Chỉ tiêu": "Tổng giờ tăng ca",
        "Giá trị": formatHours(reportStats.totalOvertimeHours),
      },
      {
        "Chỉ tiêu": "Tổng lượt quên check-out",
        "Giá trị": reportStats.forgotCheckoutCount,
      },
    ];

    const detailData = filteredRecords.map((item, index) => ({
      "STT": index + 1,
      "Mã nhân viên": item.employeeCode || "",
      "Họ tên": item.fullName || item.employeeName || "",
      "Phòng ban": item.department || "",
      "Chức vụ": item.position || "",
      "Ngày chấm công": formatDate(item.attendanceDate),
      "Giờ vào": item.checkInTime || "",
      "Giờ ra": item.checkOutTime || "",
      "Tổng giờ": formatHours(item.actualHours),
      "Tăng ca": formatHours(item.overtimeHours),
      "Trạng thái": getStatusText(item.status),
      "Vị trí": item.locationName || "",
      "Ghi chú": item.note || "Không có",
    }));

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    const detailSheet = XLSX.utils.json_to_sheet(detailData);

    summarySheet["!cols"] = [{ wch: 30 }, { wch: 25 }];
    detailSheet["!cols"] = [
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
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "TongHop");
    XLSX.utils.book_append_sheet(workbook, detailSheet, "ChiTietChamCong");

    XLSX.writeFile(workbook, getExportFileName());
    triggerToast("Xuất file Excel thành công");
  };

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: "100%" }}>
      {errorMessage && (
        <div className="rounded-xl p-4 mb-6 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-xs font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* ── Filter Card ── */}
      <div
        className="rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-end gap-4"
        style={{
          background: "#fff",
          border: "1px solid #e8eaf4",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="w-full md:flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#444653" }}>
              Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#444653" }}>
              Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#444653" }}>
              Phòng ban
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none transition-colors"
              style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#0b1c30" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#1e40af"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#e8eaf4"; }}
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            type="button"
            onClick={handleResetFilter}
            className="h-12 w-12 rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            style={{ background: "#f8f9ff", border: "1.5px solid #e8eaf4", color: "#444653" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#e2e8f0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f8f9ff"; }}
            title="Đặt lại bộ lọc"
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            type="button"
            onClick={handleExportExcel}
            className="h-12 px-6 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Download size={18} />
            Xuất file Excel
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-sm font-semibold text-gray-500">
          Đang tải dữ liệu báo cáo...
        </div>
      ) : (
        <>
          {/* ── Summary Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {summaryCards.map((card) => {
              const colors = getCardColors(card.variant, card.id);
              return (
                <div
                  key={card.id}
                  className="rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1 relative overflow-hidden group"
                  style={{
                    background: "#fff",
                    border: "1px solid #e8eaf4",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <p className="text-sm font-semibold mb-1" style={{ color: "#444653" }}>
                        {card.title}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold" style={{ color: "#0b1c30" }}>
                          {card.value}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-medium relative z-10" style={{ color: "#9da3b4" }}>
                    {card.note}
                  </p>

                  {/* Background Icon */}
                  <div
                    className="absolute -right-4 -bottom-4 opacity-10 transition-transform duration-300 group-hover:scale-110"
                    style={{ color: colors.text }}
                  >
                    {getCardIcon(card.id)}
                  </div>
                  <div
                    className="absolute right-4 top-4 w-10 h-10 rounded-full flex items-center justify-center opacity-80"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {getCardIcon(card.id)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Charts Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Top Late Employees (Horizontal) */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "#fff",
                border: "1px solid #e8eaf4",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid #e8eaf4" }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#ffedd5", color: "#ea580c" }}
                >
                  <UserRoundX size={20} />
                </div>
                <h2 className="text-base font-bold" style={{ color: "#0b1c30" }}>
                  Top nhân viên đi trễ
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                {topLateEmployees.length === 0 ? (
                  <p className="text-sm text-center py-8 text-gray-400">Chưa có dữ liệu đi trễ</p>
                ) : (
                  topLateEmployees.map((item) => (
                    <div key={item.employeeId || item.employeeCode || item.fullName}>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">
                            {item.fullName}
                          </span>
                          {item.employeeCode && (
                            <p className="text-xs text-gray-400">
                              {item.employeeCode}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-gray-900">
                          {item.lateCount} lần
                        </span>
                      </div>

                      <div className="mt-2 h-2.5 rounded-full bg-blue-50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00288e]"
                          style={{
                            width: `${(item.lateCount / maxLateCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chart 2: Overtime by Department (Vertical) */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "#fff",
                border: "1px solid #e8eaf4",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center gap-3 mb-6 pb-4" style={{ borderBottom: "1px solid #e8eaf4" }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "#eff6ff", color: "#1e40af" }}
                >
                  <Building2 size={20} />
                </div>
                <h2 className="text-base font-bold" style={{ color: "#0b1c30" }}>
                  Tổng giờ tăng ca theo bộ phận
                </h2>
              </div>

              <div
                className="h-[280px] w-full flex items-end justify-between pt-4 pb-2 relative group"
                style={{ borderBottom: "2px solid #e8eaf4" }}
              >
                {overtimeByDepartment.length === 0 ? (
                  <p className="w-full text-sm text-center py-20 text-gray-400">Chưa có dữ liệu tăng ca</p>
                ) : (
                  overtimeByDepartment.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center flex-1 group/col relative h-full justify-end"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/col:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {formatHours(item.totalOvertimeHours)}
                      </div>

                      {/* Number above bar */}
                      <span className="text-[11px] font-bold mb-1" style={{ color: "#444653" }}>
                        {formatHours(item.totalOvertimeHours)}
                      </span>

                      {/* Bar Wrapper */}
                      <div className="w-full flex-1 flex items-end justify-center">
                        <div
                          className="w-[40%] max-w-[40px] rounded-t-lg transition-all duration-300"
                          style={{
                            height: `${Math.max((item.totalOvertimeHours / maxOvertime) * 180, 12)}px`,
                            background: "#1e40af",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "#00288e";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.background = "#1e40af";
                          }}
                        />
                      </div>

                      {/* Label */}
                      <span
                        className="text-xs font-semibold mt-2 text-center line-clamp-1 px-1"
                        style={{ color: "#444653" }}
                      >
                        {item.department}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

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
    </div>
  );
}
