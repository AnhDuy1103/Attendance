using GpsAttendance.API.Models;

namespace GpsAttendance.API.Repositories.Interfaces;

/// <summary>
/// Interface đặc thù cho Attendance Repository.
/// Cung cấp các phương thức tra cứu lịch sử chấm công,
/// check-in đang mở và thống kê theo khoảng thời gian.
/// </summary>
public interface IAttendanceRepository : IGenericRepository<Attendance>
{
    /// <summary>
    /// Lấy bản ghi chấm công chưa check-out của nhân viên trong ngày hôm nay.
    /// Dùng để kiểm tra trước khi cho phép check-in mới hoặc thực hiện check-out.
    /// </summary>
    Task<Attendance?> GetOpenAttendanceAsync(int employeeId);

    /// <summary>Lấy lịch sử chấm công của nhân viên trong khoảng thời gian</summary>
    Task<IEnumerable<Attendance>> GetHistoryAsync(
        int employeeId,
        DateTime fromDate,
        DateTime toDate);

    /// <summary>
    /// Lấy lịch sử chấm công kèm thông tin Employee, Location, WorkingHours
    /// (Eager Loading) để tránh N+1 query.
    /// </summary>
    Task<IEnumerable<Attendance>> GetHistoryWithDetailsAsync(
        int employeeId,
        DateTime fromDate,
        DateTime toDate);

    /// <summary>Lấy tất cả chấm công trong ngày (dùng cho dashboard Admin)</summary>
    Task<IEnumerable<Attendance>> GetTodayAttendancesAsync();

    /// <summary>Lấy tất cả chấm công trong khoảng thời gian kèm details (dùng cho Admin)</summary>
    Task<IEnumerable<Attendance>> GetAllWithDetailsAsync(DateTime fromDate, DateTime toDate);

    /// <summary>Lấy chấm công kèm đầy đủ thông tin liên kết theo ID</summary>
    Task<Attendance?> GetByIdWithDetailsAsync(int attendanceId);

    /// <summary>Thống kê chấm công theo tháng của nhân viên</summary>
    Task<IEnumerable<Attendance>> GetMonthlyReportAsync(int employeeId, int year, int month);

    /// <summary>Đếm số ngày làm việc của nhân viên trong tháng</summary>
    Task<int> CountWorkingDaysAsync(int employeeId, int year, int month);
}
