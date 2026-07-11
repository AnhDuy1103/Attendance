import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  UserCheck,
  AlarmClock,
  ClipboardCheck,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import StatCard from '../../components/admin/StatCard'
import RecentAttendanceTable, {
  type RecentAttendance,
} from '../../components/admin/RecentAttendanceTable'
import { dashboardApi } from '../../api/dashboardApi'
import { employeeApi } from '../../api/employeeApi'
import { attendanceApi } from '../../api/attendanceApi'

type DashboardStats = {
  totalEmployees: number;
  checkedToday: number;
  lateToday: number;
  forgotCheckout: number;
};

// ─── Avatar Color Generator ───
const AVATAR_COLORS = ['#1e40af', '#ea580c', '#7c3aed', '#16a34a', '#db2777', '#0d9488'];
const getAvatarColor = (name: string) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    checkedToday: 0,
    lateToday: 0,
    forgotCheckout: 0,
  })

  const [recentAttendances, setRecentAttendances] = useState<RecentAttendance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // ─── Helpers ───
  const normalizeDateValue = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("T")) {
      return value.split("T")[0];
    }
    const parts = value.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return value.slice(0, 10);
  };

  const getTodayDateValue = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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



  const isToday = (dateValue: string) => {
    if (!dateValue) return false;
    const dateStr = normalizeDateValue(dateValue);
    const today = getTodayDateValue();
    return dateStr === today;
  };

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

  const formatDateLabel = (dateValue: string) => {
    if (isToday(dateValue)) return "Hôm nay";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const mapStatusToTableStatus = (status: string, checkInTime: string | null, checkOutTime: string | null, attendanceDate?: string | null): 'Đúng giờ' | 'Đi trễ' | 'Quên check-out' => {
    if (isForgotCheckoutRecord({ attendanceDate, checkInTime, checkOutTime })) {
      return 'Quên check-out';
    }
    if (status === 'Late') return 'Đi trễ';
    return 'Đúng giờ';
  };

  const getInitials = (name: string) => {
    if (!name) return "NV";
    const words = name.trim().split(" ").filter(Boolean);
    if (words.length === 1) {
      return words[0][0].toUpperCase();
    }
    return words
      .slice(-2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // ─── Fetch Data ───
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const allAttendances = await attendanceApi.getAllAttendances();
      const calculatedForgotCheckout = allAttendances.filter(isForgotCheckoutRecord).length;

      try {
        const summary = await dashboardApi.getSummary();

        setStats({
          totalEmployees: summary.totalEmployees,
          checkedToday: summary.checkedToday,
          lateToday: summary.lateToday,
          forgotCheckout: calculatedForgotCheckout,
        });

        const mappedRecent = summary.recentAttendances.slice(0, 5).map((item) => ({
          id: item.attendanceId.toString(),
          employeeName: item.fullName,
          employeeCode: item.employeeCode || "--",
          initials: getInitials(item.fullName),
          avatarColor: getAvatarColor(item.fullName),
          time: formatTimeFromApi(item.checkInTime),
          timeNote: formatDateLabel(item.attendanceDate),
          department: item.department || "--",
          status: mapStatusToTableStatus(item.status, item.checkInTime, item.checkOutTime, item.attendanceDate),
        }));

        setRecentAttendances(mappedRecent);
        return;
      } catch (dashboardError) {
        console.warn("Dashboard summary API chưa có, fallback sang employees + attendance/all", dashboardError);
      }

      // FALLBACK FLOW
      const [employeesResponse] = await Promise.all([
        employeeApi.getAll({ page: 1, pageSize: 9999 }) as any,
      ]);

      const employees = employeesResponse.data?.data?.items || [];
      const today = getTodayDateValue();
      const todayAttendances = allAttendances.filter((item) =>
        normalizeDateValue(item.attendanceDate) === today
      );

      const totalEmployees = employees.filter(
        (item: any) => item.employeeStatus !== "Inactive" && item.isActive !== false
      ).length;

      const checkedToday = todayAttendances.filter(
        (item: any) => item.checkInTime
      ).length;

      const lateToday = todayAttendances.filter(
        (item: any) => item.status === "Late"
      ).length;

      const recentMapped = [...allAttendances]
        .sort((a, b) => {
          const dateA = new Date(`${a.attendanceDate}T${a.checkInTime || "00:00:00"}`).getTime();
          const dateB = new Date(`${b.attendanceDate}T${b.checkInTime || "00:00:00"}`).getTime();
          return dateB - dateA;
        })
        .slice(0, 5)
        .map((item) => ({
          id: item.attendanceId.toString(),
          employeeName: item.employeeName || item.fullName || "Nhân viên",
          employeeCode: item.employeeCode || "--",
          initials: getInitials(item.employeeName || item.fullName || "Nhân viên"),
          avatarColor: getAvatarColor(item.employeeName || item.fullName || ""),
          time: formatTimeFromApi(item.checkInTime),
          timeNote: formatDateLabel(item.attendanceDate),
          department: item.department || "--",
          status: mapStatusToTableStatus(item.status, item.checkInTime, item.checkOutTime, item.attendanceDate),
        }));

      setStats({
        totalEmployees,
        checkedToday,
        lateToday,
        forgotCheckout: calculatedForgotCheckout,
      });

      setRecentAttendances(recentMapped);
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.message ||
        "Không thể tải dữ liệu dashboard";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const computedStats = [
    {
      title: 'Tổng nhân viên',
      value: stats.totalEmployees,
      icon: <Users size={22} />,
      accentColor: '#1e40af',
      bgColor: '#eff6ff',
    },
    {
      title: 'Đã chấm công',
      value: stats.checkedToday,
      subtitle: 'Hôm nay',
      icon: <UserCheck size={22} />,
      accentColor: '#16a34a',
      bgColor: '#dcfce7',
      progress: stats.totalEmployees > 0 ? Math.round((stats.checkedToday / stats.totalEmployees) * 100) : 0,
      progressColor: '#16a34a',
    },
    {
      title: 'Đi trễ',
      value: stats.lateToday,
      subtitle: 'Cần lưu ý',
      icon: <AlarmClock size={22} />,
      accentColor: '#ea580c',
      bgColor: '#ffedd5',
    },
    {
      title: 'Quên check-out',
      value: stats.forgotCheckout,
      subtitle: 'Chờ duyệt',
      icon: <ClipboardCheck size={22} />,
      accentColor: '#7c3aed',
      bgColor: '#ede9fe',
    },
  ];

  if (isLoading && recentAttendances.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm font-semibold text-gray-500">
        Đang tải dữ liệu dashboard...
      </div>
    )
  }

  return (
    <div className="page-container space-y-6" style={{ maxWidth: '100%' }}>

      {errorMessage && (
        <div className="rounded-xl p-3 flex items-center gap-2 border bg-red-50 text-red-700 border-red-200">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-xs font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {computedStats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* ── Recent Attendance Table ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e8eaf4',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {/* Table header bar */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #e8eaf4', background: '#f8f9ff' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: '#0b1c30' }}>
              Danh sách chấm công gần nhất
            </h2>
          </div>

          <button
            onClick={() => navigate('/admin/attendance-history')}
            className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-150 px-3 py-1.5 rounded-lg cursor-pointer"
            style={{ color: '#1e40af', background: '#eff6ff' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#dbeafe'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement
              el.style.background = '#eff6ff'
            }}
          >
            Xem tất cả
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Table */}
        {recentAttendances.length > 0 ? (
          <RecentAttendanceTable data={recentAttendances} />
        ) : (
          <div className="text-center py-10 text-sm font-semibold text-gray-400 bg-white">
            Chưa có dữ liệu chấm công
          </div>
        )}
      </div>
    </div>
  )
}
