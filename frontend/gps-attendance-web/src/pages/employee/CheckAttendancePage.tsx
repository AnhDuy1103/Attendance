import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Info,
  LogIn,
  LogOut,
  Check,
  Clock,
  History,
  AlertCircle
} from 'lucide-react'
import { attendanceApi, MyHistoryResponse } from '../../api/attendanceApi'

// ─── Types ────────────────────────────────────────────────────
type AttendanceStep = 'not_checked_in' | 'checked_in' | 'checked_out'

type TodayAttendance = {
  checkInTime: string
  checkOutTime: string
  totalHours: string
  step: AttendanceStep
  status: string
}

// ─── Mock Data ────────────────────────────────────────────────
const employeeInfo = {
  fullName: 'Hồ sơ nhân viên',
  initials: 'NV',
  department: 'Khối nhân sự',
}

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

const formatDateFromApi = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'OnTime': return { text: 'Đúng giờ', bg: '#dcfce7', color: '#16a34a' };
    case 'CheckedOut': return { text: 'Đã chấm công', bg: '#dcfce7', color: '#16a34a' };
    case 'Late': return { text: 'Đi trễ', bg: '#ffedd5', color: '#ea580c' };
    case 'InvalidLocation': return { text: 'Sai vị trí', bg: '#fee2e2', color: '#dc2626' };
    case 'ForgotCheckout': return { text: 'Quên check-out', bg: '#ffedd5', color: '#ea580c' };
    case 'Absent': return { text: 'Vắng mặt', bg: '#fee2e2', color: '#dc2626' };
    default: return { text: status, bg: '#f3f4f6', color: '#4b5563' };
  }
};

const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ lấy vị trí GPS"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        reject(new Error("Không thể lấy vị trí hiện tại. Vui lòng bật GPS và cho phép quyền vị trí."));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

// ─── Component ────────────────────────────────────────────────
export default function CheckAttendancePage() {
  const navigate = useNavigate()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    checkInTime: "--:--",
    checkOutTime: "--:--",
    totalHours: "0h",
    step: "not_checked_in",
    status: "NotCheckedIn",
  })

  const [recentHistories, setRecentHistories] = useState<MyHistoryResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // ─── Time Logic ───
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // ─── Fetch APIs ───
  const fetchTodayAttendance = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      
      const response = await attendanceApi.getTodayAttendance();
      
      if (response.hasCheckedIn === false) {
        setTodayAttendance({
          checkInTime: "--:--",
          checkOutTime: "--:--",
          totalHours: "0h",
          step: "not_checked_in",
          status: response.status || "NotCheckedIn"
        });
      } else if (response.hasCheckedIn === true && response.hasCheckedOut === false) {
        setTodayAttendance({
          checkInTime: formatTimeFromApi(response.checkInTime),
          checkOutTime: "--:--",
          totalHours: "0h",
          step: "checked_in",
          status: response.status || "CheckedIn"
        });
      } else if (response.hasCheckedIn === true && response.hasCheckedOut === true) {
        setTodayAttendance({
          checkInTime: formatTimeFromApi(response.checkInTime),
          checkOutTime: formatTimeFromApi(response.checkOutTime),
          totalHours: response.actualHours != null ? `${response.actualHours}h` : "0h",
          step: "checked_out",
          status: response.status || "CheckedOut"
        });
      }
    } catch (error: any) {
      setErrorMessage("Không thể tải trạng thái chấm công hôm nay");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const data = await attendanceApi.getMyHistory();
      setRecentHistories(data.slice(0, 3));
    } catch (error) {
      console.error("Không thể tải lịch sử gần đây", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
    fetchRecentHistory();
  }, [])

  const formatFullTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // ─── Handlers ───
  const triggerToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage("")
    }, 3000)
  }

  const handleCheckIn = async () => {
    if (todayAttendance.step !== "not_checked_in") return;
  
    try {
      setIsCheckingIn(true);
      setErrorMessage("");
  
      const location = await getCurrentLocation();
  
      await attendanceApi.checkIn({
        latitude: location.latitude,
        longitude: location.longitude,
      });
  
      triggerToast("Chấm công vào thành công");
      
      // Refresh state
      await fetchTodayAttendance();
      await fetchRecentHistory();

    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Chấm công vào thất bại";
  
      setErrorMessage(message);
      triggerToast(message);
    } finally {
      setIsCheckingIn(false);
    }
  };
  
  const handleCheckOut = async () => {
    if (todayAttendance.step !== "checked_in") return;
  
    try {
      setIsCheckingOut(true);
      setErrorMessage("");
  
      const location = await getCurrentLocation();
  
      await attendanceApi.checkOut({
        latitude: location.latitude,
        longitude: location.longitude,
      });
  
      triggerToast("Chấm công ra thành công");

      // Refresh state
      await fetchTodayAttendance();
      await fetchRecentHistory();

    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Chấm công ra thất bại";
  
      setErrorMessage(message);
      triggerToast(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getStatusMessage = () => {
    if (todayAttendance.step === 'not_checked_in') {
      return 'Sẵn sàng chấm công vào'
    }

    if (todayAttendance.step === 'checked_in') {
      return 'Bạn đã chấm công vào, có thể chấm công ra khi kết thúc ca'
    }

    return 'Bạn đã hoàn tất chấm công hôm nay'
  }

  // ─── Status Style ───
  const alertStyles = () => {
    if (todayAttendance.step === 'not_checked_in') {
      return { background: '#eff4ff', color: '#00288e', borderColor: '#dde1ff' }
    }
    return { background: '#dcfce7', color: '#16a34a', borderColor: '#bbf7d0' }
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up">
        
        {/* ── Card thông tin nhân viên ── */}
        <div
          className="rounded-xl flex items-center gap-4 p-4"
          style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
            style={{ background: '#dde1ff', color: '#00288e' }}
          >
            {employeeInfo.initials}
          </div>
          <div className="flex-1">
            <p className="text-base font-bold" style={{ color: '#0b1c30' }}>{employeeInfo.fullName}</p>
            <p className="text-xs font-medium" style={{ color: '#444653' }}>{employeeInfo.department}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold font-mono" style={{ color: '#00288e' }}>
              {formatFullTime(currentTime)}
            </p>
            <p className="text-[10px] font-semibold uppercase" style={{ color: '#444653' }}>
              {formatDate(currentTime)}
            </p>
          </div>
        </div>

        {/* ── Card trạng thái chấm công ── */}
        <div
          className="rounded-xl p-4 space-y-4"
          style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <Clock size={18} style={{ color: '#0b1c30' }} />
            <h2 className="text-sm font-bold" style={{ color: '#0b1c30' }}>
              Trạng thái chấm công hôm nay
            </h2>
          </div>

          <div className="grid grid-cols-3 divide-x" style={{ borderColor: '#e8eaf4' }}>
            <div className="text-center px-2">
              <p className="text-[11px] font-semibold mb-1" style={{ color: '#444653' }}>Giờ vào</p>
              <p className="text-lg font-bold" style={{ color: '#00288e' }}>
                {isLoading ? "..." : todayAttendance.checkInTime}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] font-semibold mb-1" style={{ color: '#444653' }}>Giờ ra</p>
              <p className="text-lg font-bold" style={{ color: '#00288e' }}>
                {isLoading ? "..." : todayAttendance.checkOutTime}
              </p>
            </div>
            <div className="text-center px-2">
              <p className="text-[11px] font-semibold mb-1" style={{ color: '#444653' }}>Tổng giờ</p>
              <p className="text-lg font-bold" style={{ color: '#00288e' }}>
                {isLoading ? "..." : todayAttendance.totalHours}
              </p>
            </div>
          </div>
        </div>

        {/* ── Alert trạng thái ── */}
        <div
          className="rounded-xl p-3 flex items-center gap-2 border"
          style={alertStyles()}
        >
          <Info size={16} className="shrink-0" />
          <p className="text-xs font-semibold">{getStatusMessage()}</p>
        </div>

        {/* ── Alert lỗi (nếu có) ── */}
        {errorMessage && (
          <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-xs font-semibold">{errorMessage}</p>
          </div>
        )}

        {/* ── Nút hành động ── */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleCheckIn}
            disabled={todayAttendance.step !== 'not_checked_in' || isCheckingIn || isLoading}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              todayAttendance.step === 'not_checked_in' && !isCheckingIn && !isLoading
                ? 'bg-[#00288e] text-white shadow-md active:scale-95'
                : 'bg-[#e0e3e5] text-[#626567] opacity-60 cursor-not-allowed'
            }`}
          >
            <LogIn size={24} />
            {isCheckingIn ? 'Đang chấm công...' : 'Chấm công vào'}
          </button>
          
          <button
            onClick={handleCheckOut}
            disabled={todayAttendance.step !== 'checked_in' || isCheckingOut || isLoading}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all duration-200 ${
              todayAttendance.step === 'checked_in' && !isCheckingOut && !isLoading
                ? 'bg-[#00288e] text-white shadow-md active:scale-95'
                : 'bg-[#e0e3e5] text-[#626567] opacity-60 cursor-not-allowed'
            }`}
          >
            <LogOut size={24} />
            {isCheckingOut ? 'Đang chấm công...' : 'Chấm công ra'}
          </button>
        </div>

        {/* ── Lịch sử gần đây ── */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} style={{ color: '#0b1c30' }} />
              <h2 className="text-sm font-bold" style={{ color: '#0b1c30' }}>
                Lịch sử gần đây
              </h2>
            </div>
            <button
              onClick={() => navigate('/employee/history')}
              className="text-xs font-bold transition-colors hover:underline"
              style={{ color: '#00288e' }}
            >
              Xem tất cả
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="text-center py-4 text-sm font-medium text-gray-500">
              Đang tải lịch sử...
            </div>
          ) : recentHistories.length === 0 ? (
            <div className="rounded-xl p-4 text-center border" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <p className="text-sm font-medium text-gray-500">Chưa có lịch sử chấm công</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentHistories.map((item) => {
                const statusStyle = getStatusDisplay(item.status);
                return (
                  <div
                    key={item.attendanceId}
                    className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: '#ffffff', border: '1px solid #c4c5d5', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  >
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0b1c30' }}>
                        {formatDateFromApi(item.attendanceDate)}
                      </p>
                      <p className="text-xs font-medium mt-0.5" style={{ color: '#444653' }}>
                        Vào: {formatTimeFromApi(item.checkInTime)} - Ra: {formatTimeFromApi(item.checkOutTime)}
                      </p>
                    </div>
                    <div
                      className="px-2 py-1 rounded text-[11px] font-bold"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                      }}
                    >
                      {statusStyle.text}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Toast Message ── */}
        {!!toastMessage && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border animate-fade-in-up"
            style={{ 
              background: '#ffffff', 
              borderColor: errorMessage === toastMessage ? '#fecaca' : '#bbf7d0' 
            }}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ${errorMessage === toastMessage ? 'bg-red-500' : 'bg-green-500'}`}>
              {errorMessage === toastMessage ? <AlertCircle size={12} strokeWidth={3} /> : <Check size={12} strokeWidth={3} />}
            </div>
            <p className="text-sm font-bold" style={{ color: errorMessage === toastMessage ? '#dc2626' : '#16a34a' }}>
              {toastMessage}
            </p>
          </div>
        )}

    </div>
  )
}
