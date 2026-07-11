import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, CalendarDays, MapPin, AlertCircle } from 'lucide-react'
import { attendanceApi } from '../../api/attendanceApi'
import { STORAGE_KEYS } from '../../utils/constants'
import { workingHoursApi } from '../../api/workingHoursApi'

// ─── Types ────────────────────────────────────────────────────
type EmployeeProfile = {
  fullName: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  email?: string;
};

type TodayAttendance = {
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  actualHours: number | null;
  overtimeHours: number | null;
  status: string;
};

// ─── Component ────────────────────────────────────────────────
export default function EmployeeHomePage() {
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(new Date())

  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile>({
    fullName: "Nhân viên",
    department: "Đang cập nhật",
    position: "Nhân viên",
  })
  
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // --- Working Hour States ---
  type WorkingHourState = {
    startTime: string;
    endTime: string;
    shiftDuration?: number;
    overtime?: number;
  };

  const [workingHour, setWorkingHour] = useState<WorkingHourState>({
    startTime: "",
    endTime: "",
    shiftDuration: undefined,
    overtime: undefined,
  });
  const [isLoadingWorkingHour, setIsLoadingWorkingHour] = useState(false);

  // ─── Update Clock ───
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ─── Fetch Data ───
  const loadEmployeeProfile = () => {
    let userRaw = localStorage.getItem("user")
    if (!userRaw) {
      userRaw = localStorage.getItem(STORAGE_KEYS.USER_INFO)
    }

    if (!userRaw) return

    try {
      const user = JSON.parse(userRaw)
      setEmployeeProfile({
        fullName: user.fullName || "Nhân viên",
        employeeCode: user.employeeCode,
        department: user.department || "Đang cập nhật",
        position: user.position || "Nhân viên",
        phoneNumber: user.phoneNumber,
        email: user.email,
      })
    } catch {
      console.error("Không thể đọc thông tin user từ localStorage")
    }
  }

  const fetchTodayAttendance = async () => {
    try {
      setIsLoading(true)
      setErrorMessage("")
      const data = await attendanceApi.getTodayAttendance()
      setTodayAttendance(data)
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Không thể tải trạng thái chấm công hôm nay"
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkingHour = async () => {
    try {
      setIsLoadingWorkingHour(true);
      try {
        const activeWorkingHour = await workingHoursApi.getActiveWorkingHour();
        setWorkingHour({
          startTime: activeWorkingHour.startTime,
          endTime: activeWorkingHour.endTime,
          shiftDuration: activeWorkingHour.shiftDuration,
          overtime: activeWorkingHour.overtime,
        });
        return;
      } catch (activeError) {
        console.warn("API /working-hours/active chưa có, fallback sang /working-hours");
      }

      const data = await workingHoursApi.getWorkingHours();
      const active =
        data.find((item) => item.isActive) ||
        [...data].sort((a, b) => b.workingHourId - a.workingHourId)[0];

      if (active) {
        setWorkingHour({
          startTime: active.startTime,
          endTime: active.endTime,
          shiftDuration: active.shiftDuration,
          overtime: active.overtime,
        });
      }
    } catch (error) {
      console.error("Không thể tải ca làm việc", error);
      setWorkingHour({
        startTime: "",
        endTime: "",
        shiftDuration: undefined,
        overtime: undefined,
      });
    } finally {
      setIsLoadingWorkingHour(false);
    }
  };

  useEffect(() => {
    loadEmployeeProfile()
    fetchTodayAttendance()
    fetchWorkingHour()
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      fetchWorkingHour();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // ─── Helpers ────────────────────────────────────────────────
  const formatTimeFromApi = (value: string | null | undefined) => {
    if (!value) return "--:--";

    if (value.includes(":") && !value.includes("T")) {
      return value.slice(0, 5);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";

    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatCurrentDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getTodayStatusInfo = () => {
    if (!todayAttendance || !todayAttendance.hasCheckedIn) {
      return {
        text: "Chưa chấm công",
        className: "bg-gray-100 text-gray-600",
        description: "Bạn chưa thực hiện chấm công hôm nay.",
      };
    }

    if (todayAttendance.hasCheckedIn && !todayAttendance.hasCheckedOut) {
      return {
        text: "Đang làm việc",
        className: "bg-blue-100 text-blue-700",
        description: "Bạn đã chấm công vào, có thể chấm công ra khi kết thúc ca.",
      };
    }

    return {
      text: "Hoàn tất chấm công",
      className: "bg-green-100 text-green-700",
      description: "Bạn đã hoàn tất chấm công hôm nay.",
    };
  };

  const getAttendanceStatusText = (status: string) => {
    switch (status) {
      case "OnTime":
        return "Đúng giờ";
      case "Late":
        return "Đi trễ";
      case "Absent":
        return "Vắng mặt";
      case "InvalidLocation":
        return "Sai vị trí";
      case "ForgotCheckout":
        return "Quên check-out";
      default:
        return status || "Chưa xác định";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "NV";
  };

  const statusInfo = getTodayStatusInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm font-semibold text-gray-500">
        Đang tải dữ liệu...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      
      {/* ── Lời chào ── */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: '#0b1c30' }}>
          Xin chào, {employeeProfile.fullName} 👋
        </h1>
        <p className="text-xs font-semibold text-[#757684] mt-0.5">
          Chúc bạn một ngày làm việc hiệu quả
        </p>
      </div>

      {/* ── Alert lỗi (nếu có) ── */}
      {errorMessage && (
        <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-xs font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* ── Card hồ sơ nhân viên ── */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: '#dde1ff', color: '#00288e' }}
          >
            {getInitials(employeeProfile.fullName)}
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color: '#0b1c30' }}>
              {employeeProfile.fullName}
            </p>
            <p className="text-sm font-medium mt-0.5" style={{ color: '#444653' }}>
              {employeeProfile.department}
            </p>
            {employeeProfile.position && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: '#00288e' }}>
                {employeeProfile.position}
              </p>
            )}
          </div>
        </div>

        {/* Đồng hồ hiển thị thời gian thực bên phải */}
        <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          <p className="text-2xl font-mono font-black" style={{ color: '#00288e' }}>
            {formatCurrentTime(currentTime)}
          </p>
          <p className="text-xs font-bold capitalize mt-0.5" style={{ color: '#444653' }}>
            {formatCurrentDate(currentTime)}
          </p>
        </div>
      </div>

      {/* ── Card trạng thái hôm nay ── */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={20} style={{ color: '#0b1c30' }} />
            <span className="text-sm font-bold" style={{ color: '#0b1c30' }}>
              Trạng thái hôm nay
            </span>
          </div>
          <span className={`px-4 py-2 rounded-full text-xs font-bold ${statusInfo.className}`}>
            {statusInfo.text}
          </span>
        </div>

        <p className="text-xs font-semibold text-[#444653]">
          {statusInfo.description}
        </p>

        <div className="grid grid-cols-3 divide-x border-t pt-4" style={{ borderColor: '#e8eaf4' }}>
          <div className="text-center px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Giờ vào</p>
            <p className="text-base font-black" style={{ color: '#00288e' }}>
              {formatTimeFromApi(todayAttendance?.checkInTime)}
            </p>
          </div>
          <div className="text-center px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Giờ ra</p>
            <p className="text-base font-black" style={{ color: '#00288e' }}>
              {formatTimeFromApi(todayAttendance?.checkOutTime)}
            </p>
          </div>
          <div className="text-center px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: '#444653' }}>Tổng giờ</p>
            <p className="text-base font-black" style={{ color: '#00288e' }}>
              {todayAttendance?.actualHours != null ? `${todayAttendance.actualHours}h` : "0h"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Card trạng thái đi làm hôm nay (Hiển thị nếu đã Check-in) ── */}
      {todayAttendance && todayAttendance.hasCheckedIn && todayAttendance.status && (
        <div
          className="rounded-2xl p-4 flex items-center justify-between animate-fade-in"
          style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
        >
          <span className="text-sm font-semibold" style={{ color: '#0b1c30' }}>
            Trạng thái đi làm hôm nay
          </span>
          <span
            className={`px-4 py-2 rounded-full text-xs font-bold ${
              todayAttendance.status === "Late"
                ? "bg-[#ffedd5] text-[#ea580c]"
                : todayAttendance.status === "OnTime"
                ? "bg-[#dcfce7] text-[#16a34a]"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {getAttendanceStatusText(todayAttendance.status)}
          </span>
        </div>
      )}

      {/* ── Card ca làm việc hôm nay ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid #dde1ff' }}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: '#eff4ff', borderBottom: '1px solid #dde1ff' }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={18} style={{ color: '#00288e' }} />
            <span className="text-sm font-bold" style={{ color: '#00288e' }}>
              Ca làm việc hôm nay
            </span>
          </div>
          <div
            className="px-2 py-0.5 rounded text-[11px] font-bold"
            style={{ background: '#00288e', color: '#ffffff' }}
          >
            Hành chính
          </div>
        </div>
        {/* Content */}
        <div className="p-4" style={{ background: '#ffffff' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#444653' }}>Giờ bắt đầu</p>
              <p className="text-xl font-bold" style={{ color: '#0b1c30' }}>
                {isLoadingWorkingHour ? "--:--" : formatTimeFromApi(workingHour.startTime)}
              </p>
            </div>
            <div className="w-8 border-t-2 border-dashed" style={{ borderColor: '#c4c5d5' }} />
            <div className="text-right">
              <p className="text-xs font-semibold mb-1" style={{ color: '#444653' }}>Giờ kết thúc</p>
              <p className="text-xl font-bold" style={{ color: '#0b1c30' }}>
                {isLoadingWorkingHour ? "--:--" : formatTimeFromApi(workingHour.endTime)}
              </p>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#f8f9ff', borderTop: '1px solid #e8eaf4' }}
        >
          <Info size={14} style={{ color: '#444653' }} />
          <p className="text-xs font-medium" style={{ color: '#444653' }}>
            Vui lòng chấm công đúng giờ làm việc
          </p>
        </div>
      </div>

      {/* ── Nút đi đến chấm công ── */}
      <button
        type="button"
        onClick={() => navigate('/employee/check-attendance')}
        className="w-full h-16 rounded-2xl flex items-center justify-center gap-2 text-white font-bold text-base transition-transform active:scale-[0.98] shadow-lg mt-2"
        style={{ background: '#00288e', boxShadow: '0 4px 14px rgba(0, 40, 142, 0.3)' }}
      >
        <MapPin size={22} />
        ĐI ĐẾN CHẤM CÔNG
      </button>

    </div>
  )
}
